// mapa-unificado.js - Mapa principal unificado
console.log('🗺️ Carregando mapa unificado...');

let map = null;
let escolasLayer = null;
let heatLayer = null;
let zonasLayer = null;

// Inicializar mapa
function inicializarMapa() {
  // 🔒 USAR mapa global já inicializado
  if (window.map && window.map instanceof L.Map) {
    map = window.map;
    console.log('🗺️ Usando mapa global existente');
    return map;
  }

  console.error('❌ Mapa Leaflet global não encontrado. mapa.js deve inicializar primeiro.');
  return null;
}
    // Adicionar tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    console.log('✅ Mapa unificado inicializado');
    
    // Adicionar controles
    L.control.scale().addTo(map);
    
    // Escutar atualizações de dados
    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', () => {
        console.log('🗺️ Atualizando mapa com novos dados...');
        plotarEscolas();
      });
    }
    
    // Plotar escolas se já tiver dados
    if (window.dadosManager && window.dadosManager.getEscolas().length > 0) {
      setTimeout(() => {
        plotarEscolas();
      }, 1000);
    }
    
    return map;
    
  } catch (error) {
    console.error('❌ Erro ao inicializar mapa:', error);
    return null;
  }
}

// Plotar escolas no mapa
function plotarEscolas() {
  if (!map || !window.dadosManager) return;
  
  // Limpar layer anterior
  if (escolasLayer) {
    map.removeLayer(escolasLayer);
  }
  
  const escolas = window.dadosManager.getEscolas();
  const marcadores = [];
  
  console.log(`🗺️ Plotando ${escolas.length} escolas...`);
  
  escolas.forEach(escola => {
    if (!escola.lat || !escola.lng) return;
    
    const cor = getCorPorClasse(escola.classe);
    
    // Criar marcador
    const marker = L.circleMarker([escola.lat, escola.lng], {
      radius: 6,
      fillColor: cor,
      color: '#333',
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.7,
      className: 'escola-marker'
    });
    
    // Tooltip
    marker.bindTooltip(escola.nome, {
      permanent: false,
      direction: 'top',
      className: 'map-tooltip'
    });
    
    // Popup
    const popupContent = `
      <div class="map-popup">
        <h4>${escola.nome}</h4>
        <p><strong>Status:</strong> <span style="color: ${cor}">${escola.classe}</span></p>
        <p><strong>Pontuação:</strong> ${escola.pontuacao || 0}</p>
        <p><strong>Avaliações:</strong> ${escola.avaliacoes?.length || 0}</p>
        <p><strong>Fonte:</strong> ${escola.fonte}</p>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    marcadores.push(marker);
  });
  
  // Adicionar todos os marcadores como uma layer
  escolasLayer = L.layerGroup(marcadores);
  escolasLayer.addTo(map);
  
  console.log(`✅ ${marcadores.length} escolas plotadas`);
}

// Adicionar mapa de calor
function adicionarMapaCalor() {
  if (!map || !window.dadosManager) return;
  
  // Limpar layer anterior
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }
  
  const escolas = window.dadosManager.getEscolas();
  const pontosCalor = escolas
    .filter(e => e.peso > 1) // Apenas escolas com algum problema
    .map(e => [e.lat, e.lng, e.peso * 10]); // Intensidade baseada no peso
  
  if (pontosCalor.length === 0) {
    console.warn('⚠️ Nenhum ponto para mapa de calor');
    return;
  }
  
  heatLayer = L.heatLayer(pontosCalor, {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    gradient: {
      0.0: 'blue',
      0.5: 'lime',
      1.0: 'red'
    }
  }).addTo(map);
  
  console.log('🔥 Mapa de calor adicionado');
}

// Adicionar zonas de risco
function adicionarZonasRisco() {
  if (!map || !window.dadosManager) return;
  
  // Limpar layer anterior
  if (zonasLayer) {
    map.removeLayer(zonasLayer);
  }
  
  const escolas = window.dadosManager.getEscolas();
  const escolasCriticas = escolas.filter(e => e.classe === 'crítico');
  
  if (escolasCriticas.length === 0) {
    console.warn('⚠️ Nenhuma escola crítica para zonas de risco');
    return;
  }
  
  const circulos = escolasCriticas.map(escola => {
    return L.circle([escola.lat, escola.lng], {
      radius: 500, // 500 metros
      color: '#dc3545',
      weight: 2,
      opacity: 0.5,
      fillColor: '#dc3545',
      fillOpacity: 0.2
    });
  });
  
  zonasLayer = L.layerGroup(circulos);
  zonasLayer.addTo(map);
  
  console.log(`🟥 ${circulos.length} zonas de risco adicionadas`);
}

// Obter cor por classe
function getCorPorClasse(classe) {
  const cores = {
    'crítico': '#dc3545',
    'atenção': '#fd7e14',
    'alerta': '#ffc107',
    'adequada': '#28a745',
    'não avaliada': '#6c757d'
  };
  
  return cores[classe] || '#6c757d';
}

// Redimensionar mapa
function invalidarTamanhoMapa() {
  if (map) {
    setTimeout(() => {
      try {
        map.invalidateSize();
        console.log('🔄 Mapa redimensionado');
      } catch (error) {
        console.error('❌ Erro ao redimensionar mapa:', error);
      }
    }, 300);
  }
}

// Limpar todas as camadas
function limparCamadas() {
  if (escolasLayer) {
    map.removeLayer(escolasLayer);
    escolasLayer = null;
  }
  
  if (heatLayer) {
    map.removeLayer(heatLayer);
    heatLayer = null;
  }
  
  if (zonasLayer) {
    map.removeLayer(zonasLayer);
    zonasLayer = null;
  }
  
  console.log('🗑️ Todas as camadas limpas');
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('🗺️ Configurando mapa unificado...');
  
  setTimeout(() => {
    inicializarMapa();
  }, 1000);
});

// Exportar funções
window.inicializarMapa = inicializarMapa;
window.plotarEscolas = plotarEscolas;
window.adicionarMapaCalor = adicionarMapaCalor;
window.adicionarZonasRisco = adicionarZonasRisco;
window.invalidarTamanhoMapa = invalidarTamanhoMapa;
window.limparCamadas = limparCamadas;

console.log('✅ Mapa unificado carregado');