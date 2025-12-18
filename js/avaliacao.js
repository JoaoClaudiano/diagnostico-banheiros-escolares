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

// ================= PDF =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 15;
  let y = margin;

  // ------------------ LOGO ------------------
  const logoImg = new Image();
  logoImg.src = './assets/logo-checkinfra.png';
  logoImg.onload = () => {
    const logoWidth = 40;
    const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
    pdf.addImage(logoImg, 'PNG', (210 - logoWidth)/2, y, logoWidth, logoHeight);
    y += logoHeight + 5;

    // Nome da empresa e título
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("CHECKINFRA", 105, y, { align: "center" });
    y += 7;
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR", 105, y, { align: "center" });
    y += 12;

    // ------------------ CARD IDENTIFICAÇÃO ------------------
    pdf.setDrawColor(200);
    pdf.setFillColor(240);
    pdf.rect(margin, y, 210 - 2*margin, 30, 'FD');
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("Identificação", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Escola: ${d.escola}`, margin + 2, y + 14);
    pdf.text(`Avaliador: ${d.avaliador}`, margin + 2, y + 20);
    pdf.text(`Data da Avaliação: ${new Date().toLocaleDateString()}`, margin + 2, y + 26);
    y += 35;

    // ------------------ CARD PROBLEMAS ------------------
    pdf.setDrawColor(200);
    pdf.setFillColor(245);
    const problemasCardHeight = Math.max(10 + d.problemas.length*7, 20);
    pdf.rect(margin, y, 210 - 2*margin, problemasCardHeight, 'FD');
    pdf.setFont("helvetica", "bold");
    pdf.text("Problemas Apontados", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    let py = y + 14;
    d.problemas.forEach(p => {
      pdf.text(`- ${p}`, margin + 4, py);
      py += 7;
    });
    y += problemasCardHeight + 5;

    // ------------------ CARD FOTOS ------------------
    pdf.setDrawColor(200);
    pdf.setFillColor(250);
    pdf.rect(margin, y, 210 - 2*margin, 60, 'FD');
    pdf.setFont("helvetica", "bold");
    pdf.text("Registro Fotográfico", margin + 2, y + 7);
    let x = margin + 2, yImg = y + 14, imgWidth = 80, imgHeight = 60;
    d.fotos.forEach((img) => {
      pdf.addImage(img, "JPEG", x, yImg, imgWidth, imgHeight);
      x += imgWidth + 10;
      if (x + imgWidth > 210 - margin) { x = margin + 2; yImg += imgHeight + 10; }
      if (yImg + imgHeight > 297 - margin) { pdf.addPage(); yImg = margin; x = margin + 2; }
    });
    y += 65;

    // ------------------ CARD RESULTADO ------------------
    pdf.setDrawColor(200);
    pdf.setFillColor(235);
    pdf.rect(margin, y, 210 - 2*margin, 25, 'FD');
    pdf.setFont("helvetica", "bold");
    pdf.text("Resultado", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Pontuação: ${d.pontuacao}`, margin + 2, y + 14);
    pdf.text(`Status: ${d.status}`, margin +