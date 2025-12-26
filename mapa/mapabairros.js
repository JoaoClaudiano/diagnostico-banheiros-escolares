// mapabairros.js
import { avaliacoes } from "./mapa.js";

let camadaBairros = L.geoJSON(null);

const statusCores = { ok:"#4CAF50", alerta:"#FFD700", atencao:"#FF9800", critico:"#F44336" };
const bola = { ok:"🟢", alerta:"🟡", atencao:"🟠", critico:"🔴" };

// estilo do bairro
function estiloBairro(feature){
  if(!feature.geometry) return { fillOpacity:0, color:"#999", weight:1 };
  const escolas = avaliacoes.filter(a=>{
    if(!a.lat || !a.lng) return false;
    const polygon = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return polygon.getBounds().contains([a.lat,a.lng]);
  });
  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e=>{
    const c=(e.classe||"").toLowerCase();
    if(cont[c]!==undefined) cont[c]++;
  });

  const total = escolas.length;
  const pCrit = cont.critico/total;
  const pAtencao = cont.atencao/total;
  const pAlerta = cont.alerta/total;

  let cor = statusCores.ok;
  if(pCrit>=0.5) cor=statusCores.critico;
  else if(pCrit<0.5 && pAtencao>=0.5) cor=statusCores.atencao;
  else if(pCrit===0 && pAtencao<0.5 && pAlerta>=0.5) cor=statusCores.alerta;

  return { fillColor:cor, fillOpacity:0.45, color:"#555", weight:1 };
}

// tooltip
function tooltipBairro(feature){
  if(!feature.geometry) return "";
  const escolas = avaliacoes.filter(a=>{
    if(!a.lat || !a.lng) return false;
    const polygon = L.polygon(feature.geometry.coordinates[0].map(c=>[c[1],c[0]]));
    return polygon.getBounds().contains([a.lat,a.lng]);
  });
  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ ok:0, alerta:0, atencao:0, critico:0 };
  escolas.forEach(e=>{
    const c=(e.classe||"").toLowerCase();
    if(cont[c]!==undefined) cont[c]++;
  });

  const total = escolas.length;
  const p=k=>Math.round((cont[k]/total)*100);

  let observacao="";
  if(p("critico")>=50) observacao="🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atencao")>=50) observacao="🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) observacao="🟡 Problema pontual, monitoramento recomendado.";
  else observacao="🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    ${bola.critico} ${p("critico")}% crítico (${cont.critico})<br>
    ${bola.atencao} ${p("atencao")}% atenção (${cont.atencao})<br>
    ${bola.alerta} ${p("alerta")}% alerta (${cont.alerta})<br>
    ${bola.ok} ${p("ok")}% adequado (${cont.ok})<br>
    Observação: ${observacao}
  `;
}

// carrega geojson de bairros
export async function carregarBairros(map){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style:estiloBairro,
    onEachFeature:(f,l)=> l.bindTooltip(tooltipBairro(f))
  });
}

// ativa/desativa camada
export function toggleBairros(map, ativar){
  if(ativar) camadaBairros.addTo(map);
  else map.removeLayer(camadaBairros);
}
