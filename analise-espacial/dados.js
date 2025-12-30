// dados.js - VERSÃO CORRIGIDA E SIMPLIFICADA

class DadosManager {
  constructor() {
    this.dados = {
      escolas: [],
      avaliacoes: [],
      metricas: {},
      status: 'inicializando'
    };
    
    this.eventListeners = new Map();
    this.initialized = false;
    
    // Adicione ao final da classe DadosManager, antes do } (fechamento da classe)
removerDuplicatas() {
  console.log('🔍 Removendo duplicatas de escolas...');
  
  const escolasUnicas = [];
  const nomesProcessados = new Set();
  
  this.dados.escolas.forEach(escola => {
    const chave = `${escola.nome.toLowerCase()}_${escola.lat.toFixed(6)}_${escola.lng.toFixed(6)}`;
    
    if (!nomesProcessados.has(chave)) {
      nomesProcessados.add(chave);
      escolasUnicas.push(escola);
    } else {
      console.log(`⚠️ Removendo duplicata: ${escola.nome}`);
    }
  });
  
  this.dados.escolas = escolasUnicas;
  console.log(`✅ ${this.dados.escolas.length} escolas únicas após remoção de duplicatas`);
}
    
  }
  
  async inicializar() {
    // Evitar inicialização múltipla
    if (this.initialized) {
      console.log('⚠️ Dados já inicializados');
      return this.dados;
    }
    
    console.log('🚀 Inicializando sistema de dados...');
    this.dados.status = 'carregando';
    this.notificar('status', 'carregando');
    
    try {
      // 1. Tentar carregar escolas locais
      await this.carregarEscolasLocais();
      
      // 2. Tentar carregar do Firebase (não bloqueante)
      this.carregarAvaliacoesFirebase().then(() => {
        // Quando Firebase carregar, combinar dados
        this.combinarDados();
        this.calcularMetricas();
        this.notificar('dados_atualizados', this.dados);
      }).catch(error => {
        console.warn('⚠️ Firebase falhou, usando apenas dados locais:', error);
        this.combinarDados();
        this.calcularMetricas();
        this.notificar('dados_atualizados', this.dados);
      });
      
      // 3. Marcar como pronto (mesmo sem Firebase)
      this.dados.status = 'pronto';
      this.initialized = true;
      this.notificar('status', 'pronto');
      
      console.log(`✅ Sistema de dados inicializado: ${this.dados.escolasLocais?.length || 0} escolas locais`);
      
      return this.dados;
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.dados.status = 'erro';
      this.notificar('status', 'erro', error);
      return null;
    }
  }
  
  async carregarEscolasLocais() {
    console.log('📂 Tentando carregar escolas locais...');
    
    // Estratégia 1: Verificar se já está carregado
    if (window.escolas && Array.isArray(window.escolas)) {
      console.log(`📂 ${window.escolas.length} escolas já carregadas no window.escolas`);
      return this.processarEscolasLocais(window.escolas);
    }
    
    // Estratégia 2: Tentar carregar via fetch
    try {
      const response = await fetch('../mapa/escolas.js');
      if (!response.ok) throw new Error('Arquivo não encontrado');
      
      const text = await response.text();
      // Extrair array do arquivo JS (hack simples)
      const match = text.match(/window\.escolas = (\[.*?\])/s);
      if (match) {
        const escolasArray = eval(match[1]); // Cuidado! Mas confiamos no arquivo local
        window.escolas = escolasArray;
        return this.processarEscolasLocais(escolasArray);
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível carregar escolas locais:', error);
    }
    
    // Estratégia 3: Dados de fallback
    console.warn('⚠️ Usando dados de exemplo como fallback');
    window.escolas = this.criarDadosExemplo();
    return this.processarEscolasLocais(window.escolas);
  }
  
  processarEscolasLocais(escolasArray) {
    const escolasLocais = escolasArray.map((escola, index) => ({
      id: `local-${index + 1}`,
      nome: escola.nome || `Escola ${index + 1}`,
      lat: parseFloat(escola.lat) || -3.717,
      lng: parseFloat(escola.lng) || -38.543,
      fonte: 'local',
      metadata: { index },
      avaliacoes: [],
      classe: 'não avaliada',
      pontuacao: 0,
      peso: (window.PESOS_CLASSE && window.PESOS_CLASSE['não avaliada']) || 0.5
    }));
    
    this.dados.escolasLocais = escolasLocais;
    console.log(`📂 ${escolasLocais.length} escolas processadas`);
    return escolasLocais;
  }
  
  async carregarAvaliacoesFirebase() {
    console.log('📡 Tentando conectar ao Firebase...');
    
    // Verificar se Firebase está disponível
    if (!window.firebaseManager) {
      console.warn('⚠️ FirebaseManager não disponível');
      this.dados.avaliacoes = [];
      return;
    }
    
    try {
      // Testar conexão primeiro
      if (window.firebaseManager.testarConexao) {
        const conectado = await window.firebaseManager.testarConexao();
        if (!conectado) {
          console.warn('⚠️ Sem conexão com Firebase');
          this.dados.avaliacoes = [];
          return;
        }
      }
      
      // Buscar avaliações
      const avaliacoes = await window.firebaseManager.buscarTodasAvaliacoes();
      this.dados.avaliacoes = avaliacoes;
      console.log(`📡 ${avaliacoes.length} avaliações do Firebase`);
      
    } catch (error) {
      console.error('❌ Erro no Firebase:', error);
      this.dados.avaliacoes = [];
      throw error;
    }
  }
  
  combinarDados() {
    console.log('🔗 Combinando dados...');
    
    // Começar com as escolas locais
    let escolasCombinadas = [...(this.dados.escolasLocais || [])];
    
    // Para cada avaliação, tentar encontrar escola correspondente
    (this.dados.avaliacoes || []).forEach(avaliacao => {
      let escolaIndex = escolasCombinadas.findIndex(escola => 
        escola.nome.toLowerCase() === avaliacao.nome.toLowerCase()
      );
      
      if (escolaIndex === -1) {
        // Escola nova do Firebase
        escolaIndex = escolasCombinadas.length;
        escolasCombinadas.push({
          id: `firebase-${avaliacao.id}`,
          nome: avaliacao.nome,
          lat: avaliacao.lat,
          lng: avaliacao.lng,
          fonte: 'firebase',
          metadata: {},
          avaliacoes: [],
          classe: 'não avaliada',
          pontuacao: 0,
          peso: (window.PESOS_CLASSE && window.PESOS_CLASSE['não avaliada']) || 0.5
        });
      }
      
      // Adicionar avaliação
      escolasCombinadas[escolaIndex].avaliacoes.push(avaliacao);
      
      // Atualizar classe se for mais crítica
      const pesoAtual = (window.PESOS_CLASSE && window.PESOS_CLASSE[escolasCombinadas[escolaIndex].classe]) || 0;
      const pesoNovo = (window.PESOS_CLASSE && window.PESOS_CLASSE[avaliacao.classe]) || 0;
      
      if (pesoNovo > pesoAtual) {
        escolasCombinadas[escolaIndex].classe = avaliacao.classe;
        escolasCombinadas[escolaIndex].pontuacao = avaliacao.pontuacao;
        escolasCombinadas[escolaIndex].peso = pesoNovo;
      }
    });
    
    // Adicionar propriedades para análise
    this.dados.escolas = escolasCombinadas.map(escola => ({
      ...escola,
      x: escola.lng,
      y: escola.lat,
      valor: escola.peso,
      cor: this.getCorPorClasse(escola.classe),
      grupo: `grupo-${Math.floor(escola.lat * 10)}-${Math.floor(escola.lng * 10)}`
    }));
    
    console.log(`🔗 ${this.dados.escolas.length} escolas combinadas`);
  }
  
  calcularMetricas() {
    const escolas = this.dados.escolas;
    const total = escolas.length;
    
    // Distribuição por classe
    const distribuicao = {};
    escolas.forEach(e => {
      distribuicao[e.classe] = (distribuicao[e.classe] || 0) + 1;
    });
    
    // Estatísticas
    const criticas = escolas.filter(e => e.classe === 'crítico').length;
    const avaliadas = escolas.filter(e => e.classe !== 'não avaliada').length;
    const pontuacoes = escolas.filter(e => e.pontuacao > 0).map(e => e.pontuacao);
    const media = pontuacoes.length > 0 ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length : 0;
    
    this.dados.metricas = {
      totalEscolas: total,
      escolasCriticas: criticas,
      escolasAvaliadas: avaliadas,
      percentualCriticas: total > 0 ? ((criticas / total) * 100).toFixed(1) : '0',
      percentualAvaliadas: total > 0 ? ((avaliadas / total) * 100).toFixed(1) : '0',
      pontuacaoMedia: media.toFixed(1),
      distribuicaoClasses: distribuicao,
      ultimaAtualizacao: new Date().toISOString(),
      fonteDados: this.dados.avaliacoes.length > 0 ? 'Firebase + Local' : 'Local apenas'
    };
    
    console.log('📊 Métricas calculadas:', this.dados.metricas);
    return this.dados.metricas;
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
  
  // Métodos de acesso
  getEscolas() { return this.dados.escolas; }
  getAvaliacoes() { return this.dados.avaliacoes; }
  getMetricas() { return this.dados.metricas; }
  getStatus() { return this.dados.status; }
  
  // Sistema de eventos
  adicionarListener(evento, callback) {
    if (!this.eventListeners.has(evento)) this.eventListeners.set(evento, []);
    this.eventListeners.get(evento).push(callback);
  }
  
  notificar(evento, ...args) {
    if (this.eventListeners.has(evento)) {
      this.eventListeners.get(evento).forEach(cb => {
        try { cb(...args); } catch (e) { console.error(e); }
      });
    }
  }
  
  criarDadosExemplo() {
    return [
      { nome: "Escola Exemplo A", lat: -3.717, lng: -38.543 },
      { nome: "Escola Exemplo B", lat: -3.750, lng: -38.580 }
    ];
  }
}

// Criar e exportar instância
const dadosManager = new DadosManager();
window.dadosManager = dadosManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Inicializando dados...');
  
  // Aguardar um pouco para garantir que tudo está carregado
  setTimeout(() => {
    dadosManager.inicializar();
  }, 1000);
});

console.log('✅ Sistema de dados carregado');