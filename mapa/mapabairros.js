let camadaBairros = null;

document.getElementById("toggleBairros").addEventListener("change", e => {
  if (e.target.checked) ativar();
  else desativar();
});

async function ativar() {
  if (!window.avaliacoes || window.avaliacoes.length === 0) {
    console.warn("Aguardando avaliações");
    return;
  }

  if (camadaBairros) return;

  const geo = await fetch("./POLIGONAIS.geojson").then(r => r.json());

  camadaBairros = L.geoJSON(geo, {
    style: f => estiloBairro(f),
    onEachFeature: (f, l) =>
      l.bindTooltip(tooltipBairro(f), { sticky: true })
  }).addTo(window.map);
}

function desativar() {
  if (camadaBairros) {
    map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

function estiloBairro(feature) {
  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = window.avaliacoes.filter(a =>
    turf.booleanPointInPolygon([a.lng, a.lat], poly)
  );

  if (escolas.length === 0) {
    return { fillOpacity: 0, color: "#666", weight: 1 };
  }

  const cont = { adequado:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe]++);

  const t = escolas.length;
  let cor = "#4CAF50";

  if (cont.critico / t >= 0.5) cor = "#F44336";
  else if (cont.atenção / t >= 0.5) cor = "#FF9800";
  else if (cont.alerta / t >= 0.5) cor = "#FFD700";

  return { fillColor: cor, fillOpacity: 0.45, color: "#555", weight: 1 };
}

function tooltipBairro(feature) {
  const poly = turf.polygon(feature.geometry.coordinates);
  const escolas = window.avaliacoes.filter(a =>
    turf.booleanPointInPolygon([a.lng, a.lat], poly)
  );

  if (escolas.length === 0)
    return `<strong>${feature.properties.nome}</strong><br>Sem dados`;

  const cont = { adequado:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => cont[e.classe]++);

  const t = escolas.length;
  const p = k => Math.round((cont[k] / t) * 100);

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% (${cont.critico})<br>
    🟠 ${p("atenção")}% (${cont.atenção})<br>
    🟡 ${p("alerta")}% (${cont.alerta})<br>
    🟢 ${p("adequado")}% (${cont.adequado})
  `;
}