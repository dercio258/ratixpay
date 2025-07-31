const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// Middleware de validação de login
const validateLogin = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username deve ter entre 3 e 50 caracteres'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Dados de login inválidos',
                details: errors.array()
            });
        }
        next();
    }
];

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            error: 'Token de acesso não fornecido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.log(`[SECURITY] Invalid JWT token: ${err.message}`);
            return res.status(403).json({
                error: 'Token inválido ou expirado'
            });
        }

        req.user = user;
        next();
    });
};

// Middleware de autorização por role
const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Usuário não autenticado'
            });
        }

        if (!roles.includes(req.user.role)) {
            console.log(`[SECURITY] Unauthorized access attempt: ${req.user.username} tried to access ${req.path}`);
            return res.status(403).json({
                error: 'Acesso negado. Permissões insuficientes.'
            });
        }

        next();
    };
};

// Middleware de verificação de propriedade (usuário só pode acessar seus próprios dados)
const checkOwnership = (resourceType) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user.id;

            // Verificar se o recurso pertence ao usuário
            // Implementar lógica específica para cada tipo de recurso
            switch (resourceType) {
                case 'venda':
                    const Venda = require('../models/Venda');
                    const venda = await Venda.findById(resourceId);
                    if (!venda || venda.clienteEmail !== req.user.email) {
                        return res.status(403).json({
                            error: 'Acesso negado. Recurso não pertence ao usuário.'
                        });
                    }
                    break;
                case 'produto':
                    const Produto = require('../models/Produto');
                    const produto = await Produto.findById(resourceId);
                    if (!produto || produto.criadoPor !== userId) {
                        return res.status(403).json({
                            error: 'Acesso negado. Recurso não pertence ao usuário.'
                        });
                    }
                    break;
                default:
                    return res.status(400).json({
                        error: 'Tipo de recurso não suportado'
                    });
            }

            next();
        } catch (error) {
            console.error('[SECURITY] Error in ownership check:', error);
            return res.status(500).json({
                error: 'Erro interno do servidor'
            });
        }
    };
};

// Função para gerar token JWT
const generateToken = (user) => {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        issuer: 'ratixpay',
        audience: 'ratixpay-users'
    });
};

// Função para verificar senha
const verifyPassword = async (password, hash) => {
    try {
        return await bcrypt.compare(password, hash);
    } catch (error) {
        console.error('[SECURITY] Password verification error:', error);
        return false;
    }
};

// Função para hash de senha
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

// Middleware de rate limiting para login
const loginRateLimit = (req, res, next) => {
    // Implementar rate limiting específico para login
    // Isso será aplicado via middleware de segurança
    next();
};

// Middleware de verificação de sessão
const checkSession = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            error: 'Sessão inválida ou expirada'
        });
    }
    next();
};

// Middleware de logout seguro
const secureLogout = (req, res, next) => {
    // Invalidar sessão
    req.session.destroy((err) => {
        if (err) {
            console.error('[SECURITY] Error destroying session:', err);
        }
    });

    // Limpar cookies
    res.clearCookie('connect.sid');
    
    next();
};

// Middleware de verificação de força da senha
const validatePasswordStrength = (req, res, next) => {
    const password = req.body.password;
    
    if (!password) {
        return res.status(400).json({
            error: 'Senha é obrigatória'
        });
    }

    // Verificar comprimento mínimo
    if (password.length < 8) {
        return res.status(400).json({
            error: 'Senha deve ter pelo menos 8 caracteres'
        });
    }

    // Verificar se contém pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
        return res.status(400).json({
            error: 'Senha deve conter pelo menos uma letra maiúscula'
        });
    }

    // Verificar se contém pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
        return res.status(400).json({
            error: 'Senha deve conter pelo menos uma letra minúscula'
        });
    }

    // Verificar se contém pelo menos um número
    if (!/\d/.test(password)) {
        return res.status(400).json({
            error: 'Senha deve conter pelo menos um número'
        });
    }

    // Verificar se contém pelo menos um caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return res.status(400).json({
            error: 'Senha deve conter pelo menos um caractere especial'
        });
    }

    next();
};

module.exports = {
    validateLogin,
    authenticateToken,
    authorizeRole,
    checkOwnership,
    generateToken,
    verifyPassword,
    hashPassword,
    loginRateLimit,
    checkSession,
    secureLogout,
    validatePasswordStrength
}; 