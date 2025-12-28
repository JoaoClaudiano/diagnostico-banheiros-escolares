// mapabairros.js

document.addEventListener("DOMContentLoaded", async () => {
  // Checar se mapa e db foram exportados pelo index
  if (!window._checkinfraMap) {
    console.error("Mapa não inicializado! window._checkinfraMap ausente.");
    return;
  }
  if (!window.dbFirebase) {
    console.error("Firestore não inicializado! window.dbFirebase ausente.");
    return;
  }

  const map = window._checkinfraMap;
  const db = window.dbFirebase;

  // Layer para os pontos de leitura por bairros
  if (!window.camadaBairros) {
    window.camadaBairros = L.layerGroup().addTo(map);
  }
  const camadaBairros = window.camadaBairros;

  // Cores por classe
  const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

  // Filtros do painel
  const fAdequado = document.getElementById("fAdequado");
  const fAlerta = document.getElementById("fAlerta");
  const fAtencao = document.getElementById("fAtencao");
  const fCritico = document.getElementById("fCritico");

  // Variável global para armazenar avaliações
  window.avaliacoesBairro = [];

  // Carregar avaliações do Firebase
  window.carregarAvaliacoesBairro = async function() {
    const { collection, getDocs, query, orderBy } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js");
    const q = query(collection(db,"avaliacoes"), orderBy("timestamp","desc"));
    const snap = await getDocs(q);

    const ultimos = {};
    snap.forEach(doc=>{
      const d = doc.data();
      if(d.lat && d.lng && d.classe && d.escola){
        if(!ultimos[d.escola] || (d.timestamp && d.timestamp.toMillis() > ultimos[d.escola].timestamp?.toMillis())){
          ultimos[d.escola] = d;
        }
      }
    });
    window.avaliacoesBairro = Object.values(ultimos);
  };

  // Criar e atualizar os pontos no mapa
  window.atualizarBairros = function(){
    camadaBairros.clearLayers();

    window.avaliacoesBairro.forEach(d=>{
      const s = d.classe;

      if(
        (s==="ok" && !fAdequado.checked) ||
        (s==="alerta" && !fAlerta.checked) ||
        (s==="atenção" && !fAtencao.checked) ||
        (s==="critico" && !fCritico.checked)
      ) return;

      const cor = cores[s] || "#000";
      const marker = L.circleMarker([d.lat,d.lng], {
        radius:8,
        color:cor,
        fillColor:cor,
        fillOpacity:0.8
      }).bindPopup(`<strong>${d.escola}</strong><br>Status: ${d.classe}<br>Pontuação: ${d.pontuacao || "-"}<br>Última avaliação: ${d.data || "-"}`);

      marker.addTo(camadaBairros);
    });
  };

  // Listener do checkbox no index.html
  const toggleBairros = document.getElementById("toggleBairros");
  if (toggleBairros) {
    toggleBairros.addEventListener("change", async function(){
      if(this.checked){
        await window.carregarAvaliacoesBairro();
        window.atualizarBairros();
      } else {
        camadaBairros.clearLayers();
      }
    });
  } else {
    console.warn("Checkbox toggleBairros não encontrado no HTML.");
  }
});