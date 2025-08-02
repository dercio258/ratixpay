// Configuração da API
const API_BASE = 'http://localhost:3000/api';

// Estado do formulário
let currentStep = 1;
let productData = {};
let editMode = false;
let editId = null;

// Função para fazer requisições à API
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Erro na API:', error);
        throw error;
    }
}

// Função para mostrar notificação
function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed; top: 20px; right: 20px;
                padding: 15px 20px; border-radius: 8px;
                color: white; font-weight: bold;
                z-index: 1000; animation: slideIn 0.3s ease;
            }
            .notification.success { background: #28a745; }
            .notification.error { background: #dc3545; }
            .notification.warning { background: #ffc107; color: #333; }
            .notification-content {
                display: flex; align-items: center; gap: 10px;
            }
            .notification button {
                background: none; border: none; color: inherit;
                font-size: 18px; cursor: pointer;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentElement) notification.remove(); }, 5000);
}

// Função para selecionar tipo de produto
function selectProductType(type) {
    document.querySelectorAll('.product-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    document.querySelector(`[data-type="${type}"]`)?.classList.add('selected');
    productData.tipo = type === 'curso' ? 'Curso Online' : 'eBook';

    const nextBtn = document.querySelector('.step-content.active .btn-next');
    if (nextBtn) nextBtn.disabled = false;
}

// Função para validar etapa atual
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            if (!productData.tipo) {
                showNotification('Por favor, selecione o tipo de produto', 'error');
                return false;
            }
            break;
        case 2:
            const nome = document.getElementById('productName')?.value;
            const categoria = document.getElementById('productCategory')?.value;
            const descricao = document.getElementById('productDescription')?.value;
            const preco = document.getElementById('productPrice')?.value;
            const imagemUrl = document.getElementById('productImageUrl')?.value;
            const imagemFile = document.getElementById('productImageFile')?.files[0];

            if (!nome || !categoria || !descricao || !preco || (!imagemUrl && !imagemFile)) {
                showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
                return false;
            }
            break;
        case 3:
            let conteudoUrl = '';
            if (productData.tipo === 'Curso Online') {
                conteudoUrl = document.getElementById('courseContentUrl')?.value;
            } else {
                conteudoUrl = document.getElementById('ebookContentUrl')?.value;
            }

            if (!conteudoUrl) {
                showNotification('Por favor, forneça a URL do conteúdo', 'error');
                return false;
            }
            break;
    }

    return true;
}

// Função para upload de imagem
async function uploadImagem(file) {
    const formData = new FormData();
    formData.append('imagem', file);
    const response = await fetch(`${API_BASE}/produtos/upload-imagem`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Erro ao fazer upload da imagem');
    const data = await response.json();
    return data.imagemUrl; // O backend deve retornar { imagemUrl: '...' }
}

// Coletar dados da etapa atual
function collectStepData() {
    switch (currentStep) {
        case 2:
            productData.nome = document.getElementById('productName')?.value || '';
            productData.categoria = document.getElementById('productCategory')?.value || '';
            productData.descricao = document.getElementById('productDescription')?.value || '';
            productData.preco = parseFloat(document.getElementById('productPrice')?.value) || 0;
            productData.desconto = parseFloat(document.getElementById('productDiscount')?.value) || 0;
            productData.cupom = document.getElementById('couponCode')?.value || '';
            productData.afiliado = document.getElementById('allowAffiliates')?.checked || false;
            // Imagem: priorizar arquivo
            const fileInput = document.getElementById('productImageFile');
            const file = fileInput && fileInput.files && fileInput.files[0];
            if (file) {
                productData.imagemFile = file;
                productData.imagemUrl = '';
            } else {
                productData.imagemFile = null;
                productData.imagemUrl = document.getElementById('productImageUrl')?.value || '';
            }
            break;
        case 3:
            productData.conteudoUrl =
                productData.tipo === 'Curso Online'
                    ? document.getElementById('courseContentUrl')?.value || ''
                    : document.getElementById('ebookContentUrl')?.value || '';
            break;
    }
}

// Avançar etapa
function nextStep() {
    if (!validateCurrentStep()) return;

    collectStepData();

    if (currentStep < 4) {
        document.getElementById(`step${currentStep}`)?.classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.add('completed');

        currentStep++;

        document.getElementById(`step${currentStep}`)?.classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.add('active');

        if (currentStep === 3) setupStep3();
        if (currentStep === 4) setupStep4();
    }
}

// Voltar etapa
function prevStep() {
    if (currentStep > 1) {
        document.getElementById(`step${currentStep}`)?.classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.remove('active');

        currentStep--;

        document.getElementById(`step${currentStep}`)?.classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.remove('completed');
        document.querySelector(`[data-step="${currentStep}"]`)?.classList.add('active');
    }
}

// Mostrar conteúdo correto na etapa 3
function setupStep3() {
    const courseContent = document.getElementById('courseContent');
    const ebookContent = document.getElementById('ebookContent');

    if (productData.tipo === 'Curso Online') {
        courseContent.style.display = 'block';
        ebookContent.style.display = 'none';
    } else {
        courseContent.style.display = 'none';
        ebookContent.style.display = 'block';
    }
}

// Configurar resumo na etapa 4
function setupStep4() {
    updateProductSummary();
}

// Lógica para garantir que apenas um campo de imagem seja usado
window.toggleImageInputs = function() {
    const urlInput = document.getElementById('productImageUrl');
    const fileInput = document.getElementById('productImageFile');
    if (urlInput.value) {
        fileInput.disabled = true;
    } else {
        fileInput.disabled = false;
    }
    if (fileInput.files && fileInput.files.length > 0) {
        urlInput.disabled = true;
    } else {
        urlInput.disabled = false;
    }
};

// Atualizar revisão do produto com checks verdes na checklist
function updateProductSummary() {
    // Checklist
    const check = '<i class="fas fa-check-circle" style="color:#28a745;"></i>';
    const cross = '<i class="fas fa-times" style="color:#dc3545;"></i>';
    const checklist = [
        { id: 'checkType', label: 'Tipo selecionado', valid: !!productData.tipo },
        { id: 'checkName', label: 'Nome do produto', valid: !!productData.nome },
        { id: 'checkImage', label: 'Imagem anexada', valid: !!(productData.imagemUrl || productData.imagemFile) },
        { id: 'checkContent', label: 'Conteúdo verificado', valid: !!productData.conteudoUrl },
    ];
    checklist.forEach(item => {
        const el = document.getElementById(item.id);
        if (el) {
            el.innerHTML = `${item.valid ? check : cross} <span>${item.label}</span>`;
        }
    });
    // Resumo limpo
    const summary = document.getElementById('productSummary');
    if (!summary) return;
    const preco = productData.preco || 0;
    const desconto = productData.desconto || 0;
    const precoFinal = preco - (preco * desconto / 100);
    summary.innerHTML = `
        <div class="summary-card">
            <h3>Resumo do Produto</h3>
            <div class="summary-item"><strong>Tipo:</strong> ${productData.tipo || '-'}</div>
            <div class="summary-item"><strong>Nome:</strong> ${productData.nome || '-'}</div>
            <div class="summary-item"><strong>Categoria:</strong> ${productData.categoria || '-'}</div>
            <div class="summary-item"><strong>Descrição:</strong> ${productData.descricao || '-'}</div>
            <div class="summary-item"><strong>Preço:</strong> MZN ${preco.toFixed(2).replace('.', ',')}</div>
            ${desconto > 0 ? `<div class="summary-item"><strong>Desconto:</strong> ${desconto}%</div><div class="summary-item"><strong>Preço Final:</strong> MZN ${precoFinal.toFixed(2).replace('.', ',')}</div>` : ''}
            <div class="summary-item"><strong>Permite Afiliados:</strong> ${productData.afiliado ? 'Sim' : 'Não'}</div>
            <div class="summary-item"><strong>ID:</strong> ${productData.customId || '-'}</div>
        </div>
    `;
}

// Atualiza campo "Preço Final"
function calculateFinalPrice() {
    const price = parseFloat(document.getElementById('productPrice')?.value) || 0;
    const discount = parseFloat(document.getElementById('productDiscount')?.value) || 0;
    const final = price - (price * discount / 100);

    document.getElementById('finalPrice').value = `MZN ${final.toFixed(2)}`;
}

// Spinner de carregamento na finalização
async function finishProduct() {
    if (!validateCurrentStep()) return;
    collectStepData();
    const finishBtn = document.querySelector('.btn-finish');
    const reviewLoading = document.getElementById('reviewLoading');
    if (finishBtn) {
        const originalText = finishBtn.textContent;
        finishBtn.textContent = editMode ? 'Salvando...' : 'Salvando...';
        finishBtn.disabled = true;
        if (reviewLoading) reviewLoading.style.display = 'flex';
        try {
            // Se houver arquivo de imagem, fazer upload primeiro
            if (productData.imagemFile) {
                const url = await uploadImagem(productData.imagemFile);
                productData.imagemUrl = url;
                delete productData.imagemFile;
            }
            if (editMode && editId) {
                // Atualizar produto existente (PUT)
                await apiRequest(`/produtos/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                });
                showNotification('Produto atualizado com sucesso!', 'success');
            } else {
                // Criar novo produto (POST)
                await apiRequest('/produtos', {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
                showNotification('Produto criado com sucesso!', 'success');
            }
            setTimeout(() => window.location.href = '/dashboard', 2000);
        } catch (err) {
            showNotification('Erro ao salvar produto. Tente novamente.', 'error');
            finishBtn.textContent = originalText;
            finishBtn.disabled = false;
        } finally {
            if (reviewLoading) reviewLoading.style.display = 'none';
        }
    }
}

// Suporte para edição de produto
async function carregarProdutoParaEdicao() {
    const urlParams = new URLSearchParams(window.location.search);
    editId = urlParams.get('edit');
    if (!editId) return;
    editMode = true;
    try {
        const produto = await apiRequest(`/produtos/${editId}`);
        productData = { ...produto };
        // Etapa 1
        if (produto.tipo === 'Curso Online') {
            selectProductType('curso');
        } else {
            selectProductType('ebook');
        }
        // Bloquear seleção de tipo
        document.querySelectorAll('.product-type-card').forEach(card => {
            card.style.pointerEvents = 'none';
            card.style.opacity = '0.6';
        });
        // Etapa 2
        document.getElementById('productName').value = produto.nome || '';
        document.getElementById('productCategory').value = produto.categoria || '';
        document.getElementById('productDescription').value = produto.descricao || '';
        document.getElementById('productPrice').value = produto.preco || '';
        document.getElementById('productDiscount').value = produto.desconto || 0;
        calculateFinalPrice();
        document.getElementById('finalPrice').value = `MZN ${(produto.precoComDesconto || produto.preco).toFixed(2)}`;
        document.getElementById('couponCode').value = produto.cupom || '';
        document.getElementById('allowAffiliates').checked = !!produto.afiliado;
        document.getElementById('productImageUrl').value = produto.imagemUrl || '';
        // Etapa 3
        if (produto.tipo === 'Curso Online') {
            document.getElementById('courseContentUrl').value = produto.conteudoUrl || '';
        } else {
            document.getElementById('ebookContentUrl').value = produto.conteudoUrl || '';
        }
        // Atualizar resumo e checklist
        updateProductSummary();
        // Avançar automaticamente para etapa 2 e habilitar botão Próximo
        document.getElementById('step1')?.classList.remove('active');
        document.querySelector('[data-step="1"]')?.classList.remove('active');
        document.querySelector('[data-step="1"]')?.classList.add('completed');
        document.getElementById('step2')?.classList.add('active');
        document.querySelector('[data-step="2"]')?.classList.add('active');
        document.querySelector('.step-content.active .btn-next')?.removeAttribute('disabled');
        // Bloquear botão 'Anterior' na etapa 2
        const prevBtn = document.querySelector('#step2 .btn-prev');
        if (prevBtn) prevBtn.disabled = true;
        // Mudar texto do botão de finalização
        const finishBtn = document.querySelector('.btn-finish');
        if (finishBtn) finishBtn.textContent = 'Salvar Alterações';
    } catch (err) {
        showNotification('Erro ao carregar produto para edição', 'error');
    }
}

// Inicializar eventos ao carregar
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.product-type-card').forEach(card => {
        card.addEventListener('click', () => {
            selectProductType(card.getAttribute('data-type'));
        });
    });

    document.getElementById('productPrice')?.addEventListener('input', calculateFinalPrice);
    document.getElementById('productDiscount')?.addEventListener('input', calculateFinalPrice);

    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', nextStep);
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    document.querySelector('.btn-finish')?.addEventListener('click', finishProduct);

    carregarProdutoParaEdicao();

    console.log('Criação de produto inicializada.');
});

 