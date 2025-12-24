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
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const margin = 20;
  let y = margin;

  // Logo
  if(d.logo){
    const imgProps = pdf.getImageProperties(d.logo);
    const maxWidth = 40;
    const ratio = imgProps.width / imgProps.height;
    const logoWidth = Math.min(maxWidth, imgProps.width);
    const logoHeight = logoWidth / ratio;
    pdf.addImage(d.logo,"PNG",margin,y,logoWidth,logoHeight);
  }

  // Título centralizado
  y += 30;
  pdf.setFont("Times","bold").setFontSize(16);
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 8;
  pdf.setFont("Times","normal").setFontSize(14);
  pdf.text("RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",105,y,{align:"center"});
  y += 12;

  // Data lateral
  const dataPrint = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
  pdf.setFontSize(9).setTextColor(255,0,0);
  pdf.text(dataPrint, 200, margin, {align:"right", baseline:"top"});
  pdf.setTextColor(0,0,0);

  // CARD 1 — Identificação
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,35,4,4,"F");
  pdf.setFont("Times","bold").setFontSize(14);
  pdf.text("Identificação",margin+3,y+7);
  pdf.setFont("Times","normal").setFontSize(12);
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  pdf.text(`ID: ${d.id} `,margin+3,y+29); // espaço extra no final
  y += 40;

  // CARD 2 — Problemas apontados
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,d.problemas.length*7 + 15,4,4,"F");
  pdf.setFont("Times","bold").setFontSize(14);
  pdf.text("Problemas apontados",margin+3,y+7);
  pdf.setFont("Times","normal").setFontSize(12);
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,margin+5,yP);
    yP += 7;
  });
  y = yP + 5;

  // CARD 3 — Resultado
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,30,4,4,"F");
  pdf.setFont("Times","bold").setFontSize(14);
  pdf.text("Resultado",margin+3,y+7);
  pdf.setFont("Times","normal").setFontSize(12);
  pdf.text(`Pontuação: ${d.pontuacao}`,margin+3,y+15);
  pdf.text(`Status: ${d.status} ${d.corBolinha}`,margin+3,y+22);
  y += 35;

  // CARD 4 — Registro fotográfico
  pdf.setFillColor(240,240,240);
  const cardAlturaFotos = d.fotos.length > 0 ? 60 : 25;
  pdf.roundedRect(margin,y,170,cardAlturaFotos,4,4,"F");
  pdf.setFont("Times","bold").setFontSize(14);
  pdf.text("Registro fotográfico",margin+3,y+7);
  y += 12;
  for(let i=0;i<d.fotos.length;i++){
    const file = d.fotos[i];
    await new Promise(resolve=>{
      const reader = new FileReader();
      reader.onload = e=>{
        pdf.addImage(e.target.result,'JPEG',margin+5,y,50,50);
        y+=55;
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
  y += 5;

  // CARD 5 — Aviso legal
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,20,4,4,"F");
  pdf.setFont("Times","normal").setFontSize(10);
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.",105,y+10,{align:"center"});

  // Numeração página
  pdf.setFontSize(9).setFont("Times","normal");
  const pageCount = pdf.getNumberOfPages();
  for(let i=1;i<=pageCount;i++){
    pdf.setPage(i);
    pdf.text(`Página ${i} de ${pageCount}`,105,290,{align:"center"});
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

    // Redirecionamento automático após 4s
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

    form.reset();
    preview.innerHTML="";
  });
});