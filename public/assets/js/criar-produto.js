// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Variáveis globais
let currentStep = 1;
let productData = {
    type: '',
    name: '',
    category: '',
    description: '',
    price: 0,
    discount: 0,
    finalPrice: 0,
    couponCode: '',
    allowAffiliates: false,
    image: null,
    content: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadProductData();
});

function setupEventListeners() {
    // Seleção de tipo de produto
    const productTypeCards = document.querySelectorAll('.product-type-card');
    productTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            selectProductType(this.getAttribute('data-type'));
        });
    });

    // Upload de imagem
    const uploadBox = document.getElementById('uploadBox');
    const productImage = document.getElementById('productImage');
    
    uploadBox.addEventListener('click', () => productImage.click());
    productImage.addEventListener('change', handleImageUpload);

    // Upload de PDF (eBook)
    const pdfUploadBox = document.getElementById('pdfUploadBox');
    const ebookPdf = document.getElementById('ebookPdf');
    
    if (pdfUploadBox && ebookPdf) {
        pdfUploadBox.addEventListener('click', () => ebookPdf.click());
        ebookPdf.addEventListener('change', handlePdfUpload);
    }

    // Cálculo automático do preço final
    const priceInput = document.getElementById('productPrice');
    const discountInput = document.getElementById('productDiscount');
    
    if (priceInput) priceInput.addEventListener('input', calculateFinalPrice);
    if (discountInput) discountInput.addEventListener('input', calculateFinalPrice);

    // Navegação entre etapas
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    
    nextButtons.forEach(btn => {
        btn.addEventListener('click', nextStep);
    });
    
    prevButtons.forEach(btn => {
        btn.addEventListener('click', prevStep);
    });

    // Formulário final
    const createProductForm = document.getElementById('createProductForm');
    if (createProductForm) {
        createProductForm.addEventListener('submit', handleCreateProduct);
    }
}

function selectProductType(type) {
    productData.type = type;
    
    // Atualizar interface
    const cards = document.querySelectorAll('.product-type-card');
    cards.forEach(card => card.classList.remove('selected'));
    
    const selectedCard = document.querySelector(`[data-type="${type}"]`);
    selectedCard.classList.add('selected');
    
    // Mostrar campos específicos do tipo
    showTypeSpecificFields(type);
    
    // Salvar no localStorage
    saveProductData();
}

function showTypeSpecificFields(type) {
    const ebookFields = document.getElementById('ebookFields');
    const courseFields = document.getElementById('courseFields');
    
    if (ebookFields) ebookFields.style.display = type === 'ebook' ? 'block' : 'none';
    if (courseFields) courseFields.style.display = type === 'curso' ? 'block' : 'none';
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione apenas arquivos de imagem');
        return;
    }
    
    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('A imagem deve ter no máximo 5MB');
        return;
    }
    
    // Converter para base64 para preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const uploadText = document.querySelector('.upload-text');
        
        preview.src = e.target.result;
        preview.style.display = 'block';
        uploadText.style.display = 'none';
        
        productData.image = e.target.result;
        saveProductData();
    };
    reader.readAsDataURL(file);
}

function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
        showError('Por favor, selecione apenas arquivos PDF');
        return;
    }
    
    // Validar tamanho (máximo 50MB)
    if (file.size > 50 * 1024 * 1024) {
        showError('O PDF deve ter no máximo 50MB');
        return;
    }
    
    // Mostrar nome do arquivo
    const fileName = document.getElementById('pdfFileName');
    if (fileName) {
        fileName.textContent = file.name;
        fileName.style.display = 'block';
    }
    
    // Converter para base64
    const reader = new FileReader();
    reader.onload = function(e) {
        productData.content = e.target.result;
        saveProductData();
    };
    reader.readAsDataURL(file);
}

function calculateFinalPrice() {
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const discount = parseFloat(document.getElementById('productDiscount').value) || 0;
    
    const discountAmount = (price * discount) / 100;
    const finalPrice = price - discountAmount;
    
    productData.price = price;
    productData.discount = discount;
    productData.finalPrice = finalPrice;
    
    // Atualizar display
    const finalPriceDisplay = document.getElementById('finalPriceDisplay');
    if (finalPriceDisplay) {
        finalPriceDisplay.textContent = `MZN ${finalPrice.toFixed(2)}`;
    }
    
    saveProductData();
}

function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        updateStepDisplay();
        saveProductData();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function validateCurrentStep() {
    switch(currentStep) {
        case 1:
            if (!productData.type) {
                showError('Por favor, selecione o tipo de produto');
                return false;
            }
            break;
        case 2:
            const name = document.getElementById('productName').value.trim();
            const category = document.getElementById('productCategory').value;
            const description = document.getElementById('productDescription').value.trim();
            
            if (!name || !category || !description) {
                showError('Por favor, preencha todos os campos obrigatórios');
                return false;
            }
            
            productData.name = name;
            productData.category = category;
            productData.description = description;
            break;
        case 3:
            if (!productData.price || productData.price <= 0) {
                showError('Por favor, defina um preço válido');
                return false;
            }
            break;
    }
    return true;
}

function updateStepDisplay() {
    // Ocultar todas as etapas
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => step.style.display = 'none');
    
    // Mostrar etapa atual
    const currentStepElement = document.getElementById(`step${currentStep}`);
    if (currentStepElement) {
        currentStepElement.style.display = 'block';
    }
    
    // Atualizar indicador de progresso
    updateProgressIndicator();
}

function updateProgressIndicator() {
    const indicators = document.querySelectorAll('.step-indicator');
    indicators.forEach((indicator, index) => {
        if (index < currentStep) {
            indicator.classList.add('completed');
            indicator.classList.remove('active');
        } else if (index === currentStep - 1) {
            indicator.classList.add('active');
            indicator.classList.remove('completed');
        } else {
            indicator.classList.remove('active', 'completed');
        }
    });
}

async function handleCreateProduct(event) {
    event.preventDefault();
    
    if (!validateCurrentStep()) return;
    
    try {
        showLoading('Criando produto...');
        
        // Coletar dados finais do formulário
        const formData = new FormData(event.target);
        
        const finalProductData = {
            ...productData,
            couponCode: formData.get('couponCode') || '',
            allowAffiliates: formData.get('allowAffiliates') === 'on'
        };
        
        const response = await fetch(`${API_BASE}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(finalProductData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Produto criado com sucesso!');
            
            // Limpar dados salvos
            localStorage.removeItem('ratixpay_product_draft');
            
            // Redirecionar para gestão de produtos
            setTimeout(() => {
                window.location.href = '/gestao-produtos.html';
            }, 2000);
        } else {
            throw new Error(result.message || 'Erro ao criar produto');
        }
        
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        showError('Erro ao criar produto. Tente novamente.');
    } finally {
        hideLoading();
    }
}

function saveProductData() {
    localStorage.setItem('ratixpay_product_draft', JSON.stringify(productData));
}

function loadProductData() {
    const savedData = localStorage.getItem('ratixpay_product_draft');
    if (savedData) {
        productData = { ...productData, ...JSON.parse(savedData) };
        
        // Restaurar interface
        if (productData.type) {
            selectProductType(productData.type);
        }
        
        // Restaurar campos de formulário
        const fields = ['productName', 'productCategory', 'productDescription', 'productPrice', 'productDiscount'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            const key = fieldId.replace('product', '').toLowerCase();
            if (element && productData[key]) {
                element.value = productData[key];
            }
        });
        
        // Restaurar preview de imagem
        if (productData.image) {
            const preview = document.getElementById('imagePreview');
            const uploadText = document.querySelector('.upload-text');
            if (preview) {
                preview.src = productData.image;
                preview.style.display = 'block';
                if (uploadText) uploadText.style.display = 'none';
            }
        }
        
        calculateFinalPrice();
    }
}

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

