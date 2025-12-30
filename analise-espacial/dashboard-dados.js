// dashboard-dados.js
class DashboardDados {
  constructor() {
    this.container = null;
    this.inicializado = false;
  }
  
  inicializar(containerId = 'dashboard-dados') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = this.criarContainer();
      document.querySelector('.painel').appendChild(this.container);
    }
    
    this.inicializado = true;
    this.atualizar();
    
    // Escutar atualizações de dados
    window.dadosManager.adicionarListener('dados_atualizados', () => this.atualizar());
    window.dadosManager.adicionarListener('status', () => this.atualizar());
  }
  
  criarContainer() {
    const container = document.createElement('div');
    container.id = 'dashboard-dados';
    container.className = 'dashboard-dados';
    return container;
  }
  
  atualizar() {
    if (!this.inicializado || !this.container) return;
    
    const status = window.dadosManager.getStatus();
    const metricas = window.dadosManager.getMetricas() || {};
    const escolas = window.dadosManager.getEscolas() || [];
    
    let html = '';
    
    switch(status) {
      case 'inicializando':
        html = this.renderCarregando();
        break;
      case 'carregando':
        html = this.renderCarregando('Conectando ao Firebase...');
        break;
      case 'pronto':
        html = this.renderPronto(metricas, escolas);
        break;
      case 'erro':
        html = this.renderErro();
        break;
      default:
        html = this.renderCarregando();
    }
    
    this.container.innerHTML = html;
    
    // Adicionar interatividade
    this.adicionarEventos();
  }
  
  renderCarregando(mensagem = 'Carregando dados...') {
    return `
      <div class="dashboard-status">
        <div class="spinner"></div>
        <p>${mensagem}</p>
      </div>
    `;
  }
  
  renderPronto(metricas, escolas) {
    const coresClasses = {
      'crítico': '#dc3545',
      'atenção': '#fd7e14', 
      'alerta': '#ffc107',
      'adequada': '#28a745',
      'não avaliada': '#6c757d'
    };
    
    const barrasDistribuicao = Object.entries(metricas.distribuicaoClasses || {})
      .map(([classe, quantidade]) => {
        const percentual = ((quantidade / metricas.totalEscolas) * 100).toFixed(1);
        return `
          <div class="distribuicao-item">
            <span class="classe-indicator" style="background: ${coresClasses[classe] || '#6c757d'}"></span>
            <span class="classe-nome">${classe}:</span>
            <span class="classe-quantidade">${quantidade}</span>
            <div class="classe-bar">
              <div class="classe-bar-fill" style="width: ${percentual}%; background: ${coresClasses[classe] || '#6c757d'}"></div>
            </div>
            <span class="classe-percentual">${percentual}%</span>
          </div>
        `;
      }).join('');
    
    return `
      <div class="dashboard-pronto">
        <h4>📊 Dados em Tempo Real</h4>
        
        <div class="metricas-rapidas">
          <div class="metrica-rapida">
            <div class="metrica-valor">${metricas.totalEscolas || 0}</div>
            <div class="metrica-label">Escolas</div>
          </div>
          <div class="metrica-rapida">
            <div class="metrica-valor" style="color: #dc3545">${metricas.escolasCriticas || 0}</div>
            <div class="metrica-label">Críticas</div>
          </div>
          <div class="metrica-rapida">
            <div class="metrica-valor">${metricas.percentualAvaliadas || 0}%</div>
            <div class="metrica-label">Avaliadas</div>
          </div>
          <div class="metrica-rapida">
            <div class="metrica-valor">${metricas.pontuacaoMedia || 0}</div>
            <div class="metrica-label">Pontuação Média</div>
          </div>
        </div>
        
        <div class="distribuicao">
          <h5>Distribuição por Classe</h5>
          ${barrasDistribuicao}
        </div>
        
        <div class="dados-info">
          <small>
            📍 ${escolas.length} pontos | 
            📡 Fonte: Firebase + Local | 
            🔄 ${metricas.ultimaAtualizacao ? new Date(metricas.ultimaAtualizacao).toLocaleTimeString() : 'Agora'}
          </small>
        </div>
      </div>
    `;
  }
  
  renderErro() {
    return `
      <div class="dashboard-erro">
        <div style="color: #dc3545; font-size: 24px;">⚠️</div>
        <p>Erro ao carregar dados</p>
        <button onclick="window.dadosManager.inicializar()" class="btn-recarregar">
          Tentar novamente
        </button>
      </div>
    `;
  }
  
  adicionarEventos() {
    // Botão de recarregar
    const btnRecarregar = this.container.querySelector('.btn-recarregar');
    if (btnRecarregar) {
      btnRecarregar.addEventListener('click', () => {
        window.dadosManager.inicializar();
      });
    }
  }
}

// Inicializar dashboard quando os dados estiverem prontos
document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new DashboardDados();
  
  // Aguardar um pouco para garantir que o DOM está pronto
  setTimeout(() => {
    dashboard.inicializar();
  }, 500);
  
  // Exportar para uso global
  window.dashboardDados = dashboard;
});