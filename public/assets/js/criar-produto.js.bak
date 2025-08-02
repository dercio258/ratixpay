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
    
    priceInput.addEventListener('input', calculateFinalPrice);
    discountInput.addEventListener('input', calculateFinalPrice);

    // Validação de formulário
    const form = document.getElementById('productInfoForm');
    if (form) {
        form.addEventListener('input', validateStep2);
    }
}

function selectProductType(type) {
    // Remover seleção anterior
    document.querySelectorAll('.product-type-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Selecionar novo tipo
    document.querySelector(`[data-type="${type}"]`).classList.add('selected');
    
    productData.type = type;
    saveProductData();
    
    // Habilitar botão próximo
    document.querySelector('.btn-next').disabled = false;
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            productData.image = e.target.result;
            saveProductData();
            
            // Atualizar visual do upload
            const uploadBox = document.getElementById('uploadBox');
            uploadBox.innerHTML = `
                <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 5px;">
                <p>Imagem carregada com sucesso!</p>
            `;
            uploadBox.classList.add('uploaded');
        };
        reader.readAsDataURL(file);
    }
}

function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (file) {
        productData.content = file.name;
        saveProductData();
        
        // Atualizar visual do upload
        const pdfUploadBox = document.getElementById('pdfUploadBox');
        pdfUploadBox.innerHTML = `
            <i class="fas fa-file-pdf" style="color: #e74c3c; font-size: 48px;"></i>
            <p>PDF carregado: ${file.name}</p>
        `;
        pdfUploadBox.classList.add('uploaded');
    }
}

function calculateFinalPrice() {
    const price = parseFloat(document.getElementById('productPrice').value) || 0;
    const discount = parseFloat(document.getElementById('productDiscount').value) || 0;
    
    const finalPrice = price - (price * discount / 100);
    document.getElementById('finalPrice').value = `MZN ${finalPrice.toFixed(2)}`;
    
    productData.price = price;
    productData.discount = discount;
    productData.finalPrice = finalPrice;
    saveProductData();
}

function validateStep2() {
    const name = document.getElementById('productName').value;
    const category = document.getElementById('productCategory').value;
    const description = document.getElementById('productDescription').value;
    const price = document.getElementById('productPrice').value;
    
    productData.name = name;
    productData.category = category;
    productData.description = description;
    productData.couponCode = document.getElementById('couponCode').value;
    productData.allowAffiliates = document.getElementById('allowAffiliates').checked;
    
    saveProductData();
}

function addModule() {
    const modulesList = document.getElementById('modulesList');
    const moduleCount = modulesList.children.length + 1;
    
    const moduleDiv = document.createElement('div');
    moduleDiv.className = 'module-item';
    moduleDiv.innerHTML = `
        <div class="module-header">
            <h4>Módulo ${moduleCount}</h4>
            <button class="btn-remove" onclick="removeModule(this)">×</button>
        </div>
        <div class="module-content">
            <input type="text" placeholder="Nome do módulo" class="module-name">
            <textarea placeholder="Descrição do módulo" class="module-description"></textarea>
            <div class="lessons-container">
                <h5>Aulas</h5>
                <button class="btn-add-lesson" onclick="addLesson(this)">+ Adicionar Aula</button>
                <div class="lessons-list"></div>
            </div>
        </div>
    `;
    
    modulesList.appendChild(moduleDiv);
}

function removeModule(button) {
    button.closest('.module-item').remove();
    updateModuleNumbers();
}

function addLesson(button) {
    const lessonsList = button.nextElementSibling;
    const lessonCount = lessonsList.children.length + 1;
    
    const lessonDiv = document.createElement('div');
    lessonDiv.className = 'lesson-item';
    lessonDiv.innerHTML = `
        <input type="text" placeholder="Aula ${lessonCount}" class="lesson-name">
        <button class="btn-remove-lesson" onclick="removeLesson(this)">×</button>
    `;
    
    lessonsList.appendChild(lessonDiv);
}

function removeLesson(button) {
    button.closest('.lesson-item').remove();
}

function updateModuleNumbers() {
    const modules = document.querySelectorAll('.module-item');
    modules.forEach((module, index) => {
        module.querySelector('h4').textContent = `Módulo ${index + 1}`;
    });
}

function nextStep() {
    if (currentStep < 4) {
        // Ocultar step atual
        document.getElementById(`step${currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('completed');
        
        currentStep++;
        
        // Mostrar próximo step
        document.getElementById(`step${currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
        
        // Configurar conteúdo específico do step
        if (currentStep === 3) {
            setupStep3();
        } else if (currentStep === 4) {
            setupStep4();
        }
    }
}

function prevStep() {
    if (currentStep > 1) {
        // Ocultar step atual
        document.getElementById(`step${currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');
        
        currentStep--;
        
        // Mostrar step anterior
        document.getElementById(`step${currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('completed');
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');
    }
}

function setupStep3() {
    const courseContent = document.getElementById('courseContent');
    const ebookContent = document.getElementById('ebookContent');
    
    if (productData.type === 'curso') {
        courseContent.style.display = 'block';
        ebookContent.style.display = 'none';
    } else if (productData.type === 'ebook') {
        courseContent.style.display = 'none';
        ebookContent.style.display = 'block';
    }
}

function setupStep4() {
    updateChecklist();
    updateProductSummary();
}

function updateChecklist() {
    // Verificar tipo
    const checkType = document.getElementById('checkType');
    if (productData.type) {
        checkType.querySelector('i').className = 'fas fa-check';
        checkType.classList.add('completed');
    }
    
    // Verificar nome
    const checkName = document.getElementById('checkName');
    if (productData.name) {
        checkName.querySelector('i').className = 'fas fa-check';
        checkName.classList.add('completed');
    }
    
    // Verificar imagem
    const checkImage = document.getElementById('checkImage');
    if (productData.image) {
        checkImage.querySelector('i').className = 'fas fa-check';
        checkImage.classList.add('completed');
    }
    
    // Verificar conteúdo
    const checkContent = document.getElementById('checkContent');
    if (productData.content || (productData.type === 'curso' && document.querySelectorAll('.module-item').length > 0)) {
        checkContent.querySelector('i').className = 'fas fa-check';
        checkContent.classList.add('completed');
    }
}

function updateProductSummary() {
    const summary = document.getElementById('productSummary');
    summary.innerHTML = `
        <div class="summary-card">
            <h3>Resumo do Produto</h3>
            <div class="summary-item">
                <strong>Tipo:</strong> ${productData.type === 'curso' ? 'Curso Online' : 'eBook'}
            </div>
            <div class="summary-item">
                <strong>Nome:</strong> ${productData.name || 'Não informado'}
            </div>
            <div class="summary-item">
                <strong>Categoria:</strong> ${productData.category || 'Não informada'}
            </div>
            <div class="summary-item">
                <strong>Preço:</strong> MZN ${productData.finalPrice?.toFixed(2) || '0.00'}
            </div>
            <div class="summary-item">
                <strong>Desconto:</strong> ${productData.discount || 0}%
            </div>
        </div>
    `;
}

function finishProduct() {
    // Salvar produto final
    const products = JSON.parse(localStorage.getItem('ratixpay_products') || '[]');
    
    // Gerar ID único
    productData.id = Date.now().toString();
    productData.createdAt = new Date().toISOString();
    
    products.push(productData);
    localStorage.setItem('ratixpay_products', JSON.stringify(products));
    
    alert('Produto cadastrado com sucesso!');
    
    // Redirecionar para dashboard
    window.location.href = 'dashboard.html';
}

function saveProductData() {
    localStorage.setItem('ratixpay_current_product', JSON.stringify(productData));
}

function loadProductData() {
    const saved = localStorage.getItem('ratixpay_current_product');
    if (saved) {
        productData = JSON.parse(saved);
        
        // Restaurar dados nos campos
        if (productData.type) {
            document.querySelector(`[data-type="${productData.type}"]`)?.classList.add('selected');
            document.querySelector('.btn-next').disabled = false;
        }
        
        if (productData.name) {
            document.getElementById('productName').value = productData.name;
        }
        
        // ... outros campos podem ser restaurados aqui
    }
}

