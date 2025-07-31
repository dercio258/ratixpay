const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testImageLoading() {
    try {
        console.log('🧪 Testando carregamento de imagens...\n');
        
        // Testar API de produtos
        console.log('📡 Testando API de produtos...');
        const response = await fetch('http://localhost:3000/api/produtos');
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API retornou ${data.produtos.length} produtos\n`);
        
        // Verificar imagens dos produtos
        console.log('🖼️  Verificando imagens dos produtos:');
        data.produtos.forEach((produto, index) => {
            console.log(`${index + 1}. ${produto.nome}`);
            console.log(`   Imagem: ${produto.imagemUrl || 'NENHUMA'}`);
            
            if (produto.imagemUrl) {
                console.log(`   URL completa: http://localhost:3000${produto.imagemUrl}`);
            }
            console.log('');
        });
        
        // Testar carregamento de algumas imagens
        console.log('🔍 Testando carregamento de imagens...');
        const produtosComImagem = data.produtos.filter(p => p.imagemUrl);
        
        for (let i = 0; i < Math.min(3, produtosComImagem.length); i++) {
            const produto = produtosComImagem[i];
            const imageUrl = `http://localhost:3000${produto.imagemUrl}`;
            
            console.log(`Testando: ${produto.nome}`);
            console.log(`URL: ${imageUrl}`);
            
            try {
                const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
                
                if (imageResponse.ok) {
                    const contentLength = imageResponse.headers.get('content-length');
                    const contentType = imageResponse.headers.get('content-type');
                    
                    console.log(`   ✅ Status: ${imageResponse.status}`);
                    console.log(`   📏 Tamanho: ${contentLength} bytes`);
                    console.log(`   🎨 Tipo: ${contentType}`);
                } else {
                    console.log(`   ❌ Erro: ${imageResponse.status} ${imageResponse.statusText}`);
                }
            } catch (error) {
                console.log(`   ❌ Erro de conexão: ${error.message}`);
            }
            console.log('');
        }
        
        // Testar página de produtos
        console.log('🌐 Testando página de produtos...');
        try {
            const pageResponse = await fetch('http://localhost:3000/gestao-produtos');
            
            if (pageResponse.ok) {
                console.log('✅ Página de produtos carrega corretamente');
            } else {
                console.log(`❌ Erro na página: ${pageResponse.status} ${pageResponse.statusText}`);
            }
        } catch (error) {
            console.log(`❌ Erro ao carregar página: ${error.message}`);
        }
        
        console.log('\n🎉 Teste concluído!');
        console.log('\n📋 Resumo:');
        console.log(`   - Produtos com imagem: ${produtosComImagem.length}`);
        console.log(`   - Produtos sem imagem: ${data.produtos.length - produtosComImagem.length}`);
        console.log(`   - Total de produtos: ${data.produtos.length}`);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

if (require.main === module) {
    testImageLoading();
}

module.exports = { testImageLoading }; 