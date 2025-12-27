import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* ================= FIREBASE ================= */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ================= MAPA ================= */
const map = L.map("map").setView([-3.7319, -38.5267], 12);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "© OpenStreetMap"
}).addTo(map);

let camadaPontos = L.layerGroup().addTo(map);
let avaliacoes = [];

/* ================= CORES POR CLASSE ================= */
const coresClasse = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  atencao: "#FF9800",
  critico: "#F44336",
  crítico: "#F44336"
};

const pulsoFreq = {
  critico: 1200,
  crítico: 1200,
  atenção: 2400,
  atencao: 2400,
  alerta: 2400,
  ok: 4800
};

/* ================= CARREGAR AVALIAÇÕES ================= */
async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const ultimas = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.escola) return;

    const ts = d.timestamp?.seconds || d.timestamp || 0;

    if (
      !ultimas[d.escola] ||
      ts > (ultimas[d.escola].timestamp?.seconds || ultimas[d.escola].timestamp || 0)
    ) {
      ultimas[d.escola] = d;
    }
  });

  avaliacoes = Object.values(ultimas);
}

/* ================= CRIAR PONTO ================= */
function criarPonto(d) {
  const classe = d.classe.toLowerCase();
  const cor = coresClasse[classe] || "#000";

  const marker = L.circleMarker([d.lat, d.lng], {
    radius: 8,
    color: cor,
    fillColor: cor,
    fillOpacity: 0.85
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status || "-"}<br>
    Classe: ${d.classe}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Data: ${d.data || "-"}
  `);

  if (document.getElementById("togglePulso").checked) {
    aplicarPulso(marker, classe);
  }

  return marker;
}

/* ================= PULSO ================= */
function aplicarPulso(marker, classe) {
  const freq = pulsoFreq[classe] || 2400;
  const cor = coresClasse[classe];
  let r = 8;

  setInterval(() => {
    marker.setStyle({ radius: 18, opacity: 0.1 });
    setTimeout(() => {
      marker.setStyle({ radius: 8, opacity: 1, color: cor, fillColor: cor });
    }, freq * 0.6);
  }, freq);
}

/* ================= ATUALIZAR MAPA ================= */
function atualizarPontos() {
  camadaPontos.clearLayers();

  avaliacoes.forEach(d => {
    const c = d.classe.toLowerCase();

    if (
      (c === "ok" && !fAdequado.checked) ||
      (c === "alerta" && !fAlerta.checked) ||
      ((c === "atenção" || c === "atencao") && !fAtencao.checked) ||
      ((c === "critico" || c === "crítico") && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
}

/* ================= EVENTOS ================= */
document.querySelectorAll(
  "#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso"
).forEach(el => {
  el.addEventListener("change", atualizarPontos);
});

/* ================= INICIALIZAÇÃO ================= */
await carregarAvaliacoes();
atualizarPontos();