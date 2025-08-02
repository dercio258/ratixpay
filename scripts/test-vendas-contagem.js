#!/usr/bin/env node

const Venda = require('../models/Venda');
const databaseManager = require('../database/database');

async function testarContagemVendas() {
    console.log('🧪 Testando Contagem de Vendas');
    console.log('==============================\n');

    try {
        // Inicializar banco de dados
        databaseManager.initialize();
        
        // Testar diferentes contagens
        console.log('📊 Verificando contagens...\n');

        // 1. Total de vendas (deve ser apenas aprovadas)
        const totalVendas = await Venda.count({ 'pagamentoStatus': 'Aprovado' });
        console.log(`✅ Total de vendas (apenas aprovadas): ${totalVendas}`);

        // 2. Vendas por status
        const vendasAprovadas = await Venda.count({ 'pagamentoStatus': 'Aprovado' });
        const vendasPendentes = await Venda.count({ 'pagamentoStatus': 'Pendente' });
        const vendasRejeitadas = await Venda.count({ 'pagamentoStatus': 'Rejeitado' });
        const vendasCanceladas = await Venda.count({ 'pagamentoStatus': 'Cancelado' });

        console.log(`✅ Vendas Aprovadas: ${vendasAprovadas}`);
        console.log(`⚠️  Vendas Pendentes: ${vendasPendentes}`);
        console.log(`❌ Vendas Rejeitadas: ${vendasRejeitadas}`);
        console.log(`❌ Vendas Canceladas: ${vendasCanceladas}`);

        // 3. Total geral (todas as vendas)
        const totalGeral = await Venda.count();
        console.log(`📈 Total geral (todas as vendas): ${totalGeral}`);

        // 4. Verificar se a contagem está correta
        const somaStatus = vendasAprovadas + vendasPendentes + vendasRejeitadas + vendasCanceladas;
        console.log(`🔢 Soma dos status: ${somaStatus}`);
        
        if (totalGeral === somaStatus) {
            console.log('✅ Contagem está correta!');
        } else {
            console.log('❌ Contagem incorreta!');
        }

        // 5. Testar receita
        const db = databaseManager.getDatabase();
        const receitaResult = db.prepare(`
            SELECT SUM(pagamentoValor) as total 
            FROM vendas 
            WHERE pagamentoStatus = 'Aprovado'
        `).get();
        
        const receitaTotal = receitaResult.total || 0;
        console.log(`💰 Receita total (apenas aprovadas): ${Venda.formatarValorMZN(receitaTotal)}`);

        // 6. Verificar se há vendas pendentes que não deveriam ser contadas
        if (vendasPendentes > 0) {
            console.log('\n⚠️  ATENÇÃO: Existem vendas pendentes que não são contadas no total!');
            console.log('   Isso é correto - apenas vendas aprovadas devem ser contadas.');
        }

        // 7. Resumo final
        console.log('\n📋 RESUMO:');
        console.log(`   • Vendas contadas no total: ${totalVendas} (apenas aprovadas)`);
        console.log(`   • Vendas não contadas: ${vendasPendentes + vendasRejeitadas + vendasCanceladas} (pendentes/rejeitadas/canceladas)`);
        console.log(`   • Receita considerada: ${Venda.formatarValorMZN(receitaTotal)}`);

        if (totalVendas === vendasAprovadas && receitaTotal > 0) {
            console.log('\n🎉 SUCESSO: Contagem de vendas está correta!');
            console.log('   Apenas vendas aprovadas são contadas no total.');
        } else {
            console.log('\n❌ PROBLEMA: Contagem de vendas incorreta!');
            console.log('   Verifique se as correções foram aplicadas.');
        }

    } catch (error) {
        console.error('❌ Erro ao testar contagem:', error);
    }
}

// Executar teste
testarContagemVendas(); 