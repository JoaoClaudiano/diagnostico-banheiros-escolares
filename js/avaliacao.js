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

  // Pop-up offline
  showOfflinePopup();
}

async function sincronizarOffline(){
  if(!navigator.onLine) return;
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  if(!l.length) return;

  for(const d of l){
    try{
      await db.collection("avaliacoes").doc(d.id).set({
        ...d,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Sincronizado:", d.id);
    } catch(err){
      console.error("Erro ao sincronizar offline:", err);
    }
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= POP-UP OFFLINE =================
function showOfflinePopup(){
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff3cd";
  popup.style.color = "#856404";
  popup.style.padding = "20px 30px";
  popup.style.borderRadius = "12px";
  popup.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  popup.style.zIndex = "9999";
  popup.style.fontWeight = "bold";
  popup.style.textAlign = "center";
  popup.innerHTML = `Você está offline! A avaliação será sincronizada quando a conexão voltar.
    <button id="closePopup" style="margin-left:10px; background:none; border:none; font-size:16px; cursor:pointer;">❌</button>`;
  document.body.appendChild(popup);

  const closeBtn = document.getElementById("closePopup");
  closeBtn.addEventListener("click", () => popup.remove());

  setTimeout(()=>{ popup.remove(); },3000);
}

// ================= PDF =================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  // Logo centralizada sem distorcer
  if(d.logo){
    const img = new Image();
    img.src = d.logo;
    img.onload = function(){
      const ratio = img.width / img.height;
      const w = 50;
      const h = w / ratio;
      pdf.addImage(img, "PNG", (210-w)/2, y, w, h);
      addContent();
    };
  } else addContent();

  function addContent(){
    y += 35;
    pdf.setFont("times", "bold").setFontSize(14);
    pdf.text("CheckInfra",105,y,{align:"center"});
    y += 10;

    // Identificação
    pdf.setFillColor(240,240,240);
    pdf.roundedRect(margin,y,170,35,5,5,"F");
    pdf.setFont("times","bold").setFontSize(12);
    pdf.text("Identificação",margin+3,y+7);
    pdf.setFont("times","normal");
    pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
    pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
    pdf.text(`ID: ${d.id}`,margin+3,y+29);
    y += 40;

    // Problemas apontados
    pdf.setFillColor(240,240,240);
    pdf.roundedRect(margin,y,170,d.problemas.length*7 + 20,5,5,"F");
    pdf.setFont("times","bold").setFontSize(12);
    pdf.text("Problemas apontados",margin+3,y+7);
    pdf.setFont("times","normal");
    let yP = y + 14;
    d.problemas.forEach(p=>{
      pdf.text(`- ${p}`,margin+5,yP);
      yP += 7;
    });
    y = yP + 5;

    // Resultado
    pdf.setFillColor(240,240,240);
    pdf.roundedRect(margin,y,170,22,5,5,"F");
    pdf.setFont("times","bold").setFontSize(12);
    pdf.text("Resultado",margin+3,y+7);
    pdf.setFont("times","normal");
    pdf.text(`Status: ${d.status}`,margin+3,y+15);
    pdf.text(`Pontuação: ${d.pontuacao}`,margin+3,y+22);
    y += 27;

    // Registro fotográfico
    pdf.setFillColor(240,240,240);
    pdf.roundedRect(margin,y,170,40,5,5,"F");
    pdf.setFont("times","bold").setFontSize(12);
    pdf.text("Registro fotográfico",margin+3,y+7);
    pdf.setFont("times","normal");
    let yFoto = y + 14;
    d.fotos.forEach(f=>{
      pdf.addImage(f,"JPEG",margin+5,yFoto,40,40);
      yFoto += 45;
    });
    y += Math.max(yFoto - y, 40) + 5;

    // Aviso legal
    pdf.setFillColor(240,240,240);
    pdf.roundedRect(margin,y,170,15,5,5,"F");
    pdf.setFont("times","normal").setFontSize(9);
    pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.",margin+85,y+10,{align:"center"});
    y += 20;

    // Data lateral direita
    pdf.setTextColor(255,0,0);
    pdf.setFontSize(10);
    pdf.text(`Gerado em: ${new Date().toLocaleString()}`, 200, 290, {align:"right"});
    pdf.setTextColor(0,0,0);

    // Numeração de página
    pdf.setFontSize(9);
    pdf.text(`Página 1 de 1`, 105, 295,{align:"center"});

    pdf.save(`CheckInfra-${d.id}.pdf`);
  }
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
      problemas,
      fotos: fotosBase64,
      logo: "./assets/logo-checkinfra.png"
    };

    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${status}</div>
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
        console.log("Salvo no Firebase:", dados.id);
      } else salvarOffline(dados);
    }catch(err){
      console.error("Erro ao salvar no Firebase:", err);
      salvarOffline(dados);
    }

    gerarPDF(dados);

    // Redirecionamento automático após 4s
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

    form.reset();
    preview.innerHTML="";
  });
});