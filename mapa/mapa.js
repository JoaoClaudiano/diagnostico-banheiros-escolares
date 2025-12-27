import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


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

window.map = map;

/* ================= CAMADA ================= */
const camadaPontos = L.layerGroup().addTo(map);

/* ================= CORES ================= */
const cores = {
  adequado: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

/* ================= PULSO ================= */
function criarPulso(lat, lng, cor, freq) {
  const marker = L.circleMarker([lat, lng], {
    radius: 8,
    fillColor: cor,
    color: cor,
    fillOpacity: 0.8,
    opacity: 0.8
  });

  function animar() {
    marker.setStyle({ opacity: 0, fillOpacity: 0 });
    setTimeout(() => {
      marker.setStyle({ opacity: 0.8, fillOpacity: 0.8 });
    }, freq * 0.4);
  }

  animar();
  marker._pulseInterval = setInterval(animar, freq);

  return marker;
}

/* ================= AVALIAÇÕES ================= */
let avaliacoes = [];
window.avaliacoes = avaliacoes;

async function carregarAvaliacoes() {
  const snap = await getDocs(collection(db, "avaliacoes"));
  const ultimas = {};

  snap.forEach(doc => {
    const d = doc.data();
    if (!d.lat || !d.lng || !d.classe || !d.timestamp) return;

    // 🔹 normalização
    const classe = d.classe === "ok" ? "adequado" : d.classe;

    const chave = d.escola || doc.id;

    if (!ultimas[chave] || d.timestamp > ultimas[chave].timestamp) {
      ultimas[chave] = { ...d, classe };
    }
  });

  avaliacoes = Object.values(ultimas);
  window.avaliacoes = avaliacoes;
}

/* ================= DESENHO ================= */
function atualizarMapa() {
  camadaPontos.clearLayers();

  avaliacoes.forEach(d => {
    const s = d.classe;

    if (
      (s === "adequado" && !fAdequado.checked) ||
      (s === "alerta" && !fAlerta.checked) ||
      (s === "atenção" && !fAtencao.checked) ||
      (s === "critico" && !fCritico.checked)
    ) return;

    const cor = cores[s];

    if (togglePulso.checked) {
      const freq =
        s === "critico" ? 1200 :
        s === "atenção" ? 2400 :
        s === "alerta"  ? 2400 : 3600;

      const pulso = criarPulso(d.lat, d.lng, cor, freq)
        .bindPopup(`<strong>${d.escola}</strong><br>${d.status || s}`);
      pulso.addTo(camadaPontos);
    } else {
      L.circleMarker([d.lat, d.lng], {
        radius: 8,
        fillColor: cor,
        color: cor,
        fillOpacity: 0.8
      })
      .bindPopup(`<strong>${d.escola}</strong><br>${d.status || s}`)
      .addTo(camadaPontos);
    }
  });
}

/* ================= EVENTOS ================= */
document.querySelectorAll(".painel input").forEach(i =>
  i.addEventListener("change", atualizarMapa)
);

/* ================= INIT ================= */
await carregarAvaliacoes();
atualizarMapa();
