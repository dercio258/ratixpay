const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

// Configurações de Rate Limiting
const createRateLimiters = () => {
    // Rate limiter geral (otimizado para plano gratuito)
    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 50, // reduzido para 50 requests por IP (plano gratuito)
        message: {
            error: 'Muitas requisições. Tente novamente em 15 minutos.',
            retryAfter: 15 * 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => req.path === '/api/health' // Não limitar health check
    });

    // Rate limiter para autenticação
    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 5, // máximo 5 tentativas de login
        message: {
            error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
            retryAfter: 15 * 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true
    });

    // Rate limiter para pagamentos (otimizado para plano gratuito)
    const paymentLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 5, // reduzido para 5 tentativas de pagamento (plano gratuito)
        message: {
            error: 'Muitas tentativas de pagamento. Tente novamente em 1 hora.',
            retryAfter: 60 * 60
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    // Rate limiter para uploads
    const uploadLimiter = rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hora
        max: 20, // máximo 20 uploads
        message: {
            error: 'Limite de uploads excedido. Tente novamente em 1 hora.',
            retryAfter: 60 * 60
        },
        standardHeaders: true,
        legacyHeaders: false
    });

    return {
        general: generalLimiter,
        auth: authLimiter,
        payment: paymentLimiter,
        upload: uploadLimiter
    };
};

// Configurações de Slow Down
const createSlowDown = () => {
    return slowDown({
        windowMs: 15 * 60 * 1000, // 15 minutos
        delayAfter: 50, // começar a desacelerar após 50 requests
        delayMs: 500, // adicionar 500ms de delay por request
        maxDelayMs: 20000, // máximo 20 segundos de delay
        skip: (req) => req.path === '/api/health'
    });
};

// Middleware de validação de entrada
const validateInput = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            }))
        });
    }
    next();
};

// Validações específicas para pagamentos
const validatePayment = [
    body('phoneNumber')
        .isMobilePhone('pt-BR')
        .withMessage('Número de telefone inválido'),
    body('value')
        .isFloat({ min: 1, max: 50000 })
        .withMessage('Valor deve estar entre 1 e 50.000 MZN'),
    body('method')
        .isIn(['Mpesa', 'Emola'])
        .withMessage('Método de pagamento inválido'),
    body('clienteEmail')
        .optional()
        .isEmail()
        .withMessage('Email inválido'),
    validateInput
];

// Validações para produtos
const validateProduct = [
    body('nome')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Nome deve ter entre 3 e 100 caracteres'),
    body('preco')
        .isFloat({ min: 0.01 })
        .withMessage('Preço deve ser maior que zero'),
    body('tipo')
        .isIn(['Curso Online', 'eBook'])
        .withMessage('Tipo de produto inválido'),
    validateInput
];

// Middleware de sanitização
const sanitizeInput = (req, res, next) => {
    // Sanitizar headers
    const sanitizeHeaders = (obj) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                // Remover caracteres perigosos
                sanitized[key] = value
                    .replace(/[<>]/g, '')
                    .replace(/javascript:/gi, '')
                    .replace(/on\w+=/gi, '')
                    .trim();
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    // Sanitizar body
    if (req.body) {
        req.body = sanitizeHeaders(req.body);
    }

    // Sanitizar query
    if (req.query) {
        req.query = sanitizeHeaders(req.query);
    }

    // Sanitizar params
    if (req.params) {
        req.params = sanitizeHeaders(req.params);
    }

    next();
};

// Middleware de auditoria
const auditLog = (req, res, next) => {
    const startTime = Date.now();
    const requestId = crypto.randomBytes(16).toString('hex');
    
    // Adicionar ID da requisição
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log da requisição
    console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - IP: ${req.ip}`);

    // Interceptar resposta
    const originalSend = res.send;
    res.send = function(data) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Log da resposta
        console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path} - ${statusCode} (${duration}ms)`);
        
        // Log de segurança para operações sensíveis
        if (req.path.includes('/payment') || req.path.includes('/auth')) {
            console.log(`[SECURITY] [${requestId}] Sensitive operation: ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
        }

        originalSend.call(this, data);
    };

    next();
};

// Middleware de verificação de integridade
const integrityCheck = (req, res, next) => {
    // Verificar se a requisição vem de origem confiável
    const allowedOrigins = [
        'https://seudominio.com',
        'https://www.seudominio.com',
        'https://api.seudominio.com',
        'https://ratixpay-backend.onrender.com'
    ];

    const origin = req.get('Origin');
    if (origin && !allowedOrigins.includes(origin)) {
        console.log(`[SECURITY] Blocked request from unauthorized origin: ${origin}`);
        return res.status(403).json({
            error: 'Origem não autorizada'
        });
    }

    // Verificar User-Agent suspeito
    const userAgent = req.get('User-Agent');
    if (userAgent && (
        userAgent.includes('bot') ||
        userAgent.includes('crawler') ||
        userAgent.includes('scraper') ||
        userAgent.length < 10
    )) {
        console.log(`[SECURITY] Suspicious User-Agent: ${userAgent}`);
        return res.status(403).json({
            error: 'User-Agent não autorizado'
        });
    }

    next();
};

// Middleware de proteção contra ataques comuns
const attackProtection = (req, res, next) => {
    // Proteção contra SQL Injection
    const sqlInjectionPattern = /(\b(union|select|insert|update|delete|drop|create|alter)\b)/i;
    const queryString = JSON.stringify(req.query) + JSON.stringify(req.body) + JSON.stringify(req.params);
    
    if (sqlInjectionPattern.test(queryString)) {
        console.log(`[SECURITY] SQL Injection attempt detected: ${req.ip}`);
        return res.status(403).json({
            error: 'Requisição maliciosa detectada'
        });
    }

    // Proteção contra XSS
    const xssPattern = /<script|javascript:|on\w+=/i;
    if (xssPattern.test(queryString)) {
        console.log(`[SECURITY] XSS attempt detected: ${req.ip}`);
        return res.status(403).json({
            error: 'Requisição maliciosa detectada'
        });
    }

    // Proteção contra Path Traversal
    const pathTraversalPattern = /\.\.\/|\.\.\\/;
    if (pathTraversalPattern.test(req.path)) {
        console.log(`[SECURITY] Path traversal attempt detected: ${req.ip}`);
        return res.status(403).json({
            error: 'Requisição maliciosa detectada'
        });
    }

    next();
};

// Middleware de headers de segurança
const securityHeaders = (req, res, next) => {
    // Headers de segurança
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' cdnjs.cloudflare.com; " +
        "connect-src 'self' https://opay.mucamba.site; " +
        "frame-ancestors 'none';"
    );

    next();
};

// Configuração do Helmet
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "cdnjs.cloudflare.com"],
            connectSrc: ["'self'", "https://opay.mucamba.site"],
            frameAncestors: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
});

module.exports = {
    createRateLimiters,
    createSlowDown,
    validatePayment,
    validateProduct,
    sanitizeInput,
    auditLog,
    integrityCheck,
    attackProtection,
    securityHeaders,
    helmetConfig
}; 