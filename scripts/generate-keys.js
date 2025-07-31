const crypto = require('crypto');

function gerarChaves() {
    console.log('🔐 Gerando chaves de segurança para produção...\n');
    
    // Gerar JWT Secret
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    console.log('JWT_SECRET=' + jwtSecret);
    
    // Gerar Session Secret
    const sessionSecret = crypto.randomBytes(64).toString('hex');
    console.log('SESSION_SECRET=' + sessionSecret);
    
    // Gerar Encryption Key
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    console.log('ENCRYPTION_KEY=' + encryptionKey);
    
    // Gerar Signature Key
    const signatureKey = crypto.randomBytes(32).toString('hex');
    console.log('SIGNATURE_KEY=' + signatureKey);
    
    console.log('\n📋 Copie essas chaves para o arquivo .env ou variáveis de ambiente do Render');
    console.log('⚠️  IMPORTANTE: Nunca compartilhe essas chaves!');
    
    // Gerar arquivo .env.example com as chaves
    const envContent = `# Configurações do Servidor
PORT=10000
NODE_ENV=production

# Configurações de Segurança
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}
ENCRYPTION_KEY=${encryptionKey}
SIGNATURE_KEY=${signatureKey}

# Configurações de Email (Gmail)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail
ADMIN_EMAIL=admin@seudominio.com

# Configurações da API Paga Moz Moçambique
PAGAMOZ_SECRET_KEY=sua_chave_secreta_aqui
PAGAMOZ_WALLET_ID=seu_wallet_id_aqui
PAGAMOZ_BASE_URL=https://opay.mucamba.site/api/v1

# Configurações de Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
`;

    const fs = require('fs');
    fs.writeFileSync('.env.production', envContent);
    console.log('\n✅ Arquivo .env.production criado com as chaves geradas');
}

if (require.main === module) {
    gerarChaves();
}

module.exports = { gerarChaves }; 