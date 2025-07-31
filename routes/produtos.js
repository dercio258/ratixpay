const express = require('express');
const router = express.Router();
const Produto = require('../models/Produto');
const multer = require('multer');
const path = require('path');

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = file.fieldname + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

// Função para gerar customId único (6 dígitos, paridade do último dígito oposta à posição)
async function gerarCustomId(tipo) {
  let prefix, filtroTipo;
  if (tipo === 'Curso Online') {
    prefix = 'C';
    filtroTipo = { tipo: 'Curso Online' };
  } else {
    prefix = 'B';
    filtroTipo = { tipo: 'eBook' };
  }
  const count = await Produto.count(filtroTipo);
  const posNum = count + 1;
  const pos = posNum.toString().padStart(2, '0');
  let customId, exists;
  do {
    const rand2 = Math.floor(Math.random() * 90 + 10); // 2 dígitos aleatórios
    // Último dígito: paridade oposta à posição
    let lastDigit;
    if (posNum % 2 === 0) {
      // posição par → último dígito ímpar
      const impares = [1, 3, 5, 7, 9];
      lastDigit = impares[Math.floor(Math.random() * impares.length)];
    } else {
      // posição ímpar → último dígito par
      const pares = [0, 2, 4, 6, 8];
      lastDigit = pares[Math.floor(Math.random() * pares.length)];
    }
    customId = `${prefix}${pos}${rand2}${lastDigit}`;
    exists = await Produto.findByCustomId(customId);
  } while (exists);
  return customId;
}

// GET - Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { ativo, tipo, categoria, limite = 10, pagina = 1 } = req.query;
    
    const options = {};
    if (ativo !== undefined) options.ativo = ativo === 'true';
    if (tipo) options.tipo = tipo;
    if (categoria) options.categoria = categoria;
    
    const produtos = await Produto.findAll(options);
    const total = await Produto.count(options);
    
    // Aplicar paginação manualmente
    const inicio = (parseInt(pagina) - 1) * parseInt(limite);
    const fim = inicio + parseInt(limite);
    const produtosPaginados = produtos.slice(inicio, fim);
    
    res.json({
      produtos: produtosPaginados.map(p => p.toJSON()),
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / parseInt(limite))
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos' });
  }
});

// GET - Buscar produto por ID
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }
    
    res.json(produto.toJSON());
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ erro: 'Erro ao buscar produto' });
  }
});

// POST - Criar novo produto
router.post('/', upload.single('imagem'), async (req, res) => {
  try {
    const {
      nome,
      tipo,
      preco,
      desconto = 0,
      descricao,
      ativo = true
    } = req.body;

    // Validações
    if (!nome || !tipo || !preco) {
      return res.status(400).json({
        erro: 'Nome, tipo e preço são obrigatórios'
      });
    }

    if (!['Curso Online', 'eBook'].includes(tipo)) {
      return res.status(400).json({
        erro: 'Tipo deve ser "Curso Online" ou "eBook"'
      });
    }

    // Gerar customId único
    const customId = await gerarCustomId(tipo);

    // Calcular preço com desconto
    const precoComDesconto = preco - (preco * desconto / 100);

    // Processar imagem se fornecida
    let imagemUrl = null;
    if (req.file) {
      imagemUrl = `/uploads/${req.file.filename}`;
    }

    // Criar produto
    const produtoData = {
      customId,
      nome,
      tipo,
      preco: parseFloat(preco),
      desconto: parseInt(desconto),
      precoComDesconto,
      descricao,
      imagemUrl,
      ativo: ativo === 'true' || ativo === true
    };

    const produto = await Produto.create(produtoData);

    res.status(201).json({
      mensagem: 'Produto criado com sucesso',
      produto: produto.toJSON()
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ erro: 'Erro ao criar produto' });
  }
});

// PUT - Atualizar produto
router.put('/:id', upload.single('imagem'), async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    const {
      nome,
      tipo,
      preco,
      desconto,
      descricao,
      ativo
    } = req.body;

    // Atualizar campos
    if (nome) produto.nome = nome;
    if (tipo) produto.tipo = tipo;
    if (preco) produto.preco = parseFloat(preco);
    if (desconto !== undefined) produto.desconto = parseInt(desconto);
    if (descricao !== undefined) produto.descricao = descricao;
    if (ativo !== undefined) produto.ativo = ativo === 'true' || ativo === true;

    // Recalcular preço com desconto
    if (preco || desconto !== undefined) {
      produto.precoComDesconto = produto.preco - (produto.preco * produto.desconto / 100);
    }

    // Processar nova imagem se fornecida
    if (req.file) {
      produto.imagemUrl = `/uploads/${req.file.filename}`;
    }

    await produto.save();

    res.json({
      mensagem: 'Produto atualizado com sucesso',
      produto: produto.toJSON()
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ erro: 'Erro ao atualizar produto' });
  }
});

// POST - Upload de imagem
router.post('/upload-imagem', upload.single('imagem'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma imagem foi enviada' });
    }

    const imagemUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      mensagem: 'Imagem enviada com sucesso',
      imagemUrl: imagemUrl
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({ erro: 'Erro ao fazer upload da imagem' });
  }
});

// DELETE - Deletar produto
router.delete('/:id', async (req, res) => {
  try {
    const produto = await Produto.findById(req.params.id);
    
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado' });
    }

    await Produto.findByIdAndDelete(req.params.id);

    res.json({
      mensagem: 'Produto deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ erro: 'Erro ao deletar produto' });
  }
});

// GET - Produtos ativos (para frontend)
router.get('/ativos/todos', async (req, res) => {
  try {
    const produtos = await Produto.findAtivos();
    
    res.json(produtos.map(p => p.toJSON()));
  } catch (error) {
    console.error('Erro ao buscar produtos ativos:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos ativos' });
  }
});

// GET - Produtos por tipo
router.get('/tipo/:tipo', async (req, res) => {
  try {
    const { tipo } = req.params;
    const { ativo } = req.query;
    
    const options = { tipo };
    if (ativo !== undefined) {
      options.ativo = ativo === 'true';
    }
    
    const produtos = await Produto.findAll(options);
    
    res.json(produtos.map(p => p.toJSON()));
  } catch (error) {
    console.error('Erro ao buscar produtos por tipo:', error);
    res.status(500).json({ erro: 'Erro ao buscar produtos por tipo' });
  }
});

module.exports = router;


