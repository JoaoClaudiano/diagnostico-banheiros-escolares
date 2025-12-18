// ===================== ID CHECKINFRA (GLOBAL) =====================
window.gerarIdCheckInfra = function () {
  const d = new Date();
  return `CI-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
};

// ===================== PDF (GLOBAL) =====================
window.gerarPDF = function (d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);
  pdf.text(`Código: ${d.id}`, 20, 35);
  pdf.text(`Escola: ${d.escola}`, 20, 45);
  pdf.text(`Avaliador: ${d.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${d.score}`, 20, 65);
  pdf.text(`Status: ${d.status}`, 20, 75);

  pdf.save(`${d.id}.pdf`);
};

// ===================== OFFLINE UI =====================
function atualizarOffline() {
  const card = document.getElementById("offlineCard");
  if (card) card.style.display = navigator.onLine ? "none" : "block";
}

window.addEventListener("online", atualizarOffline);
window.addEventListener("offline", atualizarOffline);

// ===================== FORM =====================
document.addEventListener("DOMContentLoaded", () => {
  atualizarOffline();

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", e => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    const id = window.gerarIdCheckInfra();

    let score = 0;
    let problemas = [];

    document.querySelectorAll("input[type=checkbox]:checked").forEach(c => {
      score += Number(c.dataset.peso);
      problemas.push(c.parentElement.innerText.trim());
    });

    let status = "Condição adequada";
    let classe = "ok";
    if (score >= 8) { status = "Crítica"; classe = "critico"; }
    else if (score >= 4) { status = "Alerta"; classe = "alerta"; }

    window.gerarPDF({ id, escola, avaliador, score, status, problemas });

    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Código:</strong> ${id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${score}
    `;
  });
});
