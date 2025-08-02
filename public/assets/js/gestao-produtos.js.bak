// Configuração da API
const API_BASE = 'http://localhost:3000/api';

// Estado da aplicação
let produtos = [];
let produtoParaExcluir = null;

// Elementos DOM
const loadingElement = document.getElementById('loading');
const produtosContainer = document.getElementById('produtos-container');
const emptyState = document.getElementById('empty-state');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalMensagem = document.getElementById('modal-mensagem');
const btnConfirmar = document.getElementById('btn-confirmar');
const btnCancelar = document.getElementById('btn-cancelar');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    configurarEventos();
});

// Configurar eventos
function configurarEventos() {
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModal);
    if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarAcao);
    
    // Fechar modal clicando fora
    if (modalConfirmacao) {
        modalConfirmacao.addEventListener('click', function(e) {
            if (e.target === modalConfirmacao) {
                fecharModal();
            }
        });
    }
}

// Carregar produtos da API
async function carregarProdutos() {
    try {
        mostrarLoading(true);
        
        const response = await fetch(`${API_BASE}/produtos?limite=100`);
        const data = await response.json();
        
        if (response.ok) {
            produtos = data.produtos || [];
            renderizarProdutos();
        } else {
            console.error('Erro ao carregar produtos:', data.erro);
            mostrarErro('Erro ao carregar produtos');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        mostrarErro('Erro de conexão com o servidor');
    } finally {
        mostrarLoading(false);
    }
}

// Renderizar produtos na tela
function renderizarProdutos() {
    if (produtos.length === 0) {
        produtosContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    produtosContainer.style.display = 'block';
    emptyState.style.display = 'none';
    
    produtosContainer.innerHTML = produtos.map(produto => criarCardProduto(produto)).join('');
}

// Adicionar barra de busca dinâmica com filtro de categoria
const searchBarHTML = `
<div class="search-container" style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
    <input type="text" id="searchProdutos" placeholder="Buscar por nome, ID ou categoria..." style="flex:1; padding: 10px; border-radius: 5px; border: 1px solid #ccc;">
    <select id="filterCategoria" style="padding: 8px; border-radius: 5px; border: 1px solid #ccc;">
        <option value="">Todas as categorias</option>
        <option value="marketing">Marketing</option>
        <option value="programacao">Programação</option>
        <option value="financeiro">Financeiro</option>
        <option value="idiomas">Idiomas</option>
        <option value="saude">Saúde</option>
        <option value="ebook">eBook</option>
    </select>
    <button id="btnSearch" style="background: none; border: none; cursor: pointer;"><i class="fas fa-search"></i></button>
</div>`;
produtosContainer.insertAdjacentHTML('beforebegin', searchBarHTML);
document.getElementById('searchProdutos').addEventListener('input', filtrarProdutos);
document.getElementById('btnSearch').addEventListener('click', filtrarProdutos);
document.getElementById('filterCategoria').addEventListener('change', filtrarProdutos);

function filtrarProdutos() {
    const termo = document.getElementById('searchProdutos').value.toLowerCase();
    const categoria = document.getElementById('filterCategoria').value;
    const filtrados = produtos.filter(produto => {
        const matchTermo =
            (produto.nome && produto.nome.toLowerCase().includes(termo)) ||
            (produto.customId && produto.customId.toLowerCase().includes(termo)) ||
            (produto.categoria && produto.categoria.toLowerCase().includes(termo));
        const matchCategoria = !categoria || (produto.categoria && produto.categoria === categoria);
        return matchTermo && matchCategoria;
    });
    produtosContainer.innerHTML = filtrados.map(produto => criarCardProduto(produto)).join('');
}

// Criar card de produto com design moderno
function criarCardProduto(produto) {
    const statusBadges = gerarStatusBadges(produto);
    const precoFormatado = formatarPreco(produto.preco);
    const precoComDesconto = produto.desconto > 0 ? formatarPreco(produto.precoComDesconto) : null;
    const imagemUrl = produto.imagemUrl || produto.imagem || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik00MCAyOEMzNy43OTA5IDI4IDM2IDI5Ljc5MDkgMzYgMzJWNDhDMzYgNTAuMjA5MSAzNy43OTA5IDUyIDQwIDUySDQ4QzUwLjIwOTEgNTIgNTIgNTAuMjA5MSA1MiA0OFY0OEM1MiA0NS43OTA5IDUwLjIwOTEgNDQgNDggNDRINDBDMzcuNzkwOSA0NCAzNiA0NS43OTA5IDM2IDQ4VjMyWiIgZmlsbD0iI0U5RUNFRiIvPgo8L3N2Zz4K';
    
    return `
        <div class="product-card">
            <div class="product-card-header">
                <h3 class="product-title">${produto.nome}</h3>
                <span class="product-type-badge">${produto.tipo}</span>
            </div>
            
            <div class="product-card-body">
                <div class="product-info-row">
                    <img src="${imagemUrl}" alt="${produto.nome}" class="product-image"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjhGOUZBIi8+CjxwYXRoIGQ9Ik00MCAyOEMzNy43OTA5IDI4IDM2IDI5Ljc5MDkgMzYgMzJWNDhDMzYgNTAuMjA5MSAzNy43OTA5IDUyIDQwIDUySDQ4QzUwLjIwOTEgNTIgNTIgNTAuMjA5MSA1MiA0OFY0OEM1MiA0NS43OTA5IDUwLjIwOTEgNDQgNDggNDRINDBDMzcuNzkwOSA0NCAzNiA0NS43OTA5IDM2IDQ4VjMyWiIgZmlsbD0iI0U5RUNFRiIvPgo8L3N2Zz4K'">
                    
                    <div class="product-details">
                        <div class="product-id">ID: ${produto.customId || produto.id}</div>
                        <div class="product-price ${produto.desconto > 0 ? 'discounted' : ''}">
                            ${precoComDesconto ? precoComDesconto : precoFormatado}
                            ${produto.desconto > 0 ? `
                                <span class="original-price">${precoFormatado}</span>
                                <span class="discount-badge">-${produto.desconto}%</span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="status-badges">
                    ${statusBadges}
                </div>
                
                <div class="product-actions">
                    <a href="/checkout?id=${produto.id}" class="action-btn success">
                        <i class="fas fa-credit-card"></i> Pagamento
                    </a>
                    <a href="criar-produto.html?edit=${produto.id}" class="action-btn warning">
                        <i class="fas fa-edit"></i> Atualizar Produto
                    </a>
                    <button onclick="confirmarExclusao('${produto.id}', '${produto.nome}')" class="action-btn danger">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Gerar badges de status com design moderno
function gerarStatusBadges(produto) {
    const badges = [];
    
    if (produto.ativo) {
        badges.push('<span class="status-badge active">Ativo</span>');
    } else {
        badges.push('<span class="status-badge inactive">Inativo</span>');
    }
    
    if (produto.afiliado) {
        badges.push('<span class="status-badge affiliate">Afiliado</span>');
    }
    
    if (produto.disponivelMarketplace) {
        badges.push('<span class="status-badge marketplace">Marketplace</span>');
    }
    
    return badges.join(' ');
}

// Formatar preço
function formatarPreco(preco) {
    return new Intl.NumberFormat('pt-MZ', {
        style: 'currency',
        currency: 'MZN',
        minimumFractionDigits: 2
    }).format(preco);
}

// Confirmar exclusão
function confirmarExclusao(produtoId, produtoNome) {
    produtoParaExcluir = produtoId;
    modalMensagem.textContent = `Tem certeza que deseja excluir o produto "${produtoNome}"? Esta ação não pode ser desfeita.`;
    modalConfirmacao.style.display = 'flex';
}

// Confirmar ação
async function confirmarAcao() {
    if (produtoParaExcluir) {
        await excluirProduto(produtoParaExcluir);
        produtoParaExcluir = null;
    }
    fecharModal();
}

// Fechar modal
function fecharModal() {
    modalConfirmacao.style.display = 'none';
    produtoParaExcluir = null;
}

// Excluir produto
async function excluirProduto(produtoId) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${produtoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarSucesso('Produto excluído com sucesso');
            produtos = produtos.filter(p => p.id !== produtoId);
            renderizarProdutos();
        } else {
            mostrarErro(data.erro || 'Erro ao excluir produto');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        mostrarErro('Erro de conexão com o servidor');
    }
}

// Alternar status ativo
async function alternarAtivo(produtoId) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${produtoId}/ativo`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarSucesso(data.mensagem);
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) {
                produto.ativo = data.produto.ativo;
                renderizarProdutos();
            }
        } else {
            mostrarErro(data.erro || 'Erro ao alterar status do produto');
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarErro('Erro de conexão com o servidor');
    }
}

// Alternar marketplace
async function alternarMarketplace(produtoId) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${produtoId}/marketplace`, {
            method: 'PATCH'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarSucesso(data.mensagem);
            const produto = produtos.find(p => p.id === produtoId);
            if (produto) {
                produto.disponivelMarketplace = data.produto.disponivelMarketplace;
                renderizarProdutos();
            }
        } else {
            mostrarErro(data.erro || 'Erro ao alterar disponibilidade no marketplace');
        }
    } catch (error) {
        console.error('Erro ao alterar marketplace:', error);
        mostrarErro('Erro de conexão com o servidor');
    }
}

// Mostrar loading
function mostrarLoading(mostrar) {
    loadingElement.style.display = mostrar ? 'block' : 'none';
}

// Mostrar mensagem de sucesso
function mostrarSucesso(mensagem) {
    console.log('Sucesso:', mensagem);
    alert(mensagem);
}

// Mostrar mensagem de erro
function mostrarErro(mensagem) {
    console.error('Erro:', mensagem);
    alert(mensagem);
}

