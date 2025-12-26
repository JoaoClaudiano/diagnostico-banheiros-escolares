// mapa.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Criar mapa
const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:"© OpenStreetMap"
}).addTo(map);

// Layer de pontos
let camadaPontos = L.layerGroup().addTo(map);

// Mapear classes do Firebase para cores
const coresClasse = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atencao: "#FF9800",
  critico: "#F44336"
};

// Frequência dos pulsos por classe (ms)
const pulsosFreq = {
  critico: 1200,
  atencao: 2400,
  alerta: 3600,
  ok: 4800
};

// Variável para ativar/desativar pulso
let pulsoAtivo = true;

// Array para armazenar avaliações
let avaliacoes = [];

// Função para criar o marker
function criarPonto(d){
  const classe = (d.classe || "ok").toLowerCase();
  const cor = coresClasse[classe] || "#000";

  // Observação automática
  let observacao = "";
  if(classe === "critico") observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(classe === "atencao") observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(classe === "alerta") observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color: cor,
    fillColor: cor,
    fillOpacity:0.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  // Pulsos
  if(pulsoAtivo) iniciarPulso(marker, classe);

  return marker;
}

// Função para criar pulso animado
function iniciarPulso(marker, classe){
  const freq = pulsosFreq[classe] || 2400;
  const cor = coresClasse[classe] || "#000";

  let growing = true;
  let raioBase = 8;
  let raioMax = 16;

  setInterval(()=>{
    const r = growing ? raioMax : raioBase;
    marker.setStyle({ radius: r, fillColor: cor, color: cor });
    growing = !growing;
  }, freq);
}

// Função para atualizar pontos
function atualizarPontos(){
  camadaPontos.clearLayers();

  avaliacoes.forEach(d=>{
    const marker = criarPonto(d);
    marker.addTo(camadaPontos);
  });
}

// Carregar avaliações do Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng) avaliacoes.push(d);
  });
}

// Controle checkbox do mapa vivo
const togglePulso = document.getElementById("togglePulso");
togglePulso.checked = true;
togglePulso.addEventListener("change", e=>{
  pulsoAtivo = e.target.checked;
  atualizarPontos();
});

// Inicializar mapa
async function initMap(){
  await carregarAvaliacoes();
  atualizarPontos();
}

initMap();