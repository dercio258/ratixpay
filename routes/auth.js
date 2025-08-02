const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Usuario = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'ratixpay_secret_key_2024';

// Configuração do Passport Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || '312349657626-krr41ttgvj573822kbot4psuaa3u3af1.apps.googleusercontent.com',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || (process.env.NODE_ENV === 'production' 
        ? "https://ratixpay.onrender.com/auth/google/callback"
        : "http://localhost:3000/auth/google/callback")
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      console.log('Google profile:', profile);
      
      // Verificar se o usuário já existe por email ou Google ID
      let usuario = await Usuario.findByEmailOrGoogleId(profile.emails[0].value, profile.id);
      
      if (!usuario) {
        // Criar novo usuário
        const usuarioData = {
          nome: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          tipo: 'vendedor',
          ativo: true
        };
        
        usuario = await Usuario.create(usuarioData);
        console.log('Novo usuário criado:', usuario);
      } else {
        // Atualizar Google ID se necessário
        if (!usuario.googleId) {
          usuario.googleId = profile.id;
          await usuario.save();
        }
        console.log('Usuário existente encontrado:', usuario);
      }
      
      return cb(null, usuario);
    } catch (error) {
      console.error('Erro na autenticação Google:', error);
      return cb(error, null);
    }
  }
));

// Serialização do usuário para sessão
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialização do usuário da sessão
passport.deserializeUser(async (id, done) => {
  try {
    const usuario = await Usuario.findById(id);
    done(null, usuario);
  } catch (error) {
    done(error, null);
  }
});

// Rota para iniciar autenticação Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Rota de teste para verificar configurações
router.get('/test-google', (req, res) => {
  res.json({
    message: 'Configurações do Google OAuth',
    clientId: process.env.GOOGLE_CLIENT_ID || 'Configurado no código',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET
  });
});

// Callback do Google OAuth
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
  function(req, res) {
    try {
      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: req.user.id,
          email: req.user.email,
          tipo: req.user.tipo
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // Redirecionar para o dashboard com token
      res.redirect(`/dashboard?token=${token}`);
    } catch (error) {
      console.error('Erro no callback Google:', error);
      res.redirect('/?error=auth_failed');
    }
  }
);

// GET - Verificar token
router.get('/verificar', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ erro: 'Token não fornecido' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Buscar usuário no banco
    const usuario = await Usuario.findById(decoded.id);
    
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    
    res.json({
      valido: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    console.error('Erro na verificação do token:', error);
    res.status(401).json({ erro: 'Token inválido' });
  }
});

// POST - Logout
router.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) {
      return res.status(500).json({ erro: 'Erro ao fazer logout' });
    }
    res.json({ mensagem: 'Logout realizado com sucesso' });
  });
});



// GET - Status da autenticação
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      autenticado: true,
      usuario: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        tipo: req.user.tipo
      }
    });
  } else {
    res.json({ autenticado: false });
  }
});

module.exports = router;

