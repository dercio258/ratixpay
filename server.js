const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
require('dotenv').config();

// Importar middlewares de segurança
const {
  createRateLimiters,
  createSlowDown,
  sanitizeInput,
  auditLog,
  integrityCheck,
  attackProtection,
  securityHeaders,
  helmetConfig
} = require('./middleware/security');

// Inicializar banco de dados SQLite
const databaseManager = require('./database/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de segurança
const rateLimiters = createRateLimiters();
const slowDown = createSlowDown();

// Aplicar Helmet e headers de segurança
app.use(helmetConfig);
app.use(securityHeaders);

// Aplicar middlewares de segurança extras no modo produção
if (process.env.NODE_ENV === 'production') {
  app.use(auditLog);
  app.use(integrityCheck);
  app.use(attackProtection);
}

// Rate limiting e controle de requisições
app.use(rateLimiters.general);
app.use(slowDown);
app.use(sanitizeInput);

// ✅ Configuração de CORS com domínio da Hostinger
const allowedOrigins = [
  'http://localhost:3000',
  'https://ratixpay.com',
  'https://www.ratixpay.com',
  'https://ratixpay-backend.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Sessão e autenticação
app.use(session({
  secret: process.env.SESSION_SECRET || 'ratixpay_session_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Body parsers e arquivos públicos (uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Inicializar banco de dados
try {
  databaseManager.initialize();
  console.log('✅ Banco SQLite inicializado com sucesso');
} catch (err) {
  console.error('❌ Erro ao inicializar banco SQLite:', err.message);
  process.exit(1);
}

// Importar rotas
const produtoRoutes = require('./routes/produtos');
const vendaRoutes = require('./routes/vendas');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const pagamentoRoutes = require('./routes/pagamento');

// Usar rotas da API
app.use('/api/produtos', produtoRoutes);
app.use('/api/vendas', vendaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', pagamentoRoutes);

// Rota adicional para callback do Google OAuth
app.use('/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    plan: 'free'
  });
});

// ✅ Removido: Rotas de páginas estáticas (index.html, etc.)

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: err.message });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }

  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota fallback para 404
app.use('*', (req, res) => {
  res.status(404).json({
    erro: 'Rota não encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor RatixPay rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
