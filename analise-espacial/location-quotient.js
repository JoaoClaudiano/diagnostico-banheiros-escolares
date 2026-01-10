// location-quotient.js - Análise de Concentração Regional
console.log('📊 Location Quotient (LQ) v1.0');

class LocationQuotientHandler {
  constructor() {
    this.grid = [];
    this.resultados = [];
    this.layerLQ = null;
    this.tamanhoCelula = 0.01; // ~1km
    this.inicializado = false;
  }
  
  inicializar() {
    if (this.inicializado) return true;
    
    console.log('🚀 Inicializando Location Quotient...');
    
    if (!window.map) {
      console.error('❌ Mapa não disponível');
      return false;
    }
    
    this.inicializado = true;
    console.log('✅ LQ inicializado');
    return true;
  }
  
  // ==================== CALCULAR LQ ====================
  calcular(filtroStatus = 'crítico') {
    console.log(`📊 Calculando LQ para status: ${filtroStatus}`);
    
    if (!window.dadosManager) {
      console.error('❌ DadosManager não disponível');
      return null;
    }
    
    const escolas = window.dadosManager.getEscolas();
    
    if (escolas.length === 0) {
      console.warn('⚠️ Nenhuma escola para análise');
      return null;
    }
    
    // Filtrar escolas por status
    const escolasFiltradas = escolas.filter(e => 
      filtroStatus === 'todos' || e.status === filtroStatus
    );
    
    // Criar grid espacial
    this.grid = this.criarGrid(escolas);
    
    // Distribuir escolas no grid
    this.distribuirEscolasNoGrid(escolas, escolasFiltradas);
    
    // Calcular LQ para cada célula
    this.resultados = this.calcularLQPorCelula();
    
    // Visualizar
    this.visualizar();
    
    // Gerar estatísticas
    const stats = this.gerarEstatisticas();
    
    console.log('✅ LQ calculado:', stats);
    
    return {
      grid: this.grid,
      resultados: this.resultados,
      estatisticas: stats
    };
  }
  
  // ==================== CRIAR GRID ====================
  criarGrid(escolas) {
    console.log('🗺️ Criando grid espacial...');
    
    // Calcular bounds
    const lats = escolas.map(e => e.lat);
    const lngs = escolas.map(e => e.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Adicionar margem
    const margem = this.tamanhoCelula;
    
    const grid = [];
    let id = 0;
    
    for (let lat = minLat - margem; lat < maxLat + margem; lat += this.tamanhoCelula) {
      for (let lng = minLng - margem; lng < maxLng + margem; lng += this.tamanhoCelula) {
        grid.push({
          id: id++,
          bounds: [
            [lat, lng],
            [lat + this.tamanhoCelula, lng + this.tamanhoCelula]
          ],
          centro: {
            lat: lat + this.tamanhoCelula / 2,
            lng: lng + this.tamanhoCelula / 2
          },
          totalEscolas: 0,
          escolasFiltradas: 0,
          lq: 0,
          escolas: []
        });
      }
    }
    
    console.log(`✅ Grid criado: ${grid.length} células`);
    return grid;
  }
  
  // ==================== DISTRIBUIR ESCOLAS ====================
  distribuirEscolasNoGrid(todasEscolas, escolasFiltradas) {
    console.log('📍 Distribuindo escolas no grid...');
    
    // Criar set de IDs filtrados para busca rápida
    const idsFiltrados = new Set(escolasFiltradas.map(e => e.id));
    
    todasEscolas.forEach(escola => {
      const celula = this.encontrarCelula(escola.lat, escola.lng);
      
      if (celula) {
        celula.totalEscolas++;
        celula.escolas.push(escola);
        
        if (idsFiltrados.has(escola.id)) {
          celula.escolasFiltradas++;
        }
      }
    });
    
    const celulasComEscolas = this.grid.filter(c => c.totalEscolas > 0);
    console.log(`✅ ${celulasComEscolas.length} células com escolas`);
  }
  
  encontrarCelula(lat, lng) {
    return this.grid.find(celula => {
      const [[minLat, minLng], [maxLat, maxLng]] = celula.bounds;
      return lat >= minLat && lat < maxLat && lng >= minLng && lng < maxLng;
    });
  }
  
  // ==================== CALCULAR LQ ====================
  calcularLQPorCelula() {
    console.log('🧮 Calculando Location Quotient...');
    
    // Totais da cidade
    const totalCidade = this.grid.reduce((sum, c) => sum + c.totalEscolas, 0);
    const filtradosCidade = this.grid.reduce((sum, c) => sum + c.escolasFiltradas, 0);
    
    if (totalCidade === 0 || filtradosCidade === 0) {
      console.warn('⚠️ Dados insuficientes para cálculo de LQ');
      return [];
    }
    
    // Taxa de referência (cidade toda)
    const taxaCidade = filtradosCidade / totalCidade;
    
    console.log(`📊 Taxa de referência da cidade: ${(taxaCidade * 100).toFixed(2)}%`);
    
    // Calcular LQ para cada célula
    const resultados = this.grid
      .filter(celula => celula.totalEscolas > 0)
      .map(celula => {
        // Taxa da região
        const taxaRegiao = celula.escolasFiltradas / celula.totalEscolas;
        
        // Location Quotient
        const lq = taxaRegiao / taxaCidade;
        
        celula.lq = lq;
        celula.taxaRegiao = taxaRegiao;
        celula.taxaCidade = taxaCidade;
        
        return {
          celula: celula,
          lq: lq,
          interpretacao: this.interpretarLQ(lq),
          nivel: this.classificarLQ(lq),
          detalhes: {
            taxaRegiao: (taxaRegiao * 100).toFixed(1) + '%',
            taxaCidade: (taxaCidade * 100).toFixed(1) + '%',
            totalEscolas: celula.totalEscolas,
            escolasFiltradas: celula.escolasFiltradas
          }
        };
      })
      .sort((a, b) => b.lq - a.lq);
    
    console.log(`✅ LQ calculado para ${resultados.length} regiões`);
    
    return resultados;
  }
  
  // ==================== INTERPRETAÇÃO ====================
  interpretarLQ(lq) {
    if (lq > 2.0) return 'Concentração muito alta';
    if (lq > 1.5) return 'Concentração alta';
    if (lq > 1.0) return 'Concentração acima da média';
    if (lq > 0.5) return 'Concentração abaixo da média';
    return 'Concentração muito baixa';
  }
  
  classificarLQ(lq) {
    if (lq > 2.0) return 'muito-alto';
    if (lq > 1.5) return 'alto';
    if (lq > 1.0) return 'medio';
    if (lq > 0.5) return 'baixo';
    return 'muito-baixo';
  }
  
  getCorPorLQ(lq) {
    if (lq > 2.0) return '#8B0000'; // Vermelho escuro
    if (lq > 1.5) return '#DC143C'; // Vermelho
    if (lq > 1.0) return '#FF8C00'; // Laranja
    if (lq > 0.5) return '#FFD700'; // Amarelo
    return '#90EE90'; // Verde claro
  }
  
  // ==================== VISUALIZAÇÃO ====================
  visualizar() {
    if (!window.map) return;
    
    console.log('🗺️ Visualizando LQ no mapa...');
    
    // Remover camada anterior
    if (this.layerLQ) {
      window.map.removeLayer(this.layerLQ);
    }
    
    // Criar retângulos para cada célula com LQ
    const retangulos = this.resultados
      .filter(r => r.lq > 0)
      .map(resultado => {
        const celula = resultado.celula;
        const cor = this.getCorPorLQ(resultado.lq);
        
        // Opacidade baseada no LQ
        const opacidade = Math.min(resultado.lq / 3, 0.7);
        
        const retangulo = L.rectangle(celula.bounds, {
          color: cor,
          weight: 1,
          fillColor: cor,
          fillOpacity: opacidade,
          className: 'lq-cell'
        });
        
        // Popup com informações
        retangulo.bindPopup(`
          <div style="min-width: 200px;">
            <h4 style="margin: 0 0 10px 0; color: ${cor};">
              📊 Location Quotient
            </h4>
            <p><strong>LQ:</strong> ${resultado.lq.toFixed(2)}</p>
            <p><strong>Interpretação:</strong> ${resultado.interpretacao}</p>
            <hr style="margin: 10px 0; border: none; border-top: 1px solid #eee;">
            <p><strong>Escolas totais:</strong> ${resultado.detalhes.totalEscolas}</p>
            <p><strong>Escolas críticas:</strong> ${resultado.detalhes.escolasFiltradas}</p>
            <p><strong>Taxa local:</strong> ${resultado.detalhes.taxaRegiao}</p>
            <p><strong>Taxa cidade:</strong> ${resultado.detalhes.taxaCidade}</p>
          </div>
        `);
        
        return retangulo;
      });
    
    // Adicionar ao mapa
    this.layerLQ = L.layerGroup(retangulos);
    this.layerLQ.addTo(window.map);
    
    // Adicionar legenda
    this.adicionarLegenda();
    
    console.log(`✅ ${retangulos.length} células visualizadas`);
  }
  
  adicionarLegenda() {
    // Remover legenda anterior se existir
    const legendaExistente = document.querySelector('.legenda-lq');
    if (legendaExistente) {
      legendaExistente.remove();
    }
    
    const legenda = L.control({ position: 'bottomleft' });
    
    legenda.onAdd = function() {
      const div = L.DomUtil.create('div', 'legenda-lq');
      div.style.cssText = `
        background: rgba(255, 255, 255, 0.95);
        padding: 12px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        font-size: 12px;
      `;
      
      div.innerHTML = `
        <strong>📊 Location Quotient</strong><br>
        <small style="color: #666;">Concentração regional vs. cidade</small><br>
        <div style="margin-top: 8px;">
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #8B0000; margin-right: 8px;"></div>
            <span>LQ > 2.0 (Muito alto)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #DC143C; margin-right: 8px;"></div>
            <span>LQ 1.5-2.0 (Alto)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #FF8C00; margin-right: 8px;"></div>
            <span>LQ 1.0-1.5 (Médio)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #FFD700; margin-right: 8px;"></div>
            <span>LQ 0.5-1.0 (Baixo)</span>
          </div>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <div style="width: 20px; height: 12px; background: #90EE90; margin-right: 8px;"></div>
            <span>LQ < 0.5 (Muito baixo)</span>
          </div>
        </div>
      `;
      
      return div;
    };
    
    legenda.addTo(window.map);
  }
  
  // ==================== ESTATÍSTICAS ====================
  gerarEstatisticas() {
    if (this.resultados.length === 0) {
      return {
        total: 0,
        lqMedio: 0,
        lqMaximo: 0,
        celulasAltas: 0
      };
    }
    
    const lqs = this.resultados.map(r => r.lq);
    const lqMedio = lqs.reduce((a, b) => a + b, 0) / lqs.length;
    const lqMaximo = Math.max(...lqs);
    const celulasAltas = this.resultados.filter(r => r.lq > 1.5).length;
    
    return {
      total: this.resultados.length,
      lqMedio: lqMedio.toFixed(2),
      lqMaximo: lqMaximo.toFixed(2),
      celulasAltas,
      porcentagemAltas: ((celulasAltas / this.resultados.length) * 100).toFixed(1) + '%',
      top5: this.resultados.slice(0, 5).map(r => ({
        lq: r.lq.toFixed(2),
        total: r.detalhes.totalEscolas,
        criticas: r.detalhes.escolasFiltradas,
        centro: r.celula.centro
      }))
    };
  }
  
  // ==================== REMOVER ====================
  remover() {
    if (this.layerLQ) {
      window.map.removeLayer(this.layerLQ);
      this.layerLQ = null;
    }
    
    const legenda = document.querySelector('.legenda-lq');
    if (legenda) {
      legenda.remove();
    }
    
    console.log('🗑️ LQ removido do mapa');
  }
  
  // ==================== EXPORTAR ====================
  exportarRelatorio() {
    const relatorio = {
      tipo: 'Location Quotient',
      timestamp: new Date().toISOString(),
      estatisticas: this.gerarEstatisticas(),
      resultados: this.resultados.map(r => ({
        lq: r.lq,
        interpretacao: r.interpretacao,
        totalEscolas: r.detalhes.totalEscolas,
        escolasCriticas: r.detalhes.escolasFiltradas,
        taxaRegiao: r.detalhes.taxaRegiao,
        centro: r.celula.centro
      }))
    };
    
    const json = JSON.stringify(relatorio, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-quotient-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('📥 Relatório LQ exportado');
  }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.locationQuotientHandler = new LocationQuotientHandler();

// Função global de atalho
window.calcularLocationQuotient = (filtro) => {
  return window.locationQuotientHandler.calcular(filtro);
};

console.log('✅ Location Quotient carregado');
