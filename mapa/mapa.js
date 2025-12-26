import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inicializar mapa
const map = L.map("map").setView([-3.7319, -38.5267], 12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let avaliacoes = [];
const camadaPontos = L.layerGroup().addTo(map);

// Cores por classe
const pulsosCor = { critico: "#F44336", atenção: "#FF9800", alerta: "#FF9800", ok: "#4CAF50" };
// Frequência em ms
const pulsosFreq = { critico: 1200, atenção: 2400, alerta: 2400, ok: 4800 };

// Função para criar pulso
function criarPulso(d) {
    const freq = pulsosFreq[d.classe] || 2400;
    const cor = pulsosCor[d.classe] || "#000";

    const pulseDiv = L.divIcon({
        className: "pulse",
        iconSize: [24,24],
        html: `<div style="
            width:24px;
            height:24px;
            border-radius:50%;
            background:${cor};
            opacity:0;
            position:absolute;
            transform:translate(-50%, -50%);
        "></div>`
    });

    const pulseMarker = L.marker([d.lat,d.lng], {icon: pulseDiv}).addTo(camadaPontos);

    setInterval(() => {
        const el = pulseMarker.getElement()?.querySelector("div");
        if(!el) return;
        el.style.transition = "opacity 0.6s ease-out, transform 0.6s ease-out";
        el.style.opacity = 0.6;
        el.style.transform = "translate(-50%, -50%) scale(1.5)";

        setTimeout(() => {
            el.style.opacity = 0;
            el.style.transform = "translate(-50%, -50%) scale(1)";
        }, 600);
    }, freq);
}

// Carregar avaliações Firebase
async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  avaliacoes = [];
  const ultimos = {}; // manter só últimos por escola
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng && d.classe){
      ultimos[d.escola] = d;
    }
  });
  avaliacoes = Object.values(ultimos);
}

// Atualizar camada de pulsos
function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = d.classe;
    // Filtrar por checkbox
    if((s==="ok" && !fAdequado.checked) || (s==="alerta" && !fAlerta.checked) ||
       (s==="atenção" && !fAtencao.checked) || (s==="critico" && !fCritico.checked)) return;
    criarPulso(d);
  });
}

// Eventos checkbox
document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico").forEach(el=>{
  el.addEventListener("change", atualizarPontos);
});

// Inicialização
await carregarAvaliacoes();
atualizarPontos();