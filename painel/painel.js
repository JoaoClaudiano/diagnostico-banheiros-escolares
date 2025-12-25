// CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ELEMENTOS
const tabelaRanking = document.getElementById("tabelaRanking");
const tabelaHistorico = document.getElementById("tabelaHistorico");
const kpiCritica = document.getElementById("kpiCritica");
const kpiAtencao = document.getElementById("kpiAtencao");
const kpiMedio = document.getElementById("kpiMedio");
const kpiProblemas = document.getElementById("kpiProblemas");
const modalIPT = document.getElementById("modalIPT");

let rankingGlobal = [];
let rankingHistorico = [];

// FUNÇÃO PARA MONTAR DADOS
function montar(dados) {
  rankingGlobal = [];
  rankingHistorico = [];
  tabelaRanking.innerHTML = "";
  tabelaHistorico.innerHTML = "";

  const statusCount = { adequada: 0, alerta: 0, atencao: 0, critica: 0 };
  const problemasCount = {};
  const escolasMap = {};
  let somaIPT = 0, critica=0, atencao=0;

  dados.forEach(d => {
    let peso = 1, classe = "adequada";
    const s = (d.status||"").toLowerCase();
    if(s.includes("crít")) { peso=4; classe="critica"; critica++; statusCount.critica++; }
    else if(s.includes("aten")) { peso=3; classe="atencao"; atencao++; statusCount.atencao++; }
    else if(s.includes("alerta")) { peso=2; classe="alerta"; statusCount.alerta++; }
    else statusCount.adequada++;

    const pont = Number(d.pontuacao||0);
    const rt = Number(d.rt||0); // Frequência do status
    // Cálculo IPT com pesos: peso*0.4 + pont*0.4 + rt*0.2
    const IPT = (peso*0.4)+(pont*0.4)+(rt*0.2);
    somaIPT += IPT;

    if(d.problemas && Array.isArray(d.problemas)) {
      d.problemas.forEach(p => { problemasCount[p] = (problemasCount[p]||0)+1; });
    }

    const registro = {
      escola: d.escola||"Sem nome",
      classe,
      statusLabel: classe==="critica"?"Crítica":classe==="atencao"?"Atenção Elevada":classe==="alerta"?"Alerta":"Adequada",
      IPT,
      diasNoStatus: rt,
      data: d.createdAt ? new Date(d.createdAt.seconds*1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    };

    rankingHistorico.push(registro);
    // Última avaliação por escola
    if(!escolasMap[registro.escola] || new Date(registro.data) > new Date(escolasMap[registro.escola].data)) {
      escolasMap[registro.escola] = registro;
    }
  });

  rankingGlobal = Object.values(escolasMap);

  // KPIs
  kpiCritica.innerText = critica;
  kpiAtencao.innerText = atencao;
  kpiMedio.innerText = (somaIPT/dados.length).toFixed(2);
  kpiProblemas.innerText = Object.keys(problemasCount).length;

  // Ranking
  rankingGlobal.sort((a,b) => b.IPT - a.IPT);
  rankingGlobal.forEach((r,i) => {
    tabelaRanking.innerHTML += `<tr>
      <td>${i+1}</td>
      <td>${r.escola}</td>
      <td><span class="badge ${r.classe}">${r.statusLabel}</span></td>
      <td>${r.IPT.toFixed(2)}</td>
    </tr>`;
  });

  // Histórico
  rankingHistorico.sort((a,b) => new Date(b.data) - new Date(a.data));
  rankingHistorico.forEach((r,i) => {
    tabelaHistorico.innerHTML += `<tr>
      <td>${i+1}</td>
      <td>${r.escola}</td>
      <td><span class="badge ${r.classe}">${r.statusLabel}</span></td>
      <td>${r.IPT.toFixed(2)}</td>
      <td>${r.data}</td>
    </tr>`;
  });

  // Gráficos
  new Chart(document.getElementById("graficoStatus"),{
    type:"pie",
    data:{ labels:["Adequada","Alerta","Atenção","Crítica"], datasets:[{ data:Object.values(statusCount), backgroundColor:["#4caf50","yellow","#ff7043","#f44336"] }] }
  });

  new Chart(document.getElementById("graficoIndice"),{
    type:"bar",
    data:{ labels: rankingGlobal.slice(0,10).map(r=>r.escola), datasets:[{ data: rankingGlobal.slice(0,10).map(r=>r.IPT.toFixed(2)), backgroundColor:"#1f4fd8" }] },
    options:{ indexAxis:"y", plugins:{ legend:{ display:false } } }
  });

  new Chart(document.getElementById("graficoProblemas"),{
    type:"bar",
    data:{ labels:Object.keys(problemasCount), datasets:[{ label:"Ocorrências", data:Object.values(problemasCount), backgroundColor:"#ff9800" }] },
    options:{ indexAxis:"y", plugins:{ legend:{ display:false } } }
  });
}

// CARREGA DADOS FIREBASE
async function carregarAvaliacoes(){
  try {
    const snapshot = await db.collection("avaliacoes").get();
    const dados = [];
    snapshot.forEach(doc => dados.push(doc.data()));
    montar(dados);
  } catch(err) {
    console.error("❌ Erro ao carregar dados do Firebase:", err);
  }
}

// EXPORTAÇÃO XLSX
window.exportarXLSX = function() {
  if(!rankingGlobal.length){ alert("Nenhum dado disponível."); return; }
  const exportData = rankingGlobal.map(r=>({
    Escola: r.escola,
    Status: r.statusLabel,
    IPT: r.IPT.toFixed(2)
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Ranking IPT");
  XLSX.writeFile(wb,"ranking_checkinfra.xlsx");
};

window.exportarHistorico = function() {
  if(!rankingHistorico.length){ alert("Nenhum dado disponível."); return; }
  const exportData = rankingHistorico.map(r=>({
    Escola: r.escola,
    Status: r.statusLabel,
    IPT: r.IPT.toFixed(2),
    Data: r.data
  }));
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"Historico Completo");
  XLSX.writeFile(wb,"historico_checkinfra.xlsx");
};

// MODAL E ABAS
function abrirModal(){ modalIPT.style.display="flex"; }
function fecharModal(){ modalIPT.style.display="none"; }

function mostrarAba(aba){
  document.getElementById("aba-ranking").style.display="none";
  document.getElementById("aba-historico").style.display="none";
  document.getElementById("aba-"+aba).style.display="block";
  document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
  document.querySelector(`.tab[onclick="mostrarAba('${aba}')"]`).classList.add("active");
}

// SIDEBAR
function abrirSidebar(){ document.getElementById("sidebarMenu").style.display="block"; }
function fecharSidebar(){ document.getElementById("sidebarMenu").style.display="none"; }

// INICIALIZA
carregarAvaliacoes();
