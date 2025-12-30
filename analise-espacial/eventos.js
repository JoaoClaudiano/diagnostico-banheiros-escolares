document.getElementById("seletorIndicador").addEventListener("change", e=>{
  modoIndicador = Number(e.target.value);
  recalcularMapa(dadosOriginais);
});

document.getElementById("toggleZonas").addEventListener("change", e=>{
  e.target.checked ? map.addLayer(camadaZonas) : map.removeLayer(camadaZonas);
});