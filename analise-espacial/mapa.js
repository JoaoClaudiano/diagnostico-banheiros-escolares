// mapa.js - VERSÃO FUNCIONAL (DONO DO MAPA)
console.log('🗺️ Carregando módulo do mapa...');

let map = null;
let marcadores = [];
let heatLayer = null;

// Inicializar mapa
function inicializarMapa() {
  if (map) {
    console.log('⚠️ Mapa já inicializado');
    return map;
  }

  console.log('🗺️ Inicializando mapa...');

  const container = document.getElementById('map');
  if (!container) {
    console.error('❌ Container do mapa não encontrado');
    return null;
  }

  const centroFortaleza = [-3.717, -38.543];

  try {
    map = L.map('map').setView(centroFortaleza, 12);
    window.map = map; // 🔒 DONO GLOBAL

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.scale().addTo(map);

    console.log('✅ Mapa inicializado com sucesso');

    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', (dados) => {
        plotarEscolasNoMapa(dados.escolas);
      });
    }

    if (window.dadosManager?.getEscolas().length > 0) {
      setTimeout(() => {
        plotarEscolasNoMapa(window.dadosManager.getEscolas());
      }, 500);
    }

    return map;

  } catch (error) {
    console.error('❌ Erro ao inicializar mapa:', error);
    return null;
  }
}

// Plotar escolas
function plotarEscolasNoMapa(escolas) {
  if (!map) return;

  limparMarcadores();

  escolas.forEach(escola => {
    if (!escola.lat || !escola.lng) return;

    const cor = getCorPorClasse(escola.classe);

    const marker = L.circleMarker([escola.lat, escola.lng], {
      radius: 8,
      fillColor: cor,
      color: '#333',
      weight: 1,
      fillOpacity: 0.7
    });

    marker.bindTooltip(escola.nome || 'Escola');

    marker.addTo(map);
    marcadores.push(marker);
  });

  if (marcadores.length > 0) {
    const grupo = L.featureGroup(marcadores);
    map.fitBounds(grupo.getBounds().pad(0.1));
  }

  console.log(`✅ ${marcadores.length} escolas plotadas`);
}

// Limpar marcadores
function limparMarcadores() {
  marcadores.forEach(m => map.removeLayer(m));
  marcadores = [];
}

// Cor por classe (NORMALIZADA)
function getCorPorClasse(classe) {
  if (!classe) return '#6c757d';

  const c = classe.toLowerCase().trim();

  const cores = {
    'adequada': '#28a745',
    'alerta': '#ffc107',
    'atenção': '#fd7e14',
    'atencao': '#fd7e14',
    'crítico': '#dc3545',
    'critico': '#dc3545',
    'não avaliada': '#6c757d',
    'nao avaliada': '#6c757d'
  };

  return cores[c] || '#6c757d';
}

// Redimensionar
function invalidarTamanhoMapa() {
  if (map) setTimeout(() => map.invalidateSize(), 300);
}

// Eventos
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(inicializarMapa, 800);
});

window.inicializarMapa = inicializarMapa;
window.plotarEscolasNoMapa = plotarEscolasNoMapa;
window.invalidarTamanhoMapa = invalidarTamanhoMapa;
window.limparMarcadores = limparMarcadores;

console.log('✅ mapa.js carregado');