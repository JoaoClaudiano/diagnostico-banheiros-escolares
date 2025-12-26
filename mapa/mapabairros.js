import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let camadaBairros;
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe){
      ultimos[d.escola] = d;
    }
  });
  return Object.values(ultimos);
}

async function carregarBairros(){
  const res = await fetch("./POLIGONAIS.geojson");
  return await res.json();
}

function estiloBairro(feature, avaliacoes){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat,a.lng]));
  if(escolas.length===0) return { fillOpacity:0, color:"#555", weight:1 };
  
  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e=> cont[e.classe] = (cont[e.classe]||0)+1 );

  const total = escolas.length;
  let cor = "#4CAF50"; // padrão verde
  if(cont.critico/total>=0.5) cor="#F44336";
  else if(cont.atenção/total>=0.5) cor="#FF9800";
  else if(cont.alerta/total>=0.5) cor="#FFD700";

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

function tooltipBairro(feature, avaliacoes){
  const poly = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
  const escolas = avaliacoes.filter(a => poly.getBounds().contains([a.lat,a.lng]));
  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atenção:0, critico:0 };
  escolas.forEach(e=> cont[e.classe] = (cont[e.classe]||0)+1 );

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let obs="";
  if(p("critico")>=50) obs="🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção")>=50) obs="🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) obs="🟡 Problema pontual, monitoramento recomendado.";
  else obs="🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `<strong>${feature.properties.nome}</strong><br>
    🔴 ${p("critico")}% crítico (${cont.critico})<br>
    🟠 ${p("atenção")}% atenção (${cont.atenção})<br>
    🟡 ${p("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${p("ok")}% adequado (${cont.ok})<br>
    Observação: ${obs}`;
}

let camadaBairrosAtiva = false;
document.getElementById("toggleBairros").addEventListener("change", async e=>{
  const avaliacoes = await carregarAvaliacoes();
  if(e.target.checked){
    const geo = await carregarBairros();
    camadaBairros = L.geoJSON(geo,{
      style:f=> estiloBairro(f,avaliacoes),
      onEachFeature:(f,l)=> l.bindTooltip(tooltipBairro(f,avaliacoes))
    }).addTo(map);
    camadaBairrosAtiva = true;
  } else {
    if(camadaBairrosAtiva) { map.removeLayer(camadaBairros); camadaBairrosAtiva=false; }
  }
});