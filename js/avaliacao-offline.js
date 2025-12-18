const STORAGE_KEY = "checkinfra_pendentes";

// ===== OFFLINE STORAGE =====
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

// ===== SINCRONIZAÇÃO =====
async function sincronizar() {
  if (!navigator.onLine || !window.salvarAvaliacao) return;

  const pendentes = carregarOffline();
  if (!pendentes.length) return;

  for (const a of pendentes) {
    await window.salvarAvaliacao(a);
  }

  limparOffline();
}

// ===== UI =====
function atualizarOfflineUI() {
  const card = document.getElementById("offlineCard");
  if (!card) return;
  card.style.display = navigator.onLine ? "none" : "block";
}

// ===== EVENTOS =====
window.addEventListener("online", () => {
  atualizarOfflineUI();
  sincronizar();
});

window.addEventListener("offline", atualizarOfflineUI);

// ===== FORM =====
document.addEventListener("DOMContentLoaded", () => {
  atualizarOfflineUI();
  sincronizar();

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    if (!escola || !avaliador) {
      alert("Preencha escola e avaliador");
      return;
    }

    let pontuacao = 0;
    let problemas = [];

    document.querySelectorAll(".check-card input:checked").forEach(cb => {
      pontuacao += Number(cb.dataset.peso);
      problemas.push(cb.parentElement.innerText.trim());
    });

    let status = "Adequada";
    let classe = "ok";

    if (pontuacao >= 8) {
      status = "Crítica";
      classe = "critico";
    } else if (pontuacao >= 4) {
      status = "Alerta";
      classe = "alerta";
    }

    const dados = {
      id: gerarIdCheckInfra(),
      escola,
      avaliador,
      pontuacao,
      status,
      problemas
    };

    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Código:</strong> ${dados.id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
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

    gerarPDF(dados);
    form.reset();
  });
});
