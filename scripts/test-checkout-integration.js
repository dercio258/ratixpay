const fetch = require('node-fetch');

// Configuração da API
const API_BASE = 'http://localhost:3000/api';

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

async function testAPIHealth() {
    console.log('🔍 Testando saúde da API...');
    
    try {
        const response = await apiRequest('/health');
        console.log('✅ API funcionando:', response);
        return true;
    } catch (error) {
        console.log('❌ API não está respondendo:', error.message);
        return false;
    }
}

async function testProductList() {
    console.log('\n🔍 Testando lista de produtos...');
    
    try {
        const products = await apiRequest('/produtos');
        console.log('✅ Produtos encontrados:', products.length);
        
        if (products.length > 0) {
            console.log('📋 Primeiro produto:', {
                id: products[0].id,
                nome: products[0].nome,
                preco: products[0].preco
            });
            return products[0];
        } else {
            console.log('⚠️  Nenhum produto encontrado');
            return null;
        }
    } catch (error) {
        console.log('❌ Erro ao buscar produtos:', error.message);
        return null;
    }
}

async function testProductCheckout(productId) {
    console.log('\n🔍 Testando checkout de produto...');
    
    try {
        const product = await apiRequest(`/produtos/${productId}`);
        console.log('✅ Produto carregado:', {
            id: product.id,
            nome: product.nome,
            preco: product.preco
        });
        return product;
    } catch (error) {
        console.log('❌ Erro ao carregar produto:', error.message);
        return null;
    }
}

async function testPaymentCreation(product) {
    console.log('\n🔍 Testando criação de pagamento para produto...');
    
    try {
        const paymentData = {
            amount: product.preco.toString(),
            reference: `TEST_PRODUTO_${product.id}_${Date.now()}`,
            description: `Pagamento do produto ${product.nome}`,
            callback_url: 'http://localhost:3000/api/paysuite/webhook',
            return_url: `http://localhost:3000/sucesso?produto=${product.id}`,
            method: 'mobile_money',
            gateway: 'mpesa',
            customer: {
                nome: 'Teste Cliente Produto',
                email: 'teste@produto.com',
                telefone: '+258841234567'
            },
            produto: {
                id: product.id,
                nome: product.nome,
                categoria: product.categoria || 'Produto',
                preco: product.preco
            }
        };
        
        const response = await apiRequest('/paysuite/create-payment', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
        
        if (response.success) {
            console.log('✅ Pagamento criado com sucesso');
            console.log('📋 Dados:', {
                transaction_id: response.transaction_id,
                checkout_url: response.checkout_url,
                venda_id: response.venda_id
            });
            return response;
        } else {
            console.log('❌ Erro ao criar pagamento:', response.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Erro ao criar pagamento:', error.message);
        return null;
    }
}

async function testPaymentStatus(transactionId) {
    console.log('\n🔍 Testando status do pagamento...');
    
    try {
        const response = await apiRequest(`/paysuite/status/${transactionId}`);
        
        if (response.success) {
            console.log('✅ Status verificado:', {
                status: response.status,
                message: response.message
            });
            return response;
        } else {
            console.log('❌ Erro ao verificar status:', response.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Erro ao verificar status:', error.message);
        return null;
    }
}

async function testVendasList() {
    console.log('\n🔍 Testando lista de vendas...');
    
    try {
        const vendas = await apiRequest('/vendas');
        console.log('✅ Vendas encontradas:', vendas.length);
        
        if (vendas.length > 0) {
            const ultimaVenda = vendas[vendas.length - 1];
            console.log('📋 Última venda:', {
                id: ultimaVenda._id,
                produto: ultimaVenda.produto?.nome,
                cliente: ultimaVenda.cliente?.nome,
                valor: ultimaVenda.pagamento?.valor,
                status: ultimaVenda.status
            });
        }
        
        return vendas;
    } catch (error) {
        console.log('❌ Erro ao buscar vendas:', error.message);
        return [];
    }
}

async function testCheckoutFlow() {
    console.log('🚀 Testando fluxo completo de checkout...\n');
    
    // Teste 1: Saúde da API
    const apiOk = await testAPIHealth();
    if (!apiOk) {
        console.log('\n❌ API não está funcionando. Verifique se o servidor está rodando.');
        return;
    }
    
    // Teste 2: Lista de produtos
    const product = await testProductList();
    if (!product) {
        console.log('\n❌ Nenhum produto disponível para teste.');
        return;
    }
    
    // Teste 3: Checkout do produto
    const productDetails = await testProductCheckout(product.id);
    if (!productDetails) {
        console.log('\n❌ Erro ao carregar detalhes do produto.');
        return;
    }
    
    // Teste 4: Criação de pagamento
    const payment = await testPaymentCreation(productDetails);
    if (!payment) {
        console.log('\n❌ Erro ao criar pagamento.');
        return;
    }
    
    // Teste 5: Verificar status (simulado)
    console.log('\n⏳ Aguardando 3 segundos para simular processamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const status = await testPaymentStatus(payment.transaction_id);
    
    // Teste 6: Lista de vendas
    await testVendasList();
    
    console.log('\n✨ Teste de checkout concluído!');
    console.log('\n📋 Resumo:');
    console.log(`   - Produto: ${productDetails.nome}`);
    console.log(`   - Valor: MZN ${productDetails.preco}`);
    console.log(`   - Transação: ${payment.transaction_id}`);
    console.log(`   - Status: ${status?.status || 'Pendente'}`);
    
    if (payment.checkout_url) {
        console.log(`\n🔗 URL de pagamento: ${payment.checkout_url}`);
        console.log('💡 Para testar o pagamento completo, acesse a URL acima.');
    }
}

// Função para testar integração específica
async function testSpecificIntegration() {
    console.log('🎯 Testando integração específica...\n');
    
    try {
        // Testar endpoint de criação de pagamento
        const testPayment = {
            amount: '150.00',
            reference: 'TEST_INTEGRATION_' + Date.now(),
            description: 'Teste de integração - Produto Teste',
            callback_url: 'http://localhost:3000/api/paysuite/webhook',
            return_url: 'http://localhost:3000/sucesso?produto=teste',
            method: 'mobile_money',
            gateway: 'mpesa',
            customer: {
                nome: 'Cliente Teste',
                email: 'teste@integracao.com',
                telefone: '+258841234567'
            },
            produto: {
                id: 'produto_teste',
                nome: 'Produto de Teste',
                categoria: 'Teste',
                preco: 150.00
            }
        };
        
        const response = await apiRequest('/paysuite/create-payment', {
            method: 'POST',
            body: JSON.stringify(testPayment)
        });
        
        if (response.success) {
            console.log('✅ Integração funcionando corretamente');
            console.log('📋 Resposta:', {
                success: response.success,
                transaction_id: response.transaction_id,
                checkout_url: response.checkout_url ? 'Disponível' : 'Não disponível',
                venda_id: response.venda_id
            });
        } else {
            console.log('❌ Erro na integração:', response.message);
        }
    } catch (error) {
        console.log('❌ Erro na integração:', error.message);
    }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--integration')) {
        testSpecificIntegration().catch(console.error);
    } else {
        testCheckoutFlow().catch(console.error);
    }
}

module.exports = {
    testAPIHealth,
    testProductList,
    testProductCheckout,
    testPaymentCreation,
    testPaymentStatus,
    testVendasList,
    testCheckoutFlow,
    testSpecificIntegration
}; 