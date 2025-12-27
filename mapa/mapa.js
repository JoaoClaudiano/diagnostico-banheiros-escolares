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

window.camadaPontos = L.layerGroup().addTo(map);
window.avaliacoes = []; // 🔑 GLOBAL

/* ================= CORES ================= */

const cores = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  atencao: "#FF9800",
  critico: "#F44336",
  crítico: "#F44336"
};

const pulsoTempo = {
  critico: 1200,
  atenção: 2400,
  atencao: 2400,
  alerta: 2400,
  ok: 4800
};

/* ================= MAPA VIVO ================= */

function aplicarPulso(marker, classe) {
  const tempo = pulsoTempo[classe] || 2400;
  let visivel = true;

  setInterval(() => {
    visivel = !visivel;
    marker.setStyle({
      opacity: visivel ? 1 : 0,
      fillOpacity: visivel ? 0.8 : 0
    });
  }, tempo);
}

/* ================= CARREGAR AVALIAÇÕES ================= */

async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const mapaEscolas = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.timestamp) return;

    if (!mapaEscolas[d.escola] || d.timestamp > mapaEscolas[d.escola].timestamp) {
      mapaEscolas[d.escola] = d;
    }
  });

  window.avaliacoes = Object.values(mapaEscolas);

  // 🔔 AVISA QUE OS DADOS ESTÃO PRONTOS
  window.dispatchEvent(new Event("avaliacoesCarregadas"));
}

/* ================= CRIAR PONTO ================= */

function criarPonto(d) {
  const classe = d.classe.toLowerCase();
  const cor = cores[classe] || "#999";

  const marker = L.circleMarker([d.lat, d.lng], {
    radius: 7,
    color: cor,
    fillColor: cor,
    fillOpacity: 0.8,
    opacity: 1
  });

  marker.bindPopup(`
    <strong>${d.escola}</strong><br>
    Classe: ${d.classe}<br>
    Pontuação: ${d.pontuacao ?? "-"}<br>
    Data: ${d.data ?? "-"}
  `);

  if (document.getElementById("togglePulso").checked) {
    aplicarPulso(marker, classe);
  }

  return marker;
}

/* ================= ATUALIZAR MAPA ================= */

window.atualizarPontos = function () {
  camadaPontos.clearLayers();

  window.avaliacoes.forEach(d => {
    const c = d.classe.toLowerCase();

    if (
      (c === "ok" && !fAdequado.checked) ||
      (c === "alerta" && !fAlerta.checked) ||
      ((c === "atenção" || c === "atencao") && !fAtencao.checked) ||
      (c === "critico" && !fCritico.checked)
    ) return;

    criarPonto(d).addTo(camadaPontos);
  });
};

/* ================= EVENTOS ================= */

document.querySelectorAll(".painel input").forEach(i =>
  i.addEventListener("change", window.atualizarPontos)
);

/* ================= INIT ================= */

await carregarAvaliacoes();
window.atualizarPontos();