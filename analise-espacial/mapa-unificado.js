// mapa-unificado.js - ORQUESTRADOR
console.log('🗺️ Carregando mapa unificado...');

let map = null;
let escolasLayer = null;
let heatLayer = null;
let zonasLayer = null;
let layersControl = null; // controle de camadas

// Inicializar (USAR MAPA EXISTENTE)
function inicializarMapa() {
  if (window.map && window.map instanceof L.Map) {
    map = window.map;
    console.log('🗺️ Usando mapa global existente');
    setTimeout(() => { try { map.invalidateSize(); } catch (e) {} }, 200);
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

    // Normaliza a classe/status para mapeamento de cores
    const statusRaw = (escola.classe || escola.status || '').toLowerCase();
    const statusMapeado = ({
      ok: 'adequada',
      adequada: 'adequada',
      alerta: 'alerta',
      atencao: 'atencao',
      atenção: 'atencao',
      critico: 'critico',
      crítico: 'critico'
    })[statusRaw] || 'desconhecido';

    const cor = getCorPorClasse(statusMapeado);

    const marker = L.circleMarker([escola.lat, escola.lng], {
      radius: 6,
      fillColor: cor,
      color: '#222',
      fillOpacity: 0.8
    });

    const popupContent = `
      <div style="min-width:200px; padding:10px; font-family: Arial, sans-serif;">
        <h4 style="margin:0 0 10px 0; color:${cor}; border-bottom:1px solid #eee; padding-bottom:5px;">
          <i class="fas fa-school"></i> ${escola.nome || 'Escola'}
        </h4>
        <p style="margin:5px 0;"><strong>Status:</strong> <span style="color:${cor}; font-weight:bold;">${escola.status || 'N/A'}</span></p>
        <p style="margin:5px 0;"><strong>Pontuação:</strong> ${escola.pontuacao || 'N/A'}</p>
        <p style="margin:5px 0;"><strong>Endereço:</strong> ${escola.endereco || 'Não informado'}</p>
        ${escola.data_avaliacao ? `<p style="margin:5px 0;"><strong>Data da avaliação:</strong> ${escola.data_avaliacao}</p>` : ''}
        <div style="margin-top:10px; padding-top:10px; border-top:1px solid #eee; font-size:11px; color:#888;">
          <i class="fas fa-info-circle"></i> Clique fora para fechar
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, { maxWidth: 300, minWidth: 250 });
    marcadores.push(marker);
  });

  escolasLayer = L.layerGroup(marcadores).addTo(map);
  console.log(`✅ ${marcadores.length} escolas (layer unificado)`);

  atualizarControleLayers();
}

// Heatmap
function adicionarMapaCalor() {
  if (!map || !window.dadosManager) return;
  if (heatLayer) map.removeLayer(heatLayer);

  const pontos = window.dadosManager.getEscolas()
    .filter(e => e.lat && e.lng && e.peso > 0)
    .map(e => [e.lat, e.lng, e.peso * 10]);

  if (!pontos.length) return;

  heatLayer = L.heatLayer(pontos, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
  console.log('🔥 Heatmap adicionado');

  atualizarControleLayers();
}

// Zonas críticas
function adicionarZonasRisco() {
  if (!map || !window.dadosManager) return;
  if (zonasLayer) map.removeLayer(zonasLayer);

  const circulos = window.dadosManager.getEscolas()
    .filter(e => {
      const c = (e.classe || e.status || '').toLowerCase();
      return c.includes('critico') || c.includes('crítico');
    })
    .map(e => L.circle([e.lat, e.lng], { radius: 500, color: '#dc3545', fillOpacity: 0.2 }));

  zonasLayer = L.layerGroup(circulos).addTo(map);
  console.log(`🟥 ${circulos.length} zonas de risco`);

  atualizarControleLayers();
}

// Atualiza ou cria o controle de camadas
function atualizarControleLayers() {
  if (!map) return;

  const overlays = {};
  if (escolasLayer) overlays["Escolas"] = escolasLayer;
  if (heatLayer) overlays["Heatmap"] = heatLayer;
  if (zonasLayer) overlays["Zonas de risco"] = zonasLayer;

  if (layersControl) layersControl.remove();
  layersControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);
}

// Cor por classe
function getCorPorClasse(classe) {
  if (!classe) return '#6c757d';
  return {
    'adequada': '#28a745',
    'alerta': '#ffc107',
    'atencao': '#fd7e14',
    'critico': '#dc3545'
  }[classe] || '#6c757d';
}

// Init
document.addEventListener('DOMContentLoaded', () => { setTimeout(inicializarMapa, 1000); });

window.inicializarMapa = inicializarMapa;
window.plotarEscolas = plotarEscolas;
window.adicionarMapaCalor = adicionarMapaCalor;
window.adicionarZonasRisco = adicionarZonasRisco;

console.log('✅ mapa-unificado.js carregado');