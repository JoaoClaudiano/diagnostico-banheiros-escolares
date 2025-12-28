/**
 * mapabairros.js
 * Sistema de Inteligência Territorial - CheckInfra (versão revisada)
 */

function iniciarModuloBairros() {
  const map = window._checkinfraMap;
  if (!map) return;

  const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
  let camadaGeoBairros = null;

  // Cache de escolas apenas para presença no bairro (geojson)
  const cacheEscolasBairro = new Map();

  function precalcularEscolas() {
    if(!camadaGeoBairros || !document.getElementById("toggleBairros").checked) return;
    const avaliacoes = window.avaliacoes || [];

    camadaGeoBairros.eachLayer(layer => {
      const feature = layer.feature;

      // Obter escolas dentro do bairro (cache de geometria)
      let escolasNoBairro = cacheEscolasBairro.get(feature.properties.nome);
      if(!escolasNoBairro) {
        escolasNoBairro = avaliacoes.filter(a => {
          const pt = turf.point([a.lng, a.lat]);
          return turf.booleanPointInPolygon(pt, feature.geometry);
        });
        cacheEscolasBairro.set(feature.properties.nome, escolasNoBairro);
      }

      // Aplicar filtros do painel
      const escolasFiltradas = escolasNoBairro.filter(a => {
        const s = a.classe;
        const checkEl = document.getElementById(
          s === "ok" ? "fAdequado" :
          s === "alerta" ? "fAlerta" :
          s === "atenção" ? "fAtencao" : "fCritico"
        );
        return checkEl ? checkEl.checked : true;
      });

      const cont = { ok:0, alerta:0, atenção:0, critico:0 };
      escolasFiltradas.forEach(e => { if(cont[e.classe] !== undefined) cont[e.classe]++; });

      const total = escolasFiltradas.length;
      const perc = k => total ? Math.round((cont[k]/total)*100) : 0;

      // Determinar classe dominante
      let classeDominante = "ok";
      if(perc("critico") >= 50) classeDominante = "critico";
      else if(perc("atenção") >= 50) classeDominante = "atenção";
      else if(perc("alerta") >= 50) classeDominante = "alerta";

      const obs = total === 0 ? "Sem dados disponíveis." :
                  classeDominante === "critico" ? "🔴 Problema generalizado." :
                  classeDominante === "atenção" ? "🟠 Tendência de piora." :
                  "🟢 Situação sob controle.";

      // Atualização visual do polígono
      layer.setStyle({
        fillColor: total > 0 ? cores[classeDominante] : "transparent",
        fillOpacity: total > 0 ? 0.35 : 0,
        opacity: 1,
        weight: 1,
        color: "#666"
      });

      // Popup com X funcional
      const html = document.createElement("div");
      html.style.fontSize = "13px";
      html.style.lineHeight = "1.4";
      html.style.minWidth = "180px";
      html.style.position = "relative";

      // Botão fechar
      const btnClose = document.createElement("button");
      btnClose.textContent = "✖";
      btnClose.style.position = "absolute";
      btnClose.style.top = "2px";
      btnClose.style.right = "2px";
      btnClose.style.border = "none";
      btnClose.style.background = "none";
      btnClose.style.cursor = "pointer";
      btnClose.style.fontWeight = "bold";
      btnClose.onclick = () => map.closePopup();
      html.appendChild(btnClose);

      // Conteúdo do popup
      const titulo = document.createElement("strong");
      titulo.textContent = feature.properties.nome || "Bairro";
      html.appendChild(titulo);

      const infoTotal = document.createElement("div");
      infoTotal.innerHTML = `<small>${total} escolas monitoradas</small><hr style="margin:4px 0">`;
      html.appendChild(infoTotal);

      if(total > 0){
        ["critico","atenção","alerta","ok"].forEach(c => {
          const div = document.createElement("div");
          div.style.display = "flex";
          div.style.alignItems = "center";
          div.style.gap = "6px";
          div.style.marginBottom = "2px";

          const bola = document.createElement("span");
          bola.style.width = "10px";
          bola.style.height = "10px";
          bola.style.borderRadius = "50%";
          bola.style.background = cores[c];
          bola.style.display = "inline-block";

          const txt = document.createElement("span");
          txt.textContent = `${c.charAt(0).toUpperCase()+c.slice(1)}: ${perc(c)}% (${cont[c]})`;

          div.appendChild(bola);
          div.appendChild(txt);
          html.appendChild(div);
        });
      } else {
        const div = document.createElement("div");
        div.textContent = "Nenhuma escola ativa neste setor.";
        html.appendChild(div);
      }

      const obsDiv = document.createElement("div");
      obsDiv.style.marginTop = "6px";
      obsDiv.style.fontSize = "11px";
      obsDiv.style.borderTop = "1px solid #eee";
      obsDiv.style.paddingTop = "4px";
      obsDiv.innerHTML = `<em>${obs}</em>`;
      html.appendChild(obsDiv);

      layer.bindPopup(html, { maxWidth: 250 });
    });
  }

  // Carregar GeoJSON
  fetch('POLIGONAIS.geojson')
    .then(res => { if(!res.ok) throw new Error("Erro ao carregar GeoJSON"); return res.json(); })
    .then(geojson => {
      camadaGeoBairros = L.geoJSON(geojson, {
        style: { color:"#666", weight:1, fillOpacity:0, opacity:0 },
        onEachFeature: (feature, layer) => {
          layer.on('mouseover', () => { if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:2, color:"#000", fillOpacity:0.1 }); });
          layer.on('mouseout', () => { if(document.getElementById("toggleBairros").checked) layer.setStyle({ weight:1, color:"#666", fillOpacity:0.35 }); });
        }
      }).addTo(map);

      if(window.avaliacoes && window.avaliacoes.length > 0){
        precalcularEscolas();
      } else {
        const checkData = setInterval(() => {
          if(window.avaliacoes && window.avaliacoes.length > 0){
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

// Inicialização segura
if(window._checkinfraMap){
  iniciarModuloBairros();
} else {
  const aguardarMapa = setInterval(() => {
    if(window._checkinfraMap){
      iniciarModuloBairros();
      clearInterval(aguardarMapa);
    }
  }, 100);
}