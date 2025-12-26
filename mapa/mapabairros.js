import { map, avaliacoes } from "./mapa.js";
import booleanPointInPolygon from "https://cdn.jsdelivr.net/npm/@turf/boolean-point-in-polygon@6.0.1/dist/es/index.js";

let camadaBairros = L.geoJSON(null);

const statusCores = {
  "adequado":"#4CAF50",
  "alerta":"#FFD700",
  "atenção":"#FF9800",
  "critico":"#F44336",
  "crítico":"#F44336"
};

const bola = { adequado: "🟢", alerta: "🟡", atenção: "🟠", crítico: "🔴" };

export async function carregarBairros(){
  const res = await fetch("./POLIGONAIS.geojson");
  const geo = await res.json();

  camadaBairros = L.geoJSON(geo,{
    style: estiloBairro,
    onEachFeature: (f,l)=> l.bindTooltip(tooltipBairro(f))
  });
}

function estiloBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const pt = { type:"Point", coordinates:[a.lng,a.lat] };
    return booleanPointInPolygon(pt, feature);
  });

  if(escolas.length===0) return { fillOpacity:0, color:"#999", weight:1 };

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s = (e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const total = escolas.length;
  const pCrit = cont.crítico/total;
  const pAtencao = cont.atenção/total;
  const pAlerta = cont.alerta/total;

  let cor = "#4CAF50";
  if(pCrit>=0.5) cor="#F44336";
  else if(pCrit<0.5 && pAtencao>=0.5) cor="#FF9800";
  else if(pCrit===0 && pAtencao<0.5 && pAlerta>=0.5) cor="#FFD700";

  return { fillColor:cor, fillOpacity:.45, color:"#555", weight:1 };
}

function tooltipBairro(feature){
  const escolas = avaliacoes.filter(a=>{
    const pt = { type:"Point", coordinates:[a.lng,a.lat] };
    return booleanPointInPolygon(pt, feature);
  });

  if(escolas.length===0) return `<strong>${feature.properties.nome}</strong><br>⚪ Sem dados – avaliação necessária.`;

  const cont={ adequado:0, alerta:0, atenção:0, crítico:0 };
  escolas.forEach(e=>{
    const s=(e.status||"").toLowerCase();
    if(s.includes("adequado")) cont.adequado++;
    else if(s.includes("alerta")) cont.alerta++;
    else if(s.includes("atenção")) cont.atenção++;
    else cont.crítico++;
  });

  const t = escolas.length;
  const p = k => Math.round((cont[k]/t)*100);

  let observacao="";
  if(p("crítico")>=50) observacao = "🔴 Problema generalizado – alto risco de impacto.";
  else if(p("atenção")>=50) observacao = "🟠 Problema localizado, tendência de piora.";
  else if(p("alerta")>=50) observacao = "🟡 Problema pontual, monitoramento recomendado.";
  else observacao = "🟢 Situação controlada – continuar acompanhamento rotineiro.";

  return `
    <strong>${feature.properties.nome}</strong><br>
    ${bola.crítico} ${p("crítico")}% crítico (${cont.crítico})<br>
    ${bola.atenção} ${p("atenção")}% atenção (${cont.atenção})<br>
    ${bola.alerta} ${p("alerta")}% alerta (${cont.alerta})<br>
    ${bola.adequado} ${p("adequado")}% adequado (${cont.adequado})<br>
    Observação: ${observacao}
  `;
}

export function toggleBairros(show){
  if(show) camadaBairros.addTo(map);
  else map.removeLayer(camadaBairros);
}