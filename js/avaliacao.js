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
    await new Promise(resolve => {
      img.onload = () => {
        const ratio = img.width / img.height;
        const width = 50;
        const height = width / ratio;
        pdf.addImage(img, "PNG", 80, y, width, height);
        resolve();
      };
    });
  }

  y += 35;
  pdf.setFontSize(14).setFont("helvetica","bold");
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 7;

  pdf.setFontSize(12).setFont("helvetica","normal");
  pdf.text(
    "RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",
    105,y,{align:"center"}
  );
  y += 12;

  // ================= CARD 1: Identificação =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,35,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Identificação",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  pdf.text(`Data da Avaliação: ${new Date().toLocaleDateString()}`,margin+3,y+29);
  y += 40;

  // ================= CARD 2: Problemas apontados =================
  pdf.setFillColor(240,240,240);
  const problemasHeight = d.problemas.length*7 + 15;
  pdf.rect(margin,y,180, problemasHeight, "F");
  pdf.setFont("helvetica","bold");
  pdf.text("Problemas apontados",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,margin+5,yP);
    yP += 7;
  });
  y = y + problemasHeight + 5;

  // ================= CARD 3: Resultado =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,22,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Resultado",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  pdf.text(`Status: ${d.status} ${d.corBolinha}`,margin+3,y+15);
  pdf.text(`Pontuação: ${d.pontuacao}`,margin+60,y+15);
  pdf.text(`ID: ${d.id}`,margin+120,y+15);
  y += 27;

  // ================= CARD 4: Registro fotográfico =================
  pdf.setFillColor(240,240,240);
  const fotoHeight = d.fotos.length ? 60 : 25;
  pdf.rect(margin,y,180,fotoHeight,"F");
  pdf.setFont("helvetica","bold");
  pdf.text("Registro fotográfico",margin+3,y+7);
  pdf.setFont("helvetica","normal");
  let yF = y + 14;
  for(const f of d.fotos){
    pdf.addImage(f, "JPEG", margin+5, yF, 50, 50);
    yF += 55;
  }
  y += fotoHeight + 5;

  // ================= CARD 5: Aviso legal =================
  pdf.setFillColor(240,240,240);
  pdf.rect(margin,y,180,15,"F");
  pdf.setFont("helvetica","normal");
  pdf.setFontSize(8);
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.",margin+3,y+10);
  y += 20;

  // ================= Data de impressão lateral =================
  pdf.setTextColor(255,0,0);
  pdf.setFontSize(8);
  pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 190, 10, {align:"right", baseline:"top"});
  pdf.setTextColor(0,0,0); // volta para preto

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

    // Exibe card diagnóstico
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

    // Gera PDF
    await gerarPDF(dados);

    // Limpa formulário e preview
    form.reset();
    preview.innerHTML="";

    // Redirecionamento automático após 4s
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

  });
});