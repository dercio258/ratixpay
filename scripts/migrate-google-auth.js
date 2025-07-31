const Database = require('better-sqlite3');
const path = require('path');

console.log('🔄 Iniciando migração para suporte ao Google OAuth...');

try {
    // Conectar ao banco
    const dbPath = path.join(__dirname, '..', 'database', 'ratixpay.db');
    const db = new Database(dbPath);
    
    console.log('✅ Conectado ao banco SQLite');
    
    // Verificar se a tabela usuarios existe
    const tableExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='usuarios'
    `).get();
    
    if (!tableExists) {
        console.log('❌ Tabela usuarios não encontrada. Criando...');
        
        // Criar tabela usuarios com suporte ao Google OAuth
        db.exec(`
            CREATE TABLE usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT,
                email TEXT UNIQUE,
                nome TEXT,
                role TEXT DEFAULT 'vendedor',
                tipo TEXT DEFAULT 'vendedor',
                googleId TEXT,
                ativo BOOLEAN DEFAULT 1,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Tabela usuarios criada com suporte ao Google OAuth');
    } else {
        console.log('✅ Tabela usuarios encontrada. Verificando campos...');
        
        // Verificar se os campos necessários existem
        const columns = db.prepare(`
            PRAGMA table_info(usuarios)
        `).all();
        
        const columnNames = columns.map(col => col.name);
        
        // Adicionar campos se não existirem
        if (!columnNames.includes('tipo')) {
            console.log('➕ Adicionando campo "tipo"...');
            db.exec('ALTER TABLE usuarios ADD COLUMN tipo TEXT DEFAULT "vendedor"');
        }
        
        if (!columnNames.includes('googleId')) {
            console.log('➕ Adicionando campo "googleId"...');
            db.exec('ALTER TABLE usuarios ADD COLUMN googleId TEXT');
        }
        
        // Atualizar campo password para permitir NULL
        if (columns.find(col => col.name === 'password' && col.notnull === 1)) {
            console.log('🔄 Atualizando campo "password" para permitir NULL...');
            // SQLite não suporta ALTER COLUMN, então vamos recriar a tabela
            db.exec(`
                CREATE TABLE usuarios_temp (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT,
                    email TEXT UNIQUE,
                    nome TEXT,
                    role TEXT DEFAULT 'vendedor',
                    tipo TEXT DEFAULT 'vendedor',
                    googleId TEXT,
                    ativo BOOLEAN DEFAULT 1,
                    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Copiar dados existentes
            db.exec(`
                INSERT INTO usuarios_temp (id, username, password, email, nome, role, ativo, createdAt, updatedAt)
                SELECT id, username, password, email, nome, role, ativo, createdAt, updatedAt
                FROM usuarios
            `);
            
            // Remover tabela antiga e renomear nova
            db.exec('DROP TABLE usuarios');
            db.exec('ALTER TABLE usuarios_temp RENAME TO usuarios');
            
            console.log('✅ Campo "password" atualizado para permitir NULL');
        }
        
        console.log('✅ Todos os campos necessários estão presentes');
    }
    
    // Verificar se há usuários existentes
    const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    console.log(`📊 Total de usuários no banco: ${userCount.count}`);
    
    // Criar usuário admin padrão se não existir
    const adminExists = db.prepare('SELECT id FROM usuarios WHERE username = ? OR email = ?').get('admin', 'admin@ratixpay.com');
    
    if (!adminExists) {
        console.log('👤 Criando usuário admin padrão...');
        
        db.prepare(`
            INSERT INTO usuarios (username, email, nome, role, tipo, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            'admin',
            'admin@ratixpay.com',
            'Administrador RatixPay',
            'admin',
            'admin',
            1
        );
        
        console.log('✅ Usuário admin criado');
    } else {
        console.log('✅ Usuário admin já existe');
    }
    
    // Fechar conexão
    db.close();
    
    console.log('🎉 Migração concluída com sucesso!');
    console.log('📝 Próximos passos:');
    console.log('   1. Configure as variáveis de ambiente do Google OAuth');
    console.log('   2. Reinicie o servidor');
    console.log('   3. Teste o login com Google');
    
} catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
} 