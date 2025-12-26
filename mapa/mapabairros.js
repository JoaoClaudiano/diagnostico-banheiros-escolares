import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import * as turf from "https://cdn.jsdelivr.net/npm/@turf/turf@6.5.0/turf.min.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let avaliacoes = [];

export async function carregarAvaliacoesBairros() {
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes=[];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe) avaliacoes.push(d);
  });
}

export async function criarCamadaBairros(map) {
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  const camadaBairros = L.geoJSON(geo, {
    style: estiloBairro,
    onEachFeature: (feature, layer) => {
      layer.bindTooltip(tooltipBairro(feature));
    }
  });

  return camadaBairros;
}

function estiloBairro(feature) {
  const escolas = avaliacoes.filter(a =>
    turf.booleanPointInPolygon(turf.point([a.lng, a.lat]), feature)
  );

  if(escolas.length === 0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont = { ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e => {
    const c = (e.classe || "ok").toLowerCase();
    if(cont[c] !== undefined) cont[c]++;
  });

  const total = escolas.length;
  const pct = k => cont[k]/total;

  let cor = "#4CAF50"; // verde
  if(pct("critico") >= 0.5) cor="#F44336";
  else if(pct("atencao") >= 0.5) cor="#FF9800";
  else if(pct("alerta") >= 0.5) cor="#FFD700";

  return { fillColor: cor, fillOpacity:0.45, color:"#555", weight:1 };
}

function tooltipBairro(feature) {
  const escolas = avaliacoes.filter(a =>
    turf.booleanPointInPolygon(turf.point([a.lng, a.lat]), feature)
  );

  if(escolas.length === 0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont = { ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e => {
    const c = (e.classe || "ok").toLowerCase();
    if(cont[c] !== undefined) cont[c]++;
  });

  const total = escolas.length;
  const pct = k => Math.round((cont[k]/total)*100);

  let observacao = "";
  if(pct("critico") >= 50) observacao = "🔴 Problema generalizado – alto risco de impacto.";
  else if(pct("atencao") >= 50) observacao = "🟠 Problema localizado, tendência de piora.";
  else if(pct("alerta") >= 50) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    🔴 ${pct("critico")}% crítico (${cont.critico})<br>
    🟠 ${pct("atencao")}% atenção (${cont.atencao})<br>
    🟡 ${pct("alerta")}% alerta (${cont.alerta})<br>
    🟢 ${pct("ok")}% adequado (${cont.ok})<br>
    Observação: ${observacao}
  `;
}