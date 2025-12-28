// mapabairros.js

// Referência ao Firestore já inicializado no index
const db = window.dbFirebase; // Certifique-se que window.dbFirebase = db no index.html

// Layer para polígonos de bairros
window.camadaBairros = L.layerGroup().addTo(window._checkinfraMap);

// Layer para pontos individuais (opcional)
window.camadaPontosBairro = L.layerGroup().addTo(window._checkinfraMap);

// Cores por classe
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Armazenar avaliações e geojson
window.avaliacoesBairro = [];
let bairrosGeoJSON = null;

// Carregar avaliações do Firebase
window.carregarAvaliacoesBairro = async function() {
  const snap = await getDocs(collection(db,"avaliacoes"));
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

// Função para carregar polígonos de bairros
async function carregarBairros() {
  if(bairrosGeoJSON) return bairrosGeoJSON;
  const res = await fetch("mapa/POLIGONAIS.geojson");
  const geojson = await res.json();
  bairrosGeoJSON = geojson;
  return geojson;
}

// Função para calcular classe dominante e tooltip
function tooltipBairro(feature, avaliacoes) {
  const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
  const poly = L.polygon(coords);

  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat,a.lng]));

  if(escolas.length === 0)
    return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e => {
    if(e.classe in cont) cont[e.classe]++;
  });

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let obs="";
  if(p("critico") >= 50) obs="🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção") >= 50) obs="🟠 Problema localizado, tendência de piora.";
  else if(p("alerta") >= 50) obs="🟡 Problema pontual, monitoramento recomendado.";
  else obs="🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `<strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    <em>${obs}</em>`;
}

// Atualizar visualização dos bairros
window.atualizarBairros = async function(){
  window.camadaBairros.clearLayers();
  window.camadaPontosBairro.clearLayers();

  const geojson = await carregarBairros();

  geojson.features.forEach(feature => {
    // Aplicar filtros do painel
    const avaliacoesFiltradas = window.avaliacoesBairro.filter(d=>{
      const s = d.classe;
      if((s==="ok" && !fAdequado.checked) ||
         (s==="alerta" && !fAlerta.checked) ||
         (s==="atenção" && !fAtencao.checked) ||
         (s==="critico" && !fCritico.checked)) return false;
      return true;
    });

    const coords = feature.geometry.coordinates[0].map(c => [c[1], c[0]]);
    const poly = L.polygon(coords);

    // Contar escolas dentro do bairro
    const escolas = avaliacoesFiltradas.filter(a => poly.getBounds().contains([a.lat,a.lng]));

    let classeDominante = "ok"; // default
    if(escolas.length>0){
      const cont = { ok:0, alerta:0, atenção:0, critico:0 };
      escolas.forEach(e => { if(e.classe in cont) cont[e.classe]++; });

      if(cont.critico>=0.5*escolas.length) classeDominante="critico";
      else if(cont.atenção>=0.5*escolas.length) classeDominante="atenção";
      else if(cont.alerta>=0.5*escolas.length) classeDominante="alerta";
      else classeDominante="ok";
    }

    poly.setStyle({
      color: cores[classeDominante],
      fillColor: cores[classeDominante],
      fillOpacity: 0.3,
      weight:1
    }).bindTooltip(tooltipBairro(feature, avaliacoesFiltradas));

    poly.addTo(window.camadaBairros);
  });
};

// Checkbox "Leitura por bairro"
document.getElementById("toggleBairros").addEventListener("change", async function(){
  if(this.checked){
    await window.carregarAvaliacoesBairro();
    await window.atualizarBairros();
  } else {
    window.camadaBairros.clearLayers();
  }
});

// Atualizar automaticamente ao alterar filtros do painel
["fAdequado","fAlerta","fAtencao","fCritico"].forEach(id=>{
  document.getElementById(id).addEventListener("change", async ()=>{
    if(document.getElementById("toggleBairros").checked){
      await window.atualizarBairros();
    }
  });
});