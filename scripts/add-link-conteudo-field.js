const databaseManager = require('../database/database');

async function adicionarCampoLinkConteudo() {
    try {
        console.log('🔧 Adicionando campo linkConteudo à tabela produtos...');
        
        // Inicializar banco de dados
        databaseManager.initialize();
        const db = databaseManager.getDatabase();
        
        // Verificar se o campo já existe
        const tableInfo = db.prepare("PRAGMA table_info(produtos)").all();
        const campoExiste = tableInfo.some(col => col.name === 'linkConteudo');
        
        if (campoExiste) {
            console.log('✅ Campo linkConteudo já existe na tabela produtos');
            return;
        }
        
        // Adicionar o campo linkConteudo
        db.exec(`
            ALTER TABLE produtos 
            ADD COLUMN linkConteudo TEXT
        `);
        
        console.log('✅ Campo linkConteudo adicionado com sucesso!');
        
        // Atualizar alguns produtos de exemplo com links
        const produtosExemplo = [
            {
                id: 1,
                linkConteudo: 'https://drive.google.com/drive/folders/1ABC123?usp=sharing'
            },
            {
                id: 2,
                linkConteudo: 'https://www.dropbox.com/s/xyz789/curso-completo.zip?dl=0'
            }
        ];
        
        const stmt = db.prepare('UPDATE produtos SET linkConteudo = ? WHERE id = ?');
        
        for (const produto of produtosExemplo) {
            try {
                stmt.run(produto.linkConteudo, produto.id);
                console.log(`✅ Produto ${produto.id} atualizado com link de conteúdo`);
            } catch (error) {
                console.log(`⚠️ Produto ${produto.id} não encontrado ou já tem link`);
            }
        }
        
        console.log('🎉 Migração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao adicionar campo linkConteudo:', error);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    adicionarCampoLinkConteudo()
        .then(() => {
            console.log('✅ Script executado com sucesso');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erro na execução:', error);
            process.exit(1);
        });
}

module.exports = { adicionarCampoLinkConteudo }; 