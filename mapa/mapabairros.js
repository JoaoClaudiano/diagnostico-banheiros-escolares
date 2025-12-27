let camadaBairros = null;

const toggleBairros = document.getElementById("toggleBairros");

/* ===============================
   Checkbox
================================ */
toggleBairros.addEventListener("change", e => {
  if (e.target.checked) {
    tentarAtivarBairros();
  } else {
    removerLeituraPorBairros();
  }
});

/* ===============================
   Espera avaliações
================================ */
function tentarAtivarBairros() {
  if (!window.avaliacoesGlobais || window.avaliacoesGlobais.length === 0) {
    console.warn("Avaliações ainda não carregadas. Aguardando…");
    toggleBairros.checked = false;

    window.addEventListener(
      "avaliacoesCarregadas",
      () => {
        toggleBairros.checked = true;
        ativarLeituraPorBairros();
      },
      { once: true }
    );
    return;
  }

  ativarLeituraPorBairros();
}

/* ===============================
   Ativar leitura por bairros
================================ */
async function ativarLeituraPorBairros() {
  if (camadaBairros) return;

  const res = await fetch("./dados/bairros.geojson");
  const geojson = await res.json();

  camadaBairros = L.geoJSON(geojson, {
    style: feature => {
      const dados = calcularIndicadores(feature);
      return {
        color: "#333",
        weight: 1,
        fillOpacity: dados.total === 0 ? 0 : 0.6,
        fillColor: dados.cor
      };
    },
    onEachFeature: (feature, layer) => {
      const d = calcularIndicadores(feature);
      layer.bindTooltip(`
        <strong>${feature.properties.nome}</strong><br>
        Avaliações: ${d.total}<br>
        Crítico: ${d.critico}<br>
        Atenção: ${d.atencao}<br>
        Alerta: ${d.alerta}<br>
        Adequado: ${d.adequado}
      `);
    }
  }).addTo(map);
}

/* ===============================
   Remover
================================ */
function removerLeituraPorBairros() {
  if (camadaBairros) {
    map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

/* ===============================
   Cálculo por bairro
================================ */
function calcularIndicadores(feature) {
  const pts = window.avaliacoesGlobais.filter(a =>
    turf.booleanPointInPolygon(
      turf.point([a.lng, a.lat]),
      feature
    )
  );

  let dados = {
    total: pts.length,
    adequado: 0,
    alerta: 0,
    atencao: 0,
    critico: 0,
    cor: "transparent"
  };

  pts.forEach(p => {
    const c = p.classe.toLowerCase();
    if (c.includes("adequado")) dados.adequado++;
    else if (c.includes("alerta")) dados.alerta++;
    else if (c.includes("atenção") || c.includes("atencao")) dados.atencao++;
    else if (c.includes("crit")) dados.critico++;
  });

  if (dados.critico > 0) dados.cor = "#F44336";
  else if (dados.atencao > 0) dados.cor = "#FF9800";
  else if (dados.alerta > 0) dados.cor = "#FFD700";
  else if (dados.adequado > 0) dados.cor = "#4CAF50";

  return dados;
}