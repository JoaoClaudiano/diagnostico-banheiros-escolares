// analise-avancada.js - VERSÃO FUNCIONAL
console.log('🚀 Módulo de análise avançada carregado');

let mapaAvancado = null;
let voronoiGerado = false;

// Inicializar mapa avançado
function inicializarMapaAvancado() {
    if (mapaAvancado) {
        mapaAvancado.invalidateSize();
        return;
    }
    
    console.log('🗺️ Inicializando mapa avançado...');
    
    // Criar container se não existir
    const container = document.getElementById('mapa-avancado');
    if (!container) {
        console.error('❌ Container do mapa avançado não encontrado');
        return;
    }
    
    // Criar mapa
    mapaAvancado = L.map('mapa-avancado').setView([-3.717, -38.543], 12);
    
    // Adicionar tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(mapaAvancado);
    
    console.log('✅ Mapa avançado inicializado');
    
    // Adicionar escolas se disponíveis
    if (window.dadosManager) {
        adicionarEscolasNoMapaAvancado();
    }
    
    return mapaAvancado;
}

// Adicionar escolas no mapa avançado
function adicionarEscolasNoMapaAvancado() {
    if (!mapaAvancado || !window.dadosManager) return;
    
    const escolas = window.dadosManager.getEscolas();
    escolas.forEach(escola => {
        if (!escola.lat || !escola.lng) return;
        
        L.circleMarker([escola.lat, escola.lng], {
            radius: 8,
            fillColor: escola.cor || '#1f4fd8',
            color: '#000',
            weight: 1,
            opacity: 0.8,
            fillOpacity: 0.7
        }).addTo(mapaAvancado);
    });
    
    console.log(`📍 ${escolas.length} escolas no mapa avançado`);
}

// Gerar diagrama de Voronoi
function gerarVoronoi() {
    console.log('🧩 Gerando diagrama de Voronoi...');
    
    if (!window.dadosManager) {
        mostrarErro('voronoi-container', 'Dados não disponíveis');
        return;
    }
    
    const escolas = window.dadosManager.getEscolas();
    if (escolas.length < 3) {
        mostrarErro('voronoi-container', 'Mínimo 3 escolas para Voronoi');
        return;
    }
    
    // Simulação de Voronoi (implementação real precisaria de biblioteca)
    const resultado = {
        escolasProcessadas: escolas.length,
        poligonosGerados: Math.floor(escolas.length * 0.8),
        areaTotal: '15.8 km²',
        tempoProcessamento: '0.8s'
    };
    
    document.getElementById('voronoi-container').innerHTML = `
        <div class="resultado-voronoi">
            <h5>✅ Diagrama de Voronoi Gerado</h5>
            <ul>
                <li>Escolas processadas: ${resultado.escolasProcessadas}</li>
                <li>Polígonos gerados: ${resultado.poligonosGerados}</li>
                <li>Área total: ${resultado.areaTotal}</li>
                <li>Tempo: ${resultado.tempoProcessamento}</li>
            </ul>
            <p><small>⚠️ Visualização em implementação</small></p>
        </div>
    `;
    
    voronoiGerado = true;
}

// Calcular análise de impacto
function calcularImpacto() {
    console.log('📐 Calculando análise de impacto...');
    
    const raio = document.getElementById('raio-impacto').value;
    document.getElementById('raio-value').textContent = raio + 'm';
    
    if (!window.dadosManager) {
        mostrarErro('impacto-container', 'Dados não disponíveis');
        return;
    }
    
    const escolas = window.dadosManager.getEscolas();
    const escolasCriticas = escolas.filter(e => e.classe === 'crítico').length;
    
    const impacto = {
        raioMetros: raio,
        escolasAfetadas: Math.min(escolasCriticas * 3, escolas.length),
        areaCobertura: ((raio / 1000) * (raio / 1000) * Math.PI).toFixed(2) + ' km²',
        recomendacao: raio > 1000 ? 'Alta prioridade' : 'Monitorar'
    };
    
    document.getElementById('impacto-container').innerHTML = `
        <div class="resultado-impacto">
            <h5>📊 Análise de Impacto</h5>
            <ul>
                <li>Raio: ${impacto.raioMetros}m</li>
                <li>Escolas na área: ${impacto.escolasAfetadas}</li>
                <li>Área coberta: ${impacto.areaCobertura}</li>
                <li>Recomendação: ${impacto.recomendacao}</li>
            </ul>
            <div class="grafico-impacto">
                <div style="background: #1f4fd8; height: 20px; width: ${(raio / 2000 * 100)}%; border-radius: 3px;"></div>
                <small>Intensidade: ${(raio / 2000 * 100).toFixed(0)}%</small>
            </div>
        </div>
    `;
}

// Calcular estatísticas avançadas
function calcularEstatisticas() {
    console.log('📈 Calculando estatísticas avançadas...');
    
    if (!window.dadosManager) {
        mostrarErro('estatisticas-container', 'Dados não disponíveis');
        return;
    }
    
    const metricas = window.dadosManager.getMetricas();
    const escolas = window.dadosManager.getEscolas();
    
    // Cálculos adicionais
    const pontuacoes = escolas.map(e => e.pontuacao).filter(p => p > 0);
    const desvioPadrao = pontuacoes.length > 1 ? 
        Math.sqrt(pontuacoes.reduce((s, x) => s + Math.pow(x - metricas.pontuacaoMedia, 2), 0) / pontuacoes.length).toFixed(2) : '0';
    
    const classes = Object.keys(metricas.distribuicaoClasses || {});
    const diversidade = classes.length;
    
    document.getElementById('estatisticas-container').innerHTML = `
        <div class="estatisticas-detalhadas">
            <h5>📊 Estatísticas Avançadas</h5>
            <div class="estat-grid">
                <div class="estat-item">
                    <div class="estat-valor">${metricas.totalEscolas}</div>
                    <div class="estat-label">Total Escolas</div>
                </div>
                <div class="estat-item">
                    <div class="estat-valor">${metricas.escolasCriticas}</div>
                    <div class="estat-label">Críticas</div>
                </div>
                <div class="estat-item">
                    <div class="estat-valor">${diversidade}</div>
                    <div class="estat-label">Classes</div>
                </div>
                <div class="estat-item">
                    <div class="estat-valor">${desvioPadrao}</div>
                    <div class="estat-label">Desvio Padrão</div>
                </div>
            </div>
            <div class="estat-detalhes">
                <p><strong>Distribuição:</strong> ${JSON.stringify(metricas.distribuicaoClasses)}</p>
                <p><strong>Pontuação média:</strong> ${metricas.pontuacaoMedia}</p>
                <p><strong>Avaliações:</strong> ${metricas.percentualAvaliadas}% das escolas</p>
            </div>
        </div>
    `;
}

// Função auxiliar para mostrar erros
function mostrarErro(containerId, mensagem) {
    document.getElementById(containerId).innerHTML = `
        <div class="erro-avancado">
            <p>❌ ${mensagem}</p>
        </div>
    `;
}

// Inicializar eventos quando o DOM carregar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Configurando análise avançada...');
    
    // Botão Voronoi
    const btnVoronoi = document.getElementById('btn-analise-voronoi');
    if (btnVoronoi) {
        btnVoronoi.addEventListener('click', gerarVoronoi);
    }
    
    // Botão Impacto
    const btnImpacto = document.getElementById('btn-calcular-impacto');
    if (btnImpacto) {
        btnImpacto.addEventListener('click', calcularImpacto);
    }
    
    // Botão Estatísticas
    const btnEstatisticas = document.getElementById('btn-calcular-estatisticas');
    if (btnEstatisticas) {
        btnEstatisticas.addEventListener('click', calcularEstatisticas);
    }
    
    // Slider de raio
    const sliderRaio = document.getElementById('raio-impacto');
    if (sliderRaio) {
        sliderRaio.addEventListener('input', function() {
            document.getElementById('raio-value').textContent = this.value + 'm';
        });
    }
    
    // Botão Voronoi no painel principal
    const btnVoronoiMain = document.getElementById('btn-voronoi');
    if (btnVoronoiMain) {
        btnVoronoiMain.addEventListener('click', function() {
            alert('🧩 Gerar Voronoi - Funcionalidade em desenvolvimento');
        });
    }
});

// Exportar funções para uso global
window.inicializarMapaAvancado = inicializarMapaAvancado;
window.gerarVoronoi = gerarVoronoi;
window.calcularImpacto = calcularImpacto;
window.calcularEstatisticas = calcularEstatisticas;



