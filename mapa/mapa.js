// mapa.js
import { avaliacoes } from "./avaliacoes.js"; // arquivo separado ou importar do Firebase
import { carregarBairros, toggleBairros } from "./mapabairros.js";

export const map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

let camadaPontos = L.layerGroup().addTo(map);

// cores por classe
const statusCores = { ok:"#4CAF50", alerta:"#FFD700", atencao:"#FF9800", critico:"#F44336" };
const pulsosFreq = { critico:1200, atencao:2400, alerta:3600, ok:4800 };

// Cria um ponto com tooltip
export function criarPonto(d){
  const status = (d.classe||"").toLowerCase();
  const cor = statusCores[status] || "#000";

  const obs = status === "critico" ? "🔴 Problema grave – intervenção imediata recomendada." :
              status === "atencao" ? "🟠 Problema localizado, tendência de evoluir a crítico." :
              status === "alerta" ? "🟡 Problema pontual, monitoramento recomendado." :
              "🟢 Situação satisfatória – manutenção do acompanhamento.";

  const marker = L.circleMarker([d.lat,d.lng],{
    radius:8, color:cor, fillColor:cor, fillOpacity:0.8
  }).bindPopup(`
    <strong>${d.escola}</strong><br>
    Status: ${d.status}<br>
    Pontuação: ${d.pontuacao || "-"}<br>
    Última avaliação: ${d.data || "-"}<br>
    Observação: ${obs}
  `);

  // pulso animado
  if(document.getElementById("togglePulso").checked){
    pulso(marker,status);
  }

  return marker;
}

// animação pulsante sem alterar o tamanho do ponto, apenas efeito de brilho
function pulso(marker,status){
  const freq = pulsosFreq[status] || 2400;
  let opacity = 0.3;
  let growing = true;
  setInterval(()=>{
    opacity = growing ? 1 : 0.3;
    marker.setStyle({ fillOpacity: opacity });
    growing = !growing;
  }, freq);
}

// atualiza todos os pontos
export function atualizarPontos(){
  camadaPontos.clearLayers();
  avaliacoes.forEach(d=>{
    const s = (d.classe||"").toLowerCase();
    if(
      (s==="ok" && !document.getElementById("fAdequado").checked) ||
      (s==="alerta" && !document.getElementById("fAlerta").checked) ||
      (s==="atencao" && !document.getElementById("fAtencao").checked) ||
      (s==="critico" && !document.getElementById("fCritico").checked)
    ) return;
    criarPonto(d).addTo(camadaPontos);
  });
}

// checkbox mapa vivo
document.getElementById("togglePulso").checked = true;

// status checkbox
document.getElementById("fAdequado").checked = true;
document.getElementById("fAlerta").checked = true;
document.getElementById("fAtencao").checked = true;
document.getElementById("fCritico").checked = true;

// eventos de checkbox
document.querySelectorAll("input").forEach(i=>{
  i.addEventListener("change", async e=>{
    atualizarPontos();
    if(i.id==="toggleBairros"){
      if(i.checked){
        await carregarBairros(map);
        toggleBairros(map,true);
      } else {
        toggleBairros(map,false);
      }
    }
  });
});

// carrega pontos do Firebase
export async function carregarAvaliacoes(){
  // exemplo: importar do Firebase
  // avaliacoes = await fetchFirebaseAvaliacoes();
}
