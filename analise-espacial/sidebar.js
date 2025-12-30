const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");

// Emojis para cada indicador
const emojis = {
    'pareto': '📊',
    'densidade-critica': '📍',
    'concentracao-relativa': '📈',
    'zonas-prioritarias': '🟥',
    'kde': '🔥',
    'gini': '⚖️',
    'lq': '📈',
    'moran': '🔗'
};

// Função para carregar indicador no iframe
function carregarIndicador(indicador) {
    console.log(`Carregando indicador: ${indicador}`);
    
    const iframe = document.createElement('iframe');
    iframe.src = `indicadores/${indicador}/index.html`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    
    // Limpa o conteúdo anterior e adiciona o iframe
    sidebarContent.innerHTML = '';
    sidebarContent.appendChild(iframe);
    
    // Adiciona tratamento de erro
    iframe.onload = function() {
        console.log(`Indicador ${indicador} carregado com sucesso`);
    };
    
    iframe.onerror = function() {
        sidebarContent.innerHTML = `
            <div style="padding: 20px; color: #666; text-align: center;">
                <h3>${emojis[indicador] || '📄'} ${formatarNomeIndicador(indicador)}</h3>
                <p>O arquivo <strong>indicadores/${indicador}/index.html</strong> não foi encontrado.</p>
                <p>Crie o arquivo HTML ou verifique o caminho.</p>
            </div>
        `;
    };
}

// Função para formatar o nome do indicador
function formatarNomeIndicador(indicador) {
    const nomes = {
        'pareto': 'Análise de Pareto',
        'densidade-critica': 'Densidade Crítica',
        'concentracao-relativa': 'Concentração Relativa',
        'zonas-prioritarias': 'Zonas Prioritárias',
        'kde': 'Kernel Density Estimation (KDE)',
        'gini': 'Coeficiente de Gini Espacial',
        'lq': 'Location Quotient (LQ)',
        'moran': 'Índice de Moran'
    };
    return nomes[indicador] || indicador;
}

// Eventos do sidebar
btnSidebar.onclick = () => sidebar.classList.add("visible");
closeSidebar.onclick = () => sidebar.classList.remove("visible");

// Eventos dos itens do menu
menuItems.forEach(item => {
    item.addEventListener("click", () => {
        menuItems.forEach(i => i.classList.remove("ativa"));
        item.classList.add("ativa");

        const indicador = item.getAttribute("data-indicador");
        carregarIndicador(indicador);
    });
});

// Carregar por padrão o primeiro indicador ativo
const ativo = document.querySelector("#sidebar-menu li.ativa");
if (ativo) {
    const indicador = ativo.getAttribute("data-indicador");
    carregarIndicador(indicador);
} else if (menuItems.length > 0) {
    // Se não houver nenhum ativo, ativa o primeiro
    menuItems[0].classList.add("ativa");
    const indicador = menuItems[0].getAttribute("data-indicador");
    carregarIndicador(indicador);
}

// Exportar funções se necessário (para uso em outros scripts)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { carregarIndicador, formatarNomeIndicador };
}