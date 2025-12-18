// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= ID CHECKINFRA =================
function gerarIdCheckInfra() {
  const d = new Date();
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CI-${ano}-${mes}-${dia}-${rand}`;
}

// ================= PDF =================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);

  pdf.setFontSize(11);
  pdf.text(`Código: ${d.id}`, 20, 35);
  pdf.text(`Escola: ${d.escola}`, 20, 45);
  pdf.text(`Avaliador: ${d.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${d.pontuacao}`, 20, 65);
  pdf.text(`Status: ${d.status}`, 20, 75);

  let y = 90;
  pdf.text("Problemas identificados:", 20, y);
  y += 10;

  d.problemas.forEach(p => {
    pdf.text(`- ${p}`, 25, y);
    y += 8;
  });

  pdf.text(`Data: ${new Date().toLocaleDateString()}`, 20, y + 10);
  pdf.save(`${d.id}.pdf`);
}

// ================= OFFLINE (localStorage) =================
const STORAGE_KEY = "checkinfra_pendentes";

function salvarOffline(dados) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  lista.push(dados);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

async function sincronizarOffline() {
  if (!navigator.onLine) return;

  const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!pendentes.length) return;

  for (const dados of pendentes) {
    await setDoc(
      doc(db, "avaliacoes", dados.id),
      { ...dados, createdAt: serverTimestamp() }
    );
  }

  localStorage.removeItem(STORAGE_KEY);
}

// ================= UI OFFLINE =================
function atualizarOfflineUI() {
  const card = document.getElementById("offlineCard");
  if (card) {
    card.style.display = navigator.onLine ? "none" : "block";
  }
}

window.addEventListener("online", () => {
  atualizarOfflineUI();
  sincronizarOffline();
});
window.addEventListener("offline", atualizarOfflineUI);

// ================= MAIN =================
document.addEventListener("DOMContentLoaded", () => {
  atualizarOfflineUI();
  sincronizarOffline();

  // popula escolas
  const select = document.getElementById("escola");
  if (window.escolas && select) {
    window.escolas.forEach(e => {
      const opt = document.createElement("option");
      opt.value = e.nome;
      opt.textContent = e.nome;
      select.appendChild(opt);
    });
  }

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    let pontuacao = 0;
    let problemas = [];

    document.querySelectorAll(".check-card input:checked").forEach(cb => {
      pontuacao += Number(cb.dataset.peso);
      problemas.push(cb.parentElement.innerText.trim());
    });

    let status = "Adequada";
    let classe = "ok";
    if (pontuacao >= 8) { status = "Crítica"; classe = "critico"; }
    else if (pontuacao >= 4) { status = "Alerta"; classe = "alerta"; }

    const dados = {
      id: gerarIdCheckInfra(),
      escola,
      avaliador,
      pontuacao,
      status,
      problemas
    };

    try {
      if (navigator.onLine) {
        await setDoc(
          doc(db, "avaliacoes", dados.id),
          { ...dados, createdAt: serverTimestamp() }
        );
      } else {
        salvarOffline(dados);
      }
    } catch {
      salvarOffline(dados);
    }

    gerarPDF(dados);

    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Código:</strong> ${dados.id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      ${navigator.onLine ? "☁️ Enviado" : "📴 Salvo offline"}
    `;

    form.reset();
  });
});