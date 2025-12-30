const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");
const btnVoltar = document.getElementById("btn-voltar");

// Abrir/Fechar Sidebar
btnSidebar.addEventListener("click", () => sidebar.classList.add("visible"));
closeSidebar.addEventListener("click", () => sidebar.classList.remove("visible"));

// Voltar
btnVoltar.addEventListener("click", () => history.back());

// Carregar indicador ao clicar
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    // Marcar ativo
    menuItems.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");

    // Determinar o arquivo HTML do indicador
    const indicador = item.dataset.indicador;
    const caminho = `indicadores/${indicador}/index.html`;
    sidebarContent.innerHTML = `<iframe src="${caminho}"></iframe>`;

    // Fechar sidebar automaticamente em mobile
    if (window.innerWidth <= 480) {
      sidebar.classList.remove("visible");
    }
  });
});

// Carregar inicialmente Pareto
const pareto = document.querySelector('#sidebar-menu li[data-indicador="pareto"]');
if (pareto) pareto.click();