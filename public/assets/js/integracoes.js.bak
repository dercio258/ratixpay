// Carregar produtos disponíveis para vincular ao pixel
async function carregarProdutos() {
    const select = document.getElementById('produto');
    select.innerHTML = '<option value="">Selecione um produto</option>';
    try {
        const resp = await fetch('/api/produtos?limite=100');
        const data = await resp.json();
        if (data.produtos) {
            data.produtos.forEach(produto => {
                const opt = document.createElement('option');
                opt.value = produto.id;
                opt.textContent = produto.customId ? `${produto.customId} - ${produto.nome}` : produto.nome;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        select.innerHTML = '<option value="">Erro ao carregar produtos</option>';
    }
}

// Mock para integrações (substituir por API real depois)
let integracoes = JSON.parse(localStorage.getItem('integracoes') || '[]');

function salvarIntegracoes() {
    localStorage.setItem('integracoes', JSON.stringify(integracoes));
}

function renderizarIntegracoes() {
    const list = document.getElementById('integrations-list');
    if (!integracoes.length) {
        list.innerHTML = '<p>Nenhuma integração cadastrada.</p>';
        return;
    }
    list.innerHTML = integracoes.map((i, idx) => `
        <div class="integration-card">
            <div><b>ID Pixel:</b> ${i.pixelId}</div>
            <div><b>Produto:</b> ${i.produtoCustomId ? i.produtoCustomId + ' - ' : ''}${i.produtoNome}</div>
            <div><b>Eventos:</b> ${i.eventos.join(', ')}</div>
            <button class="btn btn-danger" onclick="removerIntegracao(${idx})">Remover</button>
        </div>
    `).join('');
}

function removerIntegracao(idx) {
    if (confirm('Deseja remover esta integração?')) {
        integracoes.splice(idx, 1);
        salvarIntegracoes();
        renderizarIntegracoes();
    }
}

// Submissão do formulário
const form = document.getElementById('form-integracao');
form.addEventListener('submit', function(e) {
    e.preventDefault();
    const pixelId = form.pixelId.value.trim();
    const produtoId = form.produto.value;
    const produtoNome = form.produto.options[form.produto.selectedIndex].text;
    const eventos = Array.from(form.querySelectorAll('input[name="eventos"]:checked')).map(cb => cb.value);
    if (!pixelId || !produtoId || !eventos.length) {
        alert('Preencha todos os campos e selecione ao menos um evento.');
        return;
    }
    integracoes.push({ pixelId, produtoId, produtoNome, eventos });
    salvarIntegracoes();
    renderizarIntegracoes();
    form.reset();
});

// Inicialização
carregarProdutos();
renderizarIntegracoes(); 