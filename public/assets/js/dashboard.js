// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Função para capturar token da URL
function capturarTokenDaURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
        // Salvar token no localStorage
        localStorage.setItem('authToken', token);
        
        // Limpar token da URL
        const novaURL = window.location.pathname;
        window.history.replaceState({}, document.title, novaURL);
        
        console.log('✅ Token capturado e salvo');
        return true;
    }
    
    return false;
}

// Utilitário para formatação de moeda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(value);
};

// Utilitário para formatação de data
const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Função para fazer requisições à API com melhor tratamento de erros
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.erro || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        showNotification('Erro ao conectar com o servidor', 'error');
        throw error;
    }
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Função para carregar estatísticas do dashboard
async function carregarEstatisticas() {
    try {
        const estatisticas = await apiRequest('/dashboard/estatisticas');
        
        // Atualizar cards de estatísticas com animação
        updateStatCard('receitaTotal', formatCurrency(estatisticas.receitaTotal || 0));
        updateStatCard('vendasAprovadas', estatisticas.vendasAprovadas || 0);
        
        // Atualizar timestamp da última atualização
        document.getElementById('lastUpdate').textContent = 
            `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        // Manter valores padrão em caso de erro
        updateStatCard('receitaTotal', formatCurrency(0));
        updateStatCard('vendasAprovadas', 0);
    }
}

// Função para atualizar cards com animação
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.style.opacity = '0.5';
    setTimeout(() => {
        element.textContent = value;
        element.style.opacity = '1';
    }, 200);
}

// Função para carregar dados do gráfico de vendas
async function carregarGraficoVendas() {
    try {
        const vendasSemana = await apiRequest('/dashboard/vendas-semana');
        
        // Preparar dados para o gráfico
        const salesData = {
            labels: vendasSemana.map(v => v.dia),
            data: vendasSemana.map(v => v.vendas)
        };
        
        drawSalesChart(salesData);
        
    } catch (error) {
        console.error('Erro ao carregar gráfico de vendas:', error);
        // Usar dados padrão em caso de erro
        const salesData = {
            labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
            data: [0, 0, 0, 0, 0, 0, 0]
        };
        drawSalesChart(salesData);
    }
}

// Função para desenhar o gráfico de vendas aprimorada
function drawSalesChart(salesData) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Ajustar tamanho do canvas para alta resolução
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Configurações do gráfico
    const padding = 50;
    const chartWidth = rect.width - (padding * 2);
    const chartHeight = rect.height - (padding * 2);
    const maxValue = Math.max(...salesData.data, 1);
    const barWidth = chartWidth / salesData.data.length;
    
    // Limpar canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Desenhar grid de fundo
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (i * chartHeight / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(rect.width - padding, y);
        ctx.stroke();
    }
    
    // Desenhar barras com animação
    salesData.data.forEach((value, index) => {
        const barHeight = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
        const x = padding + (index * barWidth) + (barWidth * 0.1);
        const y = rect.height - padding - barHeight;
        const width = barWidth * 0.8;
        
        // Gradiente para as barras
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#4f46e5');
        gradient.addColorStop(1, '#3730a3');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, barHeight);
        
        // Sombra das barras
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        
        // Labels dos dias
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'transparent';
        ctx.fillText(salesData.labels[index], x + width/2, rect.height - 15);
        
        // Valores nas barras
        if (value > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter, sans-serif';
            ctx.fillText(value, x + width/2, y - 8);
        }
    });
    
    // Título do gráfico
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Vendas dos Últimos 7 Dias', rect.width/2, 30);
}

// Função para navegação no menu lateral aprimorada
function setupNavigation() {
    const menuItems = document.querySelectorAll('.sidebar ul li a');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Permitir navegação normal para links com href válidos
            if (this.getAttribute('href') && 
                this.getAttribute('href') !== '#' && 
                !this.getAttribute('href').startsWith('javascript:')) {
                return;
            }
            
            e.preventDefault();
            
            // Atualizar estado ativo
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
            
            const section = this.getAttribute('data-section');
            handleNavigation(section);
        });
    });
}

// Função para lidar com navegação
function handleNavigation(section) {
    switch(section) {
        case 'painel':
            // Já estamos no painel
            break;
        case 'produtos':
            window.location.href = '/gestao-produtos';
            break;
        case 'vendas':
            window.location.href = '/gestao-vendas';
            break;
        case 'ferramentas':
            window.location.href = '/ferramentas';
            break;
        default:
            console.log('Seção não implementada:', section);
    }
}

// Função para atualização automática
function setupAutoUpdate() {
    let updateInterval;
    
    const startAutoUpdate = () => {
        updateInterval = setInterval(async () => {
            try {
                await carregarEstatisticas();
                console.log('📊 Estatísticas atualizadas automaticamente');
            } catch (error) {
                console.error('❌ Erro na atualização automática:', error);
            }
        }, 2 * 60 * 1000); // A cada 2 minutos
    };
    
    const stopAutoUpdate = () => {
        if (updateInterval) {
            clearInterval(updateInterval);
        }
    };
    
    // Parar atualização quando a aba não estiver visível
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAutoUpdate();
        } else {
            startAutoUpdate();
        }
    });
    
    startAutoUpdate();
}

// Função para mostrar loading com skeleton
function showLoading() {
    const loadingElements = document.querySelectorAll('[data-loading]');
    loadingElements.forEach(element => {
        element.classList.add('skeleton-loading');
    });
}

// Função para esconder loading
function hideLoading() {
    const loadingElements = document.querySelectorAll('[data-loading]');
    loadingElements.forEach(element => {
        element.classList.remove('skeleton-loading');
    });
}

// Função para verificar saúde do sistema
async function checkSystemHealth() {
    try {
        const health = await apiRequest('/health');
        console.log('🟢 Sistema saudável:', health);
        return true;
    } catch (error) {
        console.error('🔴 Sistema com problemas:', error);
        showNotification('Sistema temporariamente indisponível', 'warning');
        return false;
    }
}

// Função para carregar informações do usuário
async function carregarInformacoesUsuario() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.log('❌ Token não encontrado, redirecionando para login...');
            window.location.href = '/';
            return;
        }

        console.log('🔍 Verificando token...');
        
        // Verificar se é token JWT válido
        if (token.split('.').length === 3) {
            console.log('🔍 Token JWT detectado, verificando via API...');
        }

        const response = await fetch(`${API_BASE}/auth/verificar`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Resposta da verificação:', response.status);

        if (response.ok) {
            const data = await response.json();
            const usuario = data.usuario;
            
            // Atualizar informações do usuário
            document.getElementById('welcomeMessage').textContent = `Seja bem-vindo, ${usuario.nome}`;
            document.getElementById('userName').textContent = usuario.nome;
            document.getElementById('userRole').textContent = usuario.tipo === 'admin' ? 'Administrador' : 'Vendedor';
            document.getElementById('userEmail').textContent = usuario.email;
            
            // Se for usuário Google, mostrar avatar do Google
            if (usuario.googleId) {
                const avatarElement = document.getElementById('userAvatar');
                avatarElement.innerHTML = `<img src="https://lh3.googleusercontent.com/a/ACg8ocKj717mQCY7qGBE4pFTt5LPAOwPAP-JsBp34h9_PuSSIdaTzA=s96-c" alt="${usuario.nome}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`;
            }
            
            console.log('✅ Informações do usuário carregadas:', usuario);
            
            // Adicionar evento de logout
            document.getElementById('logoutBtn').addEventListener('click', function() {
                if (confirm('Tem certeza que deseja sair?')) {
                    localStorage.removeItem('authToken');
                    sessionStorage.clear();
                    window.location.href = '/';
                }
            });
        } else {
            console.error('❌ Erro ao verificar token:', response.status);
            localStorage.removeItem('authToken');
            showNotification('Sessão expirada. Faça login novamente.', 'warning');
            setTimeout(() => {
                window.location.href = '/';
            }, 2000);
        }
    } catch (error) {
        console.error('❌ Erro ao carregar informações do usuário:', error);
        showNotification('Erro ao carregar informações do usuário', 'error');
        localStorage.removeItem('authToken');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Inicializando dashboard RatixPay...');
    
    showLoading();
    
    // Capturar token da URL se existir
    capturarTokenDaURL();
    
    setupNavigation();
    
    // Verificar se há token na URL (callback do Google)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
        console.log('🔑 Token encontrado na URL, salvando...');
        localStorage.setItem('authToken', tokenFromUrl);
        // Limpar a URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Carregar informações do usuário primeiro
    await carregarInformacoesUsuario();
    
    // Verificar saúde do sistema
    const systemHealthy = await checkSystemHealth();
    
    if (systemHealthy) {
        try {
            // Carregar dados em paralelo
            await Promise.all([
                carregarEstatisticas(),
                carregarGraficoVendas()
            ]);
            
            console.log('✅ Dashboard carregado com sucesso');
            showNotification('Dashboard carregado com sucesso', 'success');
        } catch (error) {
            console.error('❌ Erro ao carregar dashboard:', error);
            showNotification('Erro ao carregar alguns dados do dashboard', 'error');
        }
    }
    
    hideLoading();
    setupAutoUpdate();
    
    // Redimensionar gráfico quando a janela for redimensionada
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            carregarGraficoVendas();
        }, 250);
    });
});

// Adicionar estilos para notificações e loading
const styles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideIn 0.3s ease;
    }
    
    .notification-success { background: #10b981; }
    .notification-error { background: #ef4444; }
    .notification-warning { background: #f59e0b; }
    .notification-info { background: #3b82f6; }
    
    .notification button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .skeleton-loading {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
    }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

