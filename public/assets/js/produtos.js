// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Produtos simulados para demonstração da plataforma RatixPay
const produtosSimulados = [
    {
        id: '1',
        name: 'Curso de Marketing Digital',
        type: 'curso',
        category: 'marketing',
        description: 'Aprenda as melhores estratégias de marketing digital para alavancar seu negócio online. Curso completo com módulos práticos e cases reais.',
        price: 297.00,
        discount: 10,
        finalPrice: 267.30,
        couponCode: 'MARKETING10',
        allowAffiliates: true,
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA3YmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXJrZXRpbmc8L3RleHQ+PC9zdmc+',
        content: {
            modules: [
                {
                    name: 'Fundamentos do Marketing Digital',
                    description: 'Conceitos básicos e estratégias fundamentais',
                    lessons: ['Introdução ao Marketing Digital', 'Personas e Público-Alvo', 'Funil de Vendas']
                },
                {
                    name: 'Redes Sociais',
                    description: 'Como usar as redes sociais para marketing',
                    lessons: ['Facebook Ads', 'Instagram Marketing', 'LinkedIn para Negócios']
                },
                {
                    name: 'SEO e Conteúdo',
                    description: 'Otimização para mecanismos de busca',
                    lessons: ['SEO Básico', 'Marketing de Conteúdo', 'Google Analytics']
                }
            ]
        },
        createdAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        name: 'eBook: Finanças Pessoais',
        type: 'ebook',
        category: 'financas',
        description: 'Guia completo para organizar suas finanças pessoais, eliminar dívidas e construir patrimônio. Métodos práticos e planilhas incluídas.',
        price: 47.00,
        discount: 0,
        finalPrice: 47.00,
        couponCode: '',
        allowAffiliates: false,
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjhjM2U1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RmluYW7Dp2FzPC90ZXh0Pjwvc3ZnPg==',
        content: {
            pdfFile: 'financas-pessoais.pdf'
        },
        createdAt: '2024-01-20T14:15:00Z'
    },
    {
        id: '3',
        name: 'Curso de Programação Python',
        type: 'curso',
        category: 'tecnologia',
        description: 'Aprenda Python do zero ao avançado. Curso prático com projetos reais e certificado de conclusão.',
        price: 397.00,
        discount: 15,
        finalPrice: 337.45,
        couponCode: 'PYTHON15',
        allowAffiliates: true,
        image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2YjM1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QeXRob248L3RleHQ+PC9zdmc+',
        content: {
            modules: [
                {
                    name: 'Fundamentos do Python',
                    description: 'Sintaxe básica e conceitos fundamentais',
                    lessons: ['Variáveis e Tipos', 'Estruturas de Controle', 'Funções']
                },
                {
                    name: 'Programação Orientada a Objetos',
                    description: 'Classes, objetos e herança',
                    lessons: ['Classes e Objetos', 'Herança', 'Polimorfismo']
                },
                {
                    name: 'Projetos Práticos',
                    description: 'Desenvolvimento de aplicações reais',
                    lessons: ['Sistema de Gestão', 'API REST', 'Web Scraping']
                }
            ]
        },
        createdAt: '2024-01-25T09:45:00Z'
    }
];

// Função para carregar produtos (simulada ou da API)
async function carregarProdutos() {
    try {
        // Tentar carregar da API primeiro
        const response = await fetch(`${API_BASE}/produtos`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.produtos || [];
        } else {
            // Se falhar, usar produtos simulados
            console.log('Usando produtos simulados');
            return produtosSimulados;
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Em caso de erro, usar produtos simulados
        return produtosSimulados;
    }
}

// Função para salvar produto
async function salvarProduto(produto) {
    try {
        const response = await fetch(`${API_BASE}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(produto)
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Erro ao salvar produto');
        }
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        throw error;
    }
}

// Função para atualizar produto
async function atualizarProduto(id, produto) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(produto)
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Erro ao atualizar produto');
        }
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
    }
}

// Função para deletar produto
async function deletarProduto(id) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            throw new Error('Erro ao deletar produto');
        }
    } catch (error) {
        console.error('Erro ao deletar produto:', error);
        throw error;
    }
}

// Função para buscar produto por ID
async function buscarProdutoPorId(id) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            // Se não encontrar na API, buscar nos produtos simulados
            return produtosSimulados.find(p => p.id === id);
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        // Em caso de erro, buscar nos produtos simulados
        return produtosSimulados.find(p => p.id === id);
    }
}

// Função para gerar link de checkout
function gerarLinkCheckout(produtoId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/checkout.html?id=${produtoId}`;
}

// Função para copiar link para clipboard
async function copiarLink(link) {
    try {
        await navigator.clipboard.writeText(link);
        showSuccess('Link copiado para a área de transferência!');
    } catch (error) {
        console.error('Erro ao copiar link:', error);
        // Fallback para navegadores mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccess('Link copiado para a área de transferência!');
    }
}

// Função para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(valor);
}

// Função para formatar data
function formatarData(dataString) {
    return new Date(dataString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Funções utilitárias para UI
function showLoading(message) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingOverlay';
    loadingDiv.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(loadingDiv);
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// Exportar funções para uso global
window.ProdutosAPI = {
    carregarProdutos,
    salvarProduto,
    atualizarProduto,
    deletarProduto,
    buscarProdutoPorId,
    gerarLinkCheckout,
    copiarLink,
    formatarMoeda,
    formatarData,
    produtosSimulados
};

