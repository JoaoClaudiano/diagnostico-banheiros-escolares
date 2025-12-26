import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

export let avaliacoes = [];
export let camadaPontos = L.layerGroup().addTo(map);

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

const pulseFreq = {
  "critico": 1200,
  "crítico": 1200,
  "atenção": 2400,
  "alerta": 3600,
  "adequado": 4800
};

export async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.status) avaliacoes.push(d);
  });
}

let pulseIntervals = [];

export function atualizarPontos(){
  // Limpa os pulsos antigos
  pulseIntervals.forEach(i=>clearInterval(i));
  pulseIntervals = [];

  camadaPontos.clearLayers();

  avaliacoes.forEach(d=>{
    const s = (d.status||"").toLowerCase();

    if(
      (s.includes("adequado") && !fAdequado.checked) ||
      (s.includes("alerta") && !fAlerta.checked) ||
      (s.includes("atenção") && !fAtencao.checked) ||
      (s.includes("crit") && !fCritico.checked)
    ) return;

    let observacao = "";
    if(s.includes("crit")) observacao = "🔴 Problema grave – intervenção imediata recomendada.";
    else if(s.includes("atenção")) observacao = "🟠 Problema localizado, tendência de evoluir a crítico.";
    else if(s.includes("alerta")) observacao = "🟡 Problema pontual, monitoramento recomendado.";
    else if(s.includes("adequado")) observacao = "🟢 Situação satisfatória – manutenção do acompanhamento.";

    const marker = L.circleMarker([d.lat,d.lng],{
      radius:8,
      color:statusCores[s],
      fillColor:statusCores[s],
      fillOpacity:.8
    }).bindPopup(`
      <strong>${d.escola}</strong><br>
      Status: ${d.status}<br>
      Pontuação: ${d.pontuacao || "-"}<br>
      Última avaliação: ${d.data || "-"}<br>
      Observação: ${observacao}
    `);

    marker.addTo(camadaPontos);

    if(togglePulso.checked){
      const interval = setInterval(()=>{
        const current = marker.options.fillOpacity;
        marker.setStyle({ fillOpacity: current===0.8 ? 0.2 : 0.8 });
      }, pulseFreq[s] || 2000);
      pulseIntervals.push(interval);
    }
  });
}