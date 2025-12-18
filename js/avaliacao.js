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

  const margin = 20;
  let y = margin;

  // Logo
  const logo = new Image();
  logo.src = 'assets/logo-checkinfra.png';
  await new Promise(resolve => { logo.onload = resolve; });
  pdf.addImage(logo, 'PNG', 105 - 20, y - 10, 40, 20); // centraliza
  y += 25;

  // Cabeçalho
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("CHECKINFRA – AVALIAÇÃO SANITÁRIA ESCOLAR", 105, y, { align: "center" });
  y += 12;

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(`ID do diagnóstico: ${d.id}`, margin, y);
  y += 7;
  pdf.text(`Escola: ${d.escola}`, margin, y);
  y += 7;
  pdf.text(`Avaliador: ${d.avaliador}`, margin, y);
  y += 7;
  pdf.text(`Pontuação: ${d.pontuacao}`, margin, y);
  y += 7;
  pdf.text(`Status: ${d.status}`, margin, y);
  y += 12;

  // Problemas
  pdf.setFont("helvetica", "bold");
  pdf.text("Problemas identificados:", margin, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  d.problemas.forEach(p => {
    pdf.text(`- ${p}`, margin + 5, y);
    y += 7;
  });

  // Registro fotográfico
  if (d.fotos.length) {
    pdf.addPage();
    y = margin;
    pdf.setFont("helvetica", "bold");
    pdf.text("Registro Fotográfico", 105, y, { align: "center" });
    y += 10;

    let x = margin;
    let rowHeight = 60;
    d.fotos.forEach((img, index) => {
      pdf.addImage(img, "JPEG", x, y, 80, 60);
      x += 90;
      if (x + 80 > 210 - margin) { // nova linha
        x = margin;
        y += rowHeight + 10;
      }
      if (y + rowHeight > 297 - margin) { // nova página
        pdf.addPage();
        y = margin;
        x = margin;
      }
    });
  }

  // Rodapé
  const footerText = `Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial ou laudo de engenharia. Impressão em: ${new Date().toLocaleDateString()}`;
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
      const reader=new FileReader();
      reader.onload=e=>{
        fotosBase64.push(e.target.result);
        const img=document.createElement("img");
        img.src=e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e=>{
    e.preventDefault();

    // Calcula pontuação e problemas
    let pontuacao = 0;
    let problemas = [];
    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    // Determina status
    let status="Adequada",classe="ok";
    if(pontuacao>=8){status="Crítica";classe="critico";}
    else if(pontuacao>=4){status="Alerta";classe="alerta";}

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

    try{
      if(navigator.onLine){
        await setDoc(doc(db,"avaliacoes",dados.id),{...dados,createdAt:serverTimestamp()});
      } else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Gera PDF
    gerarPDF(dados);

    // Reset do formulário e preview
    form.reset();
    preview.innerHTML="";
    fotosBase64=[];
  });
});
