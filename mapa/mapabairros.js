// mapabairros.js

// Referências globais vindas do index.html
const map = window._checkinfraMap;

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const classeMap = { ok:"ok", alerta:"alerta", atencao:"atenção", critico:"critico" };

// Camada principal onde o GeoJSON ficará "vivo"
let camadaGeoBairros = null;

// Carregar GeoJSON dos bairros uma única vez
fetch('POLIGONAIS.geojson')
  .then(res => res.json())
  .then(geojson => {
    camadaGeoBairros = L.geoJSON(geojson, {
      style: { color:"#666", weight:1, fillOpacity:0, opacity: 0 }, // Começa invisível
      onEachFeature: (feature, layer) => {
        layer.on('mouseover', () => {
          if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight: 2, color: "#000" });
        });
        layer.on('mouseout', () => {
          if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight: 1, color: "#666" });
        });
      }
    }).addTo(map);
  });

function atualizarBairros() {
  if(!camadaGeoBairros || !document.getElementById("toggleBairros").checked) return;

  const avaliacoes = window.avaliacoes || [];

  camadaGeoBairros.eachLayer(layer => {
    const feature = layer.feature;
    
    // Filtro de escolas dentro do bairro
    const escolasNoBairro = avaliacoes.filter(a => {
      const s = a.classe; 
      // Verifica se a classe está ativa no painel do index.html
      const checkEl = document.getElementById(s === "ok" ? "fAdequado" : s === "alerta" ? "fAlerta" : s === "atenção" ? "fAtencao" : "fCritico");
      if(checkEl && !checkEl.checked) return false;

      // Correção Turf: Criar objeto Point
      const pt = turf.point([a.lng, a.lat]);
      return turf.booleanPointInPolygon(pt, feature.geometry);
    });

    const cont = { ok:0, alerta:0, atenção:0, critico:0 };
    escolasNoBairro.forEach(e => {
        if(cont[e.classe] !== undefined) cont[e.classe]++;
    });

    const total = escolasNoBairro.length;
    const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

    let classeDominante = "ok";
    if(perc("critico") >= 50) classeDominante = "critico";
    else if(perc("atenção") >= 50) classeDominante = "atenção";
    else if(perc("alerta") >= 50) classeDominante = "alerta";

    const obs = total === 0 ? "Sem dados disponíveis." : 
                classeDominante==="critico" ? "🔴 Problema generalizado." :
                classeDominante==="atenção" ? "🟠 Tendência de piora." :
                "🟢 Situação sob controle.";

    // Aplicar estilo visual
    layer.setStyle({ 
      fillColor: total > 0 ? cores[classeDominante] : "transparent", 
      fillOpacity: total > 0 ? 0.35 : 0,
      opacity: 1 // Torna a borda visível
    });

    // Template do Popup
    const html = `
      <div style="font-size:13px; line-height:1.4; min-width:180px;">
        <strong>${feature.properties.nome || "Bairro"}</strong><br>
        <small>${total} escolas no raio</small>
        <hr style="margin:4px 0">
        ${total > 0 ? ["critico","atenção","alerta","ok"].map(c => `
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="width:10px; height:10px; border-radius:50%; background:${cores[c]}; display:inline-block;"></span>
            <span>${c}: ${perc(c)}% (${cont[c]})</span>
          </div>
        `).join("") : "Nenhuma escola filtrada neste setor."}
        <div style="margin-top:6px; font-size:11px;"><em>${obs}</em></div>
      </div>`;

    layer.bindPopup(html);
  });
}

// Eventos de escuta
document.getElementById("toggleBairros").addEventListener("change", function(){
  if(this.checked) {
    atualizarBairros();
  } else {
    // Esconde a camada sem removê-la para não perder o cache
    if(camadaGeoBairros) camadaGeoBairros.setStyle({ fillOpacity: 0, opacity: 0 });
  }
});

// Reatividade com os filtros do index.html
document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico").forEach(el => {
  el.addEventListener("change", () => {
    if(document.getElementById("toggleBairros").checked) atualizarBairros();
  });
});
