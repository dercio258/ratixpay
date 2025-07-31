const databaseManager = require('../database/database');
const bcrypt = require('bcryptjs');

class Usuario {
    constructor(data = {}) {
        this.id = data.id;
        this.username = data.username;
        this.password = data.password;
        this.email = data.email;
        this.nome = data.nome;
        this.role = data.role || 'vendedor';
        this.tipo = data.tipo || 'vendedor';
        this.googleId = data.googleId;
        this.ativo = data.ativo !== undefined ? data.ativo : true;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Criar novo usuário
    static async create(usuarioData) {
        const db = databaseManager.getDatabase();
        
        // Se não for usuário Google, fazer hash da senha
        let hashedPassword = null;
        if (usuarioData.password && !usuarioData.googleId) {
            hashedPassword = await bcrypt.hash(usuarioData.password, 10);
        }

        // Garantir que todos os valores sejam compatíveis com SQLite
        const username = String(usuarioData.username || usuarioData.email || '');
        const email = String(usuarioData.email || '');
        const nome = String(usuarioData.nome || '');
        const role = String(usuarioData.role || 'vendedor');
        const tipo = String(usuarioData.tipo || 'vendedor');
        const googleId = usuarioData.googleId ? String(usuarioData.googleId) : null;
        const ativo = usuarioData.ativo !== undefined ? (usuarioData.ativo ? 1 : 0) : 1;

        console.log('Dados para inserção:', {
            username, email, nome, role, tipo, googleId, ativo
        });

        const stmt = db.prepare(`
            INSERT INTO usuarios (username, password, email, nome, role, tipo, googleId, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            username,
            hashedPassword,
            email,
            nome,
            role,
            tipo,
            googleId,
            ativo
        );

        return this.findById(result.lastInsertRowid);
    }

    // Buscar por ID
    static async findById(id) {
        const db = databaseManager.getDatabase();
        const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id);
        return usuario ? new Usuario(usuario) : null;
    }

    // Buscar por username
    static async findByUsername(username) {
        const db = databaseManager.getDatabase();
        const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);
        return usuario ? new Usuario(usuario) : null;
    }

    // Buscar por email
    static async findByEmail(email) {
        const db = databaseManager.getDatabase();
        const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
        return usuario ? new Usuario(usuario) : null;
    }

    // Buscar por email ou Google ID
    static async findByEmailOrGoogleId(email, googleId) {
        const db = databaseManager.getDatabase();
        const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ? OR googleId = ?').get(email, googleId);
        return usuario ? new Usuario(usuario) : null;
    }

    // Buscar por Google ID
    static async findByGoogleId(googleId) {
        const db = databaseManager.getDatabase();
        const usuario = db.prepare('SELECT * FROM usuarios WHERE googleId = ?').get(googleId);
        return usuario ? new Usuario(usuario) : null;
    }

    // Autenticar usuário
    static async authenticate(username, password) {
        const usuario = await this.findByUsername(username);
        if (!usuario || !usuario.ativo) {
            return null;
        }

        // Se for usuário Google, não verificar senha
        if (usuario.googleId) {
            return usuario;
        }

        const isValidPassword = await bcrypt.compare(password, usuario.password);
        if (!isValidPassword) {
            return null;
        }

        return usuario;
    }

    // Buscar todos os usuários
    static async findAll(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT * FROM usuarios';
        const params = [];

        if (options.ativo !== undefined) {
            query += ' WHERE ativo = ?';
            params.push(options.ativo ? 1 : 0);
        }

        query += ' ORDER BY createdAt DESC';

        const usuarios = db.prepare(query).all(...params);
        return usuarios.map(usuario => new Usuario(usuario));
    }

    // Atualizar usuário
    async save() {
        const db = databaseManager.getDatabase();
        
        if (this.id) {
            // Atualizar
            const stmt = db.prepare(`
                UPDATE usuarios 
                SET username = ?, email = ?, nome = ?, role = ?, tipo = ?, googleId = ?, ativo = ?, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            stmt.run(
                this.username,
                this.email,
                this.nome,
                this.role,
                this.tipo,
                this.googleId,
                this.ativo ? 1 : 0,
                this.id
            );

            return this;
        } else {
            // Criar novo
            return await Usuario.create(this);
        }
    }

    // Atualizar senha (apenas para usuários não-Google)
    async updatePassword(newPassword) {
        if (this.googleId) {
            throw new Error('Usuários Google não podem alterar senha');
        }

        const db = databaseManager.getDatabase();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const stmt = db.prepare('UPDATE usuarios SET password = ? WHERE id = ?');
        stmt.run(hashedPassword, this.id);

        this.password = hashedPassword;
        return this;
    }

    // Deletar usuário
    static async findByIdAndDelete(id) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
        stmt.run(id);
    }

    // Contar usuários
    static async count(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT COUNT(*) as count FROM usuarios';
        const params = [];

        if (options.ativo !== undefined) {
            query += ' WHERE ativo = ?';
            params.push(options.ativo ? 1 : 0);
        }

        const result = db.prepare(query).get(...params);
        return result.count;
    }

    // Converter para JSON
    toJSON() {
        return {
            id: this.id,
            username: this.username,
            email: this.email,
            nome: this.nome,
            role: this.role,
            tipo: this.tipo,
            googleId: this.googleId,
            ativo: this.ativo,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Usuario;

