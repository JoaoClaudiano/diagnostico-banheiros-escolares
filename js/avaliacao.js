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

// ================= PDF PROFISSIONAL =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  // ---------------- LOGO E TÍTULO ----------------
  const logoWidth = 40;
  const logoHeight = 40;
  pdf.addImage("./assets/logo-checkinfra.png", "PNG", (210 - logoWidth)/2, y, logoWidth, logoHeight);
  y += logoHeight + 3;

  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("CheckInfra", 105, y, { align: "center" });
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text("RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR", 105, y, { align: "center" });
  y += 12;

  // ---------------- CARD IDENTIFICAÇÃO ----------------
  pdf.setFillColor(240, 248, 255);
  pdf.rect(margin, y, 170, 35, "F");
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Identificação", margin + 3, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Escola: ${d.escola}`, margin + 3, y + 15);
  pdf.text(`Avaliador: ${d.avaliador}`, margin + 3, y + 22);
  pdf.text(`Data da avaliação: ${new Date().toLocaleDateString()}`, margin + 3, y + 29);
  y += 40;

  // ---------------- CARD PROBLEMAS ----------------
  pdf.setFillColor(240, 248, 255);
  const problemasHeight = 10 + d.problemas.length * 7;
  pdf.rect(margin, y, 170, problemasHeight, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Problemas Apontados", margin + 3, y + 7);
  pdf.setFont("helvetica", "normal");
  let py = y + 14;
  d.problemas.forEach(p => {
    pdf.text(`- ${p}`, margin + 5, py);
    py += 7;
  });
  y += problemasHeight + 5;

  // ---------------- CARD REGISTRO FOTOGRÁFICO ----------------
  pdf.setFillColor(240, 248, 255);
  const photoCardHeight = d.fotos.length ? 70 : 20;
  pdf.rect(margin, y, 170, photoCardHeight, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Registro Fotográfico", margin + 3, y + 7);
  if (d.fotos.length) {
    let x = margin + 3;
    let yImg = y + 15;
    const imgWidth = 80;
    const imgHeight = 60;
    d.fotos.forEach((img) => {
      pdf.addImage(img, "JPEG", x, yImg, imgWidth, imgHeight);
      x += imgWidth + 10;
      if (x + imgWidth > 210 - margin) {
        x = margin + 3;
        yImg += imgHeight + 10;
      }
      if (yImg + imgHeight > 297 - margin) {
        pdf.addPage();
        yImg = margin;
        x = margin + 3;
      }
    });
  }
  y += photoCardHeight + 5;

  // ---------------- CARD RESULTADO ----------------
  pdf.setFillColor(240, 248, 255);
  pdf.rect(margin, y, 170, 30, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("Resultado", margin + 3, y + 7);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Pontuação: ${d.pontuacao}`, margin + 3, y + 15);
  pdf.text(`Status: ${d.status}`, margin + 3, y + 22);
  pdf.text(`ID do diagnóstico: ${d.id}`, margin + 3, y + 29);
  y += 35;

  // ---------------- AVISO LEGAL ----------------
  pdf.setFontSize(10);
  pdf.text(
    "Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial ou laudo de engenharia.",
    margin, y, { maxWidth: 170 }
  );

  // ---------------- RODAPÉ ----------------
  const footerText = `Data de impressão: ${new Date().toLocaleDateString()}`;
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.text(footerText, 105, 287, { align: "center" });
  }

  pdf.save(`CheckInfra-${d.id}.pdf`);
}

// ================= MAIN =================
document.addEventListener("DOMContentLoaded",()=>{
  sincronizarOffline();

  const fotosInput = document.getElementById("fotos");
  const preview = document.getElementById("preview");
  let fotosBase64 = [];

  fotosInput.addEventListener("change",()=>{
    preview.innerHTML="";
    fotosBase64=[];
    [...fotosInput.files].forEach(file=>{
      const reader = new FileReader();
      reader.onload = e=>{
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

  form.addEventListener("submit", async e=>{
    e.preventDefault();

    let pontuacao = 0;
    let problemas = [];
    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    let status="Adequada",classe="ok";
    if(pontuacao>=8){status="Crítica";classe="critico";}
    else if(pontuacao>=4){status="Alerta";classe="alerta";}

    const dados = {
      id: gerarIdCheckInfra(),
      escola: document.getElementById("escola").value,
      avaliador: document.getElementById("avaliador").value,
      pontuacao,
      status,
      classe,
      problemas,
      fotos: fotosBase64,
      logoPath: "./assets/logo-checkinfra.png"
    };

    window.idcheckinfra = dados.id;

    // Atualiza card de diagnóstico
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">
        ${classe === "ok" ? "Condição adequada" :
          classe === "alerta" ? "Situação de alerta" :
          "Condição crítica"}
      </div>
      <strong>IDCHECKINFRA:</strong><br>${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine ? "Enviado ao sistema" : "Salvo offline — será sincronizado"}
    `;

    try{
      if(navigator.onLine){
        await setDoc(doc(db,"avaliacoes",dados.id),{...dados,createdAt:serverTimestamp()});
      } else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Gera PDF
    gerarPDF(dados);

    // Reset e redirecionamento automático
    form.reset();
    preview.innerHTML="";
    fotosBase64=[];
    setTimeout(()=>{ window.location.href = "./index.html"; }, 5000);
  });
});