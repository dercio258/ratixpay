// Configuração da API - Detecta automaticamente o ambiente
const API_CONFIG = {
    // Configuração para produção (Hostinger + Render)
    production: {
        frontend: 'https://ratixpay.com',
        backend: 'https://ratixpay.onrender.com/api'
    },
    // Configuração para desenvolvimento local
    development: {
        frontend: 'http://localhost:8080',
        backend: 'http://localhost:3000/api'
    }
};

// Detectar ambiente automaticamente
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('localhost');

const API_BASE = isLocalhost 
    ? API_CONFIG.development.backend
    : API_CONFIG.production.backend;

// Exportar configuração para uso global
window.RatixPayConfig = {
    API_BASE,
    isProduction: !isLocalhost,
    config: API_CONFIG
};

console.log('🔧 Configuração da API:', {
    ambiente: isLocalhost ? 'desenvolvimento' : 'produção',
    apiBase: API_BASE,
    hostname: window.location.hostname
});

