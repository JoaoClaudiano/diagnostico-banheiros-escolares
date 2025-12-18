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
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CHECKINFRA – AVALIAÇÃO SANITÁRIA",105,15,{align:"center"});
  pdf.setFontSize(11);
  pdf.text(`Escola: ${d.escola}`,20,30);
  pdf.text(`Avaliador: ${d.avaliador}`,20,38);
  pdf.text(`Código: ${d.id}`,20,46);
  pdf.text(`Pontuação: ${d.pontuacao}`,20,54);
  pdf.text(`Status: ${d.status}`,20,62);

  let y = 75;
  pdf.text("Problemas:",20,y); y+=8;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,25,y);
    y+=7;
  });

  if(d.fotos.length){
    pdf.addPage();
    pdf.text("Registro fotográfico",105,15,{align:"center"});
    let x=20,yImg=25;
    d.fotos.forEach(img=>{
      pdf.addImage(img,"JPEG",x,yImg,80,60);
      x+=90;
      if(x>120){x=20;yImg+=70;}
    });
  }

  pdf.addPage();
  pdf.setFontSize(10);
  pdf.text(
    "Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial "
    +"ou laudo de engenharia.",
    20,30,{maxWidth:170}
  );

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

  document.getElementById("form-avaliacao").addEventListener("submit",async e=>{
    e.preventDefault();

    let pontuacao=0,problemas=[];
    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao+=Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    let status="Adequada",classe="ok";
    if(pontuacao>=8){status="Crítica";classe="critico";}
    else if(pontuacao>=4){status="Alerta";classe="alerta";}

    const dados={
      id:gerarIdCheckInfra(),
      escola:document.getElementById("escola").value,
      avaliador:document.getElementById("avaliador").value,
      pontuacao,
      status,
      classe,
      problemas,
      fotos:fotosBase64
    };

    // **Define global ID para HTML e PDF**
    window.idcheckinfra = dados.id;

    try{
      if(navigator.onLine){
        await setDoc(doc(db,"avaliacoes",dados.id),{...dados,createdAt:serverTimestamp()});
      }else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Atualiza card de diagnóstico no HTML imediatamente
    const resultado = document.getElementById("resultado");
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + (classe==="ok" ? "ok" : classe==="alerta" ? "alerta" : "critico");
    resultado.innerHTML = `
      <div class="selo">
        ${classe==="ok" ? "🟢 Condição adequada" :
          classe==="alerta" ? "🟡 Situação de alerta" :
          "🔴 Condição crítica"}
      </div>
      <strong>IDCHECKINFRA:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine ? "☁️ Enviado ao sistema" : "📴 Salvo offline — será sincronizado"}
    `;

    // Gera o PDF
    gerarPDF(dados);

    // Limpa form
    e.target.reset();
    preview.innerHTML="";
    fotosBase64=[];
  });
});
