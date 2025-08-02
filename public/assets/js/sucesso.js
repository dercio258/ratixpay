// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Script para verificar status do pagamento na PaySuite e exibir ao usuário

(async function() {
    const statusDiv = document.getElementById('statusPagamento');
    const transactionId = localStorage.getItem('ratixpay_transactionId') || getTransactionIdFromUrl();
    
    if (!transactionId) {
        statusDiv.innerHTML = '<span style="color:red">ID da transação não encontrado.</span>';
        return;
    }

    statusDiv.innerHTML = 'Verificando status do pagamento...';

    try {
        // Buscar status na API
        const response = await fetch(`${API_BASE}/vendas/status/${transactionId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        const data = await response.json();
        let statusMsg = '';
        let color = 'orange';
        let hora = '';
        
        if (data && data.status) {
            if (data.status === 'Aprovado') {
                statusMsg = 'Pagamento aprovado!';
                color = 'green';
                
                // Disparar evento de conversão para pixels
                dispararEventoConversao(transactionId, data);
                
            } else if (data.status === 'Rejeitado') {
                statusMsg = 'Pagamento rejeitado.';
                color = 'red';
            } else if (data.status === 'Pendente') {
                statusMsg = 'Pagamento pendente.';
                color = 'orange';
            } else {
                statusMsg = 'Status: ' + data.status;
            }
            
            if (data.venda && data.venda.dataVenda) {
                hora = new Date(data.venda.dataVenda).toLocaleString('pt-BR');
            }
        } else {
            statusMsg = 'Não foi possível obter o status.';
            color = 'red';
        }
        
        statusDiv.innerHTML = `
            <div class="status-container">
                <strong>Status:</strong> <span style="color:${color}">${statusMsg}</span><br>
                <strong>Hora:</strong> ${hora}<br>
                <strong>ID da Transação:</strong> ${transactionId}
            </div>
        `;
        
        // Se aprovado, mostrar informações adicionais
        if (data.status === 'Aprovado' && data.venda) {
            mostrarDetalhesVenda(data.venda);
        }
        
    } catch (err) {
        console.error('Erro ao verificar status:', err);
        statusDiv.innerHTML = '<span style="color:red">Erro ao verificar status do pagamento.</span>';
    }
})();

// Função para obter ID da transação da URL
function getTransactionIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('transaction') || urlParams.get('id');
}

// Função para disparar evento de conversão para pixels
function dispararEventoConversao(transactionId, dadosVenda) {
    try {
        // Disparar evento personalizado para pixels de conversão
        const eventoConversao = new CustomEvent('ratixpay_conversion', {
            detail: {
                transactionId,
                value: dadosVenda.valor,
                currency: 'MZN',
                content_ids: [dadosVenda.produtoId],
                content_type: 'product'
            }
        });
        
        window.dispatchEvent(eventoConversao);
        
        // Se houver Facebook Pixel configurado
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Purchase', {
                value: dadosVenda.valor,
                currency: 'MZN',
                content_ids: [dadosVenda.produtoId],
                content_type: 'product'
            });
        }
        
        // Se houver Google Analytics configurado
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: transactionId,
                value: dadosVenda.valor,
                currency: 'MZN',
                items: [{
                    item_id: dadosVenda.produtoId,
                    item_name: dadosVenda.produtoNome,
                    category: dadosVenda.categoria,
                    quantity: 1,
                    price: dadosVenda.valor
                }]
            });
        }
        
        console.log('Eventos de conversão disparados com sucesso');
        
    } catch (error) {
        console.error('Erro ao disparar eventos de conversão:', error);
    }
}

// Função para mostrar detalhes da venda
function mostrarDetalhesVenda(venda) {
    const detalhesDiv = document.getElementById('detalhesVenda') || criarDivDetalhes();
    
    detalhesDiv.innerHTML = `
        <div class="venda-detalhes">
            <h3>Detalhes da Compra</h3>
            <div class="detalhe-item">
                <strong>Produto:</strong> ${venda.produtoNome || 'N/A'}
            </div>
            <div class="detalhe-item">
                <strong>Valor:</strong> MZN ${venda.valor ? venda.valor.toFixed(2) : '0.00'}
            </div>
            <div class="detalhe-item">
                <strong>Cliente:</strong> ${venda.clienteNome || 'N/A'}
            </div>
            <div class="detalhe-item">
                <strong>Email:</strong> ${venda.clienteEmail || 'N/A'}
            </div>
            <div class="detalhe-item">
                <strong>Método de Pagamento:</strong> ${venda.metodoPagamento || 'N/A'}
            </div>
        </div>
    `;
}

// Função para criar div de detalhes se não existir
function criarDivDetalhes() {
    const detalhesDiv = document.createElement('div');
    detalhesDiv.id = 'detalhesVenda';
    detalhesDiv.className = 'detalhes-container';
    
    const statusDiv = document.getElementById('statusPagamento');
    if (statusDiv && statusDiv.parentNode) {
        statusDiv.parentNode.insertBefore(detalhesDiv, statusDiv.nextSibling);
    } else {
        document.body.appendChild(detalhesDiv);
    }
    
    return detalhesDiv;
}

// Função para redirecionar para dashboard
function irParaDashboard() {
    window.location.href = '/dashboard.html';
}

// Função para baixar produto (se aplicável)
async function baixarProduto(produtoId) {
    try {
        const response = await fetch(`${API_BASE}/produtos/${produtoId}/download`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `produto-${produtoId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Erro ao baixar produto');
        }
    } catch (error) {
        console.error('Erro ao baixar produto:', error);
        alert('Erro ao baixar produto. Tente novamente mais tarde.');
    }
}

// Adicionar event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Botão para ir ao dashboard
    const dashboardBtn = document.getElementById('irDashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', irParaDashboard);
    }
    
    // Botão para baixar produto
    const downloadBtn = document.getElementById('baixarProduto');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const produtoId = this.getAttribute('data-produto-id');
            if (produtoId) {
                baixarProduto(produtoId);
            }
        });
    }
    
    // Limpar dados temporários após 5 minutos
    setTimeout(() => {
        localStorage.removeItem('ratixpay_transactionId');
    }, 5 * 60 * 1000);
});

