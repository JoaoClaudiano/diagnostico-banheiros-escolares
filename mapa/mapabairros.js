/**
 * mapabairros.js
 * Sistema de Inteligência Territorial - CheckInfra (versão otimizada)
 */

function iniciarModuloBairros() {
  const map = window._checkinfraMap;
  if (!map) return;

  const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
  let camadaGeoBairros = null;

  // Cache de escolas por bairro
  const cacheEscolasBairro = new Map();

  // Função para calcular escolas e atualizar estilo
  function precalcularEscolas() {
    if(!camadaGeoBairros || !document.getElementById("toggleBairros").checked) return;
    const avaliacoes = window.avaliacoes || [];

    camadaGeoBairros.eachLayer(layer => {
      const feature = layer.feature;

      // Se não tiver cache, calcular
      let escolasNoBairro = cacheEscolasBairro.get(feature.properties.nome);
      if(!escolasNoBairro) {
        escolasNoBairro = avaliacoes.filter(a => {
          const pt = turf.point([a.lng, a.lat]);
          return turf.booleanPointInPolygon(pt, feature.geometry);
        });
        cacheEscolasBairro.set(feature.properties.nome, escolasNoBairro);
      }

      // Aplicar filtros do painel
      escolasNoBairro = escolasNoBairro.filter(a => {
        const s = a.classe;
        const checkEl = document.getElementById(
          s === "ok" ? "fAdequado" :
          s === "alerta" ? "fAlerta" :
          s === "atenção" ? "fAtencao" : "fCritico"
        );
        return checkEl ? checkEl.checked : true;
      });

      const cont = { ok:0, alerta:0, atenção:0, critico:0 };
      escolasNoBairro.forEach(e => { if(cont[e.classe] !== undefined) cont[e.classe]++; });

      const total = escolasNoBairro.length;
      const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

      let classeDominante = "ok";
      if(perc("critico") >= 50) classeDominante = "critico";
      else if(perc("atenção") >= 50) classeDominante = "atenção";
      else if(perc("alerta") >= 50) classeDominante = "alerta";

      const obs = total === 0 ? "Sem dados disponíveis." :
                  classeDominante === "critico" ? "🔴 Problema generalizado." :
                  classeDominante === "atenção" ? "🟠 Tendência de piora." :
                  "🟢 Situação sob controle.";

      // Estilo visual
      layer.setStyle({
        fillColor: total > 0 ? cores[classeDominante] : "transparent",
        fillOpacity: total > 0 ? 0.35 : 0,
        opacity: 1,
        weight: 1,
        color: "#666"
      });

      // Popup
      const html = `
        <div style="font-size:13px; line-height:1.4; min-width:180px; position:relative;">
          <button style="position:absolute; top:2px; right:2px; border:none; background:none; cursor:pointer; font-weight:bold;"
            onclick="this.closest('.leaflet-popup-content').parentElement._layer.closePopup()">✖</button>
          <strong>${feature.properties.nome || "Bairro"}</strong><br>
          <small>${total} escolas monitoradas</small>
          <hr style="margin:4px 0">
          ${total > 0 ? ["critico","atenção","alerta","ok"].map(c => `
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
              <span style="width:10px; height:10px; border-radius:50%; background:${cores[c]}; display:inline-block;"></span>
              <span>${c.charAt(0).toUpperCase()+c.slice(1)}: ${perc(c)}% (${cont[c]})</span>
            </div>`).join("") : "Nenhuma escola ativa neste setor."}
          <div style="margin-top:6px; font-size:11px; border-top:1px solid #eee; padding-top:4px;"><em>${obs}</em></div>
        </div>`;
      
      layer.bindPopup(html, { maxWidth: 250 });
    });
  }

  // Carregamento do GeoJSON
  fetch('./mapa/POLIGONAIS.geojson')
    .then(res => { if(!res.ok) throw new Error("Erro ao carregar GeoJSON"); return res.json(); })
    .then(geojson => {
      camadaGeoBairros = L.geoJSON(geojson, {
        style: { color:"#666", weight:1, fillOpacity:0, opacity:0 },
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => {
            if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:2, color:"#000", fillOpacity:0.1 });
          });
          layer.on('mouseout', () => {
            if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:1, color:"#666", fillOpacity:0.35 });
          });
        }
      }).addTo(map);

      // Aguarda dados do Firebase
      if(window.avaliacoes && window.avaliacoes.length > 0) {
        precalcularEscolas();
      } else {
        const checkData = setInterval(() => {
          if(window.avaliacoes && window.avaliacoes.length > 0) {
            precalcularEscolas();
            clearInterval(checkData);
          }
        }, 500);
      }
    })
    .catch(err => console.error("Falha no módulo de bairros:", err));

  // Listeners
  document.getElementById("toggleBairros").addEventListener("change", function(){
    if(this.checked) precalcularEscolas();
    else if(camadaGeoBairros) camadaGeoBairros.setStyle({fillOpacity:0, opacity:0});
  });

  document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico").forEach(el => {
    el.addEventListener("change", () => {
      if(document.getElementById("toggleBairros").checked) precalcularEscolas();
    });
  });
}

// Vigia de inicialização do mapa
if(window._checkinfraMap) {
  iniciarModuloBairros();
} else {
  const aguardarMapa = setInterval(() => {
    if(window._checkinfraMap) {
      iniciarModuloBairros();
      clearInterval(aguardarMapa);
    }
  }, 100);
}