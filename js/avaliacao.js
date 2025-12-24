// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
  mostrarToast("📴 Você está offline! A avaliação foi salva localmente e será sincronizada automaticamente.");
}

async function sincronizarOffline(){
  if(!navigator.onLine) return;
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  if(!l.length) return;

  for(const d of l){
    await db.collection("avaliacoes").doc(d.id).set({
      ...d,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= TOAST OFFLINE =================
function mostrarToast(mensagem){
  let toast = document.createElement("div");
  toast.textContent = mensagem;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.background = "#333";
  toast.style.color = "#fff";
  toast.style.padding = "12px 18px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";
  toast.style.zIndex = 9999;
  toast.style.fontSize = "14px";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease";
  document.body.appendChild(toast);

  setTimeout(()=>{ toast.style.opacity = "1"; }, 50); // fade in
  setTimeout(()=>{
    toast.style.opacity = "0";
    setTimeout(()=>{ toast.remove(); }, 300);
  }, 4000); // desaparece após 4s
}

// ================= PDF =================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  // Logo
  if(d.logo){
    const larguraLogo = 40;
    const alturaLogo = 25;
    pdf.addImage(d.logo,"PNG",(210-larguraLogo)/2,y,larguraLogo,alturaLogo);
  }

  y += 30;
  pdf.setFont("times","bold");
  pdf.setFontSize(16);
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 10;

  pdf.setFont("times","normal");
  pdf.setFontSize(12);
  pdf.text(
    "RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",
    105,y,{align:"center"}
  );
  y += 15;

  // CARD 1 — Identificação
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,30,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Identificação",margin+3,y+7);
  pdf.setFont("times","normal");
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  pdf.text(`ID: ${d.id}`,margin+3,y+29);
  y += 35;

  // CARD 2 — Problemas apontados
  pdf.setFillColor(240,240,240);
  const alturaProblemas = d.problemas.length*7 + 10;
  pdf.roundedRect(margin,y,170,alturaProblemas,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Problemas apontados",margin+3,y+7);
  pdf.setFont("times","normal");
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,margin+5,yP);
    yP += 7;
  });
  y += alturaProblemas + 5;

  // CARD 3 — Resultado
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,25,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Resultado",margin+3,y+7);
  pdf.setFont("times","normal");
  pdf.text(`Pontuação: ${d.pontuacao}`,margin+3,y+15);
  pdf.text(`Status: ${d.status} ${d.corBolinha}`,margin+3,y+22);
  y += 30;

  // CARD 4 — Registro Fotográfico
  const alturaFotos = d.fotos.length > 0 ? 60 : 20;
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,alturaFotos,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Registro Fotográfico",margin+3,y+7);
  pdf.setFont("times","normal");
  let yF = y + 15;
  for(const f of d.fotos){
    pdf.addImage(f,'JPEG',margin+3,yF,50,50);
    yF += 55;
  }
  y += alturaFotos + 5;

  // CARD 5 — Aviso legal
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,20,5,5,"F");
  pdf.setFont("times","normal");
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.",105,y+10,{align:"center"});
  y += 25;

  // Data lateral direita
  const data = new Date().toLocaleString();
  pdf.setTextColor(255,0,0);
  pdf.setFontSize(10);
  pdf.text(`Data da geração: ${data}`,205,10,{align:"right",baseline:'top'});
  pdf.setTextColor(0,0,0);

  // Numeração
  const totalPaginas = pdf.getNumberOfPages();
  for(let i=1;i<=totalPaginas;i++){
    pdf.setPage(i);
    pdf.setFontSize(10);
    pdf.text(`Página ${i}`,105,290,{align:"center"});
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

    let status="Condição adequada",classe="ok",corBolinha="🟢";
    if(pontuacao >= 12){ status="Condição crítica"; classe="critico"; corBolinha="🔴"; }
    else if(pontuacao >= 8){ status="Atenção elevada"; classe="atencao"; corBolinha="🟠"; }
    else if(pontuacao >= 4){ status="Situação de alerta"; classe="alerta"; corBolinha="🟡"; }

    const escolaSelecionada = document.getElementById("escola").value;
    const objEscola = window.escolas.find(e=>e.nome===escolaSelecionada) || {};

    const dados = {
      id: gerarIdCheckInfra(),
      escola: escolaSelecionada,
      lat: objEscola.lat || null,
      lng: objEscola.lng || null,
      avaliador: document.getElementById("avaliador").value,

      pontuacao,
      status,
      classe,
      corBolinha,

      rt: 0,
      problemas,
      fotos: fotosBase64,
      logo: "./assets/logo-checkinfra.png"
    };

    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${status} ${corBolinha}</div>
      <strong>ID:</strong>${dados.id}<br>
      <strong>Pontuação:</strong>${pontuacao}<br>
      <strong>Avaliador:</strong>${dados.avaliador}<br>
      ${navigator.onLine?"☁️ Enviado ao sistema":"📴 Salvo offline"}
    `;

    try{
      if(navigator.onLine){
        await db.collection("avaliacoes").doc(dados.id).set({
          ...dados,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    gerarPDF(dados);

    form.reset();
    preview.innerHTML="";

    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);
  });
});