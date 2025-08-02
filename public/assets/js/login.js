// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Elementos do DOM
const googleLoginBtn = document.getElementById('googleLoginBtn');
const errorMessage = document.getElementById('errorMessage');

// Verificar se há token na URL (callback do Google)
function checkUrlToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    
    if (error) {
        showError('Erro na autenticação. Tente novamente.');
        return;
    }
    
    if (token) {
        // Salvar token e redirecionar
        localStorage.setItem('authToken', token);
        window.location.href = '/dashboard';
    }
}

// Função para mostrar erro
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Limpar erro após 5 segundos
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Função para fazer login com Google
function loginWithGoogle() {
    // Redirecionar para a rota de autenticação Google
    const authUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/auth/google' 
        : 'https://ratixpay.onrender.com/api/auth/google';
    window.location.href = authUrl;
}



// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de login RatixPay...');
    
    // Verificar token na URL
    checkUrlToken();
    
    // Login com Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', loginWithGoogle);
    }
    
    console.log('✅ Sistema de login inicializado');
});

// Função para verificar se o usuário está autenticado
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return false;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/verificar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            localStorage.removeItem('authToken');
            return false;
        }
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        localStorage.removeItem('authToken');
        return false;
    }
}

// Função para fazer logout
function logout() {
    localStorage.removeItem('authToken');
    sessionStorage.clear();
    window.location.href = '/';
}

// Exportar funções para uso global
window.RatixPayAuth = {
    checkAuthStatus,
    logout,
    loginWithGoogle
};

