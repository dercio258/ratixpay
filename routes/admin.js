const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
const Cliente = require('../models/Cliente');

// DELETE - Apagar todos os dados
router.delete('/clear-all-data', async (req, res) => {
  try {
    // Apagar todas as tabelas
    const db = require('../database/database').getDatabase();
    
    db.prepare('DELETE FROM vendas').run();
    db.prepare('DELETE FROM produtos').run();
    db.prepare('DELETE FROM clientes').run();
    
    res.json({
      success: true,
      message: 'Todos os dados foram apagados com sucesso'
    });
  } catch (error) {
    console.error('Erro ao apagar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao apagar dados'
    });
  }
});

// GET - Fazer backup dos dados
router.get('/backup', async (req, res) => {
  try {
    const [produtos, vendas, clientes] = await Promise.all([
      Produto.findAll(),
      Venda.findAll(),
      Cliente.findAll()
    ]);
    
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        produtos: produtos.map(p => p.toJSON()),
        vendas: vendas.map(v => v.toJSON()),
        clientes: clientes.map(c => c.toJSON())
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=ratixpay-backup.json');
    res.json(backup);
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer backup'
    });
  }
});

// GET - Estatísticas gerais do sistema
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProdutos,
      totalVendas,
      totalClientes,
      vendasAprovadas,
      vendasPendentes,
      vendasCanceladas
    ] = await Promise.all([
      Produto.count(),
      Venda.count(),
      Cliente.count(),
      Venda.count({ 'pagamentoStatus': 'Aprovado' }),
      Venda.count({ 'pagamentoStatus': 'Pendente' }),
      Venda.count({ 'pagamentoStatus': 'Rejeitado' })
    ]);
    
    // Calcular receita total
    const db = require('../database/database').getDatabase();
    const receitaResult = db.prepare(`
      SELECT SUM(pagamentoValor) as total 
      FROM vendas 
      WHERE pagamentoStatus = 'Aprovado'
    `).get();
    
    const receitaTotal = receitaResult.total || 0;
    
    res.json({
      success: true,
      data: {
        totalProdutos,
        totalVendas,
        totalClientes,
        vendasAprovadas,
        vendasPendentes,
        vendasCanceladas,
        receitaTotal,
        reembolsos: 0 // Implementar lógica de reembolsos se necessário
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

module.exports = router;

