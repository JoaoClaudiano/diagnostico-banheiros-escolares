// zonas-risco.js
console.log('🟥 Carregando Zonas de Risco...');

class ZonasRiscoHandler {
  constructor() {
    this.layer = null;
    this.config = {
      raio: 500, // metros
      cores: {
        'crítico': '#dc3545',
        'atenção': '#fd7e14',
        'alerta': '#ffc107'
      }
    };
  }

  gerar() {
    console.log('🟥 Gerando Zonas de Risco...');
    
    if (!window.map) {
      console.error('❌ Mapa não inicializado');
      return;
    }
    
    // Limpar camada anterior
    if (this.layer) {
      window.map.removeLayer(this.layer);
    }
    
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
    
    // Filtrar escolas críticas, de atenção e alerta
    const escolasRisco = escolas.filter(e => 
      e.classe === 'crítico' || 
      e.classe === 'atenção' || 
      e.classe === 'alerta'
    );
    
    if (escolasRisco.length === 0) {
      console.warn('⚠️ Nenhuma escola de risco encontrada');
      return;
    }
    
    // Criar zonas (círculos) para cada escola
    const zonas = escolasRisco.map(escola => {
      const cor = this.config.cores[escola.classe] || '#6c757d';
      const raio = this.calcularRaioPorCriticidade(escola.classe);
      
      return L.circle([escola.lat, escola.lng], {
        radius: raio,
        color: cor,
        fillColor: cor,
        fillOpacity: 0.2,
        weight: 2
      }).bindPopup(`
        <div style="min-width: 200px;">
          <h4>${escola.nome}</h4>
          <p><strong>Zona de Risco:</strong> ${escola.classe.toUpperCase()}</p>
          <p><strong>Raio:</strong> ${raio}m</p>
          <p><strong>Pontuação:</strong> ${escola.pontuacao || 'N/A'}</p>
        </div>
      `);
    });
    
    this.layer = L.layerGroup(zonas);
    this.layer.addTo(window.map);
    
    console.log(`✅ ${zonas.length} zonas de risco criadas`);
    this.adicionarLegenda();
  }
  
  calcularRaioPorCriticidade(classe) {
    switch(classe) {
      case 'crítico': return 500;  // 500m
      case 'atenção': return 300;  // 300m
      case 'alerta': return 200;   // 200m
      default: return 100;
    }
  }
  
  adicionarLegenda() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function() {
      const div = L.DomUtil.create('div', 'info legend zonas-legend');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.9);
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 12px;
        min-width: 150px;
      `;
      
      div.innerHTML = `
        <strong>⚠️ Zonas de Risco</strong><br>
        <small>Raio de influência</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: #dc3545; border-radius: 50%; margin-right: 8px;"></div>
            <span>Crítico (500m)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: #fd7e14; border-radius: 50%; margin-right: 8px;"></div>
            <span>Atenção (300m)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 12px; height: 12px; background: #ffc107; border-radius: 50%; margin-right: 8px;"></div>
            <span>Alerta (200m)</span>
          </div>
        </div>
        <div style="margin-top: 8px; font-size: 10px; color: #666;">
          Círculos representam área de influência
        </div>
      `;
      
      return div;
    };
    
    legend.addTo(window.map);
  }
  
  remover() {
    if (this.layer) {
      window.map.removeLayer(this.layer);
      this.layer = null;
    }
    
    // Remover legenda
    document.querySelectorAll('.zonas-legend').forEach(el => {
      el.parentNode.removeChild(el);
    });
  }
}

// Criar instância global
window.zonasRiscoHandler = new ZonasRiscoHandler();
window.gerarZonasRisco = () => window.zonasRiscoHandler.gerar();
console.log('✅ Zonas de Risco carregadas');