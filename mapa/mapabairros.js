// mapabairros.js

// Referências globais do index
const map = window._checkinfraMap;

// Cores e mapeamento de classes
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const classeMap = { ok:"ok", alerta:"alerta", atencao:"atenção", critico:"critico" };

// Camada GeoJSON
let camadaGeoBairros = null;

// Função de precálculo (atualiza visual e popups)
function precalcularEscolas() {
  if(!camadaGeoBairros || !document.getElementById("toggleBairros").checked) return;
  const avaliacoes = window.avaliacoes || [];

  camadaGeoBairros.eachLayer(layer => {
    const feature = layer.feature;

    // Filtra escolas dentro do bairro e respeitando os filtros do painel
    const escolasNoBairro = avaliacoes.filter(a => {
      const s = a.classe;
      const checkEl = document.getElementById(
        s === "ok" ? "fAdequado" :
        s === "alerta" ? "fAlerta" :
        s === "atenção" ? "fAtencao" :
        "fCritico"
      );
      if(checkEl && !checkEl.checked) return false;

      // Verifica se o ponto está dentro do polígono via Turf.js
      const pt = turf.point([a.lng, a.lat]);
      return turf.booleanPointInPolygon(pt, feature.geometry);
    });

    const cont = { ok:0, alerta:0, atenção:0, critico:0 };
    escolasNoBairro.forEach(e => { if(cont[e.classe] !== undefined) cont[e.classe]++; });

    const total = escolasNoBairro.length;
    const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

    // Determina classe dominante
    let classeDominante = "ok";
    if(perc("critico") >= 50) classeDominante = "critico";
    else if(perc("atenção") >= 50) classeDominante = "atenção";
    else if(perc("alerta") >= 50) classeDominante = "alerta";

    const obs = total === 0 ? "Sem dados disponíveis." :
                classeDominante==="critico" ? "🔴 Problema generalizado." :
                classeDominante==="atenção" ? "🟠 Tendência de piora." :
                "🟢 Situação sob controle.";

    // Estilo visual
    layer.setStyle({
      fillColor: total>0 ? cores[classeDominante] : "transparent",
      fillOpacity: total>0 ? 0.35 : 0,
      opacity: 1
    });

    // Popup com X para fechar
    const html = `
    <div style="font-size:13px; line-height:1.4; min-width:180px; position:relative;">
      <button style="
        position:absolute; top:2px; right:2px; border:none; background:none; cursor:pointer; font-weight:bold;"
        onclick="this.closest('.leaflet-popup-content').parentElement._close()">
        ✖
      </button>
      <strong>${feature.properties.nome || "Bairro"}</strong><br>
      <small>${total} escolas no raio</small>
      <hr style="margin:4px 0">
      ${total>0 ? ["critico","atenção","alerta","ok"].map(c => `
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="width:10px; height:10px; border-radius:50%; background:${cores[c]}; display:inline-block;"></span>
          <span>${c}: ${perc(c)}% (${cont[c]})</span>
        </div>`).join("") : "Nenhuma escola filtrada neste setor."}
      <div style="margin-top:6px; font-size:11px;"><em>${obs}</em></div>
    </div>`;
    layer.bindPopup(html, { maxWidth: 250 });
  });
}

// Carregar GeoJSON dos bairros
fetch('POLIGONAIS.geojson')
  .then(res => res.json())
  .then(geojson => {
    camadaGeoBairros = L.geoJSON(geojson, {
      style: { color:"#666", weight:1, fillOpacity:0, opacity: 0 },
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', () => {
          if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight: 2, color: "#000" });
        });
        layer.on('mouseout', () => {
          if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight: 1, color: "#666" });
        });
      }
    }).addTo(map);

    // Espera as avaliações do index
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
  });

// Atualiza ao alterar checkbox de bairros
document.getElementById("toggleBairros").addEventListener("change", function(){
  if(this.checked) {
    precalcularEscolas();
  } else if(camadaGeoBairros) {
    camadaGeoBairros.setStyle({ fillOpacity:0, opacity:0 });
  }
});

// Reatividade com filtros do painel
document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico").forEach(el => {
  el.addEventListener("change", () => {
    if(document.getElementById("toggleBairros").checked) precalcularEscolas();
  });
});