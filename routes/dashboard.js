const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
const Produto = require('../models/Produto');

// GET - Estatísticas gerais do dashboard
router.get('/estatisticas', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const inicioAno = new Date(hoje.getFullYear(), 0, 1);
    
    const db = require('../database/database').getDatabase();
    
    // Receita total
    const receitaTotalResult = db.prepare(`
      SELECT SUM(pagamentoValor) as total 
      FROM vendas 
      WHERE pagamentoStatus = 'Aprovado'
    `).get();
    
    // Vendas aprovadas
    const vendasAprovadas = await Venda.count({ 'pagamentoStatus': 'Aprovado' });
    
    // Produtos ativos
    const produtosAtivos = await Produto.count({ 'ativo': true });
    
    // Clientes únicos
    const clientesUnicosResult = db.prepare(`
      SELECT COUNT(DISTINCT clienteEmail) as total 
      FROM vendas 
      WHERE pagamentoStatus = 'Aprovado'
    `).get();
    
    // Vendas do mês
    const vendasMes = await Venda.count({ 
      'pagamentoStatus': 'Aprovado',
      'dataInicio': inicioMes.toISOString()
    });
    
    // Receita do mês
    const receitaMesResult = db.prepare(`
      SELECT SUM(pagamentoValor) as total 
      FROM vendas 
      WHERE pagamentoStatus = 'Aprovado' AND dataVenda >= ?
    `).get(inicioMes.toISOString());
    
    // Crescimento comparado ao mês anterior
    const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    
    const receitaMesAnteriorResult = db.prepare(`
      SELECT SUM(pagamentoValor) as total 
      FROM vendas 
      WHERE pagamentoStatus = 'Aprovado' 
        AND dataVenda >= ? 
        AND dataVenda <= ?
    `).get(mesAnterior.toISOString(), fimMesAnterior.toISOString());
    
    const receitaAtual = receitaMesResult.total || 0;
    const receitaAnterior = receitaMesAnteriorResult.total || 0;
    const crescimento = receitaAnterior > 0 ? 
      ((receitaAtual - receitaAnterior) / receitaAnterior * 100).toFixed(1) : 0;
    
    res.json({
      receitaTotal: receitaTotalResult.total || 0,
      vendasAprovadas,
      produtosAtivos,
      totalClientes: clientesUnicosResult.total || 0,
      vendasMes,
      receitaMes: receitaAtual,
      crescimentoMes: parseFloat(crescimento)
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ erro: 'Erro ao buscar estatísticas' });
  }
});

// GET - Vendas da semana (para gráfico)
router.get('/vendas-semana', async (req, res) => {
  try {
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - 7);
    
    const db = require('../database/database').getDatabase();
    
    const vendas = db.prepare(`
      SELECT 
        DATE(dataVenda) as data,
        COUNT(id) as vendas,
        SUM(pagamentoValor) as receita
      FROM vendas
      WHERE dataVenda >= ? AND pagamentoStatus = 'Aprovado'
      GROUP BY DATE(dataVenda)
      ORDER BY data
    `).all(inicioSemana.toISOString());
    
    // Preencher dias sem vendas com zero
    const vendasPorDia = {};
    for (let i = 0; i < 7; i++) {
      const data = new Date(inicioSemana);
      data.setDate(inicioSemana.getDate() + i);
      const dataStr = data.toISOString().split('T')[0];
      vendasPorDia[dataStr] = {
        _id: dataStr,
        vendas: 0,
        receita: 0
      };
    }
    
    vendas.forEach(venda => {
      const dataStr = venda.data;
      vendasPorDia[dataStr] = {
        _id: dataStr,
        vendas: venda.vendas,
        receita: venda.receita
      };
    });
    
    res.json(Object.values(vendasPorDia));
  } catch (error) {
    console.error('Erro ao buscar vendas da semana:', error);
    res.status(500).json({ erro: 'Erro ao buscar vendas da semana' });
  }
});

// GET - Últimas vendas
router.get('/ultimas-vendas', async (req, res) => {
  try {
    const vendas = await Venda.findAll({
      'pagamentoStatus': 'Aprovado'
    });
    
    // Pegar apenas as 5 últimas vendas
    const ultimasVendas = vendas
      .sort((a, b) => new Date(b.dataVenda) - new Date(a.dataVenda))
      .slice(0, 5)
      .map(venda => venda.toJSON());
    
    res.json(ultimasVendas);
  } catch (error) {
    console.error('Erro ao buscar últimas vendas:', error);
    res.status(500).json({ erro: 'Erro ao buscar últimas vendas' });
  }
});

// GET - Produtos mais vendidos
router.get('/produtos-populares', async (req, res) => {
  try {
    const produtos = await Produto.findAtivos();
    
    // Ordenar por número de vendas
    const produtosOrdenados = produtos
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5)
      .map(produto => produto.toJSON());
    
    res.json(produtosOrdenados);
  } catch (error) {
    console.error('Erro ao buscar produtos populares:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos populares' });
  }
});

// GET - Métodos de pagamento mais usados
router.get('/metodos-pagamento', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    
    const metodos = db.prepare(`
      SELECT 
        pagamentoMetodo,
        COUNT(id) as quantidade,
        SUM(pagamentoValor) as valorTotal
      FROM vendas
      WHERE pagamentoStatus = 'Aprovado'
      GROUP BY pagamentoMetodo
      ORDER BY quantidade DESC
    `).all();
    
    res.json(metodos);
  } catch (error) {
    console.error('Erro ao buscar métodos de pagamento:', error);
    res.status(500).json({ erro: 'Erro ao buscar métodos de pagamento' });
  }
});

// GET - Resumo de vendas por período
router.get('/resumo-periodo', async (req, res) => {
  try {
    const { periodo = '30' } = req.query;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(periodo));
    
    const db = require('../database/database').getDatabase();
    
    const resumo = db.prepare(`
      SELECT 
        COUNT(id) as totalVendas,
        SUM(CASE WHEN pagamentoStatus = 'Aprovado' THEN 1 ELSE 0 END) as vendasAprovadas,
        SUM(CASE WHEN pagamentoStatus = 'Pendente' THEN 1 ELSE 0 END) as vendasPendentes,
        SUM(CASE WHEN pagamentoStatus = 'Rejeitado' THEN 1 ELSE 0 END) as vendasRejeitadas,
        SUM(CASE WHEN pagamentoStatus = 'Aprovado' THEN pagamentoValor ELSE 0 END) as receitaTotal,
        AVG(CASE WHEN pagamentoStatus = 'Aprovado' THEN pagamentoValor ELSE NULL END) as ticketMedio
      FROM vendas
      WHERE dataVenda >= ?
    `).get(dataInicio.toISOString());
    
    res.json(resumo);
  } catch (error) {
    console.error('Erro ao buscar resumo do período:', error);
    res.status(500).json({ erro: 'Erro ao buscar resumo do período' });
  }
});

module.exports = router;

