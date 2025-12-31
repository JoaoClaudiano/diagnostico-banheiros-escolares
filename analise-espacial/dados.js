// dados.js - PRIORIZANDO DADOS DO FIREBASE

class DadosManager {
  constructor() {
    this.dados = {
      escolas: [],
      avaliacoes: [],
      metricas: {},
      status: 'inicializando'
    };
    
    this.eventListeners = new Map();
    this.ultimaAtualizacao = null;
    this.cacheFirebase = null;
    this.cacheLocal = null;
  }
  
  async inicializar() {
    console.log('🚀 Inicializando sistema de dados (Firebase primeiro)...');
    this.dados.status = 'carregando';
    this.notificar('status', 'carregando');
    
    try {
      // 1. PRIMEIRO: Tentar carregar do Firebase
      console.log('📡 Priorizando Firebase como fonte principal...');
      const sucessoFirebase = await this.carregarDoFirebase();
      
      // 2. SE FIREBASE FALHAR: Usar dados locais
      if (!sucessoFirebase || this.dados.escolas.length === 0) {
        console.log('⚠️ Firebase sem dados, usando backup local...');
        await this.carregarDoLocal();
      }
      
      // 3. Processar métricas
      this.calcularMetricas();
      
      this.dados.status = 'pronto';
      this.ultimaAtualizacao = new Date();
      
      console.log(`✅ Sistema inicializado: ${this.dados.escolas.length} escolas carregadas`);
      console.log(`📊 Fonte principal: ${sucessoFirebase ? 'Firebase' : 'Local'}`);
      
      this.notificar('dados_atualizados', this.dados);
      this.notificar('status', 'pronto');
      
      return this.dados;
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.dados.status = 'erro';
      this.notificar('status', 'erro', error);
      return null;
    }
  }
  
  async carregarDoFirebase() {
    try {
      if (!window.firebaseManager) {
        console.warn('⚠️ Firebase não disponível');
        return false;
      }
      
      console.log('🔥 Buscando dados do Firebase...');
      
      // Buscar avaliações
      const avaliacoes = await window.firebaseManager.buscarTodasAvaliacoes();
      
      if (avaliacoes.length === 0) {
        console.log('📭 Firebase retornou 0 avaliações');
        return false;
      }
      
      console.log(`✅ ${avaliacoes.length} avaliações encontradas no Firebase`);
      
      // Processar avaliações para criar escolas únicas
      this.processarAvaliacoesFirebase(avaliacoes);
      
      // Cache dos dados do Firebase
      this.cacheFirebase = {
        avaliacoes: avaliacoes,
        escolas: [...this.dados.escolas],
        timestamp: new Date()
      };
      
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar do Firebase:', error);
      return false;
    }
  }
  
  processarAvaliacoesFirebase(avaliacoes) {
    console.log('🔗 Processando avaliações do Firebase...');
    
    // Agrupar avaliações por escola (chave única)
    const escolasMap = new Map();
    
    // Ordenar por data (mais recente primeiro)
    const avaliacoesOrdenadas = [...avaliacoes].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Processar cada avaliação
    avaliacoesOrdenadas.forEach(avaliacao => {
      // Criar chave única baseada em nome e coordenadas
      const chave = this.criarChaveEscola(avaliacao);
      
      if (!escolasMap.has(chave)) {
        // Nova escola
        escolasMap.set(chave, {
          id: `fb-${avaliacao.id || Date.now()}`,
          nome: avaliacao.nome,
          lat: avaliacao.lat,
          lng: avaliacao.lng,
          fonte: 'firebase',
          avaliacoes: [avaliacao],
          // Usar dados da avaliação mais recente
          classe: avaliacao.classe,
          status: avaliacao.classe,
          pontuacao: avaliacao.pontuacao,
          peso: this.calcularPeso(avaliacao.classe, avaliacao.pontuacao),
          createdAt: avaliacao.createdAt,
          updatedAt: avaliacao.createdAt,
          metadata: {
            totalAvaliacoes: 1,
            primeiraAvaliacao: avaliacao.createdAt,
            ultimaAvaliacao: avaliacao.createdAt
          }
        });
      } else {
        // Escola já existe, atualizar
        const escola = escolasMap.get(chave);
        
        // Adicionar avaliação
        escola.avaliacoes.push(avaliacao);
        
        // Manter a classe mais crítica
        const pesoAtual = this.calcularPeso(escola.classe, escola.pontuacao);
        const pesoNovo = this.calcularPeso(avaliacao.classe, avaliacao.pontuacao);
        
        if (pesoNovo > pesoAtual) {
          escola.classe = avaliacao.classe;
          escola.pontuacao = avaliacao.pontuacao;
          escola.peso = pesoNovo;
        }
        
        // Após linha 145 no dados.js, dentro do processarAvaliacoesFirebase:
classe: avaliacao.classe,
status: avaliacao.classe,  // ← ADICIONE ESTA LINHA para compatibilidade
pontuacao: avaliacao.pontuacao,
peso: this.calcularPeso(avaliacao.classe, avaliacao.pontuacao),
        
        // Atualizar metadados
        escola.metadata.totalAvaliacoes++;
        escola.updatedAt = avaliacao.createdAt;
        escola.metadata.ultimaAvaliacao = avaliacao.createdAt;
      }
    });
    
    // Converter mapa para array
    this.dados.escolas = Array.from(escolasMap.values());
    this.dados.avaliacoes = avaliacoes;
    
    console.log(`✅ ${this.dados.escolas.length} escolas únicas do Firebase`);
  }
  
  async carregarDoLocal() {
    try {
      console.log('📂 Carregando backup local...');
      
      // Verificar se escolas locais existem
      if (!window.escolas || !Array.isArray(window.escolas)) {
        console.warn('⚠️ Nenhuma escola local encontrada');
        this.dados.escolas = [];
        return false;
      }
      
      // Processar escolas locais
      const escolasLocais = window.escolas.map((escola, index) => ({
        id: `local-${index}`,
        nome: escola.nome,
        lat: escola.lat,
        lng: escola.lng,
        fonte: 'local',
        classe: 'não avaliada',
        pontuacao: 0,
        peso: 0.5,
        avaliacoes: [],
        metadata: {
          backup: true
        }
      }));
      
      this.dados.escolas = escolasLocais;
      this.cacheLocal = escolasLocais;
      
      console.log(`✅ ${escolasLocais.length} escolas do backup local`);
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao carregar backup local:', error);
      return false;
    }
  }
  
  criarChaveEscola(avaliacao) {
    // Criar chave única baseada em nome normalizado e coordenadas arredondadas
    const nomeNormalizado = avaliacao.nome.toLowerCase().trim().replace(/\s+/g, '_');
    const latArredondada = Math.round(avaliacao.lat * 10000) / 10000; // 4 casas decimais
    const lngArredondada = Math.round(avaliacao.lng * 10000) / 10000;
    
    return `${nomeNormalizado}_${latArredondada}_${lngArredondada}`;
  }
  
  calcularPeso(classe, pontuacao) {
    const pesosBase = {
      'adequada': 1,
      'alerta': 2,
      'atenção': 3,
      'crítico': 5,
      'não avaliada': 0.5
    };
    
    const pesoClasse = pesosBase[classe] || 0.5;
    const pesoPontuacao = pontuacao ? pontuacao / 100 : 0;
    
    return pesoClasse + pesoPontuacao;
  }
  
  calcularMetricas() {
    const escolas = this.dados.escolas;
    const total = escolas.length;
    
    if (total === 0) {
      this.dados.metricas = this.metricasVazias();
      return;
    }
    
    // Distribuição por classe
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
    
    // Escolas com dados do Firebase
    const escolasFirebase = escolas.filter(e => e.fonte === 'firebase').length;
    
    this.dados.metricas = {
      totalEscolas: total,
      escolasCriticas,
      escolasAvaliadas,
      escolasFirebase,
      percentualCriticas: ((escolasCriticas / total) * 100).toFixed(1),
      percentualAvaliadas: ((escolasAvaliadas / total) * 100).toFixed(1),
      percentualFirebase: ((escolasFirebase / total) * 100).toFixed(1),
      pontuacaoMedia: media.toFixed(1),
      distribuicaoClasses: distribuicao,
      ultimaAtualizacao: new Date().toISOString(),
      fontePrincipal: escolasFirebase > 0 ? 'Firebase' : 'Local',
      status: 'ativo'
    };
    
    console.log('📊 Métricas calculadas:', this.dados.metricas);
  }
  
  metricasVazias() {
    return {
      totalEscolas: 0,
      escolasCriticas: 0,
      escolasAvaliadas: 0,
      escolasFirebase: 0,
      percentualCriticas: '0.0',
      percentualAvaliadas: '0.0',
      percentualFirebase: '0.0',
      pontuacaoMedia: '0.0',
      distribuicaoClasses: {},
      ultimaAtualizacao: new Date().toISOString(),
      fontePrincipal: 'Nenhuma',
      status: 'inativo'
    };
  }
  
  // Métodos de acesso
  getEscolas() { 
    return this.dados.escolas; 
  }
  
  getEscolasCriticas() {
    return this.dados.escolas.filter(e => e.classe === 'crítico');
  }
  
  getEscolasPorClasse(classe) {
    return this.dados.escolas.filter(e => e.classe === classe);
  }
  
  getMetricas() { 
    return this.dados.metricas; 
  }
  
  getStatus() { 
    return this.dados.status; 
  }
  
  getUltimaAtualizacao() {
    return this.ultimaAtualizacao;
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
  
  // Verificar se há dados do Firebase
  temDadosFirebase() {
    return this.dados.escolas.some(e => e.fonte === 'firebase');
  }
}

// Inicializar sistema
const dadosManager = new DadosManager();
window.dadosManager = dadosManager;

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Sistema de dados pronto para inicialização');
  
  setTimeout(() => {
    dadosManager.inicializar();
  }, 1500);
});

console.log('✅ Sistema de dados (Firebase primeiro) carregado');