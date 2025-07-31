const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'ratixpay.db');
    }

    // Inicializar conexão com o banco
    initialize() {
        try {
            // Criar diretório se não existir
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new Database(this.dbPath);
            
            // Configurar o banco
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('foreign_keys = ON');
            
            // Criar tabelas
            this.createTables();
            
            console.log('✅ Banco SQLite inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar banco SQLite:', error);
            throw error;
        }
    }

    // Criar todas as tabelas
    createTables() {
        // Tabela de produtos
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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

        // Tabela de vendas
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                produtoId INTEGER NOT NULL,
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

        // Tabela de usuários
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT,
                email TEXT UNIQUE,
                nome TEXT,
                role TEXT DEFAULT 'vendedor',
                tipo TEXT DEFAULT 'vendedor',
                googleId TEXT UNIQUE,
                ativo BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de clientes
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                telefone TEXT,
                endereco TEXT,
                dataNascimento DATETIME,
                genero TEXT CHECK (genero IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não informar')),
                totalCompras INTEGER DEFAULT 0,
                valorTotalGasto REAL DEFAULT 0,
                status TEXT DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Bloqueado')),
                observacoes TEXT,
                tags TEXT,
                dataCadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
                ultimaCompra DATETIME,
                origem TEXT DEFAULT 'Site' CHECK (origem IN ('Site', 'Indicação', 'Redes Sociais', 'Publicidade', 'Outro')),
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabela de configurações
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS configuracoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chave TEXT UNIQUE NOT NULL,
                valor TEXT,
                descricao TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Inserir dados iniciais
        this.insertInitialData();
    }

    // Inserir dados iniciais
    insertInitialData() {
        // Inserir usuário padrão
        const userExists = this.db.prepare('SELECT id FROM usuarios WHERE username = ?').get('Ratixpay');
        if (!userExists) {
            this.db.prepare(`
                INSERT INTO usuarios (username, password, email, nome, role)
                VALUES (?, ?, ?, ?, ?)
            `).run('Ratixpay', 'Moz258', 'admin@ratixpay.com', 'Administrador', 'admin');
        }

        // Inserir produtos de exemplo
        const produtosExemplo = [
            {
                customId: 'CURSO001',
                nome: 'Curso de Marketing Digital',
                tipo: 'Curso Online',
                preco: 297.00,
                desconto: 10,
                precoComDesconto: 267.30,
                descricao: 'Aprenda marketing digital do zero ao avançado'
            },
            {
                customId: 'EBOOK001',
                nome: 'eBook: Finanças Pessoais',
                tipo: 'eBook',
                preco: 47.00,
                desconto: 0,
                precoComDesconto: 47.00,
                descricao: 'Guia completo para organizar suas finanças'
            }
        ];

        produtosExemplo.forEach(produto => {
            const exists = this.db.prepare('SELECT id FROM produtos WHERE customId = ?').get(produto.customId);
            if (!exists) {
                this.db.prepare(`
                    INSERT INTO produtos (customId, nome, tipo, preco, desconto, precoComDesconto, descricao)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `).run(produto.customId, produto.nome, produto.tipo, produto.preco, produto.desconto, produto.precoComDesconto, produto.descricao);
            }
        });
    }

    // Obter instância do banco
    getDatabase() {
        return this.db;
    }

    // Fechar conexão
    close() {
        if (this.db) {
            this.db.close();
        }
    }

    // Backup do banco
    backup(backupPath) {
        if (this.db) {
            const backup = new Database(backupPath);
            this.db.backup(backup);
            backup.close();
            return true;
        }
        return false;
    }
}

// Instância singleton
const databaseManager = new DatabaseManager();

module.exports = databaseManager; 