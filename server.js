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
const databaseManager = require('./database/database_simple');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de segurança avançada (otimizadas para plano gratuito)
const rateLimiters = createRateLimiters();
const slowDown = createSlowDown();

// Aplicar Helmet (headers de segurança)
app.use(helmetConfig);

// Aplicar headers de segurança customizados
app.use(securityHeaders);

// Middleware de auditoria (otimizado para plano gratuito)
if (process.env.NODE_ENV === 'production') {
    app.use(auditLog);
    app.use(integrityCheck);
    app.use(attackProtection);
}

// Rate limiting geral (reduzido para plano gratuito)
app.use(rateLimiters.general);

// Slow down para requests excessivos (otimizado)
app.use(slowDown);

// Middleware de sanitização
app.use(sanitizeInput);

// Configuração de CORS mais robusta
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080',
  'https://ratixpay.onrender.com',
  'https://ratixpay.com',
  'https://www.ratixpay.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin não permitida: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // Para suporte a navegadores legados
}));

// Configuração de sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'ratixpay_session_secret_2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de logging aprimorado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  
  console.log(`📝 ${timestamp} - ${method} ${url} - IP: ${ip.substring(0, 15)} - UA: ${userAgent.substring(0, 50)}`);
  
  // Log do body para POST/PUT (apenas em desenvolvimento)
  if (process.env.NODE_ENV === 'development' && (method === 'POST' || method === 'PUT')) {
    console.log(`📦 Body:`, JSON.stringify(req.body, null, 2).substring(0, 200));
  }
  
  next();
});

// Inicializar banco SQLite
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

// Health check endpoint para /api/health
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

// Rota principal - Servir frontend ou informações da API
app.get('/', (req, res) => {
  // Se o request aceita HTML, servir o frontend
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
      if (err) {
        // Se não encontrar o arquivo, retornar informações da API
        res.json({
          message: '🚀 RatixPay API está funcionando!',
          version: '2.0.0',
          status: 'online',
          timestamp: new Date().toISOString(),
          endpoints: {
            health: '/api/health',
            produtos: '/api/produtos',
            vendas: '/api/vendas',
            dashboard: '/api/dashboard',
            auth: '/api/auth',
            admin: '/api/admin',
            pagamento: '/api/pagamoz/payment'
          },
          docs: 'Consulte a documentação para mais informações'
        });
      }
    });
  } else {
    // Para requests de API, retornar JSON
    res.json({
      message: '🚀 RatixPay API está funcionando!',
      version: '2.0.0',
      status: 'online',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        produtos: '/api/produtos',
        vendas: '/api/vendas',
        dashboard: '/api/dashboard',
        auth: '/api/auth',
        admin: '/api/admin',
        pagamento: '/api/pagamoz/payment'
      },
      docs: 'Consulte a documentação para mais informações'
    });
  }
});

// Rotas para páginas estáticas
const staticRoutes = [
  { path: '/', file: 'index.html' },
  { path: '/dashboard', file: 'dashboard.html' },
  { path: '/criar-produto', file: 'criar-produto.html' },
  { path: '/checkout', file: 'checkout.html' },
  { path: '/payment/success', file: 'payment-success.html' },
  { path: '/gestao-produtos', file: 'gestao-produtos.html' },
  { path: '/gestao-vendas', file: 'gestao-vendas.html' },
  { path: '/ferramentas', file: 'ferramentas.html' },
  { path: '/cadastro-produto', file: 'cadastro-produto.html' },
  { path: '/editar-produto/:id', file: 'editar-produto.html' },
  { path: '/editar-produto', file: 'editar-produto.html' },
  { path: '/saldo', file: 'saldo.html' }
];

staticRoutes.forEach(route => {
  app.get(route.path, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', route.file));
  });
});

// Middleware de tratamento de erros aprimorado
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err.stack);
  
  // Erro de validação
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.message
    });
  }
  
  // Erro de autenticação
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      erro: 'Token inválido ou expirado'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    erro: 'Erro interno do servidor',
    mensagem: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

// Rota para qualquer outra requisição - Suporte a SPA
app.use('*', (req, res) => {
  // Se for uma requisição para API que não existe, retornar 404 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      erro: 'Rota da API não encontrada',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
  
  // Para outras rotas, servir index.html (SPA fallback)
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
      if (err) {
        // Se não encontrar index.html, retornar 404 JSON
        res.status(404).json({
          erro: 'Página não encontrada',
          path: req.originalUrl,
          timestamp: new Date().toISOString()
        });
      }
    });
  } else {
    // Para requests que não aceitam HTML, retornar 404 JSON
    res.status(404).json({
      erro: 'Recurso não encontrado',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor RatixPay rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL Local: http://localhost:${PORT}`);
  console.log(`🌐 URL Externa: http://0.0.0.0:${PORT}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 CORS configurado para: ${allowedOrigins.join(', ')}`);
});

module.exports = app;

