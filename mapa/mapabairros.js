let camadaBairros = null;

const checkbox = document.getElementById("toggleBairros");

checkbox.addEventListener("change", () => {
  if (checkbox.checked) ativar();
  else desativar();
});

async function ativar() {
  if (!window.avaliacoes || window.avaliacoes.length === 0) {
    console.warn("Leitura por bairros: avaliações ainda não carregadas");
    return;
  }

  if (camadaBairros) return;

  const resp = await fetch("./POLIGONAIS.geojson");
  const geojson = await resp.json();

  camadaBairros = L.geoJSON(geojson, {
    style: f => estiloBairro(f, window.avaliacoes),
    onEachFeature: (f, l) => {
      l.bindTooltip(tooltipBairro(f, window.avaliacoes), { sticky: true });
    }
  }).addTo(window.map);
}

function desativar() {
  if (camadaBairros) {
    window.map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

/* ================= METODOLOGIA ================= */
function estiloBairro(feature, avaliacoes) {
  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = avaliacoes.filter(a =>
    turf.booleanPointInPolygon([a.lng, a.lat], poly)
  );

  if (escolas.length === 0) {
    return { fillOpacity: 0, color: "#555", weight: 1 };
  }

  const cont = { adequado:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe]++);

  const total = escolas.length;
  let cor = "#4CAF50";

  if (cont.critico / total >= 0.5) cor = "#F44336";
  else if (cont.atenção / total >= 0.5) cor = "#FF9800";
  else if (cont.alerta / total >= 0.5) cor = "#FFD700";

  return { fillColor: cor, fillOpacity: 0.45, color: "#555", weight: 1 };
}

function tooltipBairro(feature, avaliacoes) {
  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = avaliacoes.filter(a =>
    turf.booleanPointInPolygon([a.lng, a.lat], poly)
  );

  if (escolas.length === 0) {
    return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados`;
  }

  const cont = { adequado:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe]++);

  const t = escolas.length;
  const p = k => Math.round((cont[k] / t) * 100);

  let obs = "🟢 Situação controlada";
  if (p("critico") >= 50) obs = "🔴 Problema generalizado – alto risco";
  else if (p("atenção") >= 50) obs = "🟠 Tendência de agravamento";
  else if (p("alerta") >= 50) obs = "🟡 Atenção localizada";

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("adequado")}% adequado (${cont.adequado})<br>
    ${obs}
  `;
}