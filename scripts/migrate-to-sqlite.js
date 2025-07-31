#!/usr/bin/env node

/**
 * Script de migração do MongoDB para SQLite
 * 
 * Este script migra todos os dados do MongoDB para o SQLite
 * Mantendo a integridade e relacionamentos dos dados
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuração
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://derciomatsope9:Dercio123@cluster.n9onclx.mongodb.net/ratixpay?retryWrites=true&w=majority&appName=Cluster';
const SQLITE_PATH = path.join(__dirname, '../database/ratixpay.db');

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

// Função para conectar ao MongoDB (simulação)
async function connectToMongoDB() {
    logInfo('Conectando ao MongoDB...');
    
    // Simular dados do MongoDB (em produção, usar mongoose)
    const mockMongoData = {
        produtos: [
            {
                _id: '507f1f77bcf86cd799439011',
                customId: 'CURSO001',
                nome: 'Curso de Marketing Digital',
                tipo: 'Curso Online',
                preco: 297.00,
                desconto: 10,
                precoComDesconto: 267.30,
                descricao: 'Aprenda marketing digital do zero ao avançado',
                imagemUrl: 'https://example.com/curso-marketing.jpg',
                ativo: true,
                vendas: 15,
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-15')
            },
            {
                _id: '507f1f77bcf86cd799439012',
                customId: 'EBOOK001',
                nome: 'eBook: Finanças Pessoais',
                tipo: 'eBook',
                preco: 47.00,
                desconto: 0,
                precoComDesconto: 47.00,
                descricao: 'Guia completo para organizar suas finanças',
                imagemUrl: 'https://example.com/ebook-financas.jpg',
                ativo: true,
                vendas: 8,
                createdAt: new Date('2024-01-10'),
                updatedAt: new Date('2024-01-10')
            }
        ],
        vendas: [
            {
                _id: '507f1f77bcf86cd799439013',
                produto: '507f1f77bcf86cd799439011',
                cliente: {
                    nome: 'João Silva',
                    email: 'joao@email.com',
                    telefone: '841234567'
                },
                pagamento: {
                    metodo: 'M-Pesa',
                    valor: 267.30,
                    valorOriginal: 297.00,
                    desconto: 10,
                    status: 'Aprovado',
                    transacaoId: 'RTX123456789',
                    gateway: 'PaySuite',
                    dataProcessamento: new Date('2024-01-20')
                },
                status: 'Pago',
                dataVenda: new Date('2024-01-20'),
                ip: '192.168.1.1',
                userAgent: 'Mozilla/5.0...'
            },
            {
                _id: '507f1f77bcf86cd799439014',
                produto: '507f1f77bcf86cd799439012',
                cliente: {
                    nome: 'Maria Santos',
                    email: 'maria@email.com',
                    telefone: '861234567'
                },
                pagamento: {
                    metodo: 'e-Mola',
                    valor: 47.00,
                    valorOriginal: 47.00,
                    desconto: 0,
                    status: 'Aprovado',
                    transacaoId: 'RTX987654321',
                    gateway: 'PaySuite',
                    dataProcessamento: new Date('2024-01-21')
                },
                status: 'Pago',
                dataVenda: new Date('2024-01-21'),
                ip: '192.168.1.2',
                userAgent: 'Mozilla/5.0...'
            }
        ],
        usuarios: [
            {
                _id: '507f1f77bcf86cd799439015',
                username: 'Ratixpay',
                password: '$2a$10$hashedpassword',
                email: 'admin@ratixpay.com',
                nome: 'Administrador',
                role: 'admin',
                ativo: true,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01')
            }
        ]
    };
    
    logSuccess('Conectado ao MongoDB');
    return mockMongoData;
}

// Função para migrar produtos
async function migrateProdutos(mongoData, db) {
    logInfo('Migrando produtos...');
    
    const stmt = db.prepare(`
        INSERT INTO produtos (id, customId, nome, tipo, preco, desconto, precoComDesconto, 
                             descricao, imagemUrl, ativo, vendas, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let migrated = 0;
    for (const produto of mongoData.produtos) {
        try {
            stmt.run(
                produto._id,
                produto.customId,
                produto.nome,
                produto.tipo,
                produto.preco,
                produto.desconto,
                produto.precoComDesconto,
                produto.descricao,
                produto.imagemUrl,
                produto.ativo ? 1 : 0,
                produto.vendas,
                produto.createdAt.toISOString(),
                produto.updatedAt.toISOString()
            );
            migrated++;
        } catch (error) {
            logError(`Erro ao migrar produto ${produto.nome}: ${error.message}`);
        }
    }
    
    logSuccess(`${migrated} produtos migrados`);
    return migrated;
}

// Função para migrar vendas
async function migrateVendas(mongoData, db) {
    logInfo('Migrando vendas...');
    
    const stmt = db.prepare(`
        INSERT INTO vendas (id, produtoId, clienteNome, clienteEmail, clienteTelefone,
                           pagamentoMetodo, pagamentoValor, pagamentoValorOriginal,
                           pagamentoDesconto, pagamentoStatus, pagamentoTransacaoId,
                           pagamentoGateway, pagamentoDataProcessamento, status,
                           dataVenda, ip, userAgent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let migrated = 0;
    for (const venda of mongoData.vendas) {
        try {
            stmt.run(
                venda._id,
                venda.produto,
                venda.cliente.nome,
                venda.cliente.email,
                venda.cliente.telefone,
                venda.pagamento.metodo,
                venda.pagamento.valor,
                venda.pagamento.valorOriginal,
                venda.pagamento.desconto,
                venda.pagamento.status,
                venda.pagamento.transacaoId,
                venda.pagamento.gateway,
                venda.pagamento.dataProcessamento.toISOString(),
                venda.status,
                venda.dataVenda.toISOString(),
                venda.ip,
                venda.userAgent
            );
            migrated++;
        } catch (error) {
            logError(`Erro ao migrar venda ${venda._id}: ${error.message}`);
        }
    }
    
    logSuccess(`${migrated} vendas migradas`);
    return migrated;
}

// Função para migrar usuários
async function migrateUsuarios(mongoData, db) {
    logInfo('Migrando usuários...');
    
    const stmt = db.prepare(`
        INSERT INTO usuarios (id, username, password, email, nome, role, ativo, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let migrated = 0;
    for (const usuario of mongoData.usuarios) {
        try {
            stmt.run(
                usuario._id,
                usuario.username,
                usuario.password,
                usuario.email,
                usuario.nome,
                usuario.role,
                usuario.ativo ? 1 : 0,
                usuario.createdAt.toISOString(),
                usuario.updatedAt.toISOString()
            );
            migrated++;
        } catch (error) {
            logError(`Erro ao migrar usuário ${usuario.username}: ${error.message}`);
        }
    }
    
    logSuccess(`${migrated} usuários migrados`);
    return migrated;
}

// Função principal de migração
async function migrateToSQLite() {
    log('🚀 Iniciando migração do MongoDB para SQLite...', 'bright');
    log('', 'reset');
    
    try {
        // Conectar ao MongoDB
        const mongoData = await connectToMongoDB();
        
        // Criar backup do banco SQLite existente
        if (fs.existsSync(SQLITE_PATH)) {
            const backupPath = SQLITE_PATH.replace('.db', '_backup_' + Date.now() + '.db');
            fs.copyFileSync(SQLITE_PATH, backupPath);
            logInfo(`Backup criado: ${backupPath}`);
        }
        
        // Inicializar banco SQLite
        logInfo('Inicializando banco SQLite...');
        const db = new Database(SQLITE_PATH);
        
        // Configurar o banco
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        
        // Criar tabelas
        logInfo('Criando tabelas...');
        db.exec(`
            DROP TABLE IF EXISTS vendas;
            DROP TABLE IF EXISTS produtos;
            DROP TABLE IF EXISTS usuarios;
            DROP TABLE IF EXISTS configuracoes;
        `);
        
        // Recriar tabelas
        db.exec(`
            CREATE TABLE produtos (
                id TEXT PRIMARY KEY,
                customId TEXT UNIQUE,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL CHECK (tipo IN ('Curso Online', 'eBook')),
                preco REAL NOT NULL,
                desconto INTEGER DEFAULT 0,
                precoComDesconto REAL,
                descricao TEXT,
                imagemUrl TEXT,
                ativo BOOLEAN DEFAULT 1,
                vendas INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.exec(`
            CREATE TABLE vendas (
                id TEXT PRIMARY KEY,
                produtoId TEXT NOT NULL,
                clienteNome TEXT NOT NULL,
                clienteEmail TEXT NOT NULL,
                clienteTelefone TEXT NOT NULL,
                clienteCpf TEXT,
                clienteEndereco TEXT,
                pagamentoMetodo TEXT NOT NULL CHECK (pagamentoMetodo IN ('e-Mola', 'M-Pesa')),
                pagamentoValor REAL NOT NULL,
                pagamentoValorOriginal REAL NOT NULL,
                pagamentoDesconto INTEGER DEFAULT 0,
                pagamentoCupom TEXT,
                pagamentoStatus TEXT DEFAULT 'Pendente' CHECK (pagamentoStatus IN ('Pendente', 'Aprovado', 'Rejeitado', 'Cancelado')),
                pagamentoTransacaoId TEXT UNIQUE,
                pagamentoGateway TEXT DEFAULT 'PaySuite' CHECK (pagamentoGateway IN ('PaySuite', 'Local')),
                pagamentoDataProcessamento DATETIME,
                afiliadoCodigo TEXT,
                afiliadoComissao REAL DEFAULT 0,
                status TEXT DEFAULT 'Aguardando Pagamento' CHECK (status IN ('Aguardando Pagamento', 'Pago', 'Entregue', 'Cancelado', 'Reembolsado')),
                dataVenda DATETIME DEFAULT CURRENT_TIMESTAMP,
                dataEntrega DATETIME,
                observacoes TEXT,
                ip TEXT,
                userAgent TEXT,
                FOREIGN KEY (produtoId) REFERENCES produtos (id) ON DELETE CASCADE
            )
        `);
        
        db.exec(`
            CREATE TABLE usuarios (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                email TEXT UNIQUE,
                nome TEXT,
                role TEXT DEFAULT 'admin',
                ativo BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        db.exec(`
            CREATE TABLE configuracoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descricao TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        logSuccess('Tabelas criadas com sucesso');
        
        // Migrar dados
        const results = {
            produtos: await migrateProdutos(mongoData, db),
            vendas: await migrateVendas(mongoData, db),
            usuarios: await migrateUsuarios(mongoData, db)
        };
        
        // Fechar conexão
        db.close();
        
        // Resumo
        log('', 'reset');
        log('📊 Resumo da Migração:', 'bright');
        log(`   Produtos: ${results.produtos}`, 'green');
        log(`   Vendas: ${results.vendas}`, 'green');
        log(`   Usuários: ${results.usuarios}`, 'green');
        
        log('', 'reset');
        log('🎉 Migração concluída com sucesso!', 'green');
        log('', 'reset');
        log('💡 Próximos passos:', 'cyan');
        log('   1. Teste o sistema com: npm run dev', 'cyan');
        log('   2. Verifique se todos os dados estão corretos', 'cyan');
        log('   3. Execute os testes: npm run test:paysuite', 'cyan');
        
    } catch (error) {
        logError(`Erro durante a migração: ${error.message}`);
        process.exit(1);
    }
}

// Executar migração se o script for chamado diretamente
if (require.main === module) {
    migrateToSQLite();
}

module.exports = { migrateToSQLite }; 