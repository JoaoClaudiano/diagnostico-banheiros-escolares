// voronoi-critico.js - VORONOI BASEADO EM CRITICIDADE
console.log('🧩 Carregando Voronoi inteligente...');

let voronoiLayer = null;
let sementesLayer = null;
let poligonosAtivos = new Map();

class VoronoiCritico {
  constructor() {
    this.sementes = [];
    this.poligonos = [];
    this.config = {
      raioInfluencia: 1000, // metros
      classesConsideradas: ['crítico', 'atenção', 'alerta'],
      atualizarAutomatico: true
    };
  }
  
  // Gerar Voronoi baseado em criticidade
  async gerar(numSementes = 5, filtroClasse = 'critico') {
    console.log(`🧩 Gerando Voronoi com ${numSementes} sementes (${filtroClasse})...`);
    
    if (!window.dadosManager) {
      console.error('❌ Dados não disponíveis');
      return null;
    }
    
    // Limpar camadas anteriores
    this.limpar();
    
    // Obter escolas com base no filtro
    const escolas = this.filtrarEscolasPorCriticidade(filtroClasse);
    
    if (escolas.length < 2) {
      console.warn('⚠️ Número insuficiente de escolas para Voronoi');
      return null;
    }
    
    // Selecionar sementes (escolas mais críticas)
    this.sementes = this.selecionarSementes(escolas, numSementes);
    
    console.log(`✅ ${this.sementes.length} sementes selecionadas`);
    
    // Gerar polígonos de Voronoi
    this.poligonos = this.calcularPoligonosVoronoi(this.sementes);
    
    // Visualizar no mapa
    this.visualizarNoMapa();
    
    // Calcular estatísticas
    const estatisticas = this.calcularEstatisticas();
    
    console.log('✅ Voronoi gerado com sucesso:', estatisticas);
    return estatisticas;
  }
  
  // Filtrar escolas por criticidade
  filtrarEscolasPorCriticidade(filtro) {
    const escolas = window.dadosManager.getEscolas();
    
    switch(filtro) {
      case 'critico':
        return escolas.filter(e => e.classe === 'crítico');
      case 'atencao':
        return escolas.filter(e => e.classe === 'crítico' || e.classe === 'atenção');
      case 'alerta':
        return escolas.filter(e => e.classe === 'crítico' || e.classe === 'atenção' || e.classe === 'alerta');
      default:
        return escolas;
    }
  }
  
  // Selecionar sementes (escolas mais críticas)
  selecionarSementes(escolas, numSementes) {
    // Ordenar por criticidade (peso + proximidade temporal)
    const escolasOrdenadas = [...escolas].sort((a, b) => {
      // Primeiro por peso (criticidade)
      const diferencaPeso = b.peso - a.peso;
      if (diferencaPeso !== 0) return diferencaPeso;
      
      // Depois por data de atualização (mais recente primeiro)
      if (a.updatedAt && b.updatedAt) {
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      }
      
      return 0;
    });
    
    // Pegar as N mais críticas
    return escolasOrdenadas.slice(0, Math.min(numSementes, escolasOrdenadas.length));
  }
  
  // Calcular polígonos de Voronoi
  calcularPoligonosVoronoi(sementes) {
    console.log('📐 Calculando polígonos de Voronoi...');
    
    if (sementes.length < 2) {
      console.warn('⚠️ Mínimo 2 sementes para Voronoi');
      return [];
    }
    
    // Usar Turf.js para Voronoi
    try {
      // Converter sementes para pontos Turf
      const pontos = turf.featureCollection(
        sementes.map(semente => 
          turf.point([semente.lng, semente.lat], {
            id: semente.id,
            nome: semente.nome,
            classe: semente.classe,
            peso: semente.peso
          })
        )
      );
      
      // Calcular bounding box baseado em todas as escolas
      const todasEscolas = window.dadosManager.getEscolas();
      const bbox = this.calcularBoundingBox(todasEscolas);
      
      // Gerar diagrama de Voronoi
      const voronoi = turf.voronoi(points, { bbox });
      
      // Processar polígonos
      const poligonos = voronoi.features.map((feature, index) => {
        const semente = sementes[index];
        
        return {
          id: `voronoi-${semente.id}`,
          semente: semente,
          geometry: feature.geometry,
          propriedades: {
            ...feature.properties,
            area: turf.area(feature).toFixed(2),
            escolasNoPoligono: this.contarEscolasNoPoligono(feature),
            densidade: this.calcularDensidade(feature)
          }
        };
      });
      
      console.log(`✅ ${poligonos.length} polígonos gerados`);
      return poligonos;
      
    } catch (error) {
      console.error('❌ Erro ao calcular Voronoi:', error);
      return [];
    }
  }
  
  // Calcular bounding box
  calcularBoundingBox(escolas) {
    const lats = escolas.map(e => e.lat);
    const lngs = escolas.map(e => e.lng);
    
    return [
      Math.min(...lngs) - 0.01, // minX
      Math.min(...lats) - 0.01, // minY
      Math.max(...lngs) + 0.01, // maxX
      Math.max(...lats) + 0.01  // maxY
    ];
  }
  
  // Contar escolas dentro de um polígono
  contarEscolasNoPoligono(poligono) {
    const escolas = window.dadosManager.getEscolas();
    const poligonoTurf = turf.polygon(poligono.geometry.coordinates);
    
    return escolas.filter(escola => {
      const ponto = turf.point([escola.lng, escola.lat]);
      return turf.booleanPointInPolygon(ponto, poligonoTurf);
    }).length;
  }
  
  // Calcular densidade do polígono
  calcularDensidade(poligono) {
    const area = turf.area(poligono); // m²
    const escolas = this.contarEscolasNoPoligono(poligono);
    
    return area > 0 ? (escolas / area * 1000000).toFixed(2) : 0; // escolas por km²
  }
  
  // Visualizar no mapa
  visualizarNoMapa() {
    if (!window.map) {
      console.error('❌ Mapa não inicializado');
      return;
    }
    
    // Limpar camadas anteriores
    if (voronoiLayer) {
      window.map.removeLayer(voronoiLayer);
    }
    
    if (sementesLayer) {
      window.map.removeLayer(sementesLayer);
    }
    
    // Criar camada de sementes
    const sementesFeatures = this.sementes.map(semente => {
      return L.circleMarker([semente.lat, semente.lng], {
        radius: 10,
        fillColor: '#dc3545',
        color: '#fff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8
      }).bindTooltip(`
        <strong>${semente.nome}</strong><br>
        Semente ${semente.classe}<br>
        Peso: ${semente.peso.toFixed(2)}
      `);
    });
    
    sementesLayer = L.layerGroup(sementesFeatures);
    sementesLayer.addTo(window.map);
    
    // Criar camada de polígonos
    const polygonFeatures = this.poligonos.map(poligono => {
      const coordinates = poligono.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
      
      return L.polygon(coordinates, {
        color: '#1f4fd8',
        weight: 2,
        opacity: 0.8,
        fillColor: '#1f4fd8',
        fillOpacity: 0.2
      }).bindPopup(`
        <div class="voronoi-popup">
          <h4>Área de Influência</h4>
          <p><strong>Semente:</strong> ${poligono.semente.nome}</p>
          <p><strong>Classe:</strong> ${poligono.semente.classe}</p>
          <p><strong>Área:</strong> ${poligono.propriedades.area} m²</p>
          <p><strong>Escolas na área:</strong> ${poligono.propriedades.escolasNoPoligono}</p>
          <p><strong>Densidade:</strong> ${poligono.propriedades.densidade} escolas/km²</p>
        </div>
      `);
    });
    
    voronoiLayer = L.layerGroup(polygonFeatures);
    voronoiLayer.addTo(window.map);
    
    // Ajustar zoom para mostrar tudo
    if (this.sementes.length > 0) {
      const bounds = L.latLngBounds(
        this.sementes.map(s => [s.lat, s.lng])
      );
      window.map.fitBounds(bounds.pad(0.1));
    }
    
    console.log('🗺️ Voronoi visualizado no mapa');
  }
  
  // Calcular estatísticas
  calcularEstatisticas() {
    const totalEscolas = window.dadosManager.getEscolas().length;
    const escolasCobertas = this.poligonos.reduce((total, poligono) => 
      total + poligono.propriedades.escolasNoPoligono, 0);
    
    const areas = this.poligonos.map(p => parseFloat(p.propriedades.area));
    const areaTotal = areas.reduce((a, b) => a + b, 0);
    const areaMedia = areaTotal / areas.length;
    
    return {
      sementes: this.sementes.length,
      poligonos: this.poligonos.length,
      escolasCobertas,
      cobertura: ((escolasCobertas / totalEscolas) * 100).toFixed(1) + '%',
      areaTotal: (areaTotal / 1000000).toFixed(2) + ' km²',
      areaMedia: (areaMedia / 1000000).toFixed(2) + ' km²',
      classesSementes: [...new Set(this.sementes.map(s => s.classe))],
      atualizadoEm: new Date().toISOString()
    };
  }
  
  // Limpar visualização
  limpar() {
    if (voronoiLayer) {
      window.map.removeLayer(voronoiLayer);
      voronoiLayer = null;
    }
    
    if (sementesLayer) {
      window.map.removeLayer(sementesLayer);
      sementesLayer = null;
    }
    
    this.sementes = [];
    this.poligonos = [];
    
    console.log('🗑️ Voronoi limpo');
  }
  
  // Atualizar automaticamente quando novos dados chegarem
  configurarAtualizacaoAutomatica() {
    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', (dados) => {
        if (this.config.atualizarAutomatico && this.sementes.length > 0) {
          console.log('🔄 Atualizando Voronoi com novos dados...');
          
          // Recalcular com o mesmo número de sementes
          const numSementes = this.sementes.length;
          this.gerar(numSementes, 'critico');
        }
      });
    }
  }
}

// Criar instância global
const voronoiCritico = new VoronoiCritico();
window.voronoiCritico = voronoiCritico;
window.gerarVoronoiCritico = (sementes, filtro) => voronoiCritico.gerar(sementes, filtro);

// Configurar atualização automática
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    voronoiCritico.configurarAtualizacaoAutomatica();
  }, 2000);
});

console.log('✅ Voronoi inteligente carregado');