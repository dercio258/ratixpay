const databaseManager = require('../database/database');
const Produto = require('../models/Produto');
const fs = require('fs');
const path = require('path');

async function fixProductImages() {
    try {
        // Inicializar banco
        databaseManager.initialize();
        
        console.log('🔧 Corrigindo imagens dos produtos...\n');
        
        // Buscar todos os produtos
        const produtos = await Produto.findAll();
        
        // Buscar arquivos de imagem disponíveis
        const uploadsPath = path.join(__dirname, '../uploads');
        const imageFiles = fs.readdirSync(uploadsPath)
            .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
            .map(file => `/uploads/${file}`);
        
        console.log(`📊 Produtos encontrados: ${produtos.length}`);
        console.log(`🖼️  Imagens disponíveis: ${imageFiles.length}\n`);
        
        let updatedCount = 0;
        
        for (let i = 0; i < produtos.length; i++) {
            const produto = produtos[i];
            
            if (!produto.imagemUrl && imageFiles.length > 0) {
                // Usar imagem disponível (distribuir as imagens entre os produtos)
                const imageIndex = i % imageFiles.length;
                const selectedImage = imageFiles[imageIndex];
                
                console.log(`📝 Atualizando produto: ${produto.nome}`);
                console.log(`   ID: ${produto.id}`);
                console.log(`   Imagem anterior: ${produto.imagemUrl || 'NENHUMA'}`);
                console.log(`   Nova imagem: ${selectedImage}`);
                
                // Atualizar produto
                produto.imagemUrl = selectedImage;
                await produto.save();
                
                console.log(`   ✅ Atualizado com sucesso!\n`);
                updatedCount++;
            } else if (produto.imagemUrl) {
                console.log(`✅ Produto já tem imagem: ${produto.nome} - ${produto.imagemUrl}\n`);
            } else {
                console.log(`⚠️  Produto sem imagem e sem imagens disponíveis: ${produto.nome}\n`);
            }
        }
        
        console.log(`🎉 Processo concluído!`);
        console.log(`📊 Produtos atualizados: ${updatedCount}`);
        
        // Verificar resultado final
        console.log('\n🔍 Verificação final:');
        const produtosFinais = await Produto.findAll();
        const produtosComImagem = produtosFinais.filter(p => p.imagemUrl);
        const produtosSemImagem = produtosFinais.filter(p => !p.imagemUrl);
        
        console.log(`   Produtos com imagem: ${produtosComImagem.length}`);
        console.log(`   Produtos sem imagem: ${produtosSemImagem.length}`);
        
        if (produtosSemImagem.length > 0) {
            console.log('\n⚠️  Produtos que ainda precisam de imagem:');
            produtosSemImagem.forEach(p => {
                console.log(`   - ${p.nome} (ID: ${p.id})`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro ao corrigir imagens:', error);
    } finally {
        databaseManager.close();
    }
}

if (require.main === module) {
    fixProductImages();
}

module.exports = { fixProductImages }; 