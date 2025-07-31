const databaseManager = require('../database/database');

class Produto {
    constructor(data = {}) {
        this.id = data.id;
        this.customId = data.customId;
        this.nome = data.nome;
        this.tipo = data.tipo;
        this.preco = data.preco;
        this.desconto = data.desconto || 0;
        this.precoComDesconto = data.precoComDesconto;
        this.descricao = data.descricao;
        this.imagemUrl = data.imagemUrl;
        this.linkConteudo = data.linkConteudo;
        this.ativo = data.ativo !== undefined ? data.ativo : true;
        this.vendas = data.vendas || 0;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    // Criar novo produto
    static async create(produtoData) {
        const db = databaseManager.getDatabase();
        
        // Calcular preço com desconto se não fornecido
        if (!produtoData.precoComDesconto && produtoData.desconto > 0) {
            produtoData.precoComDesconto = produtoData.preco - (produtoData.preco * produtoData.desconto / 100);
        } else if (!produtoData.precoComDesconto) {
            produtoData.precoComDesconto = produtoData.preco;
        }

        const stmt = db.prepare(`
            INSERT INTO produtos (customId, nome, tipo, preco, desconto, precoComDesconto, descricao, imagemUrl, linkConteudo, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            produtoData.customId ?? null,
            produtoData.nome ?? null,
            produtoData.tipo ?? null,
            produtoData.preco ?? null,
            produtoData.desconto ?? 0,
            produtoData.precoComDesconto ?? null,
            produtoData.descricao ?? null,
            produtoData.imagemUrl ?? null,
            produtoData.linkConteudo ?? null,
            produtoData.ativo !== undefined ? (produtoData.ativo ? 1 : 0) : 1
        );

        return this.findById(result.lastInsertRowid);
    }

    // Buscar por ID
    static async findById(id) {
        const db = databaseManager.getDatabase();
        const produto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
        return produto ? new Produto(produto) : null;
    }

    // Buscar por customId
    static async findByCustomId(customId) {
        const db = databaseManager.getDatabase();
        const produto = db.prepare('SELECT * FROM produtos WHERE customId = ?').get(customId);
        return produto ? new Produto(produto) : null;
    }

    // Buscar todos os produtos
    static async findAll(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT * FROM produtos';
        const params = [];

        // Filtros
        if (options.ativo !== undefined) {
            query += ' WHERE ativo = ?';
            params.push(options.ativo ? 1 : 0);
        }

        // Ordenação
        query += ' ORDER BY createdAt DESC';

        // Paginação
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        if (options.offset) {
            query += ' OFFSET ?';
            params.push(options.offset);
        }

        const produtos = db.prepare(query).all(...params);
        return produtos.map(produto => new Produto(produto));
    }

    // Atualizar produto
    async save() {
        const db = databaseManager.getDatabase();
        
        if (this.id) {
            // Atualizar
            const stmt = db.prepare(`
                UPDATE produtos 
                SET customId = ?, nome = ?, tipo = ?, preco = ?, desconto = ?, 
                    precoComDesconto = ?, descricao = ?, imagemUrl = ?, ativo = ?, 
                    vendas = ?, updatedAt = CURRENT_TIMESTAMP
                WHERE id = ?
            `);

            stmt.run(
                this.customId,
                this.nome,
                this.tipo,
                this.preco,
                this.desconto,
                this.precoComDesconto,
                this.descricao,
                this.imagemUrl,
                this.ativo ? 1 : 0,
                this.vendas,
                this.id
            );

            return this;
        } else {
            // Criar novo
            return await Produto.create(this);
        }
    }

    // Deletar produto
    static async findByIdAndDelete(id) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare('DELETE FROM produtos WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Incrementar vendas
    static async incrementVendas(id) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare('UPDATE produtos SET vendas = vendas + 1 WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Buscar produtos ativos
    static async findAtivos() {
        return await this.findAll({ ativo: true });
    }

    // Contar produtos
    static async count(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT COUNT(*) as count FROM produtos';
        const params = [];

        if (options.ativo !== undefined) {
            query += ' WHERE ativo = ?';
            params.push(options.ativo ? 1 : 0);
        }

        const result = db.prepare(query).get(...params);
        return result.count;
    }

    // Buscar produtos com estatísticas de vendas
    static async findWithStats() {
        const db = databaseManager.getDatabase();
        const query = `
            SELECT p.*, 
                   COUNT(v.id) as totalVendas,
                   SUM(v.pagamentoValor) as receitaTotal
            FROM produtos p
            LEFT JOIN vendas v ON p.id = v.produtoId
            GROUP BY p.id
            ORDER BY p.createdAt DESC
        `;

        const produtos = db.prepare(query).all();
        return produtos.map(produto => new Produto(produto));
    }

    // Converter para objeto JSON
    toJSON() {
        return {
            id: this.id,
            customId: this.customId,
            nome: this.nome,
            tipo: this.tipo,
            preco: this.preco,
            desconto: this.desconto,
            precoComDesconto: this.precoComDesconto,
            descricao: this.descricao,
            imagemUrl: this.imagemUrl,
            ativo: this.ativo,
            vendas: this.vendas,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}

module.exports = Produto;

