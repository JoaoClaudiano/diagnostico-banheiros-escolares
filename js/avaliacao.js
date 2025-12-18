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
  if(d.logo){
    pdf.addImage(d.logo,"PNG",80,y,50,30); // ajuste de tamanho
  }
  y += 35;
  pdf.setFontSize(14);
  pdf.setFont("helvetica","bold");
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 7;
  pdf.setFontSize(12);
  pdf.setFont("helvetica","normal");
  pdf.text("RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",105,y,{align:"center"});
  y += 12;

  // === Card: Identificação ===
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,170,35,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Identificação",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  pdf.text(`Data da Avaliação: ${new Date().toLocaleDateString()}`,margin+3,y+29);
  y += 40;

  // === Card: Problemas ===
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,170, d.problemas.length*7 + 20,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Problemas apontados",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  let yProblema = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,margin+5,yProblema);
    yProblema += 7;
  });
  y = yProblema + 5;

  // === Card: Registro Fotográfico ===
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,170,65,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Registro Fotográfico",margin+3,y+7);
  if(d.fotos.length){
    let x = margin+3, yImg = y+15;
    d.fotos.forEach(img=>{
      pdf.addImage(img,"JPEG",x,yImg,80,60);
      x += 90;
      if(x+80>210-margin){x=margin+3;yImg+=70;}
      if(yImg+60>297-margin){pdf.addPage();yImg=margin;x=margin+3;}
    });
  }
  y += 70;

  // === Card: Resultado ===
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,170,20,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Resultado",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  pdf.text(`Pontuação: ${d.pontuacao}`,margin+3,y+14);
  pdf.text(`Status: ${d.status}`,margin+60,y+14);
  pdf.text(`ID Diagnóstico: ${d.id}`,margin+120,y+14);
  y += 25;

  // === Aviso Legal ===
  pdf.setFont("helvetica","normal");
  pdf.text("Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial ou laudo de engenharia.",margin,y);

  // === Rodapé com data de impressão ===
  const footerText = `Impressão em: ${new Date().toLocaleDateString()}`;
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  const pageCount = pdf.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    pdf.setPage(i);
    pdf.text(footerText,105,287,{align:"center"});
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

    // Pontuação e problemas
    let pontuacao = 0;
    let problemas = [];
    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    // Status
    let status="Adequada",classe="ok";
    if(pontuacao>=8){status="Crítica";classe="critico";}
    else if(pontuacao>=4){status="Alerta";classe="alerta";}

    // Escola selecionada e lat/lng da lista escolas.js
    const escolaSelecionada = document.getElementById("escola").value;
    const objEscola = window.escolas.find(e=>e.nome===escolaSelecionada) || {lat:null,lng:null};

    const dados = {
      id: gerarIdCheckInfra(),
      escola: escolaSelecionada,
      lat: objEscola.lat,
      lng: objEscola.lng,
      avaliador: document.getElementById("avaliador").value,
      pontuacao,
      status,
      classe,
      problemas,
      fotos: fotosBase64,
      logo: "./assets/logo-checkinfra.png"
    };

    window.idcheckinfra = dados.id;

    // Atualiza card
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">
        ${classe === "ok" ? "Condição adequada" :
          classe === "alerta" ? "Situação de alerta" :
          "Condição crítica"}
      </div>
      <strong>ID:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine ? "☁️ Enviado ao sistema" : "📴 Salvo offline — será sincronizado"}
    `;

    // Salva no Firebase ou offline
    try{
      if(navigator.onLine){
        await setDoc(doc(db,"avaliacoes",dados.id),{...dados,createdAt:serverTimestamp()});
      }else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Gera PDF
    gerarPDF(dados);

    // Reset do formulário e preview
    form.reset();
    preview.innerHTML=[];
  });
});