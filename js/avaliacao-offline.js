// ===================== ID CHECKINFRA =====================
function gerarIdCheckInfra() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CI-${ano}-${mes}-${dia}-${random}`;
}

// ===================== STORAGE OFFLINE =====================
const STORAGE_KEY = "checkinfra_avaliacoes_pendentes";

function salvarOffline(dados) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  lista.push(dados);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function carregarOffline() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function limparOffline() {
  localStorage.removeItem(STORAGE_KEY);
}

// ===================== SINCRONIZAÇÃO =====================
async function sincronizarAvaliacoes() {
  if (!navigator.onLine || !window.salvarAvaliacao) return;

  const pendentes = carregarOffline();
  if (pendentes.length === 0) return;

  console.log("🔄 Sincronizando avaliações offline:", pendentes.length);

  for (const avaliacao of pendentes) {
    try {
      await window.salvarAvaliacao(avaliacao);
    } catch (e) {
      console.error("Erro ao sincronizar", avaliacao.id);
      return; // para tudo se falhar
    }
  }

  limparOffline();
  console.log("✅ Sincronização concluída");
}

// ===================== UI OFFLINE =====================
function atualizarStatusOffline() {
  const card = document.getElementById("offlineCard");
  if (!card) return;

  card.style.display = navigator.onLine ? "none" : "block";
}

// ===================== EVENTOS =====================
window.addEventListener("online", () => {
  atualizarStatusOffline();
  sincronizarAvaliacoes();
});

window.addEventListener("offline", atualizarStatusOffline);

// ===================== FORM =====================
document.addEventListener("DOMContentLoaded", () => {

  atualizarStatusOffline();
  sincronizarAvaliacoes();

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  if (!form || !resultado) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    if (!escola || !avaliador) {
      alert("Preencha escola e avaliador");
      return;
    }

    const avaliacaoId = gerarIdCheckInfra();

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

    const dados = {
      id: avaliacaoId,
      escola,
      avaliador,
      pontuacao: score,
      status,
      problemas,
      createdAt: new Date().toISOString()
    };

    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Código:</strong> ${avaliacaoId}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${score}<br>
      ${navigator.onLine ? "☁️ Enviado" : "📴 Salvo offline"}
    `;

    if (navigator.onLine && window.salvarAvaliacao) {
      try {
        await window.salvarAvaliacao(dados);
      } catch {
        salvarOffline(dados);
      }
    } else {
      salvarOffline(dados);
    }

    gerarPDF({
      id: avaliacaoId,
      escola,
      avaliador,
      score,
      status,
      problemas
    });

    form.reset();
  });

});

// ===================== PDF =====================
function gerarPDF(dados) {
  if (!window.jspdf) {
    alert("jsPDF não carregado");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);

  pdf.setFontSize(11);
  pdf.text(`Código: ${dados.id}`, 20, 35);
  pdf.text(`Escola: ${dados.escola}`, 20, 45);
  pdf.text(`Avaliador: ${dados.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${dados.score}`, 20, 65);
  pdf.text(`Status: ${dados.status}`, 20, 75);
  pdf.text(`Data: ${new Date().toLocaleString()}`, 20, 85);

  if (dados.problemas?.length) {
    pdf.text("Problemas identificados:", 20, 100);
    dados.problemas.forEach((p, i) => {
      pdf.text(`- ${p}`, 24, 110 + i * 8);
    });
  }

  pdf.save(`CheckInfra_${dados.id}.pdf`);
}
