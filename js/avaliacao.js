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

// ================= PDF =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  let y = margin;

  // ================= LOGO =================
  if(d.logo){
    const img = new Image();
    img.src = d.logo;
    await new Promise(res=>{
      img.onload = ()=>{
        const w = 50; // largura fixa
        const h = (img.height/img.width)*w; // manter proporção
        pdf.addImage(img.src, "PNG", 80, y, w, h);
        y += h + 5;
        res();
      };
    });
  }

  // ================= TÍTULO =================
  pdf.setFont("times","normal");
  pdf.setFontSize(14);
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 8;
  pdf.setFontSize(12);
  pdf.text("RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",105,y,{align:"center"});
  y += 12;

  // ================= CARD IDENTIFICAÇÃO =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,35, "F");
  pdf.setFontSize(11);
  pdf.text("Identificação",margin+3,y+7);
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  // Espaço extra para o ID
  pdf.text(`ID: ${d.id}`, margin+3, y+29);
  y += 40;

  // ================= CARD PROBLEMAS =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,d.problemas.length*7 + 10,"F");
  pdf.text("Problemas apontados", margin+3, y+7);
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`, margin+5, yP);
    yP += 7;
  });
  y = yP + 5;

  // ================= CARD RESULTADO =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,25,"F");
  pdf.text("Resultado", margin+3, y+7);
  pdf.text(`Pontuação: ${d.pontuacao}`, margin+3, y+15);
  pdf.text(`Status: ${d.status} ${d.corBolinha}`, margin+3, y+22);
  y += 30;

  // ================= CARD REGISTRO FOTOGRÁFICO =================
  pdf.setFillColor(240,240,240);
  const fotosAltura = d.fotos.length > 0 ? 60 : 20;
  pdf.rect(margin,y,180,fotosAltura,"F");
  pdf.text("Registro Fotográfico", margin+3, y+7);
  let yF = y + 12;
  for(let i=0;i<d.fotos.length;i++){
    pdf.addImage(d.fotos[i],'JPEG', margin+3, yF, 50, 50);
    yF += 55;
  }
  y += fotosAltura + 5;

  // ================= CARD AVISO LEGAL =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,20,"F");
  pdf.setFontSize(9);
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.", margin+90, y+10, {align:"center"});
  y += 25;

  // ================= DATA NA LATERAL =================
  const dataStr = `Data de geração: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
  pdf.setTextColor(255,0,0);
  pdf.setFontSize(8);
  pdf.text(dataStr, 200, 10, {angle:90}); // vertical à direita
  pdf.setTextColor(0,0,0);

  // ================= NUMERAÇÃO =================
  const totalPages = pdf.internal.getNumberOfPages();
  for(let i=1;i<=totalPages;i++){
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.text(`Página ${i} de ${totalPages}`, 105, 290, {align:"center"});
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
      <strong>ID:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
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

    await gerarPDF(dados);

    form.reset();
    preview.innerHTML="";

    // Redirecionamento automático
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

  });
});