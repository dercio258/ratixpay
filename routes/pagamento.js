const express = require('express');
require('dotenv').config();

// Importar fetch para compatibilidade
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = require('node-fetch');
} else {
  fetch = globalThis.fetch;
}

const router = express.Router();

const Venda = require('../models/Venda');
const Produto = require('../models/Produto');
const SecurityUtils = require('../utils/securityUtils');
const EmailService = require('../utils/emailService');

// Importar middlewares de segurança
const { validatePayment } = require('../middleware/security');
const { createRateLimiters } = require('../middleware/security');
const rateLimiters = createRateLimiters();

// Configurações da API Paga Moz
const PAGAMOZ_CONFIG = {
  secretKey: process.env.PAGAMOZ_SECRET_KEY,
  walletId: process.env.PAGAMOZ_WALLET_ID,
  baseUrl: process.env.PAGAMOZ_BASE_URL || 'https://opay.mucamba.site/api/v1'
};

// Função para fazer requisições à API Paga Moz
async function pagamozRequest(endpoint, options = {}) {
  try {
    const url = `${PAGAMOZ_CONFIG.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'X-Wallet-Id': PAGAMOZ_CONFIG.walletId,
        'X-Secret-Key': PAGAMOZ_CONFIG.secretKey,
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Paga Moz API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição Paga Moz:', error);
    throw error;
  }
}

// Rota para iniciar pagamento com Paga Moz
router.post('/pagamoz/payment', rateLimiters.payment, validatePayment, async (req, res) => {
  try {
    const {
      phoneNumber,
      value,
      method,
      context,
      returnUrl,
      callback,
      produtoId,
      clienteNome,
      clienteEmail
    } = req.body;

    // Validações básicas
    if (!phoneNumber || !value || !method) {
      return res.status(400).json({
        success: false,
        error: 'Dados obrigatórios não fornecidos'
      });
    }

    // Validar telefone moçambicano
    if (!SecurityUtils.validarTelefoneMZ(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Número de telefone inválido. Use um número moçambicano válido (9 dígitos)'
      });
    }

    // Validar email se fornecido
    if (clienteEmail && !SecurityUtils.validarEmail(clienteEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    // Validar método de pagamento
    if (!['Mpesa', 'Emola'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Método de pagamento inválido. Use "Mpesa" ou "Emola"'
      });
    }

    // Validar valor em MZN (1 a 50.000 MZN)
    const valor = parseFloat(value);
    if (!SecurityUtils.validarValorMZN(valor)) {
      return res.status(400).json({
        success: false,
        error: 'Valor inválido. O valor deve estar entre 1 e 50.000 MZN'
      });
    }

    // Mapear métodos para os valores corretos da API Paga Moz
    const methodMapping = {
      'Mpesa': 'mpesa',
      'Emola': 'emola'
    };

    // Mapear métodos para os valores corretos do banco de dados
    const dbMethodMapping = {
      'Mpesa': 'M-Pesa',
      'Emola': 'e-Mola'
    };

    // Preparar dados para a API Paga Moz
    const paymentData = {
      phoneNumber: phoneNumber.replace(/\D/g, ''), // Remove caracteres não numéricos
      value: valor.toString(),
      method: methodMapping[method] || method.toLowerCase(), // Usar mapeamento correto
      context: context || 'Pagamento via RatixPay',
      returnUrl: returnUrl || `${req.protocol}://${req.get('host')}/payment-success.html`,
      callback: callback || `${req.protocol}://${req.get('host')}/api/pagamoz/callback`
    };

    console.log('Iniciando pagamento Paga Moz:', paymentData);

    // Fazer requisição para a API Paga Moz
    const result = await pagamozRequest('/payment', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });

    if (result.success) {
      // Buscar informações do produto se produtoId fornecido
      let produto = null;
      if (produtoId) {
        produto = await Produto.findById(produtoId);
      }

      // Salvar transação no banco local
      const venda = await Venda.create({
        produtoId: produtoId,
        clienteNome: SecurityUtils.sanitizarDados(clienteNome || 'Cliente'),
        clienteEmail: SecurityUtils.sanitizarDados(clienteEmail || ''),
        clienteTelefone: phoneNumber,
        pagamentoMetodo: dbMethodMapping[method] || method, // Usar mapeamento para o banco
        pagamentoValor: valor,
        pagamentoValorOriginal: req.body.valorOriginal || valor,
        pagamentoStatus: 'Pendente',
        pagamentoTransacaoId: result.transactionId,
        pagamentoGateway: 'PaySuite', // Mapear Paga Moz para PaySuite (aceito pelo banco)
        status: 'Aguardando Pagamento',
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        transactionId: result.transactionId,
        checkoutUrl: result.checkoutUrl,
        message: 'Pagamento iniciado com sucesso',
        valorFormatado: SecurityUtils.formatarValorMZN(valor)
      });
    } else {
      throw new Error(result.error || 'Erro ao iniciar pagamento');
    }

  } catch (error) {
    console.error('Erro ao processar pagamento Paga Moz:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar pagamento',
      details: error.message
    });
  }
});

// Rota para verificar status da transação Paga Moz
router.get('/pagamoz/transaction/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    console.log('Verificando status da transação Paga Moz:', transactionId);

    // Buscar na API Paga Moz
    const result = await pagamozRequest(`/transaction/${transactionId}`);

    if (result.id) {
      // Atualizar status no banco local
      const venda = await Venda.findByTransacaoId(transactionId);
      if (venda) {
        const novoStatus = result.status === 'completed' ? 'Aprovado' : 
                          result.status === 'failed' ? 'Rejeitado' : 'Pendente';
        
        await Venda.updateStatus(transactionId, novoStatus);
      }

      res.json({
        success: true,
        transaction: result
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Transação não encontrada'
      });
    }

  } catch (error) {
    console.error('Erro ao verificar transação Paga Moz:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar transação',
      details: error.message
    });
  }
});

// Rota para callback do Paga Moz
router.post('/pagamoz/callback', async (req, res) => {
  try {
    const { transactionId, status, value, method, phoneNumber } = req.body;

    console.log('Callback Paga Moz recebido:', req.body);

    // Atualizar status da venda no banco
    const venda = await Venda.findByTransacaoId(transactionId);
    if (venda) {
      const novoStatus = status === 'completed' ? 'Aprovado' : 
                        status === 'failed' ? 'Rejeitado' : 'Pendente';
      
      await Venda.updateStatus(transactionId, novoStatus);
      
      console.log(`Venda ${transactionId} atualizada para status: ${novoStatus}`);

      // Se o pagamento foi aprovado, enviar email com link do conteúdo
      if (novoStatus === 'Aprovado' && venda.clienteEmail) {
        try {
          // Buscar informações do produto
          let produto = null;
          if (venda.produtoId) {
            produto = await Produto.findById(venda.produtoId);
          }

          // Enviar email com link do conteúdo
          if (EmailService.isConfigurado()) {
            await EmailService.enviarLinkConteudo(venda, produto);
            console.log(`✅ Email enviado para ${venda.clienteEmail}`);
            
            // Enviar notificação para administrador
            await EmailService.enviarNotificacaoAdmin(venda, produto);
            console.log('✅ Notificação admin enviada');
          } else {
            console.log('⚠️ Serviço de email não configurado');
          }
        } catch (emailError) {
          console.error('❌ Erro ao enviar email:', emailError);
          // Não falhar o callback por erro de email
        }
      }
    }

    res.json({ success: true, message: 'Callback processado com sucesso' });

  } catch (error) {
    console.error('Erro ao processar callback Paga Moz:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao processar callback'
    });
  }
});

// Rota para criar venda (mantida para compatibilidade)
router.post('/vendas', async (req, res) => {
  try {
    const vendaData = req.body;
    
    console.log('Criando venda:', vendaData);
    
    const venda = await Venda.create(vendaData);
    
    res.json({
      success: true,
      message: 'Venda criada com sucesso',
      vendaId: venda.id
    });
  } catch (err) {
    console.error('Erro ao criar venda:', err);
    res.status(500).json({ 
      error: 'Erro ao criar venda', 
      details: err.message 
    });
  }
});

// Rota para verificar status da venda (mantida para compatibilidade)
router.get('/vendas/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    console.log('Verificando status da venda:', transactionId);
    
    const venda = await Venda.findByTransacaoId(transactionId);
    
    if (!venda) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }
    
    res.json({
      success: true,
      status: venda.pagamentoStatus,
      message: `Status: ${venda.pagamentoStatus}`,
      valorFormatado: SecurityUtils.formatarValorMZN(venda.pagamentoValor)
    });
  } catch (err) {
    console.error('Erro ao verificar status da venda:', err);
    res.status(500).json({
      error: 'Erro ao verificar status',
      details: err.message
    });
  }
});

// Rota para reenviar email de conteúdo
router.post('/reenviar-email/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    console.log('Reenviando email para transação:', transactionId);
    
    const venda = await Venda.findByTransacaoId(transactionId);
    
    if (!venda) {
      return res.status(404).json({
        success: false,
        message: 'Venda não encontrada'
      });
    }

    if (venda.pagamentoStatus !== 'Aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas vendas aprovadas podem ter email reenviado'
      });
    }

    if (!venda.clienteEmail) {
      return res.status(400).json({
        success: false,
        message: 'Venda não possui email do cliente'
      });
    }

    // Buscar informações do produto
    let produto = null;
    if (venda.produtoId) {
      produto = await Produto.findById(venda.produtoId);
    }

    // Enviar email
    if (EmailService.isConfigurado()) {
      await EmailService.enviarLinkConteudo(venda, produto);
      
      res.json({
        success: true,
        message: 'Email reenviado com sucesso',
        email: venda.clienteEmail
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Serviço de email não configurado'
      });
    }
  } catch (err) {
    console.error('Erro ao reenviar email:', err);
    res.status(500).json({
      error: 'Erro ao reenviar email',
      details: err.message
    });
  }
});

module.exports = router; 