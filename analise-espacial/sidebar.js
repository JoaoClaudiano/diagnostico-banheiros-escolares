const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const sidebarContent = document.getElementById("sidebar-content");
const menuItems = document.querySelectorAll("#sidebar-menu li");

btnSidebar.addEventListener("click", () => sidebar.classList.add("visible"));
closeSidebar.addEventListener("click", () => sidebar.classList.remove("visible"));

function carregarIndicador(nomeIndicador) {
  sidebarContent.innerHTML = `<iframe src="./indicadores/${nomeIndicador}/index.html" title="${nomeIndicador}"></iframe>`;
}

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");
    const indicador = item.getAttribute("data-indicador");
    carregarIndicador(indicador);
  });
});

window.addEventListener("DOMContentLoaded", () => carregarIndicador("pareto"));