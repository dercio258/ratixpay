const databaseManager = require('../database/database');
const Produto = require('../models/Produto');
const fs = require('fs');
const path = require('path');

async function checkImages() {
    try {
        // Inicializar banco
        databaseManager.initialize();
        
        console.log('🔍 Verificando imagens no banco de dados...\n');
        
        // Buscar todos os produtos
        const produtos = await Produto.findAll();
        
        console.log(`📊 Total de produtos: ${produtos.length}\n`);
        
        produtos.forEach((produto, index) => {
            console.log(`${index + 1}. ${produto.nome}`);
            console.log(`   ID: ${produto.id}`);
            console.log(`   Custom ID: ${produto.customId}`);
            console.log(`   Imagem URL: ${produto.imagemUrl || 'NÃO DEFINIDA'}`);
            
            if (produto.imagemUrl) {
                // Verificar se o arquivo existe
                const imagePath = path.join(__dirname, '..', produto.imagemUrl);
                const fileExists = fs.existsSync(imagePath);
                console.log(`   Arquivo existe: ${fileExists ? '✅ SIM' : '❌ NÃO'}`);
                
                if (fileExists) {
                    const stats = fs.statSync(imagePath);
                    console.log(`   Tamanho: ${(stats.size / 1024).toFixed(2)} KB`);
                }
            }
            console.log('');
        });
        
        // Verificar produtos sem imagem
        const produtosSemImagem = produtos.filter(p => !p.imagemUrl);
        console.log(`📋 Produtos sem imagem: ${produtosSemImagem.length}`);
        
        if (produtosSemImagem.length > 0) {
            console.log('Produtos que precisam de imagem:');
            produtosSemImagem.forEach(p => {
                console.log(`   - ${p.nome} (ID: ${p.id})`);
            });
        }
        
        // Verificar arquivos na pasta uploads
        console.log('\n📁 Verificando arquivos na pasta uploads...');
        const uploadsPath = path.join(__dirname, '../uploads');
        const files = fs.readdirSync(uploadsPath);
        
        console.log(`Arquivos encontrados: ${files.length}`);
        files.forEach(file => {
            const filePath = path.join(uploadsPath, file);
            const stats = fs.statSync(filePath);
            console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao verificar imagens:', error);
    } finally {
        databaseManager.close();
    }
}

if (require.main === module) {
    checkImages();
}

module.exports = { checkImages }; 