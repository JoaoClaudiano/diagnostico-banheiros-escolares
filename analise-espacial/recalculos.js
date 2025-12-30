/* =========================
   RECÁLCULOS E INDICADORES
========================= */

// camada de zonas e heatmap já estão definidas no mapa.js
// dadosOriginais contém todas as escolas com lat, lng e status

function gerarGrid(bounds, tamanho) {
  const grid = [];
  for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += tamanho) {
    for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += tamanho) {
      grid.push({ bounds: [[lat,lng],[lat+tamanho,lng+tamanho]], peso:0, escolas: [] });
    }
  }
  return grid;
}

// Função principal de recalculo
function recalcularMapa(dados) {
  camadaZonas.clearLayers();
  camadaHeatmap.setLatLngs([]);

  const grid = gerarGrid(map.getBounds(), 0.01);
  let maxPeso = 0;

  dados.forEach(escola => {
    if (!escola.lat || !escola.lng) return;

    // peso baseado no indicador selecionado
    let peso = 0.3;
    if (modoIndicador === 1) peso = escola.status.includes("crítica") ? 1.5 : escola.status.includes("alerta") ? 1.0 : 0.3;
    if (modoIndicador === 2) peso = escola.status.includes("crítica") ? 1.2 : escola.status.includes("alerta") ? 0.8 : 0.3;

    camadaHeatmap.addLatLng([escola.lat, escola.lng, peso]);

    // distribuir escolas na grid
    grid.forEach(c => {
      const [[latMin, lngMin],[latMax, lngMax]] = c.bounds;
      if (escola.lat >= latMin && escola.lat < latMax && escola.lng >= lngMin && escola.lng < lngMax) {
        c.peso += peso;
        c.escolas.push(escola);
        maxPeso = Math.max(maxPeso, c.peso);
      }
    });
  });

  // gerar ranking das top zonas
  const ranking = grid
    .filter(c => c.peso > 0)
    .sort((a,b) => b.peso - a.peso)
    .slice(0,5);

  const lista = document.getElementById("listaRanking");
  lista.innerHTML = "";

  ranking.forEach((c, i) => {
    const indice = Math.round((c.peso / maxPeso) * 100);
    lista.innerHTML += `<li>Zona ${i+1} — Índice Territorial: ${indice}</li>`;

    L.rectangle(c.bounds, {
      color: "#de2d26",
      fillOpacity: 0.4,
      weight: 1
    }).addTo(camadaZonas);
  });

  return grid;
}

/* =========================
   INDICADORES INTERNOS
========================= */

function calcularIndicadores(grid) {
  return grid.map(c => {
    const totalEscolas = c.escolas.length;
    const criticas = c.escolas.filter(e => e.status.includes("crítica")).length;
    const alertas = c.escolas.filter(e => e.status.includes("alerta")).length;

    // ISS: índice de severidade sanitária
    const ISS = totalEscolas ? (criticas * 1.5 + alertas * 1.0) / totalEscolas : 0;

    // ISU: índice de saturação urbana (exemplo de indicador interno)
    const ISU = totalEscolas ? criticas / totalEscolas : 0;

    return {
      bounds: c.bounds,
      totalEscolas,
      criticas,
      alertas,
      ISS,
      ISU
    };
  });
}

/* =========================
   SIMULAÇÃO DE IMPACTO
========================= */

function simularFechamento(escolaCritica) {
  // reduz o peso e recalcula ranking se uma escola crítica fosse fechada
  const dadosSimulados = dadosOriginais.map(e => {
    if (e.id === escolaCritica.id) {
      return { ...e, status: "fechada" };
    }
    return e;
  });

  return recalcularMapa(dadosSimulados);
}