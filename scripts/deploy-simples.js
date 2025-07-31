#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 RatixPay - Deploy Simples');
console.log('=============================\n');

// Verificar se está no diretório correto
if (!fs.existsSync('package.json')) {
    console.error('❌ Erro: Execute este script na pasta raiz do projeto');
    process.exit(1);
}

// Verificar arquivos essenciais
const arquivosEssenciais = [
    'server.js',
    'package.json',
    'render.yaml',
    'env.example'
];

console.log('📋 Verificando arquivos essenciais...');
let todosArquivosExistem = true;

arquivosEssenciais.forEach(arquivo => {
    if (fs.existsSync(arquivo)) {
        console.log(`✅ ${arquivo}`);
    } else {
        console.log(`❌ ${arquivo} - FALTANDO`);
        todosArquivosExistem = false;
    }
});

if (!todosArquivosExistem) {
    console.error('\n❌ Alguns arquivos essenciais estão faltando!');
    process.exit(1);
}

console.log('\n✅ Todos os arquivos essenciais encontrados!');

// Verificar dependências
console.log('\n📦 Verificando dependências...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const dependenciasObrigatorias = [
    'express',
    'sqlite3',
    'cors',
    'helmet',
    'express-rate-limit',
    'express-slow-down',
    'bcryptjs',
    'express-validator',
    'nodemailer'
];

let todasDependenciasExistem = true;

dependenciasObrigatorias.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`✅ ${dep}`);
    } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
        console.log(`✅ ${dep} (dev)`);
    } else {
        console.log(`❌ ${dep} - FALTANDO`);
        todasDependenciasExistem = false;
    }
});

if (!todasDependenciasExistem) {
    console.error('\n❌ Algumas dependências estão faltando!');
    console.log('Execute: npm install');
    process.exit(1);
}

console.log('\n✅ Todas as dependências estão instaladas!');

// Verificar scripts
console.log('\n🔧 Verificando scripts...');
if (packageJson.scripts && packageJson.scripts.start) {
    console.log('✅ Script start configurado');
} else {
    console.log('❌ Script start não encontrado');
    console.log('Adicione em package.json: "start": "node server.js"');
}

// Verificar estrutura de pastas
console.log('\n📁 Verificando estrutura de pastas...');
const pastasObrigatorias = [
    'routes',
    'models',
    'database',
    'middleware',
    'utils',
    'public'
];

pastasObrigatorias.forEach(pasta => {
    if (fs.existsSync(pasta)) {
        console.log(`✅ ${pasta}/`);
    } else {
        console.log(`❌ ${pasta}/ - FALTANDO`);
    }
});

// Gerar chaves de segurança
console.log('\n🔐 Gerando chaves de segurança...');
const crypto = require('crypto');

const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(64).toString('hex');
const encryptionKey = crypto.randomBytes(32).toString('hex');
const signatureKey = crypto.randomBytes(32).toString('hex');

console.log('✅ Chaves geradas com sucesso!');

// Criar arquivo .env.production
console.log('\n📝 Criando arquivo .env.production...');
const envContent = `# Configurações de Produção - RatixPay
NODE_ENV=production
PORT=10000

# Segurança
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}
ENCRYPTION_KEY=${encryptionKey}
SIGNATURE_KEY=${signatureKey}

# Email (Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail
ADMIN_EMAIL=admin@seudominio.com

# PagaMoz
PAGAMOZ_SECRET_KEY=sua_chave_secreta_aqui
PAGAMOZ_WALLET_ID=seu_wallet_id_aqui
PAGAMOZ_BASE_URL=https://opay.mucamba.site/api/v1

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
`;

fs.writeFileSync('.env.production', envContent);
console.log('✅ Arquivo .env.production criado!');

// Instruções finais
console.log('\n🎉 PROJETO PRONTO PARA DEPLOY!');
console.log('===============================\n');

console.log('📋 PRÓXIMOS PASSOS:');
console.log('1. Faça upload do código para GitHub');
console.log('2. Crie conta no Render.com');
console.log('3. Conecte com GitHub e faça deploy');
console.log('4. Configure as variáveis de ambiente no Render');
console.log('5. Configure DNS no Hostinger');
console.log('6. Teste tudo funcionando\n');

console.log('🔗 LINKS ÚTEIS:');
console.log('- Render: https://render.com');
console.log('- Hostinger: https://hostinger.com');
console.log('- GitHub: https://github.com\n');

console.log('📖 DOCUMENTAÇÃO:');
console.log('- Deploy Simples: DEPLOY_SIMPLES.md');
console.log('- Guia Render Gratuito: RENDER_FREE_GUIDE.md');
console.log('- Guia de Segurança: SECURITY_GUIDE.md\n');

console.log('🔐 CHAVES DE SEGURANÇA GERADAS:');
console.log('Copie estas chaves para as variáveis de ambiente no Render:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`SIGNATURE_KEY=${signatureKey}\n`);

console.log('⚠️  IMPORTANTE:');
console.log('- Nunca compartilhe as chaves de segurança');
console.log('- Configure todas as variáveis de ambiente no Render');
console.log('- Teste todos os endpoints após o deploy');
console.log('- Configure monitoramento de uptime\n');

console.log('🚀 BOA SORTE COM O DEPLOY!'); 