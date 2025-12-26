// mapabairros.js
import * as turf from "https://cdn.jsdelivr.net/npm/@turf/turf@6/turf.min.js";

let camadaBairros = null;

// Substitua este GeoJSON pelos seus bairros
const bairrosGeoJSON = await fetch("./data/bairros.geojson").then(r=>r.json());

function corPorStatus(status) {
  status = (status || "ok").toLowerCase();
  if(status === "critico") return "#F44336";
  if(status === "atenção") return "#FF9800";
  if(status === "alerta") return "#FFD700";
  return "#4CAF50";
}

// Função para ativar a camada de bairros
window.ativarBairros = function() {
  if(camadaBairros) map.removeLayer(camadaBairros);

  camadaBairros = L.geoJSON(bairrosGeoJSON, {
    style: function(feature) {
      // Pegamos os pontos dentro do polígono
      const pontosNoBairro = avaliacoes.filter(d => {
        if(!d.lat || !d.lng) return false;
        const pt = turf.point([d.lng, d.lat]);
        return turf.booleanPointInPolygon(pt, feature);
      });

      if(pontosNoBairro.length === 0) return { color: "transparent", fillOpacity:0 };

      // Definimos a cor pelo pior status presente
      let pior = "ok";
      pontosNoBairro.forEach(p=>{
        const s = (p.classe || "ok").toLowerCase();
        if(s === "critico") pior = "critico";
        else if(s === "atenção" && pior !== "critico") pior = "atenção";
        else if(s === "alerta" && !["critico","atenção"].includes(pior)) pior = "alerta";
      });

      return { color: corPorStatus(pior), weight:2, fillOpacity:0.3, fillColor: corPorStatus(pior) };
    },
    onEachFeature: function(feature, layer) {
      // Tooltip com contagem de escolas por status
      const pontosNoBairro = avaliacoes.filter(d => {
        if(!d.lat || !d.lng) return false;
        const pt = turf.point([d.lng, d.lat]);
        return turf.booleanPointInPolygon(pt, feature);
      });

      const contagem = { ok:0, alerta:0, "atenção":0, critico:0 };
      pontosNoBairro.forEach(d=>{
        const s = (d.classe || "ok").toLowerCase();
        if(contagem[s] !== undefined) contagem[s]++;
      });

      let html = `<strong>${feature.properties.nome}</strong><br>`;
      html += `Adequado: ${contagem.ok} <br>`;
      html += `Alerta: ${contagem.alerta} <br>`;
      html += `Atenção: ${contagem["atenção"]} <br>`;
      html += `Crítico: ${contagem.critico} <br>`;
      layer.bindTooltip(html);
    }
  }).addTo(map);
}

// Função para desativar camada
window.desativarBairros = function() {
  if(camadaBairros) {
    map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}