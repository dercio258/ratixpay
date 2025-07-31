const mongoose = require('mongoose');
const Produto = require('../models/Produto');
const Venda = require('../models/Venda');
const Usuario = require('../models/Usuario');

// Conectar ao MongoDB
mongoose.connect('mongodb+srv://derciomatsope9:Dercio%40123@cluster.n9onclx.mongodb.net/ratixpay?retryWrites=true&w=majority&appName=Cluster')
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch((err) => console.error('❌ Erro na conexão:', err));

// Dados de exemplo para produtos
const produtosExemplo = [
  {
    tipo: 'Curso Online',
    nome: 'Curso de Marketing Digital',
    categoria: 'Marketing',
    descricao: 'Aprenda as melhores estratégias de marketing digital para alavancar seu negócio online.',
    preco: 297.00,
    desconto: 10,
    cupom: 'MARKETING10',
    afiliado: true,
    vendas: 45,
    modulos: [
      {
        titulo: 'Introdução ao Marketing Digital',
        descricao: 'Conceitos básicos e fundamentos',
        ordem: 1,
        aulas: [
          { titulo: 'O que é Marketing Digital', duracao: '15:30', url: '#' },
          { titulo: 'Principais Canais', duracao: '20:45', url: '#' }
        ]
      }
    ]
  },
  {
    tipo: 'eBook',
    nome: 'eBook: Finanças Pessoais',
    categoria: 'Finanças',
    descricao: 'Guia completo para organizar suas finanças e alcançar a independência financeira.',
    preco: 47.00,
    desconto: 0,
    afiliado: false,
    vendas: 23,
    arquivos: [
      { nome: 'financas-pessoais.pdf', url: '#', tipo: 'PDF' }
    ]
  },
  {
    tipo: 'Curso Online',
    nome: 'Curso de Programação Web',
    categoria: 'Tecnologia',
    descricao: 'Aprenda a criar sites e aplicações web modernas com HTML, CSS e JavaScript.',
    preco: 497.00,
    desconto: 20,
    cupom: 'PROG20',
    afiliado: true,
    vendas: 67,
    modulos: [
      {
        titulo: 'HTML e CSS',
        descricao: 'Fundamentos do desenvolvimento web',
        ordem: 1,
        aulas: [
          { titulo: 'Estrutura HTML', duracao: '25:00', url: '#' },
          { titulo: 'Estilização CSS', duracao: '30:15', url: '#' }
        ]
      }
    ]
  },
  {
    tipo: 'eBook',
    nome: 'eBook: Receitas Saudáveis',
    categoria: 'Saúde',
    descricao: 'Mais de 100 receitas saudáveis e nutritivas para uma vida mais equilibrada.',
    preco: 27.00,
    desconto: 0,
    afiliado: false,
    vendas: 89,
    arquivos: [
      { nome: 'receitas-saudaveis.pdf', url: '#', tipo: 'PDF' }
    ]
  },
  {
    tipo: 'Curso Online',
    nome: 'Curso de Design Gráfico',
    categoria: 'Design',
    descricao: 'Domine as ferramentas e técnicas essenciais do design gráfico profissional.',
    preco: 397.00,
    desconto: 15,
    cupom: 'DESIGN15',
    afiliado: true,
    vendas: 34,
    modulos: [
      {
        titulo: 'Fundamentos do Design',
        descricao: 'Teoria das cores, tipografia e composição',
        ordem: 1,
        aulas: [
          { titulo: 'Teoria das Cores', duracao: '18:20', url: '#' },
          { titulo: 'Tipografia', duracao: '22:10', url: '#' }
        ]
      }
    ]
  }
];

// Dados de exemplo para usuários
const usuariosExemplo = [
  {
    nome: 'João Silva',
    email: 'joao@exemplo.com',
    senha: '123456',
    tipo: 'vendedor'
  },
  {
    nome: 'Maria Santos',
    email: 'maria@exemplo.com',
    senha: '123456',
    tipo: 'afiliado'
  }
];

// Função para gerar vendas de exemplo
function gerarVendasExemplo(produtos) {
  const vendas = [];
  const nomes = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Oliveira', 'Carlos Lima', 'Lucia Ferreira', 'Roberto Alves', 'Fernanda Souza'];
  const emails = ['joao@email.com', 'maria@email.com', 'pedro@email.com', 'ana@email.com', 'carlos@email.com', 'lucia@email.com', 'roberto@email.com', 'fernanda@email.com'];
  const metodos = ['e-Mola', 'M-Pesa', 'RatixPay', 'PIX'];
  
  for (let i = 0; i < 50; i++) {
    const produto = produtos[Math.floor(Math.random() * produtos.length)];
    const nomeIndex = Math.floor(Math.random() * nomes.length);
    
    // Gerar data aleatória nos últimos 30 dias
    const dataVenda = new Date();
    dataVenda.setDate(dataVenda.getDate() - Math.floor(Math.random() * 30));
    
    const venda = {
      produto: produto._id,
      cliente: {
        nome: nomes[nomeIndex],
        email: emails[nomeIndex],
        telefone: `+258 ${Math.floor(Math.random() * 900000000) + 100000000}`,
        cpf: `${Math.floor(Math.random() * 900000000) + 100000000}`
      },
      pagamento: {
        metodo: metodos[Math.floor(Math.random() * metodos.length)],
        valor: produto.precoComDesconto,
        valorOriginal: produto.preco,
        desconto: produto.desconto,
        status: Math.random() > 0.1 ? 'Aprovado' : 'Pendente',
        transacaoId: `RTX${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}${i}`
      },
      status: Math.random() > 0.1 ? 'Pago' : 'Aguardando Pagamento',
      dataVenda,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
    
    vendas.push(venda);
  }
  
  return vendas;
}

// Função principal para popular o banco
async function popularBanco() {
  try {
    console.log('🗑️ Limpando dados existentes...');
    await Produto.deleteMany({});
    await Venda.deleteMany({});
    await Usuario.deleteMany({});
    
    console.log('📦 Criando produtos...');
    const produtos = await Produto.insertMany(produtosExemplo);
    console.log(`✅ ${produtos.length} produtos criados`);
    
    console.log('👥 Criando usuários...');
    const usuarios = await Usuario.insertMany(usuariosExemplo);
    console.log(`✅ ${usuarios.length} usuários criados`);
    
    console.log('💰 Criando vendas...');
    const vendasExemplo = gerarVendasExemplo(produtos);
    const vendas = await Venda.insertMany(vendasExemplo);
    console.log(`✅ ${vendas.length} vendas criadas`);
    
    console.log('🎉 Banco populado com sucesso!');
    
    // Mostrar estatísticas
    const totalProdutos = await Produto.countDocuments();
    const totalVendas = await Venda.countDocuments();
    const totalUsuarios = await Usuario.countDocuments();
    const receitaTotal = await Venda.aggregate([
      { $match: { 'pagamento.status': 'Aprovado' } },
      { $group: { _id: null, total: { $sum: '$pagamento.valor' } } }
    ]);
    
    console.log('\n📊 Estatísticas:');
    console.log(`- Produtos: ${totalProdutos}`);
    console.log(`- Vendas: ${totalVendas}`);
    console.log(`- Usuários: ${totalUsuarios}`);
    console.log(`- Receita Total: MZN ${receitaTotal[0]?.total?.toFixed(2) || '0.00'}`);
    
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  popularBanco();
}

module.exports = { popularBanco };

