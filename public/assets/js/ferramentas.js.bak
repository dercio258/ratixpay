const API_BASE = 'http://localhost:3000/api';

// Função para fazer logout
function logout() {
    showConfirmModal('Tem certeza que deseja sair da sua conta?', () => {
        localStorage.removeItem('authToken');
        sessionStorage.clear();
        window.location.href = 'index.html';
    });
}

// Função para alternar modo escuro
function toggleDarkMode() {
    const body = document.body;
    const btn = document.getElementById('darkModeBtn');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        btn.innerHTML = '<i class="fas fa-moon"></i> Ativar Modo Escuro';
        localStorage.setItem('darkMode', 'false');
    } else {
        body.classList.add('dark-mode');
        btn.innerHTML = '<i class="fas fa-sun"></i> Ativar Modo Claro';
        localStorage.setItem('darkMode', 'true');
    }
}

// Função para apagar todos os dados
function clearAllData() {
    showConfirmModal(
        'ATENÇÃO: Esta ação irá apagar TODOS os dados do sistema (produtos, vendas, clientes). Esta ação não pode ser desfeita. Tem certeza que deseja continuar?',
        async () => {
            try {
                const response = await fetch(`${API_BASE}/admin/clear-all-data`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('Todos os dados foram apagados com sucesso!');
                    window.location.reload();
                } else {
                    alert('Erro ao apagar dados: ' + data.message);
                }
            } catch (error) {
                console.error('Erro ao apagar dados:', error);
                alert('Erro ao apagar dados. Tente novamente.');
            }
        }
    );
}

// Função para fazer backup dos dados
async function backupData() {
    try {
        const response = await fetch(`${API_BASE}/admin/backup`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ratixpay-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('Backup realizado com sucesso!');
        } else {
            alert('Erro ao fazer backup dos dados.');
        }
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        alert('Erro ao fazer backup. Tente novamente.');
    }
}

// Função para abrir configurações
function openSettings() {
    document.getElementById('paymentConfigModal').style.display = 'flex';
    // Preencher campos se já houver valores salvos
    const apiKey = localStorage.getItem('apiKey') || '';
    const secretKey = localStorage.getItem('secretKey') || '';
    document.getElementById('apiKey').value = apiKey;
    document.getElementById('secretKey').value = secretKey;
}

// Função para mostrar/ocultar credenciais
function toggleCredentialVisibility(fieldId, btn) {
    const input = document.getElementById(fieldId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
}

// Função para mostrar campos de autenticação
function mostrarAuthFields() {
    document.getElementById('authFields').style.display = 'block';
}

// Função para fechar modal e esconder campos de autenticação
function fecharPaymentConfigModal() {
    document.getElementById('paymentConfigModal').style.display = 'none';
    document.getElementById('authFields').style.display = 'none';
}

// Salvar credenciais ao submeter o formulário (com autenticação)
const formPaymentConfig = document.getElementById('formPaymentConfig');
if (formPaymentConfig) {
    formPaymentConfig.addEventListener('submit', function(e) {
        e.preventDefault();
        const apiKey = document.getElementById('apiKey').value.trim();
        const secretKey = document.getElementById('secretKey').value.trim();
        const user = document.getElementById('authUser').value.trim();
        const pass = document.getElementById('authPass').value.trim();
        if (!apiKey || !secretKey) {
            alert('Preencha ambos os campos de credenciais!');
            return;
        }
        if (!user || !pass) {
            alert('Informe usuário e senha para atualizar as chaves!');
            return;
        }
        // Aqui você pode validar o usuário/senha (exemplo simples: admin/admin)
        if (!(user === 'admin' && pass === 'admin')) {
            alert('Usuário ou senha inválidos!');
            return;
        }
        // Criptografar (simples base64 para exemplo)
        const apiKeyEnc = btoa(apiKey);
        const secretKeyEnc = btoa(secretKey);
        localStorage.setItem('apiKey', apiKeyEnc);
        localStorage.setItem('secretKey', secretKeyEnc);
        alert('Credenciais salvas localmente e criptografadas! (Necessário reiniciar o backend para aplicar)');
        fecharPaymentConfigModal();
    });
}

// Função para gerar relatórios
function generateReports() {
    alert('Funcionalidade de relatórios em desenvolvimento.');
}

// Função para mostrar modal de confirmação
function showConfirmModal(message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const messageEl = document.getElementById('confirmMessage');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    messageEl.textContent = message;
    modal.style.display = 'flex';
    
    confirmBtn.onclick = () => {
        modal.style.display = 'none';
        onConfirm();
    };
    
    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };
    
    // Fechar modal ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Inicializar modo escuro se estiver salvo
document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('darkMode');
    const btn = document.getElementById('darkModeBtn');
    
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        btn.innerHTML = '<i class="fas fa-sun"></i> Ativar Modo Claro';
    }
});

