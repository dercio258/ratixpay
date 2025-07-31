const express = require('express');
const router = express.Router();
const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const fetch = require('node-fetch');
require('dotenv').config();

// GET - Listar todas as vendas
router.get('/', async (req, res) => {
  try {
    const { status, metodo, limite = 10, pagina = 1, dataInicio, dataFim } = req.query;
    
    const options = {};
    if (status) options.pagamentoStatus = status;
    if (metodo) options.pagamentoMetodo = metodo;
    if (dataInicio || dataFim) {
      options.dataInicio = dataInicio;
      options.dataFim = dataFim;
    }
    
    const vendas = await Venda.findAll(options);
    const total = await Venda.count(options);
    
    // Aplicar paginação manualmente
    const inicio = (parseInt(pagina) - 1) * parseInt(limite);
    const fim = inicio + parseInt(limite);
    const vendasPaginadas = vendas.slice(inicio, fim);
    
    res.json({
      vendas: vendasPaginadas.map(v => v.toJSON()),
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite)),
      formatacao: 'MZN'
    });
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ erro: 'Erro ao buscar vendas' });
  }
});

// GET - Estatísticas para gestão de vendas
router.get('/estatisticas', async (req, res) => {
  try {
    const [
      totalVendas,
      vendasAprovadas,
      vendasPendentes,
      vendasCanceladas
    ] = await Promise.all([
      Venda.count(),
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
        totalVendas,
        vendasAprovadas,
        vendasPendentes,
        vendasCanceladas,
        receitaTotal,
        receitaFormatada: Venda.formatarValorMZN(receitaTotal),
        reembolsos: 0, // Implementar lógica de reembolsos se necessário
        reembolsosFormatado: Venda.formatarValorMZN(0),
        formatacao: 'MZN'
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

// GET - Produtos vendidos
router.get('/produtos-vendidos', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    const produtosVendidos = db.prepare(`
      SELECT 
        p.id as produtoId,
        p.nome as produtoNome,
        p.tipo as produtoTipo,
        COUNT(v.id) as quantidadeVendida,
        SUM(v.pagamentoValor) as receitaTotal
      FROM vendas v
      JOIN produtos p ON v.produtoId = p.id
      WHERE v.pagamentoStatus = 'Aprovado'
      GROUP BY p.id, p.nome, p.tipo
      ORDER BY quantidadeVendida DESC
    `).all();
    
    res.json({
      success: true,
      data: produtosVendidos
    });
  } catch (error) {
    console.error('Erro ao buscar produtos vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos vendidos'
    });
  }
});

// GET - Clientes que mais compraram
router.get('/clientes-top', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    const clientes = db.prepare(`
      SELECT 
        clienteEmail,
        clienteNome,
        COUNT(id) as totalCompras,
        SUM(pagamentoValor) as valorTotalGasto
      FROM vendas
      WHERE pagamentoStatus = 'Aprovado'
      GROUP BY clienteEmail, clienteNome
      ORDER BY valorTotalGasto DESC
      LIMIT 10
    `).all();
    
    res.json({
      success: true,
      data: clientes
    });
  } catch (error) {
    console.error('Erro ao buscar clientes top:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes top'
    });
  }
});

// GET - Lista de clientes (para compatibilidade com frontend)
router.get('/clientes', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    const clientes = db.prepare(`
      SELECT 
        clienteEmail,
        clienteNome,
        clienteTelefone,
        COUNT(id) as totalCompras,
        SUM(pagamentoValor) as valorTotalGasto,
        MAX(dataVenda) as ultimaCompra
      FROM vendas
      WHERE pagamentoStatus = 'Aprovado'
      GROUP BY clienteEmail, clienteNome, clienteTelefone
      ORDER BY ultimaCompra DESC
    `).all();
    
    res.json({
      success: true,
      data: clientes
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar clientes'
    });
  }
});

// GET - Vendas por período
router.get('/por-periodo', async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        success: false,
        message: 'Data início e data fim são obrigatórias'
      });
    }
    
    const vendas = await Venda.findByPeriod(dataInicio, dataFim);
    
    res.json({
      success: true,
      data: vendas.map(v => v.toJSON())
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por período:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vendas por período'
    });
  }
});

// GET - Vendas por método de pagamento
router.get('/por-metodo', async (req, res) => {
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
      ORDER BY valorTotal DESC
    `).all();
    
    res.json({
      success: true,
      data: metodos.map(metodo => ({
        ...metodo,
        valorFormatado: Venda.formatarValorMZN(metodo.valorTotal || 0)
      })),
      formatacao: 'MZN'
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por método:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vendas por método'
    });
  }
});

// GET - Vendas por status
router.get('/por-status', async (req, res) => {
  try {
    const db = require('../database/database').getDatabase();
    const status = db.prepare(`
      SELECT 
        pagamentoStatus,
        COUNT(id) as quantidade,
        SUM(pagamentoValor) as valorTotal
      FROM vendas
      GROUP BY pagamentoStatus
      ORDER BY quantidade DESC
    `).all();
    
    res.json({
      success: true,
      data: status.map(status => ({
        ...status,
        valorFormatado: Venda.formatarValorMZN(status.valorTotal || 0)
      })),
      formatacao: 'MZN'
    });
  } catch (error) {
    console.error('Erro ao buscar vendas por status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar vendas por status'
    });
  }
});

// GET - Resumo de vendas
router.get('/resumo', async (req, res) => {
  try {
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
    `).get();
    
    res.json({
      success: true,
      data: {
        ...resumo,
        receitaFormatada: Venda.formatarValorMZN(resumo.receitaTotal || 0),
        ticketMedioFormatado: Venda.formatarValorMZN(resumo.ticketMedio || 0)
      },
      formatacao: 'MZN'
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo'
    });
  }
});

// GET - Buscar venda por ID
router.get('/:id', async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    
    if (!venda) {
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }
    
    // Buscar informações do produto se necessário
    if (venda.produtoId) {
      const produto = await Produto.findById(venda.produtoId);
      if (produto) {
        const vendaCompleta = {
          ...venda.toJSON(),
          produto: produto.toJSON()
        };
        return res.json(vendaCompleta);
      }
    }
    
    res.json(venda.toJSON());
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ erro: 'Erro ao buscar venda' });
  }
});

// POST - Criar nova venda (checkout)
router.post('/', async (req, res) => {
  try {
    const { produtoId, cliente, pagamento, cupom, afiliado, ip, userAgent } = req.body;
    
    // Verificar se o produto existe
    const produto = await Produto.findById(produtoId);
    if (!produto || !produto.ativo) {
      return res.status(404).json({ erro: 'Produto não encontrado ou inativo' });
    }
    
    // Calcular valores
    let valorOriginal = produto.preco;
    let desconto = produto.desconto || 0;
    let valorFinal = produto.precoComDesconto;
    
    // Aplicar cupom se fornecido
    if (cupom) {
      const cuponsValidos = {
        'DESCONTO10': 10,
        'DESCONTO20': 20,
        'BLACKFRIDAY': 30,
        'WELCOME': 15
      };
      
      if (cuponsValidos[cupom.toUpperCase()]) {
        const descontoCupom = cuponsValidos[cupom.toUpperCase()];
        desconto = Math.max(desconto, descontoCupom);
        valorFinal = valorOriginal - (valorOriginal * desconto / 100);
      }
    }
    
    // Criar venda
    const vendaData = {
      produtoId: produtoId,
      clienteNome: cliente.nome,
      clienteEmail: cliente.email,
      clienteTelefone: cliente.telefone,
      clienteCpf: cliente.cpf,
      clienteEndereco: JSON.stringify(cliente.endereco),
      pagamentoMetodo: pagamento.metodo,
      pagamentoValor: valorFinal,
      pagamentoValorOriginal: valorOriginal,
      pagamentoDesconto: desconto,
      pagamentoCupom: cupom?.toUpperCase(),
      pagamentoStatus: 'Pendente',
      afiliadoCodigo: afiliado?.codigo,
      afiliadoComissao: afiliado?.comissao || 0,
      ip,
      userAgent
    };
    
    const venda = await Venda.create(vendaData);
    
    // Processar pagamento usando o novo método
    try {
      const aprovado = await venda.processarPagamento();
      
      if (aprovado) {
        // Incrementar vendas do produto
        await Produto.incrementVendas(produtoId);
      }
      
      await venda.save();
    } catch (error) {
      console.error('Erro no processamento do pagamento:', error);
    }
    
    res.status(201).json({
      mensagem: 'Venda criada com sucesso',
      venda: {
        id: venda.id,
        transacaoId: venda.pagamentoTransacaoId,
        valor: valorFinal,
        status: venda.pagamentoStatus
      }
    });
  } catch (error) {
    console.error('Erro ao criar venda:', error);
    
    if (error.name === 'ValidationError') {
      const erros = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });
    }
    
    res.status(500).json({ erro: 'Erro ao processar venda' });
  }
});

// PUT - Atualizar status da venda
router.put('/:id/status', async (req, res) => {
  try {
    const { status, statusPagamento } = req.body;
    
    const venda = await Venda.findById(req.params.id);
    
    if (!venda) {
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }
    
    if (status) venda.status = status;
    if (statusPagamento) venda.pagamentoStatus = statusPagamento;
    
    await venda.save();
    
    res.json({
      mensagem: 'Status atualizado com sucesso',
      venda: venda.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ erro: 'Erro ao atualizar status' });
  }
});

// GET - Verificar status do pagamento
router.get('/:id/status', async (req, res) => {
  try {
    const venda = await Venda.findById(req.params.id);
    
    if (!venda) {
      return res.status(404).json({ erro: 'Venda não encontrada' });
    }
    
    res.json({
      transacaoId: venda.pagamentoTransacaoId,
      statusPagamento: venda.pagamentoStatus,
      statusVenda: venda.status
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({ erro: 'Erro ao verificar status' });
  }
});

// GET - Vendas por dia (para gráfico)
router.get('/relatorio/por-dia', async (req, res) => {
  try {
    const { dias = '7' } = req.query;
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - parseInt(dias));
    
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
    `).all(dataInicio.toISOString());
    
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas por dia:', error);
    res.status(500).json({ erro: 'Erro ao buscar vendas por dia' });
  }
});

// Consultar status da venda pelo transactionId
router.get('/status/:transactionId', async (req, res) => {
  try {
    const transactionId = req.params.transactionId;
    let venda = await Venda.findByTransacaoId(transactionId);
    if (!venda) return res.status(404).json({ status: 'nao_encontrado' });

    // Consultar status na PaySuite
    const url = `https://paysuite.tech/api/v1/transactions/${transactionId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSUITE_SECRET_KEY}`,
        'X-Public-Key': process.env.PAYSUITE_PUBLIC_KEY
      }
    });
    const transaction = await response.json();

    // Atualizar status da venda conforme resposta da PaySuite
    let novoStatus = venda.pagamento.status;
    if (transaction && transaction.status) {
      if (transaction.status === 'success') {
        novoStatus = 'Aprovado';
        venda.status = 'Pago';
      } else if (transaction.status === 'pending') {
        novoStatus = 'Pendente';
        venda.status = 'Aguardando Pagamento';
      } else {
        novoStatus = 'Rejeitado';
        venda.status = 'Cancelado';
      }
      venda.pagamento.status = novoStatus;
      await venda.save();
    }

    res.json({ status: venda.pagamento.status, venda });
  } catch (err) {
    res.status(500).json({ status: 'erro' });
  }
});

// Rota para processar pagamento externo
const baseUrl = "https://paysuite.tech/api/v1/transactions";

router.post('/api/pagar', async (req, res) => {
  const paymentData = req.body;
  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Id': process.env.WALLET_ID,
        'X-Secret-Key': process.env.SECRET_KEY
      },
      body: JSON.stringify(paymentData)
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao processar pagamento' });
  }
});

module.exports = router;

