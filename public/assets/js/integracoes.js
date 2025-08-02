// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Carregar produtos disponíveis para vincular ao pixel
async function carregarProdutos() {
    const select = document.getElementById('produto');
    select.innerHTML = '<option value="">Selecione um produto</option>';
    try {
        const resp = await fetch(`${API_BASE}/produtos?limite=100`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        const data = await resp.json();
        if (data.produtos) {
            data.produtos.forEach(produto => {
                const opt = document.createElement('option');
                opt.value = produto.id;
                opt.textContent = produto.customId ? `${produto.customId} - ${produto.nome}` : produto.nome;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error('Erro ao carregar produtos:', e);
        select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

// Mock para integrações (substituir por API real depois)
let integracoes = JSON.parse(localStorage.getItem('integracoes') || '[]');

function salvarIntegracoes() {
    localStorage.setItem('integracoes', JSON.stringify(integracoes));
}

function renderizarIntegracoes() {
    const list = document.getElementById('integrations-list');
    if (!integracoes.length) {
        list.innerHTML = '<p>Nenhuma integração cadastrada.</p>';
        return;
    }
    list.innerHTML = integracoes.map((i, idx) => `
        <div class="integration-card">
            <div><b>ID Pixel:</b> ${i.pixelId}</div>
            <div><b>Produto:</b> ${i.produtoCustomId ? i.produtoCustomId + ' - ' : ''}${i.produtoNome}</div>
            <div><b>Eventos:</b> ${i.eventos.join(', ')}</div>
            <button class="btn btn-danger" onclick="removerIntegracao(${idx})">Remover</button>
        </div>
    `).join('');
}

function removerIntegracao(idx) {
    if (confirm('Deseja remover esta integração?')) {
        integracoes.splice(idx, 1);
        salvarIntegracoes();
        renderizarIntegracoes();
    }
}

// Adicionar nova integração
function adicionarIntegracao() {
    const pixelId = document.getElementById('pixelId').value.trim();
    const produtoId = document.getElementById('produto').value;
    const eventos = Array.from(document.querySelectorAll('input[name="eventos"]:checked')).map(cb => cb.value);
    
    if (!pixelId || !produtoId || !eventos.length) {
        showError('Por favor, preencha todos os campos obrigatórios');
        return;
    }
    
    // Buscar nome do produto
    const produtoSelect = document.getElementById('produto');
    const produtoNome = produtoSelect.options[produtoSelect.selectedIndex].text;
    
    const novaIntegracao = {
        pixelId,
        produtoId,
        produtoNome,
        eventos,
        dataCriacao: new Date().toISOString()
    };
    
    integracoes.push(novaIntegracao);
    salvarIntegracoes();
    renderizarIntegracoes();
    
    // Limpar formulário
    document.getElementById('integrationForm').reset();
    
    showSuccess('Integração adicionada com sucesso!');
}

// Testar integração
async function testarIntegracao(idx) {
    const integracao = integracoes[idx];
    
    try {
        showLoading('Testando integração...');
        
        // Simular teste de pixel
        const response = await fetch(`${API_BASE}/integracoes/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({
                pixelId: integracao.pixelId,
                produtoId: integracao.produtoId,
                eventos: integracao.eventos
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Integração testada com sucesso!');
        } else {
            throw new Error(result.message || 'Erro ao testar integração');
        }
        
    } catch (error) {
        console.error('Erro ao testar integração:', error);
        showError('Erro ao testar integração. Verifique as configurações.');
    } finally {
        hideLoading();
    }
}

// Exportar configurações
function exportarConfiguracoes() {
    const config = {
        integracoes,
        dataExportacao: new Date().toISOString(),
        versao: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ratixpay-integracoes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showSuccess('Configurações exportadas com sucesso!');
}

// Importar configurações
function importarConfiguracoes(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            if (config.integracoes && Array.isArray(config.integracoes)) {
                integracoes = config.integracoes;
                salvarIntegracoes();
                renderizarIntegracoes();
                showSuccess('Configurações importadas com sucesso!');
            } else {
                throw new Error('Formato de arquivo inválido');
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            showError('Erro ao importar configurações. Verifique o arquivo.');
        }
    };
    reader.readAsText(file);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    carregarProdutos();
    renderizarIntegracoes();
    
    // Event listeners
    const integrationForm = document.getElementById('integrationForm');
    if (integrationForm) {
        integrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            adicionarIntegracao();
        });
    }
    
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportarConfiguracoes);
    }
    
    const importInput = document.getElementById('importInput');
    if (importInput) {
        importInput.addEventListener('change', importarConfiguracoes);
    }
});

// Funções utilitárias
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
    
    const container = document.querySelector('.container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

