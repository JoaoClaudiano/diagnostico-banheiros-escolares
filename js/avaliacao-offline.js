// ===================== ID CHECKINFRA =====================
function gerarIdCheckInfra() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CI-${ano}-${mes}-${dia}-${rand}`;
}

// ===================== PDF =====================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);

  pdf.setFontSize(11);
  pdf.text(`Código: ${d.id}`, 20, 35);
  pdf.text(`Escola: ${d.escola}`, 20, 45);
  pdf.text(`Avaliador: ${d.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${d.score}`, 20, 65);
  pdf.text(`Status: ${d.status}`, 20, 75);

  pdf.save(`${d.id}.pdf`);
}

// ===================== OFFLINE UI =====================
function atualizarOffline() {
  const card = document.getElementById("offlineCard");
  if (card) card.style.display = navigator.onLine ? "none" : "block";
}

window.addEventListener("online", atualizarOffline);
window.addEventListener("offline", atualizarOffline);

// ===================== INIT =====================
document.addEventListener("DOMContentLoaded", () => {
  atualizarOffline();

  // popula escolas
  const select = document.getElementById("escola");
  if (window.escolas) {
    window.escolas.forEach(e => {
      const o = document.createElement("option");
      o.value = e.nome;
      o.textContent = e.nome;
      select.appendChild(o);
    });
  }

  document.getElementById("form-avaliacao").addEventListener("submit", e => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    let score = 0;
    document.querySelectorAll("input[type=checkbox]:checked").forEach(c => {
      score += Number(c.dataset.peso);
    });

    let status = "Adequada";
    let classe = "ok";
    if (score >= 8) { status = "Crítica"; classe = "critico"; }
    else if (score >= 4) { status = "Alerta"; classe = "alerta"; }

    const dados = {
      id: gerarIdCheckInfra(),
      escola,
      avaliador,
      score,
      status
    };

    gerarPDF(dados);

    const r = document.getElementById("resultado");
    r.className = "resultado " + classe;
    r.style.display = "block";
    r.innerHTML = `
      Código: ${dados.id}<br>
      Status: ${status}<br>
      Pontuação: ${score}<br>
      ${navigator.onLine ? "☁️ Online" : "📴 Offline"}
    `;
  });
});
