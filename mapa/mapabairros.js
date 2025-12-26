// mapabairros.js
export async function initMapBairros(map, avaliacoes, checkboxId) {
  let camadaBairros = L.layerGroup();

  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  function estiloBairro(feature) {
    // pegar escolas dentro do polígono
    const escolas = avaliacoes.filter(a => {
      if (!feature.geometry) return false;
      const latlngs = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
      const polygon = L.polygon(latlngs);
      return polygon.getBounds().contains([a.lat, a.lng]);
    });

    if (escolas.length === 0) return { fillOpacity: 0, color: "#555", weight: 1 };

    const cont = { ok:0, alerta:0, atenção:0, critico:0 };
    escolas.forEach(e => {
      const s = (e.classe || "ok").toLowerCase();
      if (s === "ok") cont.ok++;
      else if (s === "alerta") cont.alerta++;
      else if (s === "atenção") cont.atenção++;
      else cont.critico++;
    });

    const total = escolas.length;
    let cor = "#4CAF50"; // verde
    if (cont.critico / total >= 0.5) cor = "#F44336";
    else if (cont.atenção / total >= 0.5) cor = "#FF9800";
    else if (cont.alerta / total >= 0.5) cor = "#FFD700";

    return { fillColor: cor, fillOpacity: 0.45, color: "#555", weight:1 };
  }

  function tooltipBairro(feature) {
    const escolas = avaliacoes.filter(a => {
      if (!feature.geometry) return false;
      const latlngs = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
      const polygon = L.polygon(latlngs);
      return polygon.getBounds().contains([a.lat, a.lng]);
    });

    if (escolas.length === 0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

    const cont = { ok:0, alerta:0, atenção:0, critico:0 };
    escolas.forEach(e => {
      const s = (e.classe || "ok").toLowerCase();
      if (s === "ok") cont.ok++;
      else if (s === "alerta") cont.alerta++;
      else if (s === "atenção") cont.atenção++;
      else cont.critico++;
    });

    const total = escolas.length;
    const p = k => Math.round((cont[k]/total)*100);

    let observacao = "";
    if (p("critico")>=50) observacao = "🔴 Problema generalizado – alto risco de impacto.";
    else if (p("atenção")>=50) observacao = "🟠 Problema localizado, tendência de piora.";
    else if (p("alerta")>=50) observacao = "🟡 Problema pontual, monitoramento recomendado.";
    else observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

    return `
      <strong>${feature.properties.nome}</strong><br>
      🟢 ${p("ok")}% adequado (${cont.ok})<br>
      🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
      🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
      🔴 ${p("critico")}% crítico (${cont.critico})<br>
      Observação: ${observacao}
    `;
  }

  camadaBairros = L.geoJSON(geo, {
    style: estiloBairro,
    onEachFeature: (feature, layer) => layer.bindTooltip(tooltipBairro(feature))
  });

  const checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      camadaBairros.addTo(map);
    } else {
      map.removeLayer(camadaBairros);
    }
  });

  // retorna camada para possível controle externo
  return camadaBairros;
}