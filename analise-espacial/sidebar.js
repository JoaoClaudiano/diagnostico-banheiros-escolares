/* =====================
   SIDEBAR – EXPLICAÇÃO METODOLÓGICA
===================== */

const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("sidebar-toggle");
const closeBtn = document.getElementById("sidebar-close");
const frame = document.getElementById("sidebar-frame");

/**
 * Abre o sidebar e carrega o indicador
 * @param {string} indicador - Caminho relativo do indicador (ex: "./pareto/index.html")
 */
function abrirSidebar(indicador) {
  if (indicador) frame.src = indicador;
  sidebar.classList.remove("hidden");
}

/**
 * Fecha o sidebar e limpa o conteúdo do iframe
 */
function fecharSidebar() {
  sidebar.classList.add("hidden");
  frame.src = "";
}

/* =====================
   EVENTOS DE INTERAÇÃO
===================== */

// Botão toggle no header (ℹ️)
toggle.addEventListener("click", () => {
  // Por padrão, abre o Pareto (pode ser alterado dinamicamente)
  abrirSidebar("./pareto/index.html");
});

// Botão de fechar dentro do sidebar
closeBtn.addEventListener("click", fecharSidebar);

// Fechar sidebar ao clicar fora (opcional, melhora UX)
sidebar.addEventListener("click", (e) => {
  if (e.target === sidebar) fecharSidebar();
});

/* =====================
   FUNÇÃO PARA INDICADORES DINÂMICOS
===================== */

/**
 * Função utilitária para abrir qualquer indicador
 * Exemplo:
 * abrirIndicador("./densidade/index.html")
 */
function abrirIndicador(caminho) {
  abrirSidebar(caminho);
}