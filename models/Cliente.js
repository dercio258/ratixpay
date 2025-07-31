const databaseManager = require('../database/database');

class Cliente {
    constructor(data = {}) {
        this.id = data.id;
        this.nome = data.nome;
        this.email = data.email;
        this.telefone = data.telefone;
        this.endereco = data.endereco ? JSON.parse(data.endereco) : {};
        this.dataNascimento = data.dataNascimento;
        this.genero = data.genero;
        this.totalCompras = data.totalCompras || 0;
        this.valorTotalGasto = data.valorTotalGasto || 0;
        this.status = data.status || 'Ativo';
        this.observacoes = data.observacoes;
        this.tags = data.tags ? JSON.parse(data.tags) : [];
        this.dataCadastro = data.dataCadastro;
        this.ultimaCompra = data.ultimaCompra;
        this.origem = data.origem || 'Site';
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Criar novo cliente
    static async create(clienteData) {
        const db = databaseManager.getDatabase();
        
        const stmt = db.prepare(`
            INSERT INTO clientes (
                nome, email, telefone, endereco, dataNascimento, genero,
                totalCompras, valorTotalGasto, status, observacoes, tags,
                dataCadastro, ultimaCompra, origem
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            clienteData.nome,
            clienteData.email,
            clienteData.telefone,
            JSON.stringify(clienteData.endereco || {}),
            clienteData.dataNascimento,
            clienteData.genero,
            clienteData.totalCompras || 0,
            clienteData.valorTotalGasto || 0,
            clienteData.status || 'Ativo',
            clienteData.observacoes,
            JSON.stringify(clienteData.tags || []),
            clienteData.dataCadastro || new Date().toISOString(),
            clienteData.ultimaCompra,
            clienteData.origem || 'Site'
        );

        return this.findById(result.lastInsertRowid);
    }

    // Buscar por ID
    static async findById(id) {
        const db = databaseManager.getDatabase();
        const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(id);
        return cliente ? new Cliente(cliente) : null;
    }

    // Buscar por email
    static async findByEmail(email) {
        const db = databaseManager.getDatabase();
        const cliente = db.prepare('SELECT * FROM clientes WHERE email = ?').get(email);
        return cliente ? new Cliente(cliente) : null;
    }

    // Buscar por telefone
    static async findByTelefone(telefone) {
        const db = databaseManager.getDatabase();
        const cliente = db.prepare('SELECT * FROM clientes WHERE telefone = ?').get(telefone);
        return cliente ? new Cliente(cliente) : null;
    }

    // Buscar todos os clientes
    static async findAll(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT * FROM clientes';
        const params = [];

        // Filtros
        const conditions = [];
        
        if (options.status) {
            conditions.push('status = ?');
            params.push(options.status);
        }

        if (options.origem) {
            conditions.push('origem = ?');
            params.push(options.origem);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Ordenação
        query += ' ORDER BY dataCadastro DESC';

        // Paginação
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        if (options.offset) {
            query += ' OFFSET ?';
            params.push(options.offset);
        }

        const clientes = db.prepare(query).all(...params);
        return clientes.map(cliente => new Cliente(cliente));
    }

    // Atualizar cliente
    async save() {
        const db = databaseManager.getDatabase();
        
        if (this.id) {
            // Atualizar
            const stmt = db.prepare(`
                UPDATE clientes SET
                    nome = ?, email = ?, telefone = ?, endereco = ?, dataNascimento = ?,
                    genero = ?, totalCompras = ?, valorTotalGasto = ?, status = ?,
                    observacoes = ?, tags = ?, ultimaCompra = ?, origem = ?,
                    updatedAt = ?
                WHERE id = ?
            `);

            stmt.run(
                this.nome,
                this.email,
                this.telefone,
                JSON.stringify(this.endereco || {}),
                this.dataNascimento,
                this.genero,
                this.totalCompras,
                this.valorTotalGasto,
                this.status,
                this.observacoes,
                JSON.stringify(this.tags || []),
                this.ultimaCompra,
                this.origem,
                new Date().toISOString(),
                this.id
            );
        } else {
            // Criar novo
            const stmt = db.prepare(`
                INSERT INTO clientes (
                    nome, email, telefone, endereco, dataNascimento, genero,
                    totalCompras, valorTotalGasto, status, observacoes, tags,
                    dataCadastro, ultimaCompra, origem
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const result = stmt.run(
                this.nome,
                this.email,
                this.telefone,
                JSON.stringify(this.endereco || {}),
                this.dataNascimento,
                this.genero,
                this.totalCompras,
                this.valorTotalGasto,
                this.status,
                this.observacoes,
                JSON.stringify(this.tags || []),
                this.dataCadastro || new Date().toISOString(),
                this.ultimaCompra,
                this.origem
            );

            this.id = result.lastInsertRowid;
        }

        return this;
    }

    // Deletar cliente
    static async findByIdAndDelete(id) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare('DELETE FROM clientes WHERE id = ?');
        stmt.run(id);
        return true;
    }

    // Contar clientes
    static async count(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT COUNT(*) as total FROM clientes';
        const params = [];

        // Filtros
        const conditions = [];
        
        if (options.status) {
            conditions.push('status = ?');
            params.push(options.status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = db.prepare(query).get(...params);
        return result.total;
    }

    // Atualizar estatísticas do cliente
    async atualizarEstatisticas() {
        const db = databaseManager.getDatabase();
        
        // Buscar vendas aprovadas do cliente
        const vendas = db.prepare(`
            SELECT * FROM vendas 
            WHERE clienteEmail = ? AND pagamentoStatus = 'Aprovado'
        `).all(this.email);
        
        this.totalCompras = vendas.length;
        this.valorTotalGasto = vendas.reduce((total, venda) => total + venda.pagamentoValor, 0);
        
        if (vendas.length > 0) {
            // Encontrar a venda mais recente
            const vendaMaisRecente = vendas.reduce((maisRecente, venda) => {
                return new Date(venda.dataVenda) > new Date(maisRecente.dataVenda) ? venda : maisRecente;
            });
            this.ultimaCompra = vendaMaisRecente.dataVenda;
        }
        
        await this.save();
        return this;
    }

    // Buscar clientes com estatísticas
    static async findWithStats() {
        const db = databaseManager.getDatabase();
        const clientes = db.prepare(`
            SELECT c.*, 
                   COUNT(v.id) as totalVendas,
                   SUM(v.pagamentoValor) as valorTotalGasto
            FROM clientes c
            LEFT JOIN vendas v ON c.email = v.clienteEmail AND v.pagamentoStatus = 'Aprovado'
            GROUP BY c.id
            ORDER BY c.dataCadastro DESC
        `).all();

        return clientes.map(cliente => new Cliente(cliente));
    }

    // Converter para JSON
    toJSON() {
        return {
            id: this.id,
            nome: this.nome,
            email: this.email,
            telefone: this.telefone,
            endereco: this.endereco,
            dataNascimento: this.dataNascimento,
            genero: this.genero,
            totalCompras: this.totalCompras,
            valorTotalGasto: this.valorTotalGasto,
            status: this.status,
            observacoes: this.observacoes,
            tags: this.tags,
            dataCadastro: this.dataCadastro,
            ultimaCompra: this.ultimaCompra,
            origem: this.origem,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Cliente;

