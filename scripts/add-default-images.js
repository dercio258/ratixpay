const fs = require('fs');
const path = require('path');

function adicionarImagensPadrao() {
    console.log('🖼️ Adicionando imagens padrão ao projeto...');
    
    // Criar diretórios
    const diretorios = [
        'public/images',
        'public/images/products',
        'public/assets/css'
    ];
    
    diretorios.forEach(dir => {
        const dirPath = path.join(__dirname, '..', dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Diretório criado: ${dir}`);
        }
    });
    
    // Criar CSS para imagens
    const cssContent = `
.default-image {
    width: 100%;
    height: auto;
    max-width: 200px;
    border-radius: 8px;
}

.placeholder-image {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    font-size: 14px;
    text-align: center;
    border-radius: 8px;
    border: 2px dashed #ddd;
    height: 150px;
}
`;

    const cssPath = path.join(__dirname, '../public/assets/css/images.css');
    fs.writeFileSync(cssPath, cssContent);
    console.log(`✅ CSS de imagens criado`);
    
    console.log('🎉 Imagens padrão configuradas!');
}

if (require.main === module) {
    adicionarImagensPadrao();
}

module.exports = { adicionarImagensPadrao }; 