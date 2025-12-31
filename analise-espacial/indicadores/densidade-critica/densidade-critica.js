// densidade-critica.js
console.log('📍 Carregando Densidade Crítica...');

class DensidadeCriticaHandler {
  constructor() {
    this.layer = null;
    this.gridLayer = null;
    this.config = {
      tamanhoCelula: 0.01, // graus
      cores: ['#28a745', '#ffc107', '#fd7e14', '#dc3545']
    };
  }

  calcular() {
    console.log('📍 Calculando Densidade Crítica...');
    
    if (!window.map) {
      console.error('❌ Mapa não inicializado');
      return;
    }
    
    // Limpar camadas anteriores
    this.remover();
    
    // Obter dados
    let escolas = [];
    if (window.dadosManager) {
      escolas = window.dadosManager.getEscolas();
    } else if (window.escolasDados) {
      escolas = window.escolasDados;
    } else {
      console.error('❌ Dados não disponíveis');
      return;
    }
    
    // Filtrar escolas críticas
    const escolasCriticas = escolas.filter(e => e.classe === 'crítico');
    
    if (escolasCriticas.length === 0) {
      console.warn('⚠️ Nenhuma escola crítica encontrada');
      return;
    }
    
    // Obter bounds do mapa
    const bounds = window.map.getBounds();
    const grid = this.criarGrid(bounds);
    
    // Calcular densidade em cada célula
    escolasCriticas.forEach(escola => {
      const cell = this.encontrarCelula(grid, escola.lat, escola.lng);
      if (cell) {
        cell.escolas.push(escola);
        cell.contagem++;
      }
    });
    
    // Normalizar contagens
    const maxContagem = Math.max(...grid.map(cell => cell.contagem));
    
    // Criar retângulos coloridos
    const retangulos = grid
      .filter(cell => cell.contagem > 0)
      .map(cell => {
        const intensidade = maxContagem > 0 ? cell.contagem / maxContagem : 0;
        const corIndex = Math.min(
          Math.floor(intensidade * this.config.cores.length),
          this.config.cores.length - 1
        );
        const cor = this.config.cores[corIndex];
        
        return L.rectangle(cell.bounds, {
          color: cor,
          fillColor: cor,
          fillOpacity: 0.4,
          weight: 1
        }).bindPopup(`
          <div style="min-width: 180px;">
            <h4>Densidade Crítica</h4>
            <p><strong>Escolas críticas:</strong> ${cell.contagem}</p>
            <p><strong>Intensidade:</strong> ${(intensidade * 100).toFixed(1)}%</p>
            <p><strong>Área:</strong> ~${(this.calcularAreaKm2(cell.bounds)).toFixed(2)} km²</p>
          </div>
        `);
      });
    
    this.gridLayer = L.layerGroup(retangulos);
    this.gridLayer.addTo(window.map);
    
    console.log(`✅ Densidade calculada: ${retangulos.length} células com escolas críticas`);
    this.adicionarLegenda(maxContagem);
  }
  
  criarGrid(bounds) {
    const grid = [];
    const tamanho = this.config.tamanhoCelula;
    
    for (let lat = bounds.getSouth(); lat < bounds.getNorth(); lat += tamanho) {
      for (let lng = bounds.getWest(); lng < bounds.getEast(); lng += tamanho) {
        grid.push({
          bounds: [[lat, lng], [lat + tamanho, lng + tamanho]],
          contagem: 0,
          escolas: []
        });
      }
    }
    
    return grid;
  }
  
  encontrarCelula(grid, lat, lng) {
    return grid.find(cell => {
      const [[latMin, lngMin], [latMax, lngMax]] = cell.bounds;
      return lat >= latMin && lat < latMax && lng >= lngMin && lng < lngMax;
    });
  }
  
  calcularAreaKm2(bounds) {
    const [[lat1, lng1], [lat2, lng2]] = bounds;
    const dLat = Math.abs(lat2 - lat1) * 111.32; // 1 grau ≈ 111.32 km
    const dLng = Math.abs(lng2 - lng1) * 111.32 * Math.cos((lat1 + lat2) * Math.PI / 360);
    return dLat * dLng;
  }
  
  adicionarLegenda(maxContagem) {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend densidade-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>📍 Densidade Crítica</strong><br>
        <small>Escolas críticas por célula</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #dc3545; margin-right: 8px;"></div>
            <span>Alta (${maxContagem} escolas)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #fd7e14; margin-right: 8px;"></div>
            <span>Média</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #ffc107; margin-right: 8px;"></div>
            <span>Baixa</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 10px; background: #28a745; margin-right: 8px;"></div>
            <span>Mínima</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Célula: ${(this.config.tamanhoCelula * 111.32).toFixed(1)} km
        </div>
      `;
      
      return div;
    }.bind(this);
    
    legend.addTo(window.map);
  }
  
  remover() {
    if (this.gridLayer) {
      window.map.removeLayer(this.gridLayer);
      this.gridLayer = null;
    }
    
    // Remover legenda
    document.querySelectorAll('.densidade-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.densidadeCriticaHandler = new DensidadeCriticaHandler();
window.calcularDensidadeCritica = () => window.densidadeCriticaHandler.calcular();
console.log('✅ Densidade Crítica carregada');