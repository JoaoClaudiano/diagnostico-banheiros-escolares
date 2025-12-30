// dados.js - VERSÃO CORRIGIDA PARA INTEGRAÇÃO COMPLETA
class DadosManager {
  constructor() {
    this.dados = {
      escolas: [],
      avaliacoes: [],
      metricas: {},
      status: 'inicializando'
    };
    
    this.eventListeners = new Map();
  }
  
  async inicializar() {
    console.log('🚀 Inicializando sistema de dados...');
    this.dados.status = 'carregando';
    this.notificar('status', 'carregando');
    
    try {
      // 1. Carregar escolas locais (sempre primeiro)
      await this.carregarEscolasLocais();
      
      // 2. Tentar carregar do Firebase (mas não bloquear)
      this.carregarAvaliacoesFirebase().then(avaliacoes => {
        console.log(`📡 ${avaliacoes.length} avaliações do Firebase processadas`);
        
        // 3. Combinar dados quando Firebase terminar
        this.combinarDadosComFirebase(avaliacoes);
        
        // 4. Calcular métricas
        this.calcularMetricas();
        
        // 5. Notificar que dados estão prontos
        this.notificar('dados_atualizados', this.dados);
      }).catch(error => {
        console.warn('⚠️ Firebase falhou, usando apenas dados locais');
        this.calcularMetricas();
        this.notificar('dados_atualizados', this.dados);
      });
      
      // Marcar como pronto (não esperar pelo Firebase)
      this.dados.status = 'pronto';
      this.notificar('status', 'pronto');
      
      return this.dados;
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.dados.status = 'erro';
      this.notificar('status', 'erro', error);
      return null;
    }
  }
  
  carregarEscolasLocais() {
    console.log('📂 Carregando escolas locais...');
    
    // Verificar se já temos as escolas no window
    if (window.escolas && Array.isArray(window.escolas)) {
      console.log(`📂 ${window.escolas.length} escolas encontradas no window.escolas`);
      
      // Processar escolas locais
      this.dados.escolas = window.escolas.map((escola, index) => ({
        id: `local-${index}`,
        nome: escola.nome || `Escola ${index}`,
        lat: parseFloat(escola.lat) || -3.717,
        lng: parseFloat(escola.lng) || -38.543,
        fonte: 'local',
        classe: 'não avaliada',
        pontuacao: 0,
        peso: window.PESOS_CLASSE ? window.PESOS_CLASSE['não avaliada'] : 0.5,
        avaliacoes: [],
        metadata: { indice: index }
      }));
      
      console.log(`✅ ${this.dados.escolas.length} escolas locais processadas`);
      return this.dados.escolas;
    }
    
    console.warn('⚠️ Nenhuma escola local encontrada');
    return [];
  }
  
  async carregarAvaliacoesFirebase() {
    console.log('📡 Conectando ao Firebase...');
    
    // Verificar se Firebase está disponível
    if (!window.firebaseManager) {
      console.warn('⚠️ FirebaseManager não disponível');
      return [];
    }
    
    try {
      // Testar conexão
      const conectado = await window.firebaseManager.testarConexao();
      if (!conectado) {
        console.warn('⚠️ Sem conexão com Firebase');
        return [];
      }
      
      // Buscar avaliações
      const avaliacoes = await window.firebaseManager.buscarTodasAvaliacoes();
      this.dados.avaliacoes = avaliacoes;
      
      console.log(`✅ ${avaliacoes.length} avaliações do Firebase`);
      
      return avaliacoes;
      
    } catch (error) {
      console.error('❌ Erro no Firebase:', error);
      return [];
    }
  }
  
  combinarDadosComFirebase(avaliacoesFirebase) {
    console.log('🔗 Combinando dados locais com Firebase...');
    
    // Se não houver avaliações do Firebase, apenas usar locais
    if (!avaliacoesFirebase || avaliacoesFirebase.length === 0) {
      console.log('⚠️ Nenhuma avaliação do Firebase para combinar');
      return;
    }
    
    // Mapa para armazenar escolas únicas por nome
    const escolasMap = new Map();
    
    // Primeiro, adicionar todas as escolas locais ao mapa
    this.dados.escolas.forEach(escola => {
      const chave = escola.nome.toLowerCase().trim();
      escolasMap.set(chave, { ...escola });
    });
    
    // Agora, processar avaliações do Firebase
    avaliacoesFirebase.forEach(avaliacao => {
      const chave = avaliacao.nome.toLowerCase().trim();
      
      if (escolasMap.has(chave)) {
        // Escola já existe, atualizar com dados do Firebase
        const escola = escolasMap.get(chave);
        
        // Adicionar avaliação
        if (!escola.avaliacoes) escola.avaliacoes = [];
        escola.avaliacoes.push(avaliacao);
        
        // Atualizar classe se for mais crítica
        const pesoAtual = window.PESOS_CLASSE ? window.PESOS_CLASSE[escola.classe] || 0 : 0;
        const pesoNovo = window.PESOS_CLASSE ? window.PESOS_CLASSE[avaliacao.classe] || 0 : 0;
        
        if (pesoNovo > pesoAtual) {
          escola.classe = avaliacao.classe;
          escola.pontuacao = avaliacao.pontuacao;
          escola.peso = pesoNovo;
        }
        
        // Marcar que tem dados do Firebase
        escola.fonte = 'local+firebase';
        
      } else {
        // Escola nova do Firebase (não está na lista local)
        escolasMap.set(chave, {
          id: `firebase-${avaliacao.id}`,
          nome: avaliacao.nome,
          lat: avaliacao.lat,
          lng: avaliacao.lng,
          fonte: 'firebase',
          classe: avaliacao.classe,
          pontuacao: avaliacao.pontuacao,
          peso: window.PESOS_CLASSE ? window.PESOS_CLASSE[avaliacao.classe] || 0.5 : 0.5,
          avaliacoes: [avaliacao],
          metadata: { fonte: 'firebase' }
        });
      }
    });
    
    // Converter mapa de volta para array
    this.dados.escolas = Array.from(escolasMap.values());
    
    console.log(`🔗 ${this.dados.escolas.length} escolas após combinação`);
  }
  
  calcularMetricas() {
    const escolas = this.dados.escolas;
    const total = escolas.length;
    
    if (total === 0) {
      this.dados.metricas = {
        totalEscolas: 0,
        escolasCriticas: 0,
        escolasAvaliadas: 0,
        percentualCriticas: '0.0',
        percentualAvaliadas: '0.0',
        pontuacaoMedia: '0.0',
        distribuicaoClasses: {},
        ultimaAtualizacao: new Date().toISOString(),
        fonteDados: 'Nenhuma'
      };
      return;
    }
    
    // Calcular distribuição por classe
    const distribuicao = {};
    escolas.forEach(escola => {
      distribuicao[escola.classe] = (distribuicao[escola.classe] || 0) + 1;
    });
    
    // Estatísticas
    const escolasCriticas = escolas.filter(e => e.classe === 'crítico').length;
    const escolasAvaliadas = escolas.filter(e => e.classe !== 'não avaliada').length;
    const pontuacoes = escolas.filter(e => e.pontuacao > 0).map(e => e.pontuacao);
    const media = pontuacoes.length > 0 ? 
      pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length : 0;
    
    this.dados.metricas = {
      totalEscolas: total,
      escolasCriticas,
      escolasAvaliadas,
      percentualCriticas: ((escolasCriticas / total) * 100).toFixed(1),
      percentualAvaliadas: ((escolasAvaliadas / total) * 100).toFixed(1),
      pontuacaoMedia: media.toFixed(1),
      distribuicaoClasses: distribuicao,
      ultimaAtualizacao: new Date().toISOString(),
      fonteDados: this.dados.avaliacoes.length > 0 ? 'Firebase + Local' : 'Local apenas'
    };
    
    console.log('📊 Métricas calculadas:', this.dados.metricas);
  }
  
  // Métodos de acesso
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
  
  // Sistema de eventos
  adicionarListener(evento, callback) {
    if (!this.eventListeners.has(evento)) {
      this.eventListeners.set(evento, []);
    }
    this.eventListeners.get(evento).push(callback);
  }
  
  notificar(evento, ...args) {
    if (this.eventListeners.has(evento)) {
      this.eventListeners.get(evento).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Erro no listener de ${evento}:`, error);
        }
      });
    }
  }
}

// Criar e inicializar o gerenciador de dados
const dadosManager = new DadosManager();
window.dadosManager = dadosManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Inicializando sistema de dados...');
  
  // Aguardar um pouco para garantir que tudo está carregado
  setTimeout(() => {
    dadosManager.inicializar();
  }, 1500);
});

console.log('✅ Sistema de dados carregado');