// Configuração da API - Usar configuração centralizada
const API_BASE = window.RatixPayConfig ? window.RatixPayConfig.API_BASE : 
    (window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : 'https://ratixpay.onrender.com/api');

// Variáveis globais
let currentProduct = null;
let originalPrice = 0;
let discountAmount = 0;
let finalPrice = 0;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadProductFromUrl();
    setupEventListeners();
});

function loadProductFromUrl() {
    // Obter ID do produto da URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        showError('ID do produto não encontrado na URL');
        return;
    }
    
    // Carregar produto do localStorage ou usar dados simulados
    const products = JSON.parse(localStorage.getItem('ratixpay_products') || '[]');
    currentProduct = products.find(p => p.id === productId);
    
    // Se não encontrar no localStorage, usar produtos simulados
    if (!currentProduct) {
        currentProduct = getSimulatedProduct(productId);
    }
    
    if (currentProduct) {
        displayProduct();
        updatePricing();
    } else {
        showError('Produto não encontrado');
    }
}

function getSimulatedProduct(id) {
    // Produtos simulados para demonstração
    const simulatedProducts = {
        '1': {
            id: '1',
            name: 'Curso de Marketing Digital',
            type: 'curso',
            price: 297.00,
            finalPrice: 297.00,
            discount: 0,
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDA3YmZmIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5NYXJrZXRpbmc8L3RleHQ+PC9zdmc+',
            description: 'Aprenda as melhores estratégias de marketing digital'
        },
        '2': {
            id: '2',
            name: 'eBook: Finanças Pessoais',
            type: 'ebook',
            price: 47.00,
            finalPrice: 47.00,
            discount: 0,
            image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjhjM2U1MCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RmluYW7Dp2FzPC90ZXh0Pjwvc3ZnPg==',
            description: 'Guia completo para organizar suas finanças'
        }
    };
    
    return simulatedProducts[id] || null;
}

function displayProduct() {
    const productCard = document.getElementById('productCard');
    
    productCard.innerHTML = `
        <div class="product-image">
            <img src="${currentProduct.image || '/api/placeholder/200/200'}" alt="${currentProduct.name}">
        </div>
        <div class="product-details">
            <h2>${currentProduct.name}</h2>
            <p class="product-type">${currentProduct.type === 'curso' ? '📘 Curso Online' : '📕 eBook'}</p>
            <p class="product-description">${currentProduct.description || 'Descrição não disponível'}</p>
            <div class="product-price">
                <span class="price">MZN ${currentProduct.finalPrice.toFixed(2)}</span>
                ${currentProduct.discount > 0 ? `<span class="original-price">MZN ${currentProduct.price.toFixed(2)}</span>` : ''}
            </div>
        </div>
    `;
}

function setupEventListeners() {
    // Formulário de checkout
    const checkoutForm = document.getElementById('checkoutForm');
    checkoutForm.addEventListener('submit', handleCheckout);
    
    // Aplicar cupom
    const applyCouponBtn = document.getElementById('applyCoupon');
    applyCouponBtn.addEventListener('click', applyCoupon);
    
    // Métodos de pagamento
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethods.forEach(method => {
        method.addEventListener('change', updatePaymentMethod);
    });
}

function updatePricing() {
    originalPrice = currentProduct.price;
    finalPrice = currentProduct.finalPrice;
    
    updatePricingDisplay();
}

function updatePricingDisplay() {
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = `MZN ${originalPrice.toFixed(2)}`;
    if (discountElement) discountElement.textContent = `- MZN ${discountAmount.toFixed(2)}`;
    if (totalElement) totalElement.textContent = `MZN ${finalPrice.toFixed(2)}`;
}

function applyCoupon() {
    const couponInput = document.getElementById('couponCode');
    const couponCode = couponInput.value.trim().toUpperCase();
    
    // Cupons simulados
    const coupons = {
        'DESCONTO10': { type: 'percentage', value: 10 },
        'SAVE20': { type: 'percentage', value: 20 },
        'FIRST50': { type: 'fixed', value: 50 }
    };
    
    if (coupons[couponCode]) {
        const coupon = coupons[couponCode];
        
        if (coupon.type === 'percentage') {
            discountAmount = (originalPrice * coupon.value) / 100;
        } else {
            discountAmount = Math.min(coupon.value, originalPrice);
        }
        
        finalPrice = originalPrice - discountAmount;
        updatePricingDisplay();
        
        showSuccess(`Cupom aplicado! Desconto de MZN ${discountAmount.toFixed(2)}`);
        couponInput.disabled = true;
        document.getElementById('applyCoupon').disabled = true;
    } else {
        showError('Cupom inválido ou expirado');
    }
}

function updatePaymentMethod() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
    // Atualizar interface baseado no método selecionado
    const paymentDetails = document.getElementById('paymentDetails');
    
    switch(selectedMethod) {
        case 'mpesa':
            paymentDetails.innerHTML = `
                <div class="payment-info">
                    <p>📱 Você será redirecionado para o M-Pesa para completar o pagamento</p>
                </div>
            `;
            break;
        case 'emola':
            paymentDetails.innerHTML = `
                <div class="payment-info">
                    <p>💳 Você será redirecionado para o e-Mola para completar o pagamento</p>
                </div>
            `;
            break;
        case 'card':
            paymentDetails.innerHTML = `
                <div class="payment-info">
                    <p>💳 Pagamento com cartão será processado de forma segura</p>
                </div>
            `;
            break;
    }
}

async function handleCheckout(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const checkoutData = {
        product: currentProduct,
        customer: {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone')
        },
        payment: {
            method: formData.get('paymentMethod'),
            amount: finalPrice,
            originalAmount: originalPrice,
            discount: discountAmount
        }
    };
    
    try {
        showLoading('Processando pagamento...');
        
        const response = await fetch(`${API_BASE}/pagamoz/payment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkoutData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Redirecionar para página de sucesso ou gateway de pagamento
            if (result.paymentUrl) {
                window.location.href = result.paymentUrl;
            } else {
                window.location.href = `/payment-success.html?transaction=${result.transactionId}`;
            }
        } else {
            throw new Error(result.message || 'Erro ao processar pagamento');
        }
        
    } catch (error) {
        console.error('Erro no checkout:', error);
        showError('Erro ao processar pagamento. Tente novamente.');
    } finally {
        hideLoading();
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
    
    const container = document.querySelector('.checkout-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = message;
    
    const container = document.querySelector('.checkout-container');
    container.insertBefore(successDiv, container.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

