// normalizador-dados.js - Padronização de Dados
console.log('🔧 Normalizador de Dados v1.0');

class NormalizadorDados {
  constructor() {
    // Mapeamentos padronizados
    this.mapaStatus = {
      // Variações em português
      'critico': 'crítico',
      'crítico': 'crítico',
      'crÃ­tico': 'crítico',
      
      'atencao': 'atenção',
      'atenção': 'atenção',
      'atenÃ§Ã£o': 'atenção',
      'atencion': 'atenção',
      
      'alerta': 'alerta',
      
      'ok': 'adequada',
      'adequada': 'adequada',
      'adequado': 'adequada',
      'bom': 'adequada',
      
      'nao avaliada': 'não avaliada',
      'não avaliada': 'não avaliada',
      'nÃ£o avaliada': 'não avaliada',
      'sem avaliacao': 'não avaliada',
      'sem avaliação': 'não avaliada'
    };
    
    this.mapaClasse = this.mapaStatus; // Mesmo mapa para 'classe'
    
    // Cores padrão por status
    this.cores = {
      'crítico': '#F44336',
      'atenção': '#FF9800',
      'alerta': '#FFD700',
      'adequada': '#4CAF50',
      'não avaliada': '#6c757d'
    };
    
    // Pesos por criticidade
    this.pesos = {
      'crítico': 100,
      'atenção': 70,
      'alerta': 40,
      'adequada': 10,
      'não avaliada': 0
    };
  }
  
  // ==================== NORMALIZAR ESCOLA ====================
  normalizarEscola(escola, index = 0) {
    // Criar objeto normalizado
    const normalizada = {
      // IDs
      id: escola.id || escola._id || `escola_${index}`,
      
      // Nome (prioridade: escola > nome > nombre)
      nome: this.normalizarNome(escola),
      
      // Localização
      lat: this.normalizarCoordenada(escola.lat || escola.latitude),
      lng: this.normalizarCoordenada(escola.lng || escola.longitude || escola.lon),
      
      // Status/Classe (padronizado)
      status: this.normalizarStatus(escola.status || escola.clase || escola.classe),
      classe: this.normalizarStatus(escola.classe || escola.status || escola.clase),
      
      // Pontuação
      pontuacao: this.normalizarPontuacao(escola.pontuacao || escola.score || escola.nota),
      
      // Peso calculado
      peso: 0, // Será calculado depois
      
      // Endereço
      endereco: escola.endereco || escola.endereÃ§o || escola.direccion || 'Não informado',
      bairro: escola.bairro || escola.barrio || '',
      
      // Datas
      createdAt: this.normalizarData(escola.createdAt || escola.created_at),
      updatedAt: this.normalizarData(escola.updatedAt || escola.updated_at),
      
      // Informações adicionais
      tipo: escola.tipo || 'EMEF',
      matriculas: parseInt(escola.matriculas || escola.alunos || 200),
      
      // Metadados
      fonte: escola.fonte || 'desconhecida',
      metadata: escola.metadata || {},
      
      // Dados originais (backup)
      _original: escola
    };
    
    // Calcular peso baseado no status normalizado
    normalizada.peso = this.calcularPeso(normalizada);
    
    // Calcular cor
    normalizada.cor = this.cores[normalizada.status] || '#6c757d';
    
    return normalizada;
  }
  
  // ==================== NORMALIZADORES ESPECÍFICOS ====================
  
  normalizarNome(escola) {
    // Prioridade: escola > nome > nombre > title > id
    const possiveisNomes = [
      escola.escola,
      escola.nome,
      escola.nombre,
      escola.name,
      escola.title,
      escola.instituicao,
      escola.instituição
    ];
    
    for (const nome of possiveisNomes) {
      if (nome && typeof nome === 'string' && nome.trim().length > 0) {
        return nome.trim();
      }
    }
    
    // Fallback
    return `Escola ${escola.id || 'Sem Nome'}`;
  }
  
  normalizarStatus(status) {
    if (!status) return 'não avaliada';
    
    // Converter para lowercase e remover acentos/espaços extras
    const statusLimpo = status
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    
    // Buscar no mapa
    return this.mapaStatus[statusLimpo] || 'não avaliada';
  }
  
  normalizarCoordenada(coord) {
    if (coord === null || coord === undefined) return null;
    
    const num = parseFloat(coord);
    
    // Validar range
    if (isNaN(num)) return null;
    
    return num;
  }
  
  normalizarPontuacao(pontuacao) {
    if (pontuacao === null || pontuacao === undefined) return 0;
    
    const num = parseFloat(pontuacao);
    if (isNaN(num)) return 0;
    
    // Garantir range 0-100
    return Math.max(0, Math.min(100, num));
  }
  
  normalizarData(data) {
    if (!data) return new Date();
    
    if (data instanceof Date) return data;
    
    // Firebase Timestamp
    if (data.toDate && typeof data.toDate === 'function') {
      return data.toDate();
    }
    
    // String ISO
    try {
      return new Date(data);
    } catch (e) {
      return new Date();
    }
  }
  
  // ==================== CALCULAR PESO ====================
  calcularPeso(escola) {
    // Peso base do status
    let peso = this.pesos[escola.status] || 0;
    
    // Adicionar pontuação (0-10 pontos)
    peso += (escola.pontuacao / 10);
    
    // Bônus por recência (últimos 30 dias)
    if (escola.updatedAt) {
      const diasDesdeAtualizacao = (new Date() - escola.updatedAt) / (1000 * 60 * 60 * 24);
      
      if (diasDesdeAtualizacao <= 7) {
        peso += 20;
      } else if (diasDesdeAtualizacao <= 30) {
        peso += 10;
      } else if (diasDesdeAtualizacao <= 90) {
        peso += 5;
      }
    }
    
    // Bônus por quantidade de alunos (mais alunos = mais grave se crítico)
    if (escola.status === 'crítico') {
      peso += (escola.matriculas / 100);
    }
    
    return peso;
  }
  
  // ==================== NORMALIZAR ARRAY ====================
  normalizarArray(escolas) {
    if (!Array.isArray(escolas)) {
      console.warn('⚠️ Dados não são um array');
      return [];
    }
    
    console.log(`🔧 Normalizando ${escolas.length} escolas...`);
    
    const normalizadas = escolas
      .map((escola, index) => this.normalizarEscola(escola, index))
      .filter(escola => escola.lat && escola.lng); // Remover sem coordenadas
    
    console.log(`✅ ${normalizadas.length} escolas normalizadas (${escolas.length - normalizadas.length} removidas por falta de coordenadas)`);
    
    // Ordenar por peso (mais críticas primeiro)
    normalizadas.sort((a, b) => b.peso - a.peso);
    
    return normalizadas;
  }
  
  // ==================== VALIDAÇÃO ====================
  validarEscola(escola) {
    const erros = [];
    
    if (!escola.nome || escola.nome.includes('Sem Nome')) {
      erros.push('Nome inválido ou ausente');
    }
    
    if (!escola.lat || !escola.lng) {
      erros.push('Coordenadas ausentes');
    }
    
    if (escola.lat < -90 || escola.lat > 90) {
      erros.push('Latitude fora do range válido');
    }
    
    if (escola.lng < -180 || escola.lng > 180) {
      erros.push('Longitude fora do range válido');
    }
    
    if (!escola.status || escola.status === 'não avaliada') {
      erros.push('Status não informado');
    }
    
    return {
      valida: erros.length === 0,
      erros: erros
    };
  }
  
  // ==================== ESTATÍSTICAS ====================
  gerarEstatisticas(escolas) {
    const total = escolas.length;
    
    // Contar por status
    const porStatus = {};
    escolas.forEach(e => {
      porStatus[e.status] = (porStatus[e.status] || 0) + 1;
    });
    
    // Contar por fonte
    const porFonte = {};
    escolas.forEach(e => {
      porFonte[e.fonte] = (porFonte[e.fonte] || 0) + 1;
    });
    
    // Calcular médias
    const pontuacoes = escolas.filter(e => e.pontuacao > 0).map(e => e.pontuacao);
    const pontuacaoMedia = pontuacoes.length > 0 
      ? pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length 
      : 0;
    
    const matriculasTotal = escolas.reduce((sum, e) => sum + (e.matriculas || 0), 0);
    
    return {
      total,
      porStatus,
      porFonte,
      pontuacaoMedia: pontuacaoMedia.toFixed(1),
      matriculasTotal,
      escolasSemCoordenadas: escolas.filter(e => !e.lat || !e.lng).length,
      escolasCriticas: porStatus['crítico'] || 0,
      percentualCritico: total > 0 ? ((porStatus['crítico'] || 0) / total * 100).toFixed(1) + '%' : '0%'
    };
  }
  
  // ==================== EXPORTAR/IMPORTAR ====================
  exportarJSON(escolas, nomeArquivo = 'escolas-normalizadas.json') {
    const dados = {
      versao: '1.0',
      timestamp: new Date().toISOString(),
      total: escolas.length,
      escolas: escolas,
      estatisticas: this.gerarEstatisticas(escolas)
    };
    
    const json = JSON.stringify(dados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log(`📥 ${escolas.length} escolas exportadas para ${nomeArquivo}`);
  }
  
  // ==================== CORREÇÃO DE DADOS ====================
  corrigirDuplicatas(escolas) {
    const mapa = new Map();
    
    escolas.forEach(escola => {
      // Criar chave única baseada em coordenadas arredondadas
      const chave = `${escola.lat.toFixed(4)}_${escola.lng.toFixed(4)}`;
      
      const existente = mapa.get(chave);
      
      if (!existente || escola.peso > existente.peso) {
        // Manter a mais crítica ou a mais recente
        mapa.set(chave, escola);
      }
    });
    
    const semDuplicatas = Array.from(mapa.values());
    
    console.log(`🔍 Removidas ${escolas.length - semDuplicatas.length} duplicatas`);
    
    return semDuplicatas;
  }
}

// ==================== INSTÂNCIA GLOBAL ====================
window.normalizadorDados = new NormalizadorDados();

// ==================== INTEGRAÇÃO COM DADOSMANAGER ====================
// Adicionar hook no DadosManager para normalizar automaticamente
if (window.dadosManager) {
  const metodoOriginal = window.dadosManager.getEscolas;
  
  window.dadosManager.getEscolas = function() {
    const escolas = metodoOriginal.call(this);
    
    // Normalizar na primeira vez
    if (!this._normalizado) {
      console.log('🔧 Aplicando normalização automática...');
      const normalizadas = window.normalizadorDados.normalizarArray(escolas);
      this.dados.escolas = normalizadas;
      this._normalizado = true;
      return normalizadas;
    }
    
    return escolas;
  };
}

console.log('✅ Normalizador de Dados carregado');
