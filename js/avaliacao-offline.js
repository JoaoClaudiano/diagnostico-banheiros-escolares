document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  if (!form || !resultado) {
    console.error("Formulário ou resultado não encontrados");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    if (!escola || !avaliador) {
      alert("Preencha escola e avaliador");
      return;
    }

    // ===== CALCULA SCORE =====
    let score = 0;
    let problemas = [];

    document.querySelectorAll(".check-card input:checked").forEach(cb => {
      score += Number(cb.dataset.peso || 0);
      problemas.push(cb.parentElement.innerText.trim());
    });

    let status = "Condição adequada";
    let classe = "ok";

    if (score >= 8) {
      status = "Condição crítica";
      classe = "critico";
    } else if (score >= 4) {
      status = "Situação de alerta";
      classe = "alerta";
    }

    // ===== FEEDBACK VISUAL =====
    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${score}
    `;

    // ===== SALVAR ONLINE =====
    try {
      const avaliacaoId = await window.salvarAvaliacao({
        escola,
        avaliador,
        pontuacao: score,
        status,
        problemas
      });

      // guarda ID global
      window.__avaliacaoId = avaliacaoId;

      // ===== GERA PDF COM ID =====
      gerarPDF({
        escola,
        avaliador,
        score,
        status,
        problemas,
        avaliacaoId
      });

    } catch (err) {
      alert("Erro ao salvar avaliação");
      console.error(err);
    }

  });

});


// ===================== PDF =====================
function gerarPDF(dados) {

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  const data = new Date().toLocaleDateString("pt-BR");

  pdf.setFontSize(16);
  pdf.text("CheckInfra – Diagnóstico Sanitário", 14, 20);

  pdf.setFontSize(11);
  pdf.text(`Escola: ${dados.escola}`, 14, 35);
  pdf.text(`Avaliador: ${dados.avaliador}`, 14, 42);
  pdf.text(`Data: ${data}`, 14, 49);
  pdf.text(`Avaliação ID: ${dados.avaliacaoId}`, 14, 56);

  pdf.setFontSize(12);
  pdf.text("Problemas identificados:", 14, 72);

  let y = 82;
  if (dados.problemas.length === 0) {
    pdf.text("Nenhum problema crítico identificado.", 18, y);
  } else {
    dados.problemas.forEach(p => {
      pdf.text("• " + p, 18, y);
      y += 8;
    });
  }

  pdf.setFontSize(12);
  pdf.text(`Pontuação técnica: ${dados.score}`, 14, y + 10);
  pdf.text(`Status: ${dados.status}`, 14, y + 18);

  pdf.save(`checkinfra_${dados.escola}_${dados.avaliacaoId}.pdf`);
}
