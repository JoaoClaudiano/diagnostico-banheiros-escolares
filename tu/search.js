// Sistema de busca para o Manual CheckInfra
class ManualSearch {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchResults = document.getElementById('searchResults');
        this.allContent = [];
        this.index = {};
        
        this.init();
    }
    
    init() {
        this.loadAllContent();
        this.setupEventListeners();
    }
    
    loadAllContent() {
        // Carregar conteúdo de todas as abas
        const tabContents = document.querySelectorAll('.tab-content');
        this.allContent = [];
        
        tabContents.forEach(tab => {
            const tabId = tab.id;
            const tabTitle = tab.querySelector('h2')?.textContent || tabId;
            
            // Extrair texto dos elementos
            const elements = tab.querySelectorAll('h3, h4, p, li, td, .methodology-card, .tech-card, .equacao');
            
            elements.forEach(element => {
                const text = element.textContent.trim();
                if (text && text.length > 10) { // Ignorar textos muito curtos
                    const parentCard = element.closest('.methodology-card, .tech-card');
                    const cardTitle = parentCard?.querySelector('h3')?.textContent || '';
                    
                    this.allContent.push({
                        tabId: tabId,
                        tabTitle: tabTitle,
                        element: element,
                        text: text,
                        cardTitle: cardTitle,
                        elementType: element.tagName.toLowerCase(),
                        elementClass: element.className
                    });
                }
            });
        });
        
        // Criar índice de busca
        this.createSearchIndex();
    }
    
    createSearchIndex() {
        this.index = {};
        
        this.allContent.forEach((item, index) => {
            const words = this.normalizeText(item.text).split(/\s+/);
            
            words.forEach(word => {
                if (word.length > 2) { // Ignorar palavras muito curtas
                    if (!this.index[word]) {
                        this.index[word] = [];
                    }
                    if (!this.index[word].includes(index)) {
                        this.index[word].push(index);
                    }
                }
            });
        });
    }
    
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/g, ' ');
    }
    
    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            } else if (this.searchInput.value.trim().length >= 2) {
                this.performSearch();
            } else {
                this.clearResults();
            }
        });
        
        // Fechar resultados ao clicar fora
        document.addEventListener('click', (e) => {
            if (!this.searchResults.contains(e.target) && 
                e.target !== this.searchInput && 
                e.target !== this.searchBtn) {
                this.clearResults();
            }
        });
    }
    
    performSearch() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) {
            this.clearResults();
            return;
        }
        
        const normalizedQuery = this.normalizeText(query);
        const queryWords = normalizedQuery.split(/\s+/);
        
        // Buscar conteúdo relevante
        const results = this.searchContent(queryWords);
        
        // Exibir resultados
        this.displayResults(results, query);
    }
    
    searchContent(queryWords) {
        const scores = {};
        
        // Para cada palavra da query
        queryWords.forEach(word => {
            if (this.index[word]) {
                this.index[word].forEach(contentIndex => {
                    if (!scores[contentIndex]) {
                        scores[contentIndex] = 0;
                    }
                    scores[contentIndex] += 1;
                });
            }
        });
        
        // Ordenar por pontuação
        const sortedResults = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // Limitar a 20 resultados
            .map(([index]) => this.allContent[parseInt(index)]);
        
        return sortedResults;
    }
    
    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-result-item">
                    <p style="text-align: center; padding: 20px; color: var(--gray);">
                        <i class="fas fa-search"></i><br>
                        Nenhum resultado encontrado para "<strong>${query}</strong>"
                    </p>
                </div>
            `;
            this.searchResults.classList.add('active');
            return;
        }
        
        let html = '';
        
        results.forEach((result, index) => {
            const preview = this.getTextPreview(result.text, query);
            const icon = this.getIconForElement(result);
            
            html += `
                <div class="search-result-item" data-tab="${result.tabId}" data-index="${index}">
                    <div style="display: flex; align-items: flex-start; gap: 10px;">
                        <div style="color: var(--primary); font-size: 1.2rem; flex-shrink: 0;">
                            ${icon}
                        </div>
                        <div>
                            <h4>${result.cardTitle || result.tabTitle}</h4>
                            <p style="color: var(--secondary); font-size: 0.8rem; margin-bottom: 5px;">
                                <i class="fas fa-folder"></i> ${result.tabTitle}
                            </p>
                            <p class="context">${preview}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        this.searchResults.innerHTML = html;
        this.searchResults.classList.add('active');
        
        // Adicionar event listeners aos resultados
        this.addResultEventListeners(results);
        
        // Ajustar altura máxima dos resultados
        const maxHeight = Math.min(window.innerHeight * 0.6, results.length * 80);
        this.searchResults.style.maxHeight = `${maxHeight}px`;
    }
    
    getIconForElement(result) {
        const icons = {
            'h3': 'fas fa-heading',
            'h4': 'fas fa-heading',
            'p': 'fas fa-paragraph',
            'li': 'fas fa-list',
            'td': 'fas fa-table',
            'methodology-card': 'fas fa-clipboard-check',
            'tech-card': 'fas fa-microscope',
            'equacao': 'fas fa-calculator'
        };
        
        if (result.elementClass.includes('methodology-card')) return '<i class="fas fa-clipboard-check"></i>';
        if (result.elementClass.includes('tech-card')) return '<i class="fas fa-microscope"></i>';
        if (result.elementClass.includes('equacao')) return '<i class="fas fa-calculator"></i>';
        
        return `<i class="${icons[result.elementType] || 'fas fa-file-alt'}"></i>`;
    }
    
    getTextPreview(text, query) {
        const normalizedText = this.normalizeText(text);
        const normalizedQuery = this.normalizeText(query);
        
        let preview = text.substring(0, 150);
        if (text.length > 150) {
            preview += '...';
        }
        
        // Destacar termos da busca
        const queryWords = normalizedQuery.split(/\s+/);
        queryWords.forEach(word => {
            if (word.length > 2) {
                const regex = new RegExp(`(${word})`, 'gi');
                preview = preview.replace(regex, '<mark>$1</mark>');
            }
        });
        
        return preview;
    }
    
    addResultEventListeners(results) {
        const resultItems = this.searchResults.querySelectorAll('.search-result-item');
        
        resultItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const result = results[index];
                this.navigateToResult(result);
            });
            
            item.addEventListener('mouseenter', () => {
                item.style.background = '#f8f9fa';
                if (document.body.classList.contains('dark-theme')) {
                    item.style.background = '#4a5568';
                }
            });
            
            item.addEventListener('mouseleave', () => {
                item.style.background = '';
            });
        });
    }
    
    navigateToResult(result) {
        // Ativar a aba correspondente
        window.activateTab(result.tabId);
        
        // Fechar resultados
        this.clearResults();
        
        // Limpar campo de busca
        this.searchInput.value = '';
        
        // Fechar menu de ferramentas
        const sidebarTools = document.getElementById('sidebarTools');
        const menuOverlay = document.getElementById('menuOverlay');
        if (sidebarTools && menuOverlay) {
            sidebarTools.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        // Destacar elemento após um breve delay
        setTimeout(() => {
            this.highlightElement(result.element);
        }, 300);
    }
    
    highlightElement(element) {
        // Remover destaque anterior
        document.querySelectorAll('.search-highlight').forEach(el => {
            el.classList.remove('search-highlight');
        });
        
        // Adicionar destaque ao elemento
        element.classList.add('search-highlight');
        
        // Estilo temporário para destaque
        const style = document.createElement('style');
        style.id = 'search-highlight-style';
        style.textContent = `
            .search-highlight {
                background-color: #fff3cd !important;
                border-left: 4px solid #ffc107 !important;
                padding: 10px !important;
                border-radius: 4px !important;
                animation: pulse-highlight 2s ease-in-out;
            }
            
            body.dark-theme .search-highlight {
                background-color: rgba(255, 193, 7, 0.2) !important;
                border-left-color: #ffc107 !important;
            }
            
            @keyframes pulse-highlight {
                0% { background-color: #fff3cd; }
                50% { background-color: #ffeaa7; }
                100% { background-color: #fff3cd; }
            }
            
            body.dark-theme @keyframes pulse-highlight {
                0% { background-color: rgba(255, 193, 7, 0.2); }
                50% { background-color: rgba(255, 193, 7, 0.4); }
                100% { background-color: rgba(255, 193, 7, 0.2); }
            }
        `;
        
        // Remover estilo anterior se existir
        const existingStyle = document.getElementById('search-highlight-style');
        if (existingStyle) existingStyle.remove();
        
        document.head.appendChild(style);
        
        // Rolar até o elemento
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Remover destaque após 5 segundos
        setTimeout(() => {
            element.classList.remove('search-highlight');
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 5000);
    }
    
    clearResults() {
        this.searchResults.innerHTML = '';
        this.searchResults.classList.remove('active');
    }
    
    // Atualizar índice quando o conteúdo mudar
    updateIndex() {
        this.loadAllContent();
    }
}

// Inicializar busca quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.manualSearch = new ManualSearch();
    
    // Expor função para atualizar índice
    window.updateSearchIndex = () => {
        window.manualSearch.updateIndex();
    };
    
    // Atualizar índice quando abas mudarem
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-btn') || 
            e.target.closest('.tab-btn') ||
            e.target.classList.contains('menu-btn')) {
            setTimeout(() => {
                window.manualSearch.updateIndex();
            }, 500);
        }
    });
});

// Função auxiliar para destacar texto
function highlightTextInElement(element, query) {
    if (!element || !query) return;
    
    const text = element.textContent;
    const regex = new RegExp(`(${query})`, 'gi');
    const highlighted = text.replace(regex, '<mark>$1</mark>');
    
    // Preservar HTML original se possível
    if (element.innerHTML !== text) {
        // Elemento tem HTML interno, precisamos processar cuidadosamente
        const temp = document.createElement('div');
        temp.innerHTML = element.innerHTML;
        
        // Processar nós de texto
        function processNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<mark>$1</mark>');
                node.parentNode.replaceChild(span, node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                Array.from(node.childNodes).forEach(processNode);
            }
        }
        
        processNode(temp);
        element.innerHTML = temp.innerHTML;
    } else {
        element.innerHTML = highlighted;
    }
}