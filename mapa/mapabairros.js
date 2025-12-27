import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   Firebase
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =========================
   Variáveis
========================= */
let camadaBairros = null;
let bairrosGeoJSON = null;

/* =========================
   Cores por classe
========================= */
const coresClasse = {
  ok: "#4CAF50",
  alerta: "#FFD700",
  atenção: "#FF9800",
  critico: "#F44336"
};

/* =========================
   Checkbox
========================= */
const toggleBairros = document.getElementById("toggleBairros");

toggleBairros.addEventListener("change", async (e) => {
  if (e.target.checked) {
    await ativarLeituraPorBairros();
  } else {
    removerLeituraPorBairros();
  }
});

/* =========================
   Ativar leitura por bairros
========================= */
async function ativarLeituraPorBairros() {
  // 🔴 GARANTIA ABSOLUTA
  if (!window.avaliacoesGlobais || window.avaliacoesGlobais.length === 0) {
    console.warn("Leitura por bairros: avaliações ainda não carregadas.");
    toggleBairros.checked = false;
    return;
  }

  if (!bairrosGeoJSON) {
    const res = await fetch("./bairros.geojson");
    bairrosGeoJSON = await res.json();
  }

  camadaBairros = L.geoJSON(bairrosGeoJSON, {
    style: feature => estiloBairro(feature),
    onEachFeature: (feature, layer) => {
      const dados = calcularLeituraBairro(feature);

      if (dados.total > 0) {
        layer.bindTooltip(
          `<strong>${feature.properties.nome}</strong><br>
           Avaliações: ${dados.total}<br>
           Classe dominante: <strong>${dados.classe}</strong>`,
          { sticky: true }
        );
      }
    }
  });

  camadaBairros.addTo(window.map);
}

/* =========================
   Remover camada
========================= */
function removerLeituraPorBairros() {
  if (camadaBairros) {
    window.map.removeLayer(camadaBairros);
    camadaBairros = null;
  }
}

/* =========================
   Estilo do bairro
========================= */
function estiloBairro(feature) {
  const dados = calcularLeituraBairro(feature);

  if (dados.total === 0) {
    return {
      color: "#999",
      weight: 1,
      fillOpacity: 0
    };
  }

  return {
    color: "#666",
    weight: 1,
    fillColor: coresClasse[dados.classe],
    fillOpacity: 0.55
  };
}

/* =========================
   Cálculo espacial correto
========================= */
function calcularLeituraBairro(feature) {
  const poligono = feature.geometry;

  const contagem = {
    ok: 0,
    alerta: 0,
    atenção: 0,
    critico: 0
  };

  window.avaliacoesGlobais.forEach(d => {
    const ponto = turf.point([d.lng, d.lat]);
    if (turf.booleanPointInPolygon(ponto, poligono)) {
      contagem[d.classe]++;
    }
  });

  let classeDominante = null;
  let maior = 0;
  let total = 0;

  for (const c in contagem) {
    total += contagem[c];
    if (contagem[c] > maior) {
      maior = contagem[c];
      classeDominante = c;
    }
  }

  return {
    total,
    classe: classeDominante
  };
}