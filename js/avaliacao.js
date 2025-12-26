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

  const margin = 15;
  let y = margin;

  // LOGO centralizada
  if(d.logo){
    const imgProps = await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ w: img.width, h: img.height });
      img.src = d.logo;
    });
    const scale = Math.min(50 / imgProps.w, 30 / imgProps.h);
    pdf.addImage(d.logo, "PNG", (210 - imgProps.w*scale)/2, y, imgProps.w*scale, imgProps.h*scale);
  }

  y += 35;
  pdf.setFont("Times","bold");
  pdf.setFontSize(14);
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 7;

  pdf.setFont("Times","normal");
  pdf.setFontSize(12);
  pdf.text(
    "RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",
    105,y,{align:"center"}
  );
  y += 12;

  function alturaMinima(contentHeight, minHeight=25){ return Math.max(contentHeight, minHeight); }

  // CARD 1 — Identificação
  const alturaIdentificacao = alturaMinima(35);
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin, y, 180, alturaIdentificacao, 5,5,'F');
  pdf.setFont("Times","bold");
  pdf.text("Identificação", margin+3, y+7);
  pdf.setFont("Times","normal");
  pdf.text(`Escola: ${d.escola}`, margin+3, y+15);
  pdf.text(`Avaliador: ${d.avaliador}`, margin+3, y+22);
  pdf.text(`ID: ${d.id}`, margin+3, y+29);
  y += alturaIdentificacao + 5;

  // CARD 2 — Problemas
  const alturaProblemas = alturaMinima(d.problemas.length*7 + 20);
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin, y, 180, alturaProblemas, 5,5,'F');
  pdf.setFont("Times","bold");
  pdf.text("Problemas apontados", margin+3, y+7);
  pdf.setFont("Times","normal");
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`, margin+5, yP);
    yP += 7;
  });
  y += alturaProblemas + 5;

  // CARD 3 — Resultado
  let alturaResultado = alturaMinima(30);
  if(d.classe==="ok") pdf.setFillColor(212,237,218);
  else if(d.classe==="alerta") pdf.setFillColor(255,243,205);
  else if(d.classe==="atencao") pdf.setFillColor(255,230,204);
  else if(d.classe==="critico") pdf.setFillColor(248,215,218);
  pdf.roundedRect(margin, y, 180, alturaResultado, 5,5,'F');
  pdf.setFont("Times","bold");
  pdf.text("Resultado", margin+3, y+7);
  pdf.setFont("Times","normal");
  pdf.text(`Situação: ${d.status}`, margin+3, y+15);
  pdf.text(`Pontuação: ${d.pontuacao}`, margin+3, y+22);
  y += alturaResultado + 5;

  // CARD 4 — Registro fotográfico
  let alturaFotos = alturaMinima(d.fotos.length*55, 40);
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin, y, 180, alturaFotos, 5,5,'F');
  pdf.setFont("Times","bold");
  pdf.text("Registro fotográfico", margin+3, y+7);
  pdf.setFont("Times","normal");
  let yF = y + 14;
  for(let i=0; i<d.fotos.length; i++){
    const file = d.fotos[i];
    await new Promise(resolve=>{
      const reader = new FileReader();
      reader.onload = e=>{
        pdf.addImage(e.target.result,'JPEG',margin+3,yF,50,50);
        yF += 55;
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }
  y += alturaFotos + 5;

  // CARD 5 — Aviso legal
  const alturaAviso = alturaMinima(20);
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin, y, 180, alturaAviso, 5,5,'F');
  pdf.setFont("Times","bold");
  pdf.text("Aviso legal", 105, y+7, {align:'center'});
  pdf.setFont("Times","normal");
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.", 105, y+15, {align:'center', maxWidth:170});
  y += alturaAviso + 5;

  // DATA e numeração
  pdf.setTextColor(255,0,0);
  pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 195, 290, {align:'right'});
  pdf.setTextColor(0,0,0);
  pdf.setFontSize(10);
  pdf.text(`Página 1`, 105, 295, {align:'center'});

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

    let status="Condição adequada",classe="ok";
    if(pontuacao >= 12){ status="Condição crítica"; classe="critico"; }
    else if(pontuacao >= 8){ status="Atenção elevada"; classe="atencao"; }
    else if(pontuacao >= 4){ status="Situação de alerta"; classe="alerta"; }

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
      rt: 0,
      problemas,
      fotos: fotosBase64,
      logo: "./assets/logo-checkinfra.png"
    };

    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${status}</div>
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
      } else {
        salvarOffline(dados);
      }
    }catch{
      salvarOffline(dados);
    }

    await gerarPDF(dados);

    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

    form.reset();
    preview.innerHTML="";
  });
});