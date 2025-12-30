// mapa.js - VERSÃO CORRIGIDA
let map = null;
let marcadores = [];
let heatmapLayer = null;

// Inicializar mapa
function inicializarMapa() {
    if (map) return map;
    
    // Coordenadas centrais de Fortaleza
    const centroFortaleza = [-3.717, -38.543];
    
    // Criar mapa
    map = L.map('map').setView(centroFortaleza, 12);
    window.map = map; // Para compatibilidade com código existente
    
    // Adicionar tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    console.log('🗺️ Mapa inicializado');
    
    // Escutar atualizações de dados
    if (window.dadosManager) {
        window.dadosManager.adicionarListener('dados_atualizados', function(dados) {
            atualizarMarcadoresNoMapa(dados.escolas);
        });
    }
    
    return map;
}

// Atualizar marcadores no mapa
function atualizarMarcadoresNoMapa(escolas) {
    if (!map) return;
    
    // Limpar marcadores anteriores
    marcadores.forEach(marker => map.removeLayer(marker));
    marcadores = [];
    
    // Adicionar novos marcadores
    escolas.forEach(escola => {
        if (!escola.lat || !escola.lng) return;
        
        const marker = L.circleMarker([escola.lat, escola.lng], {
            radius: 8,
            fillColor: escola.cor || '#1f4fd8',
            color: '#000',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.7
        });
        
        // Tooltip com informações
        marker.bindPopup(`
            <strong>${escola.nome}</strong><br>
            Classe: ${escola.classe}<br>
            Pontuação: ${escola.pontuacao || 0}<br>
            Avaliações: ${escola.avaliacoes?.length || 0}
        `);
        
        marker.addTo(map);
        marcadores.push(marker);
    });
    
    console.log(`📍 ${marcadores.length} marcadores adicionados ao mapa`);
}

// Função para invalidar tamanho (corrigir renderização)
function invalidarTamanhoMapa() {
    if (map) {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }
}

// Adicionar mapa de calor (KDE)
function adicionarMapaCalor(pontos) {
    if (!map) return;
    
    // Remover camada anterior
    if (heatmapLayer) {
        map.removeLayer(heatmapLayer);
    }
    
    // Converter pontos para formato do leaflet.heat
    const heatPoints = pontos.map(ponto => [
        ponto.lat, 
        ponto.lng, 
        ponto.valor || 1
    ]);
    
    // Adicionar camada de calor
    heatmapLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
    }).addTo(map);
    
    console.log('🔥 Mapa de calor adicionado');
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🗺️ Inicializando mapa...');
    
    // Aguardar um pouco para garantir que o container está pronto
    setTimeout(() => {
        inicializarMapa();
        
        // Atualizar com dados se já estiverem carregados
        if (window.dadosManager && window.dadosManager.getEscolas().length > 0) {
            atualizarMarcadoresNoMapa(window.dadosManager.getEscolas());
        }
    }, 500);
});

// Exportar funções para uso global
window.inicializarMapa = inicializarMapa;
window.atualizarMarcadoresNoMapa = atualizarMarcadoresNoMapa;
window.invalidarTamanhoMapa = invalidarTamanhoMapa;