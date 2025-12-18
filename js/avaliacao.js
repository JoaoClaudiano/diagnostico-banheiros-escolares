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
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= ID =================
function gerarIdCheckInfra() {
  const d = new Date();
  return `CI-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}

// ================= OFFLINE =================
const STORAGE_KEY = "checkinfra_pendentes";

function salvarOffline(dados){
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  l.push(dados);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(l));
}

async function sincronizarOffline(){
  if(!navigator.onLine) return;
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  if(!l.length) return;

  for(const d of l){
    await setDoc(doc(db,"avaliacoes",d.id),{...d,createdAt:serverTimestamp()});
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= PDF REFORMULADO COM PROBLEMAS =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 15;
  let y = margin;

  // Logo centralizada
  const logo = new Image();
  logo.src = 'assets/logo-checkinfra.png';
  await new Promise(resolve => { logo.onload = resolve; });
  pdf.addImage(logo, 'PNG', 105 - 20, y, 40, 20);
  y += 25;

  // Título PDF
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("CHECKINFRA – AVALIAÇÃO SANITÁRIA ESCOLAR", 105, y, { align: "center" });
  y += 10;

  // ---------------- Card Identificação ----------------
  const cardHeight = 35;
  pdf.setFillColor(230, 240, 255);
  pdf.roundedRect(margin, y, 180, cardHeight, 4, 4, 'F');

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Identificação", margin + 3, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`ID: ${d.id}`, margin + 3, y + 16);
  pdf.text(`Escola: ${d.escola}`, margin + 3, y + 23);
  pdf.text(`Avaliador: ${d.avaliador}`, margin + 3, y + 30);
  pdf.text(`Data da Avaliação: ${new Date().toLocaleDateString()}`, margin + 90, y + 16);
  y += cardHeight + 8;

  // ---------------- Card Problemas Apontados ----------------
  const problemasHeight = Math.max(d.problemas.length * 7 + 10, 20);
  pdf.setFillColor(255, 245, 245);
  pdf.roundedRect(margin, y, 180, problemasHeight, 4, 4, 'F');

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Problemas Apontados", margin + 3, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  if(d.problemas.length) {
    let py = y + 16;
    d.problemas.forEach(p => {
      pdf.text(`- ${p}`, margin + 5, py);
      py += 7;
    });
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.text("Nenhum problema registrado", margin + 5, y + 16);
  }
  y += problemasHeight + 8;

  // ---------------- Card Registro Fotográfico ----------------
  const fotoCardHeight = 70;
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(margin, y, 180, fotoCardHeight, 4, 4, 'F');

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Registro Fotográfico", margin + 3, y + 8);

  let x = margin + 3;
  let yImg = y + 15;
  const maxImgWidth = 80;
  const maxImgHeight = 50;
  const gap = 5;

  if (d.fotos.length) {
    d.fotos.forEach((img) => {
      pdf.addImage(img, "JPEG", x, yImg, maxImgWidth, maxImgHeight);
      x += maxImgWidth + gap;
      if (x + maxImgWidth > 195) {
        x = margin + 3;
        yImg += maxImgHeight + gap;
      }
    });
  } else {
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.text("Nenhuma foto enviada", margin + 3, y + 35);
  }
  y += fotoCardHeight + 8;

  // ---------------- Card Resultado ----------------
  const resultadoCardHeight = 25;
  pdf.setFillColor(230, 255, 230);
  if (d.classe === "alerta") pdf.setFillColor(255, 250, 200);
  if (d.classe === "critico") pdf.setFillColor(255, 220, 220);
  pdf.roundedRect(margin, y, 180, resultadoCardHeight, 4, 4, 'F');

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.text("Resultado", margin + 3, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`Pontuação: ${d.pontuacao}`, margin + 3, y + 16);
  pdf.text(`Status: ${d.status}`, margin + 60, y + 16);
  pdf.text(`ID do Diagnóstico: ${d.id}`, margin + 120, y + 16);
  y += resultadoCardHeight + 8;

  // ---------------- Card Aviso Legal ----------------
  const avisoCardHeight = 20;
  pdf.setFillColor(245, 245, 245);
  pdf.roundedRect(margin, y, 180, avisoCardHeight, 4, 4, 'F');

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(10);
  pdf.text("Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial ou laudo de engenharia.", margin + 3, y + 12);
  y += avisoCardHeight + 10;

  // ---------------- Rodapé ----------------
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  const footerText = `Data de Impressão: ${new Date().toLocaleDateString()}`;
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(footerText, 105, 287, { align: "center" });
  }

  pdf.save(`CheckInfra-${d.id}.pdf`);
}

// ================= MAIN =================
document.addEventListener("DOMContentLoaded", () => {

  sincronizarOffline();

  const fotosInput = document.getElementById("fotos");
  const preview = document.getElementById("preview");
  let fotosBase64 = [];

  fotosInput.addEventListener("change", () => {
    preview.innerHTML = "";
    fotosBase64 = [];

    [...fotosInput.files].forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        fotosBase64.push(e.target.result);
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e => {
    e.preventDefault();

    // Calcula pontuação e problemas
    let pontuacao = 0;
    let problemas = [];
    document.querySelectorAll(".check-card.selected").forEach(c => {
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    // Determina status
    let status = "Adequada", classe = "ok";
    if (pontuacao >= 8) { status = "Crítica"; classe = "critico"; }
    else if (pontuacao >= 4) { status = "Alerta"; classe = "alerta"; }

    // Dados avaliação
    const dados = {
      id: gerarIdCheckInfra(),
      escola: document.getElementById("escola").value,
      avaliador: document.getElementById("avaliador").value,
      pontuacao,
      status,
      classe,
      problemas,
      fotos: fotosBase64
    };

    // Define global ID para HTML
    window.idcheckinfra = dados.id;

    // Atualiza card de diagnóstico
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">
        ${classe === "ok" ? "🟢 Condição adequada" :
          classe === "alerta" ? "🟡 Situação de alerta" :
            "🔴 Condição crítica"}
      </div>
      <strong>IDCHECKINFRA:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine ? "☁️ Enviado ao sistema" : "📴 Salvo offline — será sincronizado"}
    `;

    try {
      if (navigator.onLine) {
        await setDoc(doc(db, "avaliacoes", dados.id), { ...dados, createdAt: serverTimestamp() });
      } else salvarOffline(dados);
    } catch {
      salvarOffline(dados);
    }

    // Gera PDF
    gerarPDF(dados);

    // Reset do formulário e preview
    form.reset();
    preview.innerHTML = "";
    fotosBase64 = [];

    // Redirecionamento para página inicial em 5 segundos
    setTimeout(() => { window.location.href = "./index.html"; }, 5000);
  });
});