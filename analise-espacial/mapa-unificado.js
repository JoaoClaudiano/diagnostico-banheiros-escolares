// ==================== mapa-unificado.js UNIFICADO ====================

console.log('🗺️ Carregando mapa unificado unificado...');

// -------------------- Variáveis Globais --------------------
window.map = null;
window.camadas = {};
window.escolasDados = [];
let layersControl = null;

// -------------------- Inicialização do Mapa --------------------
function inicializarMapa() {
  if (window.map) window.map.remove();

  window.map = L.map('map').setView([-3.7319, -38.5267], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(window.map);
}

// -------------------- Cor por Classe --------------------
function getCorPorClasse(classe) {
  if (!classe) return '#6c757d';
  const c = classe.toString().toLowerCase().trim();
  const map = {
    ok: '#28a745',
    adequada: '#28a745',
    alerta: '#ffc107',
    atencao: '#fd7e14',
    atenção: '#fd7e14',
    critico: '#dc3545',
    crítico: '#dc3545'
  };
  return map[c] || '#6c757d';
}

// -------------------- Criar Marcadores --------------------
function criarMarcador(escola) {
  const cor = getCorPorClasse(escola.status || escola.classe);

  return L.circleMarker([escola.lat, escola.lng], {
    radius: 6,
    fillColor: cor,
    color: '#222',
    fillOpacity: 0.8
  }).bindPopup(`
    <div style="min-width:200px; padding:10px; font-family: Arial, sans-serif;">
      <h4 style="margin:0 0 10px 0; color:${cor}; border-bottom:1px solid #eee; padding-bottom:5px;">
        <i class="fas fa-school"></i> ${escola.nome || 'Escola'}
      </h4>
      <p><strong>Status:</strong> <span style="color:${cor}; font-weight:bold;">${escola.status || 'N/A'}</span></p>
      <p><strong>Pontuação:</strong> ${escola.pontuacao || 'N/A'}</p>
      <p><strong>Endereço:</strong> ${escola.endereco || 'Não informado'}</p>
      ${escola.data_avaliacao ? `<p><strong>Data da avaliação:</strong> ${escola.data_avaliacao}</p>` : ''}
      <div style="margin-top:10px; font-size:11px; color:#888;">
        <i class="fas fa-info-circle"></i> Clique fora para fechar
      </div>
    </div>
  `);
}

// -------------------- Criar Camadas --------------------
function criarCamadaEscolas(escolas) {
  const layerGroup = L.layerGroup();
  escolas.forEach(e => layerGroup.addLayer(criarMarcador(e)));
  return layerGroup;
}

function criarCamadaKDE(escolas) {
  const pontos = escolas.filter(e => e.lat && e.lng).map(e => [e.lat, e.lng, 1]);
  return L.heatLayer(pontos, {radius: 25, blur: 15, maxZoom: 17});
}

function criarCamadaVoronoi(escolas) {
  const layerGroup = L.layerGroup();
  escolas.forEach(e => {
    const polygon = L.polygon([
      [e.lat, e.lng],
      [e.lat + 0.001, e.lng + 0.001],
      [e.lat + 0.001, e.lng - 0.001]
    ], {color: 'blue', weight: 1, fillOpacity: 0.2});
    polygon.addTo(layerGroup);
  });
  return layerGroup;
}

function criarCamadaZonas(escolas) {
  const layerGroup = L.layerGroup();
  escolas.filter(e => e.classe?.toLowerCase().includes('crít')).forEach(e => {
    L.circle([e.lat, e.lng], {
      radius: 500,
      color: '#dc3545',
      fillOpacity: 0.2
    }).addTo(layerGroup);
  });
  return layerGroup;
}

// -------------------- Controle de Camadas --------------------
function atualizarControleLayers() {
  if (!window.map) return;
  const overlays = {};
  Object.keys(window.camadas).forEach(k => { if (window.camadas[k]) overlays[k] = window.camadas[k]; });

  if (layersControl) layersControl.remove();
  layersControl = L.control.layers(null, overlays, {collapsed:false}).addTo(window.map);
}

function ativarCamada(nome) {
  if (window.camadas[nome] && !window.map.hasLayer(window.camadas[nome])) window.camadas[nome].addTo(window.map);
}

function desativarCamada(nome) {
  if (window.camadas[nome] && window.map.hasLayer(window.camadas[nome])) window.map.removeLayer(window.camadas[nome]);
}

// -------------------- Carregar Mapa --------------------
function carregarMapaUnificado({escolas}) {
  window.escolasDados = escolas || [];

  if (!window.map) inicializarMapa();

  // Criar camadas
  window.camadas['Escolas'] = criarCamadaEscolas(escolas);
  window.camadas['Heatmap'] = criarCamadaKDE(escolas);
  window.camadas['Voronoi'] = criarCamadaVoronoi(escolas);
  window.camadas['Zonas de Risco'] = criarCamadaZonas(escolas);

  // Adicionar camadas iniciais
  ativarCamada('Escolas');
  atualizarControleLayers();

  // Toggles (se existirem no HTML)
  const toggles = [
    {id:'toggle-escolas', nome:'Escolas'},
    {id:'toggle-kde', nome:'Heatmap'},
    {id:'toggle-voronoi', nome:'Voronoi'},
    {id:'toggle-zonas', nome:'Zonas de Risco'}
  ];

  toggles.forEach(t => {
    const input = document.getElementById(t.id);
    if (!input) return;
    input.checked = window.map.hasLayer(window.camadas[t.nome]);
    input.addEventListener('change',()=>{input.checked ? ativarCamada(t.nome) : desativarCamada(t.nome)});
  });
}

// -------------------- Inicialização --------------------
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔗 Inicializando mapa unificado');

  const maxTentativas = 20;
  let tentativas = 0;

  const aguardarMapa = setInterval(() => {
    tentativas++;
    if (window.dadosManager && window.dadosManager.getEscolas) {
      clearInterval(aguardarMapa);
      const escolas = window.dadosManager.getEscolas() || [];
      carregarMapaUnificado({escolas});
      console.log(`✅ Mapa unificado carregado com ${escolas.length} escolas`);
    } else if (tentativas > maxTentativas) {
      clearInterval(aguardarMapa);
      console.warn('⚠️ Dados não disponíveis. Usando dados de demonstração.');
      carregarMapaUnificado({escolas: []});
    }
  }, 300);
});

window.inicializarMapa = inicializarMapa;
window.carregarMapaUnificado = carregarMapaUnificado;