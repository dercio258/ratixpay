const API_BASE = 'http://localhost:3000/api';

// Função para carregar dados das vendas
async function carregarDadosVendas() {
    try {
        const response = await fetch(`${API_BASE}/vendas/estatisticas`);
        const data = await response.json();
        
        if (data.success) {
            atualizarEstatisticas(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar dados das vendas:', error);
    }
}

// Função para atualizar as estatísticas na tela
function atualizarEstatisticas(data) {
    document.getElementById('totalVendas').textContent = data.totalVendas || 0;
    document.getElementById('vendasAprovadas').textContent = data.vendasAprovadas || 0;
    document.getElementById('vendasPendentes').textContent = data.vendasPendentes || 0;
    document.getElementById('vendasCanceladas').textContent = data.vendasCanceladas || 0;
    document.getElementById('receitaTotal').textContent = data.receitaFormatada || 'MZN 0,00';
    document.getElementById('reembolsos').textContent = data.reembolsosFormatado || 'MZN 0,00';
}

// Função para carregar produtos vendidos
async function carregarProdutosVendidos() {
    try {
        const response = await fetch(`${API_BASE}/vendas/produtos-vendidos`);
        const data = await response.json();
        
        if (data.success) {
            renderizarProdutosVendidos(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar produtos vendidos:', error);
    }
}

// Função para renderizar produtos vendidos
function renderizarProdutosVendidos(produtos) {
    const tbody = document.getElementById('produtosVendidosBody');
    tbody.innerHTML = '';
    
    if (produtos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Nenhum produto vendido encontrado</td></tr>';
        return;
    }
    
    produtos.forEach(produto => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${produto.customId ? produto.customId + ' - ' : ''}${produto.nome}</td>
            <td>${produto.quantidade}</td>
            <td>${produto.valorFormatado || 'MZN 0,00'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Função para carregar clientes
async function carregarClientes() {
    try {
        const response = await fetch(`${API_BASE}/vendas/clientes`);
        const data = await response.json();
        
        if (data.success) {
            renderizarClientes(data.data);
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    }
}

// Função para renderizar clientes
function renderizarClientes(clientes) {
    const tbody = document.getElementById('clientesBody');
    tbody.innerHTML = '';
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhum cliente encontrado</td></tr>';
        return;
    }
    
    clientes.forEach(cliente => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${cliente.nome}</td>
            <td>${cliente.email}</td>
            <td>${cliente.telefone || 'N/A'}</td>
            <td>${cliente.produtoCustomId ? cliente.produtoCustomId + ' - ' : ''}${cliente.produtoPago}</td>
            <td>${cliente.comprasFeitas}</td>
                            <td><span class="status ${(cliente.statusCompra || 'pendente').toLowerCase()}">${cliente.statusCompra || 'Pendente'}</span></td>
            <td>${new Date(cliente.hora).toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(row);
    });
}

// Função para carregar vendas detalhadas
async function carregarVendasDetalhadas() {
    try {
        const response = await fetch(`${API_BASE}/vendas?limite=50`);
        const data = await response.json();
        if (data.vendas) {
            renderizarVendasDetalhadas(data.vendas);
        }
    } catch (error) {
        console.error('Erro ao carregar vendas detalhadas:', error);
    }
}

// Função para popular selects de filtro com opções únicas
function popularFiltrosDetalhados(vendas) {
    const selectProduto = document.getElementById('filtroProduto');
    const selectCliente = document.getElementById('filtroCliente');
    const selectEmail = document.getElementById('filtroEmail');
    if (!selectProduto || !selectCliente || !selectEmail) return;
    // Limpar opções antigas
    selectProduto.innerHTML = '<option value="">Produto</option>';
    selectCliente.innerHTML = '<option value="">Cliente</option>';
    selectEmail.innerHTML = '<option value="">Email</option>';
    const produtosSet = new Set();
    const clientesSet = new Set();
    const emailsSet = new Set();
    vendas.forEach(venda => {
        let produtoNome = '-';
        if (venda.produto && typeof venda.produto === 'object') {
            produtoNome = venda.produto.nome || venda.produto.id || venda.produto;
        } else if (venda.produto) {
            produtoNome = venda.produto;
        }
        produtosSet.add(produtoNome);
        if (venda.cliente?.nome) clientesSet.add(venda.cliente.nome);
        if (venda.cliente?.email) emailsSet.add(venda.cliente.email);
    });
    Array.from(produtosSet).sort().forEach(produto => {
        const opt = document.createElement('option');
        opt.value = produto;
        opt.textContent = produto;
        selectProduto.appendChild(opt);
    });
    Array.from(clientesSet).sort().forEach(cliente => {
        const opt = document.createElement('option');
        opt.value = cliente;
        opt.textContent = cliente;
        selectCliente.appendChild(opt);
    });
    Array.from(emailsSet).sort().forEach(email => {
        const opt = document.createElement('option');
        opt.value = email;
        opt.textContent = email;
        selectEmail.appendChild(opt);
    });
}

// Função para renderizar vendas detalhadas
function renderizarVendasDetalhadas(vendas) {
    const tbody = document.getElementById('vendasDetalhadasBody');
    tbody.innerHTML = '';
    if (!vendas.length) {
        tbody.innerHTML = '<tr><td colspan="7">Nenhuma venda encontrada</td></tr>';
        return;
    }
    popularFiltrosDetalhados(vendas);
    vendas.forEach(venda => {
        let produtoId = '-';
        let produtoNome = '-';
        if (venda.produto && typeof venda.produto === 'object') {
            produtoId = venda.produto.id || venda.produto._id || venda.produto;
            produtoNome = venda.produto.nome || '-';
        } else if (venda.produto) {
            produtoId = venda.produto;
        }
        const clienteNome = venda.cliente?.nome || '-';
        const clienteEmail = venda.cliente?.email || '-';
        const clienteTelefone = venda.cliente?.telefone || '-';
        const status = venda.pagamento?.status || venda.status || '-';
        const valorFinal = venda.pagamento?.valorFormatado || (venda.pagamento?.valor ? `MZN ${Number(venda.pagamento.valor).toFixed(2)}` : '-');
        const dataHora = venda.dataVenda ? new Date(venda.dataVenda).toLocaleString('pt-BR') : '-';
        const transacaoId = venda.pagamento?.transacaoId || '-';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span title="${produtoId}">${produtoNome !== '-' ? produtoNome + ' (' + produtoId + ')' : produtoId}</span></td>
            <td>${clienteNome}</td>
            <td>${clienteEmail}</td>
            <td>${clienteTelefone}</td>
                            <td><span class="status ${(status || 'pendente').toLowerCase()}">${status || 'Pendente'}</span></td>
            <td>${valorFinal}</td>
            <td>${dataHora}</td>
            <td>${transacaoId}</td>
        `;
        tbody.appendChild(row);
    });
}

// Função para filtrar vendas detalhadas
function filtrarVendasDetalhadas() {
    const filtroProduto = document.getElementById('filtroProduto').value.toLowerCase();
    const filtroCliente = document.getElementById('filtroCliente').value.toLowerCase();
    const filtroEmail = document.getElementById('filtroEmail').value.toLowerCase();
    const filtroStatus = document.getElementById('filtroStatus').value.toLowerCase();
    const filtroDataHora = document.getElementById('filtroDataHora').value;
    const rows = document.querySelectorAll('#vendasDetalhadasBody tr');
    rows.forEach(row => {
        const [produto, cliente, email, status, dataHora] = Array.from(row.children).map(td => td.textContent.toLowerCase());
        let dataOk = true;
        if (filtroDataHora) {
            // dataHora está no formato dd/mm/yyyy hh:mm:ss
            const dataVenda = row.children[4].textContent.split(' ')[0];
            const [dia, mes, ano] = dataVenda.split('/');
            const dataVendaISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
            dataOk = filtroDataHora === dataVendaISO;
        }
        if (
            (filtroProduto === '' || produto.includes(filtroProduto)) &&
            (filtroCliente === '' || cliente.includes(filtroCliente)) &&
            (filtroEmail === '' || email.includes(filtroEmail)) &&
            (filtroStatus === '' || status.includes(filtroStatus)) &&
            dataOk
        ) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Função para filtrar dados
function aplicarFiltros() {
    const periodo = document.getElementById('periodo').value;
    const status = document.getElementById('status').value;
    
    // Recarregar dados com filtros
    carregarDadosVendas();
    carregarProdutosVendidos();
    carregarClientes();
}

// Função para pesquisar clientes
function pesquisarClientes() {
    const searchTerm = document.getElementById('searchClientes').value.toLowerCase();
    const rows = document.querySelectorAll('#clientesBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    carregarDadosVendas();
    carregarProdutosVendidos();
    carregarClientes();
    carregarVendasDetalhadas();
    
    // Filtros
    document.getElementById('periodo').addEventListener('change', aplicarFiltros);
    document.getElementById('status').addEventListener('change', aplicarFiltros);
    
    // Pesquisa de clientes
    document.getElementById('searchClientes').addEventListener('input', pesquisarClientes);
    [
        'filtroProduto',
        'filtroCliente',
        'filtroEmail',
        'filtroStatus',
        'filtroDataHora'
    ].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', filtrarVendasDetalhadas);
    });
    const btnLupa = document.getElementById('btnLupaFiltroDetalhado');
    if (btnLupa) btnLupa.addEventListener('click', filtrarVendasDetalhadas);
});

