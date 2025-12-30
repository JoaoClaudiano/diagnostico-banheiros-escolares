// mapa.js - VERSÃO FUNCIONAL
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
  
  // Verificar se o container existe
  const container = document.getElementById('map');
  if (!container) {
    console.error('❌ Container do mapa não encontrado');
    return null;
  }
  
  // Coordenadas de Fortaleza
  const centroFortaleza = [-3.717, -38.543];
  
  try {
    // Criar mapa
    map = L.map('map').setView(centroFortaleza, 12);
    window.map = map; // Para compatibilidade
    
    // Adicionar tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);
    
    console.log('✅ Mapa inicializado com sucesso');
    
    // Adicionar controle de escala
    L.control.scale().addTo(map);
    
    // Escutar atualizações de dados
    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', (dados) => {
        console.log('🗺️ Atualizando mapa com dados...');
        plotarEscolasNoMapa(dados.escolas);
      });
    }
    
    // Plotar dados se já estiverem carregados
    if (window.dadosManager && window.dadosManager.getEscolas().length > 0) {
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

// Plotar escolas no mapa
function plotarEscolasNoMapa(escolas) {
  if (!map) {
    console.error('❌ Mapa não inicializado');
    return;
  }
  
  // Limpar marcadores anteriores
  limparMarcadores();
  
  console.log(`🗺️ Plotando ${escolas.length} escolas no mapa...`);
  
  // Adicionar cada escola como marcador
  escolas.forEach((escola, index) => {
    if (!escola.lat || !escola.lng) {
      console.warn(`⚠️ Escola sem coordenadas: ${escola.nome}`);
      return;
    }
    
    // Definir cor baseada na classe
    const cor = getCorPorClasse(escola.classe);
    
    // Criar marcador
    const marker = L.circleMarker([escola.lat, escola.lng], {
      radius: 8,
      fillColor: cor,
      color: '#333',
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.7
    });
    
    // Tooltip
    marker.bindTooltip(escola.nome, {
      permanent: false,
      direction: 'top',
      className: 'map-tooltip'
    });
    
    // Popup com mais informações
    const popupContent = `
      <div class="map-popup">
        <h4>${escola.nome}</h4>
        <p><strong>Status:</strong> <span style="color: ${cor}">${escola.classe}</span></p>
        <p><strong>Pontuação:</strong> ${escola.pontuacao || 0}</p>
        <p><strong>Avaliações:</strong> ${escola.avaliacoes?.length || 0}</p>
        <p><strong>Fonte:</strong> ${escola.fonte || 'local'}</p>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    
    // Adicionar ao mapa
    marker.addTo(map);
    marcadores.push(marker);
  });
  
  console.log(`✅ ${marcadores.length} marcadores adicionados ao mapa`);
  
  // Ajustar zoom para mostrar todos os marcadores
  if (marcadores.length > 0) {
    const grupo = L.featureGroup(marcadores);
    map.fitBounds(grupo.getBounds().pad(0.1));
  }
}

// Limpar marcadores
function limparMarcadores() {
  if (!map) return;
  
  marcadores.forEach(marker => {
    map.removeLayer(marker);
  });
  
  marcadores = [];
  console.log('🗑️ Marcadores removidos do mapa');
}

// Obter cor baseada na classe
function getCorPorClasse(classe) {
  const cores = {
    'adequada': '#28a745',   // Verde
    'alerta': '#ffc107',     // Amarelo
    'atenção': '#fd7e14',    // Laranja
    'crítico': '#dc3545',    // Vermelho
    'não avaliada': '#6c757d'// Cinza
  };
  
  return cores[classe] || '#6c757d';
}

// Redimensionar mapa quando necessário
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

// Adicionar mapa de calor
function adicionarMapaCalor(pontos) {
  if (!map) return;
  
  // Remover camada anterior
  if (heatLayer) {
    map.removeLayer(heatLayer);
  }
  
  // Converter pontos para formato do heatmap
  const heatPoints = pontos
    .filter(ponto => ponto.lat && ponto.lng && ponto.peso > 0)
    .map(ponto => [ponto.lat, ponto.lng, ponto.peso]);
  
  if (heatPoints.length === 0) {
    console.warn('⚠️ Nenhum ponto válido para mapa de calor');
    return;
  }
  
  // Criar camada de calor
  heatLayer = L.heatLayer(heatPoints, {
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

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('🗺️ Configurando mapa...');
  
  // Aguardar um pouco para garantir que o DOM está pronto
  setTimeout(() => {
    inicializarMapa();
  }, 1000);
  
  // Adicionar listener para quando a aba de mapa for aberta
  window.addEventListener('aba_mapa_aberta', () => {
    invalidarTamanhoMapa();
  });
});

// Exportar funções para uso global
window.inicializarMapa = inicializarMapa;
window.plotarEscolasNoMapa = plotarEscolasNoMapa;
window.invalidarTamanhoMapa = invalidarTamanhoMapa;
window.adicionarMapaCalor = adicionarMapaCalor;
window.limparMarcadores = limparMarcadores;

console.log('✅ Módulo do mapa carregado');