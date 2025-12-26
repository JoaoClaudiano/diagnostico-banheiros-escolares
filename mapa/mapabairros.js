import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let camadaBairros = L.layerGroup().addTo(map);
let bairrosGeoJSON = null;
let avaliacoes = [];

// Cores por classe
const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };

// Carregar avaliações recentes do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe) ultimos[d.escola] = d;
  });
  avaliacoes = Object.values(ultimos);
}

// Carregar bairros (GeoJSON)
async function carregarBairros(urlGeoJSON){
  const resp = await fetch(urlGeoJSON);
  bairrosGeoJSON = await resp.json();
}

// Verificar se algum ponto está dentro do polígono
function pontosNoPoligono(polygon){
  return avaliacoes.some(d=>{
    return turf.booleanPointInPolygon(turf.point([d.lng,d.lat]), polygon);
  });
}

// Atualizar camada de bairros
function atualizarBairros(){
  camadaBairros.clearLayers();
  if(!document.getElementById("toggleBairros").checked) return;
  if(!bairrosGeoJSON) return;

  bairrosGeoJSON.features.forEach(feature=>{
    const polygon = feature.geometry;
    const temPontos = pontosNoPoligono(feature);
    const cor = temPontos ? "#1f4fd8" : "transparent"; // ou outra lógica de cor
    L.geoJSON(feature, {
      style: { color: cor, fillColor: cor, fillOpacity: 0.4, weight:1 }
    }).addTo(camadaBairros);
  });
}

// Checkbox para ativar/desativar camada
document.getElementById("toggleBairros").addEventListener("change", atualizarBairros);

// Inicialização
await carregarAvaliacoes();
await carregarBairros("./bairros.geojson");
atualizarBairros();