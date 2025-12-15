document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault();

  const escola = document.getElementById("escola").value;
  const avaliador = document.getElementById("avaliador").value;

  if (!escola || !avaliador) {
    alert("Preencha todos os campos");
    return;
  }

  // coleta checklist
  let score = 0;
  let problemas = [];
  document.querySelectorAll("input[type=checkbox]").forEach(cb => {
    if (cb.checked) {
      score += Number(cb.dataset.peso);
      problemas.push(cb.parentElement.textContent.trim());
    }
  });

  let status = "Condição adequada";
  if (score >= 9) status = "Condição crítica";
  else if (score >= 4) status = "Situação de alerta";

  const dados = {
    escola,
    avaliador,
    score,
    status,
    problemas,
    timestamp: new Date().toISOString()
  };

  // salva offline sempre
  await salvarAvaliacaoOffline(dados);

  const r = document.getElementById("resultado");

  if (!navigator.onLine) {
    // 1️⃣ mensagem imediata offline
    r.className = "resultado alerta";
    r.style.display = "block";
    r.innerHTML = "📴 Offline: avaliação salva no dispositivo.";

    // 2️⃣ após 3s, gera diagnóstico + PDF
    setTimeout(() => {
      gerarDiagnostico();
    }, 3000);

  } else {
    // online → fluxo normal
    gerarDiagnostico();
  }
});
