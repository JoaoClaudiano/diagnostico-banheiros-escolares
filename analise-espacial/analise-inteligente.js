// analise-inteligente.js - Análise Inteligente em Tempo Real
console.log('🧠 Carregando análise inteligente...');

class AnaliseInteligente {
  constructor() {
    this.indicadoresAtivos = new Set();
    this.metricasEmTempoReal = {};
    this.intervalos = {};
    this.inicializado = false;
  }
  
  inicializar() {
    if (this.inicializado) return;
    
    console.log('🚀 Inicializando análise inteligente...');
    
    // Verificar dependências
    if (!window.dadosManager) {
      console.error('❌ DadosManager não disponível');
      return false;
    }
    
    // Configurar monitoramento
    this.configurarMonitoramento();
    
    this.inicializado = true;
    console.log('✅ Análise inteligente inicializada');
    
    return true;
  }
  
  configurarMonitoramento() {
    // Monitorar atualizações de dados
    if (window.dadosManager) {
      window.dadosManager.adicionarListener('dados_atualizados', (dados) => {
        this.atualizarMetricasEmTempoReal(dados);
        this.verificarAlertas(dados);
      });
    }
    
    // Configurar atualização periódica
    this.intervalos.metricas = setInterval(() => {
      this.atualizarDashboard();
    }, 5000); // A cada 5 segundos
  }
  
  atualizarMetricasEmTempoReal(dados) {
    const metricas = dados.metricas || {};
    const escolas = dados.escolas || [];
    
    // Calcular métricas avançadas
    this.metricasEmTempoReal = {
      ...metricas,
      // KDE - Densidade
      densidadeCritica: this.calcularDensidadeCritica(escolas),
      // Gini Espacial
      giniEspacial: this.calcularGiniEspacial(escolas),
      // Índice de Moran
      moranIndex: this.calcularMoranIndex(escolas),
      // Location Quotient
      locationQuotient: this.calcularLocationQuotient(escolas),
      // Hotspots
      hotspots: this.identificarHotspots(escolas),
      // Timestamp
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Métricas em tempo real atualizadas');
  }
  
  calcularDensidadeCritica(escolas) {
    const criticas = escolas.filter(e => e.classe === 'crítico');
    const total = escolas.length;
    
    if (total === 0) return 0;
    
    // Densidade = críticas / total
    const densidade = criticas.length / total;
    
    // Calcular concentração espacial
    const concentracao = this.calcularConcentracaoEspacial(criticas);
    
    return {
      densidade: densidade.toFixed(3),
      concentracao: concentracao.toFixed(3),
      nivel: densidade > 0.3 ? 'ALTA' : densidade > 0.1 ? 'MÉDIA' : 'BAIXA'
    };
  }
  
  calcularConcentracaoEspacial(escolas) {
    if (escolas.length < 2) return 0;
    
    // Calcular distância média entre escolas
    let distanciaTotal = 0;
    let pares = 0;
    
    for (let i = 0; i < escolas.length; i++) {
      for (let j = i + 1; j < escolas.length; j++) {
        const distancia = this.calcularDistancia(
          escolas[i].lat, escolas[i].lng,
          escolas[j].lat, escolas[j].lng
        );
        distanciaTotal += distancia;
        pares++;
      }
    }
    
    const distanciaMedia = pares > 0 ? distanciaTotal / pares : 0;
    
    // Normalizar (distância menor = concentração maior)
    const concentracao = 1 / (1 + distanciaMedia);
    
    return concentracao;
  }
  
  calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  calcularGiniEspacial(escolas) {
    if (escolas.length === 0) return 0;
    
    // Ordenar escolas por peso (criticidade)
    const escolasOrdenadas = [...escolas].sort((a, b) => a.peso - b.peso);
    
    // Calcular coeficiente de Gini
    const n = escolasOrdenadas.length;
    const pesos = escolasOrdenadas.map(e => e.peso);
    const somaPesos = pesos.reduce((a, b) => a + b, 0);
    
    if (somaPesos === 0) return 0;
    
    let somaAcumulada = 0;
    let gini = 0;
    
    for (let i = 0; i < n; i++) {
      somaAcumulada += pesos[i];
      gini += (i + 1) * pesos[i];
    }
    
    gini = (2 * gini) / (n * somaPesos) - (n + 1) / n;
    
    return {
      coeficiente: gini.toFixed(3),
      interpretacao: gini > 0.4 ? 'Alta desigualdade' : 
                    gini > 0.3 ? 'Desigualdade moderada' : 
                    'Baixa desigualdade'
    };
  }
  
  calcularMoranIndex(escolas) {
    if (escolas.length < 3) return 0;
    
    // Implementação simplificada do Índice de Moran
    const valores = escolas.map(e => e.peso);
    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    
    let numerador = 0;
    let denominador = 0;
    
    for (let i = 0; i < valores.length; i++) {
      const diffI = valores[i] - media;
      denominador += diffI * diffI;
      
      for (let j = 0; j < valores.length; j++) {
        if (i !== j) {
          const distancia = this.calcularDistancia(
            escolas[i].lat, escolas[i].lng,
            escolas[j].lat, escolas[j].lng
          );
          
          // Peso inversamente proporcional à distância
          const peso = distancia > 0 ? 1 / distancia : 0;
          const diffJ = valores[j] - media;
          
          numerador += peso * diffI * diffJ;
        }
      }
    }
    
    const moran = denominador > 0 ? numerador / denominador : 0;
    
    return {
      indice: moran.toFixed(3),
      significancia: Math.abs(moran) > 0.3 ? 'Significativo' : 'Não significativo',
      padrao: moran > 0 ? 'Cluster (agrupamento)' : 
              moran < 0 ? 'Dispersão' : 'Aleatório'
    };
  }
  
  calcularLocationQuotient(escolas) {
    // Implementação simplificada do LQ
    const criticas = escolas.filter(e => e.classe === 'crítico').length;
    const total = escolas.length;
    
    if (total === 0) return 0;
    
    // Supondo que a referência seja 20% (proporção esperada)
    const proporcaoReferencia = 0.2;
    const proporcaoLocal = criticas / total;
    
    const lq = proporcaoLocal / proporcaoReferencia;
    
    return {
      lq: lq.toFixed(2),
      interpretacao: lq > 1.5 ? 'Alta especialização' : 
                    lq > 1 ? 'Especialização moderada' : 
                    'Baixa especialização'
    };
  }
  
  identificarHotspots(escolas) {
    const criticas = escolas.filter(e => e.classe === 'crítico');
    
    if (criticas.length === 0) return [];
    
    // Agrupar por proximidade (500m)
    const clusters = [];
    const visitadas = new Set();
    
    criticas.forEach((escola, index) => {
      if (visitadas.has(index)) return;
      
      const cluster = [escola];
      visitadas.add(index);
      
      // Encontrar vizinhas
      for (let j = index + 1; j < criticas.length; j++) {
        if (!visitadas.has(j)) {
          const distancia = this.calcularDistancia(
            escola.lat, escola.lng,
            criticas[j].lat, criticas[j].lng
          );
          
          if (distancia < 0.5) { // 500m
            cluster.push(criticas[j]);
            visitadas.add(j);
          }
        }
      }
      
      if (cluster.length >= 2) {
        clusters.push({
          escolas: cluster,
          tamanho: cluster.length,
          centro: this.calcularCentro(cluster),
          raio: this.calcularRaioCluster(cluster)
        });
      }
    });
    
    return clusters.sort((a, b) => b.tamanho - a.tamanho);
  }
  
  calcularCentro(escolas) {
    const lat = escolas.reduce((sum, e) => sum + e.lat, 0) / escolas.length;
    const lng = escolas.reduce((sum, e) => sum + e.lng, 0) / escolas.length;
    
    return { lat, lng };
  }
  
  calcularRaioCluster(escolas) {
    if (escolas.length < 2) return 0;
    
    const centro = this.calcularCentro(escolas);
    const distancias = escolas.map(e => 
      this.calcularDistancia(centro.lat, centro.lng, e.lat, e.lng)
    );
    
    return Math.max(...distancias);
  }
  
  verificarAlertas(dados) {
    const metricas = dados.metricas || {};
    
    // Verificar aumento súbito de escolas críticas
    if (metricas.escolasCriticas > this.metricasEmTempoReal.escolasCriticas * 1.5) {
      this.dispararAlerta('aumento_critico', {
        anterior: this.metricasEmTempoReal.escolasCriticas,
        atual: metricas.escolasCriticas,
        aumento: ((metricas.escolasCriticas / this.metricasEmTempoReal.escolasCriticas - 1) * 100).toFixed(1) + '%'
      });
    }
    
    // Verificar hotspots
    const hotspots = this.identificarHotspots(dados.escolas || []);
    if (hotspots.length > 0 && hotspots[0].tamanho >= 3) {
      this.dispararAlerta('hotspot_detectado', {
        localizacao: hotspots[0].centro,
        tamanho: hotspots[0].tamanho,
        raio: hotspots[0].raio.toFixed(2) + ' km'
      });
    }
  }
  
  dispararAlerta(tipo, dados) {
    console.log(`🚨 ALERTA: ${tipo}`, dados);
    
    // Criar notificação visual
    this.criarNotificacao(tipo, dados);
    
    // Disparar evento
    document.dispatchEvent(new CustomEvent('alerta_detectado', {
      detail: { tipo, dados, timestamp: new Date().toISOString() }
    }));
  }
  
  criarNotificacao(tipo, dados) {
    // Verificar se já existe container de notificações
    let container = document.getElementById('alertas-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'alertas-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 300px;
      `;
      document.body.appendChild(container);
    }
    
    // Criar notificação
    const alerta = document.createElement('div');
    alerta.className = 'alerta-notificacao';
    alerta.style.cssText = `
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 8px;
      padding: 12px 15px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    
    // Adicionar conteúdo baseado no tipo
    let titulo = '';
    let mensagem = '';
    let cor = '#ffc107';
    
    switch(tipo) {
      case 'aumento_critico':
        titulo = '🚨 Aumento Crítico Detectado';
        mensagem = `Escolas críticas aumentaram ${dados.aumento}`;
        cor = '#dc3545';
        break;
      case 'hotspot_detectado':
        titulo = '🔥 Hotspot Detectado';
        mensagem = `Cluster com ${dados.tamanho} escolas críticas`;
        cor = '#fd7e14';
        break;
      default:
        titulo = '⚠️ Alerta do Sistema';
        mensagem = JSON.stringify(dados);
    }
    
    alerta.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 10px;">
        <div style="width: 8px; height: 100%; background: ${cor}; border-radius: 4px;"></div>
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 5px;">${titulo}</div>
          <div style="font-size: 13px; color: #666;">${mensagem}</div>
          <div style="font-size: 11px; color: #999; margin-top: 8px;">
            ${new Date().toLocaleTimeString()}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; font-size: 20px; cursor: pointer; color: #999;">
          &times;
        </button>
      </div>
    `;
    
    container.insertBefore(alerta, container.firstChild);
    
    // Remover automaticamente após 10 segundos
    setTimeout(() => {
      if (alerta.parentElement) {
        alerta.remove();
      }
    }, 10000);
  }
  
  atualizarDashboard() {
    // Atualizar métricas na interface
    const elementosMetricas = document.querySelectorAll('.metric-card .metric-value');
    
    if (elementosMetricas.length > 0 && this.metricasEmTempoReal.totalEscolas) {
      // Atualizar métricas básicas
const elTotal = document.getElementById('metric-total');
if (elTotal) elTotal.textContent = this.metricasEmTempoReal.totalEscolas || 0;

const elCriticas = document.getElementById('metric-criticas');
if (elCriticas) elCriticas.textContent = this.metricasEmTempoReal.escolasCriticas || 0;

const elAvaliadas = document.getElementById('metric-avaliadas');
if (elAvaliadas) elAvaliadas.textContent = this.metricasEmTempoReal.percentualAvaliadas || '0%';

const elPontuacao = document.getElementById('metric-pontuacao');
if (elPontuacao) elPontuacao.textContent = this.metricasEmTempoReal.pontuacaoMedia || '0.0';

     }
    
    // Atualizar distribuição
    if (this.metricasEmTempoReal.distribuicaoClasses) {
      this.atualizarGraficoDistribuicao(this.metricasEmTempoReal.distribuicaoClasses);
    }
  }
  
  atualizarGraficoDistribuicao(distribuicao) {
    const total = Object.values(distribuicao).reduce((a, b) => a + b, 0);
    
    if (total === 0) return;
    
    // Atualizar cada barra
    const classes = ['crítico', 'atenção', 'alerta', 'adequada'];
    const cores = {
      'crítico': '#dc3545',
      'atenção': '#fd7e14',
      'alerta': '#ffc107',
      'adequada': '#28a745'
    };
    
    classes.forEach(classe => {
      const quantidade = distribuicao[classe] || 0;
      const percentual = (quantidade / total * 100).toFixed(1);
      
      // Encontrar elemento da barra
      const barLabel = Array.from(document.querySelectorAll('.bar-label'))
        .find(el => el.textContent.includes(classe.charAt(0).toUpperCase() + classe.slice(1)));
      
      if (barLabel) {
        const barContainer = barLabel.nextElementSibling;
        if (barContainer && barContainer.classList.contains('bar-container')) {
          const barFill = barContainer.querySelector('.bar-fill');
          const barValue = barContainer.querySelector('.bar-value');
          
          if (barFill) {
            barFill.style.width = `${percentual}%`;
            barFill.style.background = cores[classe] || '#6c757d';
          }
          
          if (barValue) {
            barValue.textContent = `${percentual}%`;
          }
        }
      }
    });
  }
  
  // Ativar/desativar indicadores
  ativarIndicador(nome) {
    this.indicadoresAtivos.add(nome);
    console.log(`📊 Indicador ativado: ${nome}`);
  }
  
  desativarIndicador(nome) {
    this.indicadoresAtivos.delete(nome);
    console.log(`📊 Indicador desativado: ${nome}`);
  }
  
  // Obter métricas
  getMetricas() {
    return this.metricasEmTempoReal;
  }
}

// Criar e inicializar instância global
const analiseInteligente = new AnaliseInteligente();

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    analiseInteligente.inicializar();
  }, 1500);
});

// Exportar funções globais
window.analiseInteligente = analiseInteligente;

console.log('✅ Análise inteligente carregada');