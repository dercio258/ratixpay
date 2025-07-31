const databaseManager = require('../database/database');
const SecurityUtils = require('../utils/securityUtils');

class Venda {
    constructor(data = {}) {
        this.id = data.id;
        this.produtoId = data.produtoId;
        this.clienteNome = data.clienteNome;
        this.clienteEmail = data.clienteEmail;
        this.clienteTelefone = data.clienteTelefone;
        this.clienteCpf = data.clienteCpf;
        this.clienteEndereco = data.clienteEndereco;
        this.pagamentoMetodo = data.pagamentoMetodo;
        this.pagamentoValor = data.pagamentoValor;
        this.pagamentoValorOriginal = data.pagamentoValorOriginal;
        this.pagamentoDesconto = data.pagamentoDesconto || 0;
        this.pagamentoCupom = data.pagamentoCupom;
        this.pagamentoStatus = data.pagamentoStatus || 'Pendente';
        this.pagamentoTransacaoId = data.pagamentoTransacaoId;
        this.pagamentoGateway = data.pagamentoGateway || 'Local';
        this.pagamentoDataProcessamento = data.pagamentoDataProcessamento;
        this.afiliadoCodigo = data.afiliadoCodigo;
        this.afiliadoComissao = data.afiliadoComissao || 0;
        this.status = data.status || 'Aguardando Pagamento';
        this.dataVenda = data.dataVenda;
        this.dataEntrega = data.dataEntrega;
        this.observacoes = data.observacoes;
        this.ip = data.ip;
        this.userAgent = data.userAgent;
    }

    // Criar nova venda
    static async create(vendaData) {
        const db = databaseManager.getDatabase();
        
        // Validar e sanitizar dados
        if (vendaData.clienteNome) {
            vendaData.clienteNome = SecurityUtils.sanitizarDados(vendaData.clienteNome);
        }
        if (vendaData.clienteEmail) {
            vendaData.clienteEmail = SecurityUtils.sanitizarDados(vendaData.clienteEmail);
        }
        if (vendaData.clienteTelefone) {
            vendaData.clienteTelefone = SecurityUtils.sanitizarDados(vendaData.clienteTelefone);
        }
        
        // Validar valor em MZN
        if (vendaData.pagamentoValor && !SecurityUtils.validarValorMZN(vendaData.pagamentoValor)) {
            throw new Error('Valor inválido. O valor deve estar entre 1 e 50.000 MZN');
        }
        
        // Gerar transação ID seguro se não fornecido
        if (!vendaData.pagamentoTransacaoId) {
            vendaData.pagamentoTransacaoId = SecurityUtils.gerarTransacaoIdSeguro();
        } else if (!SecurityUtils.validarTransacaoId(vendaData.pagamentoTransacaoId)) {
            throw new Error('ID de transação inválido');
        }

        const stmt = db.prepare(`
            INSERT INTO vendas (
                produtoId, clienteNome, clienteEmail, clienteTelefone, clienteCpf, clienteEndereco,
                pagamentoMetodo, pagamentoValor, pagamentoValorOriginal, pagamentoDesconto, 
                pagamentoCupom, pagamentoStatus, pagamentoTransacaoId, pagamentoGateway,
                afiliadoCodigo, afiliadoComissao, status, observacoes, ip, userAgent
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            vendaData.produtoId,
            vendaData.clienteNome,
            vendaData.clienteEmail,
            vendaData.clienteTelefone,
            vendaData.clienteCpf,
            vendaData.clienteEndereco,
            vendaData.pagamentoMetodo,
            vendaData.pagamentoValor,
            vendaData.pagamentoValorOriginal,
            vendaData.pagamentoDesconto || 0,
            vendaData.pagamentoCupom,
            vendaData.pagamentoStatus || 'Pendente',
            vendaData.pagamentoTransacaoId,
            vendaData.pagamentoGateway || 'PaySuite',
            vendaData.afiliadoCodigo,
            vendaData.afiliadoComissao || 0,
            vendaData.status || 'Aguardando Pagamento',
            vendaData.observacoes,
            vendaData.ip,
            vendaData.userAgent
        );

        return this.findById(result.lastInsertRowid);
    }

    // Buscar por ID
    static async findById(id) {
        const db = databaseManager.getDatabase();
        const venda = db.prepare('SELECT * FROM vendas WHERE id = ?').get(id);
        return venda ? new Venda(venda) : null;
    }

    // Buscar por transação ID
    static async findByTransacaoId(transacaoId) {
        const db = databaseManager.getDatabase();
        const venda = db.prepare('SELECT * FROM vendas WHERE pagamentoTransacaoId = ?').get(transacaoId);
        return venda ? new Venda(venda) : null;
    }

    // Buscar todas as vendas
    static async findAll(options = {}) {
        const db = databaseManager.getDatabase();
        let query = `
            SELECT v.*, p.nome as produtoNome, p.customId as produtoCustomId
            FROM vendas v
            LEFT JOIN produtos p ON v.produtoId = p.id
        `;
        const params = [];

        // Filtros
        const conditions = [];
        if (options.status) {
            conditions.push('v.status = ?');
            params.push(options.status);
        }

        if (options.pagamentoStatus) {
            conditions.push('v.pagamentoStatus = ?');
            params.push(options.pagamentoStatus);
        }

        if (options.produtoId) {
            conditions.push('v.produtoId = ?');
            params.push(options.produtoId);
        }

        if (options.email) {
            conditions.push('v.clienteEmail = ?');
            params.push(options.email);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        // Ordenação
        query += ' ORDER BY v.dataVenda DESC';

        // Paginação
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        if (options.offset) {
            query += ' OFFSET ?';
            params.push(options.offset);
        }

        const vendas = db.prepare(query).all(...params);
        return vendas.map(venda => new Venda(venda));
    }

    // Atualizar venda
    async save() {
        const db = databaseManager.getDatabase();
        
        if (this.id) {
            // Atualizar
            const stmt = db.prepare(`
                UPDATE vendas 
                SET clienteNome = ?, clienteEmail = ?, clienteTelefone = ?, clienteCpf = ?, 
                    clienteEndereco = ?, pagamentoMetodo = ?, pagamentoValor = ?, 
                    pagamentoValorOriginal = ?, pagamentoDesconto = ?, pagamentoCupom = ?,
                    pagamentoStatus = ?, pagamentoTransacaoId = ?, pagamentoGateway = ?,
                    pagamentoDataProcessamento = ?, afiliadoCodigo = ?, afiliadoComissao = ?,
                    status = ?, dataEntrega = ?, observacoes = ?, ip = ?, userAgent = ?
                WHERE id = ?
            `);

            stmt.run(
                this.clienteNome,
                this.clienteEmail,
                this.clienteTelefone,
                this.clienteCpf,
                this.clienteEndereco,
                this.pagamentoMetodo,
                this.pagamentoValor,
                this.pagamentoValorOriginal,
                this.pagamentoDesconto,
                this.pagamentoCupom,
                this.pagamentoStatus,
                this.pagamentoTransacaoId,
                this.pagamentoGateway,
                this.pagamentoDataProcessamento,
                this.afiliadoCodigo,
                this.afiliadoComissao,
                this.status,
                this.dataEntrega,
                this.observacoes,
                this.ip,
                this.userAgent,
                this.id
            );

            return this;
        } else {
            // Criar novo
            return await Venda.create(this);
        }
    }

    // Deletar venda
    static async findByIdAndDelete(id) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare('DELETE FROM vendas WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    // Atualizar status do pagamento
    static async updatePaymentStatus(transacaoId, status) {
        const db = databaseManager.getDatabase();
        const stmt = db.prepare(`
            UPDATE vendas 
            SET pagamentoStatus = ?, 
                status = CASE 
                    WHEN ? = 'Aprovado' THEN 'Pago'
                    WHEN ? = 'Rejeitado' THEN 'Cancelado'
                    ELSE status
                END,
                pagamentoDataProcessamento = CURRENT_TIMESTAMP
            WHERE pagamentoTransacaoId = ?
        `);

        const result = stmt.run(status, status, status, transacaoId);
        return result.changes > 0;
    }

    // Atualizar status (alias para compatibilidade com Paga Moz)
    static async updateStatus(transacaoId, status) {
        return this.updatePaymentStatus(transacaoId, status);
    }

    // Gerar ID de transação único (mantido para compatibilidade)
    static gerarTransacaoId() {
        return SecurityUtils.gerarTransacaoIdSeguro();
    }

    // Gerar ID de referência de pagamento (mantido para compatibilidade)
    static gerarReferenciaId() {
        return SecurityUtils.gerarReferenciaIdSeguro();
    }

    // Formatar valor em MZN
    static formatarValorMZN(valor) {
        if (typeof valor !== 'number' || isNaN(valor)) {
            return 'MZN 0,00';
        }
        
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'MZN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Processar pagamento (simulação)
    async processarPagamento() {
        try {
            // Simular processamento de pagamento baseado no método
            const metodosConfiabilidade = {
                'e-Mola': 0.95,
                'M-Pesa': 0.92
            };
            
            const confiabilidade = metodosConfiabilidade[this.pagamentoMetodo] || 0.85;
            const aprovado = Math.random() < confiabilidade;
            
            // Simular tempo de processamento (1-5 segundos)
            const tempoProcessamento = Math.floor(Math.random() * 4000) + 1000;
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    this.pagamentoStatus = aprovado ? 'Aprovado' : 'Rejeitado';
                    this.pagamentoDataProcessamento = new Date().toISOString();
                    
                    if (aprovado) {
                        this.status = 'Pago';
                    } else {
                        this.status = 'Cancelado';
                    }
                    
                    this.save();
                    resolve(aprovado);
                }, tempoProcessamento);
            });
        } catch (error) {
            this.pagamentoStatus = 'Rejeitado';
            this.status = 'Cancelado';
            this.save();
            throw error;
        }
    }

    // Buscar vendas por período
    static async findByPeriod(startDate, endDate) {
        const db = databaseManager.getDatabase();
        const query = `
            SELECT v.*, p.nome as produtoNome, p.customId as produtoCustomId
            FROM vendas v
            LEFT JOIN produtos p ON v.produtoId = p.id
            WHERE v.dataVenda BETWEEN ? AND ?
            ORDER BY v.dataVenda DESC
        `;

        const vendas = db.prepare(query).all(startDate, endDate);
        return vendas.map(venda => new Venda(venda));
    }

    // Estatísticas de vendas
    static async getStats() {
        const db = databaseManager.getDatabase();
        
        // Vendas totais
        const totalVendas = db.prepare('SELECT COUNT(*) as count FROM vendas').get();
        
        // Receita total
        const receitaTotal = db.prepare('SELECT SUM(pagamentoValor) as total FROM vendas WHERE pagamentoStatus = "Aprovado"').get();
        
        // Vendas por status
        const vendasPorStatus = db.prepare(`
            SELECT status, COUNT(*) as count 
            FROM vendas 
            GROUP BY status
        `).all();

        // Vendas dos últimos 7 dias
        const vendasUltimos7Dias = db.prepare(`
            SELECT DATE(dataVenda) as data, COUNT(*) as count, SUM(pagamentoValor) as receita
            FROM vendas 
            WHERE dataVenda >= date('now', '-7 days')
            GROUP BY DATE(dataVenda)
            ORDER BY data
        `).all();

        return {
            totalVendas: totalVendas.count,
            receitaTotal: receitaTotal.total || 0,
            vendasPorStatus,
            vendasUltimos7Dias
        };
    }

    // Contar vendas
    static async count(options = {}) {
        const db = databaseManager.getDatabase();
        let query = 'SELECT COUNT(*) as count FROM vendas';
        const params = [];

        if (options.status) {
            query += ' WHERE status = ?';
            params.push(options.status);
        }

        const result = db.prepare(query).get(...params);
        return result.count;
    }

    // Converter para objeto JSON
    toJSON() {
        return {
            id: this.id,
            produtoId: this.produtoId,
            cliente: {
                nome: this.clienteNome,
                email: this.clienteEmail,
                telefone: this.clienteTelefone,
                cpf: this.clienteCpf,
                endereco: this.clienteEndereco
            },
            pagamento: {
                metodo: this.pagamentoMetodo,
                valor: this.pagamentoValor,
                valorFormatado: Venda.formatarValorMZN(this.pagamentoValor),
                valorOriginal: this.pagamentoValorOriginal,
                desconto: this.pagamentoDesconto,
                cupom: this.pagamentoCupom,
                status: this.pagamentoStatus,
                transacaoId: this.pagamentoTransacaoId,
                gateway: this.pagamentoGateway,
                dataProcessamento: this.pagamentoDataProcessamento
            },
            afiliado: {
                codigo: this.afiliadoCodigo,
                comissao: this.afiliadoComissao
            },
            status: this.status,
            dataVenda: this.dataVenda,
            dataEntrega: this.dataEntrega,
            observacoes: this.observacoes,
            ip: this.ip,
            userAgent: this.userAgent
        };
    }
}

module.exports = Venda;

