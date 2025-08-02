const sqlite3 = require('sqlite3').verbose();
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

            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Erro ao conectar com SQLite:', err.message);
                    throw err;
                }
            });
            
            // Configurar o banco
            this.db.run('PRAGMA journal_mode = WAL');
            this.db.run('PRAGMA foreign_keys = ON');
            
            // Criar tabelas
            this.createTables();
            
            console.log('✅ Banco SQLite inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar banco SQLite:', error.message);
            throw error;
        }
    }

    // Criar todas as tabelas
    createTables() {
        // Tabela de produtos
        this.db.run(`
            CREATE TABLE IF NOT EXISTS produtos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customId TEXT UNIQUE,
                nome TEXT NOT NULL,
                tipo TEXT NOT NULL,
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
        this.db.run(`
            CREATE TABLE IF NOT EXISTS vendas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                produtoId INTEGER NOT NULL,
                clienteNome TEXT NOT NULL,
                clienteEmail TEXT NOT NULL,
                clienteTelefone TEXT NOT NULL,
                pagamentoMetodo TEXT NOT NULL,
                pagamentoValor REAL NOT NULL,
                pagamentoStatus TEXT DEFAULT 'Pendente',
                pagamentoTransacaoId TEXT UNIQUE,
                dataVenda DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (produtoId) REFERENCES produtos (id)
            )
        `);

        // Tabela de usuários
        this.db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                googleId TEXT UNIQUE,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                avatar TEXT,
                ativo BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    // Fechar conexão
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ Erro ao fechar banco:', err.message);
                } else {
                    console.log('✅ Conexão com banco fechada');
                }
            });
        }
    }

    // Getter para acessar a instância do banco
    getDatabase() {
        return this.db;
    }
}

module.exports = new DatabaseManager();
