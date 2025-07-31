const fs = require('fs');
const path = require('path');

function verificarDeploy() {
    console.log('🔍 Verificando se o projeto está pronto para deploy...\n');
    
    let problemas = [];
    let avisos = [];
    let sucessos = [];
    
    // Verificar arquivos essenciais
    const arquivosEssenciais = [
        'package.json',
        'server.js',
        'render.yaml',
        '.dockerignore'
    ];
    
    arquivosEssenciais.forEach(arquivo => {
        if (fs.existsSync(arquivo)) {
            sucessos.push(`✅ ${arquivo} encontrado`);
        } else {
            problemas.push(`❌ ${arquivo} não encontrado`);
        }
    });
    
    // Verificar dependências
    if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (packageJson.scripts && packageJson.scripts.start) {
            sucessos.push('✅ Script start configurado');
        } else {
            problemas.push('❌ Script start não configurado');
        }
        
        if (packageJson.dependencies) {
            const dependenciasEssenciais = ['express', 'cors', 'sqlite3'];
            dependenciasEssenciais.forEach(dep => {
                if (packageJson.dependencies[dep]) {
                    sucessos.push(`✅ Dependência ${dep} encontrada`);
                } else {
                    avisos.push(`⚠️  Dependência ${dep} não encontrada`);
                }
            });
        }
    }
    
    // Verificar estrutura de diretórios
    const diretorios = [
        'routes',
        'models',
        'database',
        'public',
        'utils'
    ];
    
    diretorios.forEach(dir => {
        if (fs.existsSync(dir)) {
            sucessos.push(`✅ Diretório ${dir} encontrado`);
        } else {
            avisos.push(`⚠️  Diretório ${dir} não encontrado`);
        }
    });
    
    // Verificar arquivo .env
    if (fs.existsSync('.env')) {
        sucessos.push('✅ Arquivo .env encontrado');
    } else {
        avisos.push('⚠️  Arquivo .env não encontrado (crie um para desenvolvimento)');
    }
    
    // Verificar banco de dados
    if (fs.existsSync('database/ratixpay.db')) {
        sucessos.push('✅ Banco de dados SQLite encontrado');
    } else {
        avisos.push('⚠️  Banco de dados SQLite não encontrado (será criado automaticamente)');
    }
    
    // Verificar configurações de segurança
    const serverContent = fs.readFileSync('server.js', 'utf8');
    if (serverContent.includes('cors')) {
        sucessos.push('✅ CORS configurado');
    } else {
        avisos.push('⚠️  CORS não configurado');
    }
    
    if (serverContent.includes('helmet') || serverContent.includes('security')) {
        sucessos.push('✅ Configurações de segurança encontradas');
    } else {
        avisos.push('⚠️  Configurações de segurança básicas (recomendado adicionar helmet)');
    }
    
    // Exibir resultados
    console.log('📋 RESULTADOS DA VERIFICAÇÃO:\n');
    
    if (sucessos.length > 0) {
        console.log('✅ SUCESSOS:');
        sucessos.forEach(s => console.log(`   ${s}`));
        console.log('');
    }
    
    if (avisos.length > 0) {
        console.log('⚠️  AVISOS:');
        avisos.forEach(a => console.log(`   ${a}`));
        console.log('');
    }
    
    if (problemas.length > 0) {
        console.log('❌ PROBLEMAS:');
        problemas.forEach(p => console.log(`   ${p}`));
        console.log('');
    }
    
    // Resumo final
    console.log('📊 RESUMO:');
    console.log(`   ✅ Sucessos: ${sucessos.length}`);
    console.log(`   ⚠️  Avisos: ${avisos.length}`);
    console.log(`   ❌ Problemas: ${problemas.length}`);
    
    if (problemas.length === 0) {
        console.log('\n🎉 PROJETO PRONTO PARA DEPLOY!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('   1. Execute: node scripts/generate-keys.js');
        console.log('   2. Configure as variáveis de ambiente no Render');
        console.log('   3. Faça push para o repositório Git');
        console.log('   4. Configure o deploy no Render');
        console.log('   5. Configure o domínio no Hostinger');
    } else {
        console.log('\n🔧 CORRIJA OS PROBLEMAS ANTES DO DEPLOY');
    }
    
    // Verificar tamanho do projeto
    const stats = fs.statSync('.');
    const tamanhoMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`\n📦 Tamanho do projeto: ${tamanhoMB} MB`);
    
    if (parseFloat(tamanhoMB) > 100) {
        avisos.push('⚠️  Projeto muito grande (considere otimizar)');
    }
}

if (require.main === module) {
    verificarDeploy();
}

module.exports = { verificarDeploy }; 