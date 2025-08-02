// Injeta dinamicamente o Facebook Pixel e dispara eventos conforme integrações cadastradas
(function() {
    // Recupera integrações do localStorage
    let integracoes = [];
    try {
        integracoes = JSON.parse(localStorage.getItem('integracoes') || '[]');
    } catch (e) {}
    if (!integracoes.length) return;

    // Injeta o script do Facebook Pixel para cada pixelId único
    const pixelIds = [...new Set(integracoes.map(i => i.pixelId))];
    pixelIds.forEach(pixelId => {
        if (!window.fbq) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
        }
        fbq('init', pixelId);
    });
    // Sempre dispara PageView
    if (window.fbq) fbq('track', 'PageView');

    // Dispara eventos conforme configuração
    // Exemplo: na página de sucesso, dispara Purchase
    const path = window.location.pathname;
    integracoes.forEach(integ => {
        // Evento de compra (Purchase) na página de sucesso
        if (integ.eventos.includes('compra') && path.includes('sucesso')) {
            // Você pode customizar os dados abaixo conforme sua lógica
            fbq('track', 'Purchase', {
                value: 0, // Substitua pelo valor real se disponível
                currency: 'MZN',
                content_name: integ.produtoNome,
                content_ids: [integ.produtoId]
            });
        }
        // Evento de visualização
        if (integ.eventos.includes('visualizacao')) {
            fbq('track', 'ViewContent', {
                content_name: integ.produtoNome,
                content_ids: [integ.produtoId]
            });
        }
        // Evento de adição ao carrinho
        if (integ.eventos.includes('carrinho') && path.includes('checkout')) {
            fbq('track', 'AddToCart', {
                content_name: integ.produtoNome,
                content_ids: [integ.produtoId]
            });
        }
        // Evento de início de pagamento
        if (integ.eventos.includes('pagamento') && path.includes('checkout')) {
            fbq('track', 'InitiateCheckout', {
                content_name: integ.produtoNome,
                content_ids: [integ.produtoId]
            });
        }
    });
})(); 