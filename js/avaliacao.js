// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= ID =================
function gerarIdCheckInfra() {
  const d = new Date();
  return `CI-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
}

// ================= PDF =================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.text("CHECKINFRA – Avaliação Sanitária", 10, 15);
  pdf.text(`Código: ${d.id}`, 10, 30);
  pdf.text(`Escola: ${d.escola}`, 10, 40);
  pdf.text(`Avaliador: ${d.avaliador}`, 10, 50);
  pdf.text(`Status: ${d.status}`, 10, 60);
  pdf.text(`Pontuação: ${d.score}`, 10, 70);

  pdf.save(`CheckInfra-${d.id}.pdf`);
}

// ================= OFFLINE =================
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
    await addDoc(collection(db, "avaliacoes"), {
      ...dados,
      createdAt: serverTimestamp()
    });
  }

  localStorage.removeItem(STORAGE_KEY);
}

// ================= UI OFFLINE =================
function atualizarOffline() {
  const card = document.getElementById("offlineCard");
  if (!card) return;
  card.style.display = navigator.onLine ? "none" : "block";
}

window.addEventListener("online", () => {
  atualizarOffline();
  sincronizarOffline();
});
window.addEventListener("offline", atualizarOffline);

// ================= SUBMIT =================
document.addEventListener("DOMContentLoaded", () => {
  atualizarOffline();
  sincronizarOffline();

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    if (!escola || !avaliador) {
      alert("Preencha escola e avaliador");
      return;
    }

    const id = gerarIdCheckInfra();
    let score = 0;
    let problemas = [];

    document.querySelectorAll(".check-card input:checked").forEach(c => {
      score += Number(c.dataset.peso);
      problemas.push(c.parentElement.innerText.trim());
    });

    let status = "Condição adequada";
    let classe = "ok";
    if (score >= 8) { status = "Condição crítica"; classe = "critico"; }
    else if (score >= 4) { status = "Situação de alerta"; classe = "alerta"; }

    const dados = {
      id,
      escola,
      avaliador,
      score,
      status,
      problemas
    };

    try {
      if (navigator.onLine) {
        await addDoc(collection(db, "avaliacoes"), {
          ...dados,
          createdAt: serverTimestamp()
        });
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
      <strong>Código:</strong> ${id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${score}
    `;

    form.reset();
  });
});
