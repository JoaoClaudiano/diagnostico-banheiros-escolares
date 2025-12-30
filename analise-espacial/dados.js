// dados.js - Sistema unificado de dados para análise espacial

class DadosManager {
  constructor() {
    this.dados = {
      escolas: [],
      avaliacoes: [],
      metricas: {},
      status: 'inicializando'
    };
    
    this.eventListeners = new Map();
    this.cache = new Map();
    
    // Configurar eventos
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Quando as escolas locais carregarem
    document.addEventListener('escolasCarregadas', () => {
      console.log('🏫 Escolas locais carregadas, iniciando integração...');
      this.inicializar();
    });
  }
  
  async inicializar() {
    console.log('🚀 Inicializando sistema de dados...');
    this.dados.status = 'carregando';
    this.notificar('status', 'carregando');
    
    try {
      // 1. Carregar escolas locais
      await this.carregarEscolasLocais();
      
      // 2. Carregar avaliações do Firebase
      await this.carregarAvaliacoesFirebase();
      
      // 3. Combinar dados
      this.combinarDados();
      
      // 4. Calcular métricas iniciais
      await this.calcularMetricas();
      
      this.dados.status = 'pronto';
      console.log('✅ Sistema de dados inicializado com sucesso!');
      console.log(`📊 ${this.dados.escolas.length} escolas processadas`);
      
      this.notificar('status', 'pronto');
      this.notificar('dados_atualizados', this.dados);
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.dados.status = 'erro';
      this.notificar('status', 'erro', error);
    }
  }
  
  carregarEscolasLocais() {
    console.log('📂 Carregando escolas do arquivo local...');
    
    // Verificar se window.escolas existe (do mapa/escolas.js)
    if (!window.escolas || !Array.isArray(window.escolas)) {
      console.warn('⚠️ Nenhuma escola local encontrada, criando dados de exemplo...');
      window.escolas = this.criarDadosExemplo();
    }
    
    // Formatar escolas locais
    const escolasLocais = window.escolas.map((escola, index) => ({
      id: `local-${index + 1}`,
      nome: escola.nome,
      lat: parseFloat(escola.lat),
      lng: parseFloat(escola.lng),
      fonte: 'local',
      metadata: {
        index: index,
        ...escola
      },
      // Inicializar sem avaliações
      avaliacoes: [],
      classe: 'não avaliada',
      pontuacao: 0,
      peso: PESOS_CLASSE['não avaliada'] || 0.5
    }));
    
    this.dados.escolasLocais = escolasLocais;
    console.log(`📂 ${escolasLocais.length} escolas carregadas do arquivo local`);
    
    return escolasLocais;
  }
  
  async carregarAvaliacoesFirebase() {
    console.log('📡 Carregando avaliações do Firebase...');
    
    if (!window.firebaseManager) {
      console.warn('⚠️ Firebase não disponível, usando dados de exemplo');
      this.dados.avaliacoes = this.criarAvaliacoesExemplo();
      return;
    }
    
    try {
      const avaliacoes = await window.firebaseManager.buscarTodasAvaliacoes();
      this.dados.avaliacoes = avaliacoes;
      console.log(`📡 ${avaliacoes.length} avaliações carregadas do Firebase`);
    } catch (error) {
      console.error('Erro ao carregar do Firebase:', error);
      this.dados.avaliacoes = [];
    }
  }
  
  combinarDados() {
    console.log('🔗 Combinando dados locais com avaliações...');
    
    const escolasComAvaliacoes = [...this.dados.escolasLocais];
    
    // Para cada avaliação, encontrar a escola correspondente
    this.dados.avaliacoes.forEach(avaliacao => {
      // Encontrar escola mais próxima (por nome e/ou coordenadas)
      let escolaIndex = escolasComAvaliacoes.findIndex(escola => 
        this.saoMesmaEscola(escola, avaliacao)
      );
      
      if (escolaIndex === -1) {
        // Se não encontrar, criar nova entrada
        escolaIndex = escolasComAvaliacoes.length;
        escolasComAvaliacoes.push({
          id: `firebase-${avaliacao.id}`,
          nome: avaliacao.nome,
          lat: avaliacao.lat,
          lng: avaliacao.lng,
          fonte: 'firebase',
          metadata: {},
          avaliacoes: [],
          classe: 'não avaliada',
          pontuacao: 0,
          peso: PESOS_CLASSE['não avaliada'] || 0.5
        });
      }
      
      // Adicionar avaliação à escola
      escolasComAvaliacoes[escolaIndex].avaliacoes.push(avaliacao);
      
      // Atualizar classe baseada na avaliação mais crítica
      const pesoAtual = PESOS_CLASSE[escolasComAvaliacoes[escolaIndex].classe] || 0;
      const pesoNova = PESOS_CLASSE[avaliacao.classe] || 0;
      
      if (pesoNova > pesoAtual) {
        escolasComAvaliacoes[escolaIndex].classe = avaliacao.classe;
        escolasComAvaliacoes[escolaIndex].pontuacao = avaliacao.pontuacao;
        escolasComAvaliacoes[escolaIndex].peso = pesoNova;
      }
    });
    
    // Adicionar propriedades para análise espacial
    this.dados.escolas = escolasComAvaliacoes.map(escola => ({
      ...escola,
      // Propriedades para análise
      x: escola.lng,
      y: escola.lat,
      valor: escola.peso,
      // Cores baseadas na classe
      cor: this.getCorPorClasse(escola.classe),
      // Informações de agrupamento
      grupo: this.determinarGrupo(escola)
    }));
    
    console.log(`🔗 ${this.dados.escolas.length} escolas processadas no total`);
  }
  
  saoMesmaEscola(escola, avaliacao) {
    // Comparar por nome (case insensitive)
    const nomesIguais = escola.nome.toLowerCase() === avaliacao.nome.toLowerCase();
    
    // Comparar por proximidade geográfica (100 metros)
    const distancia = this.calcularDistancia(
      escola.lat, escola.lng,
      avaliacao.lat, avaliacao.lng
    );
    
    return nomesIguais || distancia < 0.1; // ~100 metros
  }
  
  calcularDistancia(lat1, lon1, lat2, lon2) {
    // Fórmula de Haversine (simplificada para distâncias curtas)
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  }
  
  getCorPorClasse(classe) {
    const cores = {
      'adequada': '#28a745',
      'alerta': '#ffc107',
      'atenção': '#fd7e14',
      'crítico': '#dc3545',
      'não avaliada': '#6c757d'
    };
    return cores[classe] || '#6c757d';
  }
  
  determinarGrupo(escola) {
    // Agrupa escolas por região aproximada (baseado em coordenadas)
    const latGrupo = Math.floor(escola.lat * 100) / 100; // Duas casas decimais
    const lngGrupo = Math.floor(escola.lng * 100) / 100;
    return `grupo-${latGrupo.toFixed(2)}-${lngGrupo.toFixed(2)}`;
  }
  
  async calcularMetricas() {
    console.log('📈 Calculando métricas de análise...');
    
    const escolas = this.dados.escolas;
    const total = escolas.length;
    
    // Distribuição por classe
    const distribuicao = {};
    escolas.forEach(escola => {
      distribuicao[escola.classe] = (distribuicao[escola.classe] || 0) + 1;
    });
    
    // Estatísticas básicas
    const escolasCriticas = escolas.filter(e => e.classe === 'crítico').length;
    const escolasAvaliadas = escolas.filter(e => e.classe !== 'não avaliada').length;
    
    // Pontuações
    const pontuacoes = escolas.map(e => e.pontuacao).filter(p => p > 0);
    const pontuacaoMedia = pontuacoes.length > 0 
      ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length 
      : 0;
    
    // Densidade geográfica
    const densidade = total / this.calcularAreaConvexHull(escolas);
    
    this.dados.metricas = {
      totalEscolas: total,
      escolasCriticas,
      escolasAvaliadas,
      percentualCriticas: total > 0 ? (escolasCriticas / total * 100).toFixed(1) : 0,
      percentualAvaliadas: total > 0 ? (escolasAvaliadas / total * 100).toFixed(1) : 0,
      pontuacaoMedia: pontuacaoMedia.toFixed(1),
      distribuicaoClasses: distribuicao,
      densidadeGeografica: densidade.toFixed(6),
      ultimaAtualizacao: new Date().toISOString(),
      fonteDados: 'Firebase + Arquivo Local'
    };
    
    console.log('📊 Métricas calculadas:', this.dados.metricas);
    return this.dados.metricas;
  }
  
  calcularAreaConvexHull(pontos) {
    // Cálculo simplificado da área do envelope convexo
    if (pontos.length < 3) return 1;
    
    const lats = pontos.map(p => p.lat);
    const lngs = pontos.map(p => p.lng);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Área aproximada em km²
    const deltaLat = (maxLat - minLat) * 111.32; // 1 grau ≈ 111.32 km
    const deltaLng = (maxLng - minLng) * 111.32 * Math.cos((minLat + maxLat) / 2 * Math.PI / 180);
    
    return Math.abs(deltaLat * deltaLng) || 1;
  }
  
  // Métodos de acesso aos dados
  getEscolas() {
    return this.dados.escolas;
  }
  
  getAvaliacoes() {
    return this.dados.avaliacoes;
  }
  
  getMetricas() {
    return this.dados.metricas;
  }
  
  getStatus() {
    return this.dados.status;
  }
  
  getDadosParaAnalise() {
    return this.dados.escolas.map(escola => ({
      id: escola.id,
      nome: escola.nome,
      x: escola.lng,
      y: escola.lat,
      valor: escola.peso,
      classe: escola.classe,
      pontuacao: escola.pontuacao,
      avaliacoes: escola.avaliacoes.length
    }));
  }
  
  // Sistema de notificação/eventos
  adicionarListener(evento, callback) {
    if (!this.eventListeners.has(evento)) {
      this.eventListeners.set(evento, []);
    }
    this.eventListeners.get(evento).push(callback);
  }
  
  removerListener(evento, callback) {
    if (this.eventListeners.has(evento)) {
      const listeners = this.eventListeners.get(evento);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }
  
  notificar(evento, ...args) {
    if (this.eventListeners.has(evento)) {
      this.eventListeners.get(evento).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Erro no listener do evento ${evento}:`, error);
        }
      });
    }
  }
  
  // Métodos auxiliares
  criarDadosExemplo() {
    return [
      { nome: "Escola Exemplo A", lat: -3.717, lng: -38.543 },
      { nome: "Escola Exemplo B", lat: -3.750, lng: -38.580 },
      { nome: "Escola Exemplo C", lat: -3.780, lng: -38.520 }
    ];
  }
  
  criarAvaliacoesExemplo() {
    return [
      {
        id: 'exemplo-1',
        nome: "MARIA DALVA DOS SANTOS",
        lat: -3.713231714,
        lng: -38.54572195,
        classe: "crítico",
        pontuacao: 85,
        createdAt: new Date()
      }
    ];
  }
}

// Criar e exportar instância global
const dadosManager = new DadosManager();
window.dadosManager = dadosManager;

// Inicializar automaticamente quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Sistema de dados pronto para inicialização');
  
  // Se as escolas já carregaram, inicializar
  if (window.escolas && window.escolas.length > 0) {
    dadosManager.inicializar();
  }
  
  // Caso contrário, aguardar o evento
});

console.log('✅ Sistema de dados carregado');