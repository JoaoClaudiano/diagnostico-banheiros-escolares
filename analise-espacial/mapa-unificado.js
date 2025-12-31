// mapa-unificado.js - ORQUESTRADOR
console.log('🗺️ Carregando mapa unificado...');

let map = null;
let escolasLayer = null;
let heatLayer = null;
let zonasLayer = null;

// Inicializar (USAR MAPA EXISTENTE)
function inicializarMapa() {
  if (window.map && window.map instanceof L.Map) {
    map = window.map;
    console.log('🗺️ Usando mapa global existente');

    setTimeout(() => {
      try { map.invalidateSize(); } catch (e) {}
    }, 200);

    return map;
  }

  console.error('❌ Mapa global não encontrado');
  return null;
}

// Plotar escolas (layer separada)
function plotarEscolas() {
  if (!map || !window.dadosManager) return;

  if (escolasLayer) map.removeLayer(escolasLayer);

  const marcadores = [];

  window.dadosManager.getEscolas().forEach(escola => {
    if (!escola.lat || !escola.lng) return;

    const cor = getCorPorClasse(escola.classe);

    const marker = L.circleMarker([escola.lat, escola.lng], {
      radius: 6,
      fillColor: cor,
      color: '#222',
      fillOpacity: 0.8
    });

    marker.bindTooltip(escola.nome || 'Escola');
    marcadores.push(marker);
  });

  escolasLayer = L.layerGroup(marcadores).addTo(map);
  console.log(`✅ ${marcadores.length} escolas (layer unificado)`);
}

// Heatmap
function adicionarMapaCalor() {
  if (!map || !window.dadosManager) return;

  if (heatLayer) map.removeLayer(heatLayer);

  const pontos = window.dadosManager.getEscolas()
    .filter(e => e.lat && e.lng && e.peso > 0)
    .map(e => [e.lat, e.lng, e.peso * 10]);

  if (!pontos.length) return;

  heatLayer = L.heatLayer(pontos, {
    radius: 25,
    blur: 15,
    maxZoom: 17
  }).addTo(map);

  console.log('🔥 Heatmap adicionado');
}

// Zonas críticas
function adicionarZonasRisco() {
  if (!map || !window.dadosManager) return;

  if (zonasLayer) map.removeLayer(zonasLayer);

  const circulos = window.dadosManager.getEscolas()
    .filter(e => e.classe?.toLowerCase().includes('crít'))
    .map(e => L.circle([e.lat, e.lng], {
      radius: 500,
      color: '#dc3545',
      fillOpacity: 0.2
    }));

  zonasLayer = L.layerGroup(circulos).addTo(map);
  console.log(`🟥 ${circulos.length} zonas de risco`);
}

// Cor por classe
function getCorPorClasse(classe) {
  if (!classe) return '#6c757d';
  const c = classe.toLowerCase().trim();
  return {
    'adequada': '#28a745',
    'alerta': '#ffc107',
    'atenção': '#fd7e14',
    'atencao': '#fd7e14',
    'crítico': '#dc3545',
    'critico': '#dc3545'
  }[c] || '#6c757d';
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(inicializarMapa, 1000);
});

window.inicializarMapa = inicializarMapa;
window.plotarEscolas = plotarEscolas;
window.adicionarMapaCalor = adicionarMapaCalor;
window.adicionarZonasRisco = adicionarZonasRisco;

console.log('✅ mapa-unificado.js carregado');