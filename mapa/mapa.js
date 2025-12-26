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

// Inicializa mapa
const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution:"© OpenStreetMap" }).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

const statusCores = {
  "adequado":"#4CAF50",
  "alerta":"#FFD700",
  "atenção":"#FF9800",
  "critico":"#F44336",
  "crítico":"#F44336"
};

const bola = {
  adequado: "🟢",
  alerta: "🟡",
  atenção: "🟠",
  crítico: "🔴"
};

// Frequências de pulso por status (em ms)
const pulseFreq = {
  "critico": 1200,
  "atenção": 2400,
  "alerta": 3600,
  "adequado": 4800
};

async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.status) avaliacoes.push(d);
  });
}

function criarPonto(d){
  const status = (d.status||"").toLowerCase();

  let observacao = "";
  if(status.includes("crit")) observacao = "🔴 Problema grave – intervenção imediata recomendada.";
  else if(status.includes("atenção")) observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
  else if(status.includes("alerta")) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else if(status.includes("adequado")) observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const circle = L.circleMarker([d.lat,d.lng],{
    radius:8,
    color:statusCores[status],
    fillColor:statusCores[status],
    fillOpacity:0.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${observacao}
  `);

  // Pulso (apenas se togglePulso estiver ativo)
  if(document.getElementById("togglePulso").checked) {
    let growing = true;
    let r = 8;
    const freq = pulseFreq[status] || 2000;

    const interval = setInterval(()=>{
      if(!document.getElementById("togglePulso").checked) {
        circle.setRadius(8);
        clearInterval(interval);
        return;
      }
      r = growing ? r + 0.5 : r - 0.5;
      if(r>=16) growing = false;
      if(r<=8) growing = true;
      circle.setRadius(r);
    }, freq/16);
  }

  return circle;
}

function atualizarPontos(){
  camadaPontos.clearLayers();

  avaliacoes.forEach(d=>{
    const s = (d.status||"").toLowerCase();
    if(
      (s.includes("adequado") && !fAdequado.checked) ||
      (s.includes("alerta") && !fAlerta.checked) ||
      (s.includes("atenção") && !fAtencao.checked) ||
      (s.includes("crit") && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

// Event listeners para checkboxes
document.querySelectorAll("input").forEach(i=>i.addEventListener("change",()=>{
  atualizarPontos();
}));

// Inicialização
await carregarAvaliacoes();
atualizarPontos();