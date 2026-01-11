// Sistema principal do manual CheckInfra
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script carregado! Iniciando sistema...');
    
    // ====================
    // SISTEMA DE ABAS
    // ====================
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Função para ativar uma aba específica
    function activateTab(tabId) {
        // Remove classe active de todos os botões e conteúdos
        tabBtns.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Ativa a aba clicada
        const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const activeContent = document.getElementById(tabId);
        
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.setAttribute('aria-selected', 'true');
        }
        if (activeContent) activeContent.classList.add('active');
        
        // Salva a aba ativa no localStorage
        localStorage.setItem('activeTab', tabId);
    }
    
    // Adiciona eventos aos botões
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            activateTab(tabId);
        });
    });
    
    
    // Verifica se há uma aba salva no localStorage
    const savedTab = localStorage.getItem('activeTab') || 'apresentacao';
    activateTab(savedTab);
    
    // ====================
    // SISTEMA DE ACCORDION
    // ====================
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = header.classList.contains('active');
            
            // Fecha todos os accordions da mesma aba
            const parentTab = header.closest('.tab-content');
            parentTab.querySelectorAll('.accordion-header').forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.style.maxHeight = null;
            });
            
            // Abre o clicado
            if (!isOpen) {
                header.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
    
    // ====================
    // SISTEMA DE ACCORDION TÉCNICO
    // ====================
    const techAccordionHeaders = document.querySelectorAll('.tech-accordion-header');
    techAccordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const isOpen = header.classList.contains('active');
            
            // Fecha todos os accordions técnicos
            techAccordionHeaders.forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.style.maxHeight = null;
            });
            
            // Abre o clicado
            if (!isOpen) {
                header.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });
    
    // ====================
    // BOTÃO VOLTAR AO TOPO
    // ====================
    const backToTopBtn = document.querySelector('.back-to-top');
    
    // Mostrar/ocultar botão baseado na rolagem
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTopBtn.style.display = 'flex';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // ====================
    // SISTEMA DE IMPRESSÃO/EXPORTAÇÃO
    // ====================
    document.addEventListener('keydown', function(e) {
        // Ctrl+P para imprimir a aba atual
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active');
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>CheckInfra - ${activeTab.querySelector('h2').textContent}</title>
                        <style>
                            body { 
                                font-family: 'Segoe UI', Arial, sans-serif; 
                                padding: 30px; 
                                line-height: 1.6;
                                color: #333;
                            }
                            h1 { 
                                color: #1f4fd8; 
                                border-bottom: 3px solid #1f4fd8;
                                padding-bottom: 10px;
                                margin-bottom: 25px;
                            }
                            h2 { color: #163ca6; margin-top: 25px; }
                            h3 { color: #1f4fd8; }
                            .methodology-card {
                                background: #f8f9fa;
                                border-left: 4px solid #1f4fd8;
                                padding: 15px;
                                margin: 20px 0;
                                border-radius: 5px;
                            }
                            .equacao {
                                background: #f0f4ff;
                                border: 2px solid #d1dbff;
                                padding: 15px;
                                border-radius: 8px;
                                margin: 20px 0;
                                font-family: 'Courier New', monospace;
                                font-size: 1.2rem;
                                text-align: center;
                                color: #163ca6;
                            }
                            @media print {
                                body { padding: 15px; }
                                .no-print { display: none; }
                            }
                            .footer {
                                margin-top: 40px;
                                padding-top: 20px;
                                border-top: 1px solid #ddd;
                                font-size: 12px;
                                color: #666;
                                text-align: center;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>CheckInfra - Manual Técnico-Institucional</h1>
                        <div style="color: #666; margin-bottom: 25px;">
                            <strong>Seção:</strong> ${activeTab.querySelector('h2').textContent}<br>
                            <strong>Gerado em:</strong> ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}
                        </div>
                        ${activeTab.innerHTML}
                        <div class="footer">
                            © 2025 CheckInfra - Sistema de Diagnóstico Sanitário Escolar<br>
                            Documento técnico institucional - Uso interno
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    });
    
    // Inicializar menus
    initMenus();
});

// ====================
// SISTEMA DE MENUS E FERRAMENTAS
// ====================
function initMenus() {
    const menuToggle = document.getElementById('menuToggle');
    const menuOverlay = document.getElementById('menuOverlay');
    const sidebarTools = document.getElementById('sidebarTools');
    const closeMenu = document.getElementById('closeMenu');
    
    if (!menuToggle || !menuOverlay || !sidebarTools || !closeMenu) {
        console.error('Elementos do menu não encontrados');
        return;
    }
    
    // Menu sanduíche de ferramentas
    menuToggle.addEventListener('click', () => {
        sidebarTools.classList.add('active');
        menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Fechar menu
    closeMenu.addEventListener('click', () => {
        sidebarTools.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    menuOverlay.addEventListener('click', () => {
        sidebarTools.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    // Botões das ferramentas
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    const exportPrintBtn = document.getElementById('exportPrintBtn');
    const jumpToTopBtn = document.getElementById('jumpToTopBtn');
    const jumpToBottomBtn = document.getElementById('jumpToBottomBtn');
    const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
    const helpBtn = document.getElementById('helpBtn');
    const versionInfoBtn = document.getElementById('versionInfoBtn');
    
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    if (exportPrintBtn) exportPrintBtn.addEventListener('click', () => window.print());
    
    if (jumpToTopBtn) jumpToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        sidebarTools.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    if (jumpToBottomBtn) jumpToBottomBtn.addEventListener('click', () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        sidebarTools.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    });
    
    if (toggleSidebarBtn) toggleSidebarBtn.addEventListener('click', () => {
        sidebarTools.classList.toggle('active');
        if (sidebarTools.classList.contains('active')) {
            menuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    if (helpBtn) helpBtn.addEventListener('click', showHelp);
    if (versionInfoBtn) versionInfoBtn.addEventListener('click', showVersionInfo);
    
    // Sistema de tema
    const themeLight = document.getElementById('themeLight');
    const themeDark = document.getElementById('themeDark');
    
    if (themeLight && themeDark) {
        // Verificar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeDark.classList.add('active');
            themeLight.classList.remove('active');
        } else {
            themeLight.classList.add('active');
            themeDark.classList.remove('active');
        }
        
        themeLight.addEventListener('click', () => {
            themeLight.classList.add('active');
            themeDark.classList.remove('active');
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        });
        
        themeDark.addEventListener('click', () => {
            themeDark.classList.add('active');
            themeLight.classList.remove('active');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        });
    }
    
    // Fechar menu ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebarTools.classList.contains('active')) {
            sidebarTools.classList.remove('active');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ====================
// FUNÇÃO DE EXPORTAÇÃO PARA PDF
// ====================
function exportToPDF() {
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    // Criar elemento para impressão
    const printContent = document.createElement('div');
    printContent.style.cssText = `
        font-family: 'Segoe UI', Arial, sans-serif;
        padding: 30px;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
    `;
    
    // Adicionar cabeçalho
    printContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1f4fd8; padding-bottom: 20px;">
            <h1 style="color: #1f4fd8; margin-bottom: 10px;">CheckInfra - Manual Técnico-Institucional</h1>
            <div style="color: #666; font-size: 14px;">
                <strong>Seção:</strong> ${activeTab.querySelector('h2').textContent}<br>
                <strong>Gerado em:</strong> ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}<br>
                <strong>Versão:</strong> 3.0
            </div>
        </div>
    `;
    
    // Clonar conteúdo da aba
    const contentClone = activeTab.cloneNode(true);
    
    // Remover elementos indesejados
    const elementsToRemove = contentClone.querySelectorAll('.tech-accordion-header, .accordion-header, .back-to-top, button, .nav-tabs');
    elementsToRemove.forEach(el => el.remove());
    
    // Abrir todos os accordions para impressão
    const accordionContents = contentClone.querySelectorAll('.tech-accordion-content, .accordion-content');
    accordionContents.forEach(content => {
        content.style.maxHeight = 'none';
        content.style.display = 'block';
    });
    
    // Adicionar estilos para impressão
    const style = document.createElement('style');
    style.textContent = `
        .methodology-card {
            background: #f8f9fa !important;
            border-left: 4px solid #1f4fd8 !important;
            padding: 15px !important;
            margin: 20px 0 !important;
            border-radius: 5px !important;
            page-break-inside: avoid;
        }
        .equacao {
            background: #f0f4ff !important;
            border: 2px solid #d1dbff !important;
            padding: 15px !important;
            border-radius: 8px !important;
            margin: 20px 0 !important;
            font-family: 'Courier New', monospace !important;
            font-size: 1.2rem !important;
            text-align: center !important;
            color: #163ca6 !important;
            page-break-inside: avoid;
        }
        table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin: 15px 0 !important;
            page-break-inside: avoid;
        }
        th {
            background: #1f4fd8 !important;
            color: white !important;
            padding: 10px !important;
            text-align: left !important;
        }
        td {
            padding: 10px !important;
            border-bottom: 1px solid #ddd !important;
        }
        h2 {
            color: #163ca6 !important;
            margin-top: 25px !important;
            page-break-before: always;
        }
        h2:first-of-type {
            page-break-before: avoid;
        }
        h3 { color: #1f4fd8 !important; }
        .highlight {
            background: #f0f4ff !important;
            padding: 2px 6px !important;
            border-radius: 3px !important;
            font-weight: bold !important;
            color: #1f4fd8 !important;
        }
        @media print {
            body { padding: 15px !important; }
        }
    `;
    
    printContent.appendChild(style);
    printContent.appendChild(contentClone);
    
    // Adicionar rodapé
    const footer = document.createElement('div');
    footer.style.cssText = `
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ddd;
        font-size: 12px;
        color: #666;
        text-align: center;
        page-break-inside: avoid;
    `;
    footer.innerHTML = `
        © 2025 CheckInfra - Sistema de Diagnóstico Sanitário Escolar<br>
        Documento técnico institucional - Uso interno<br>
        <small>Gerado automaticamente pelo sistema CheckInfra v3.0</small>
    `;
    printContent.appendChild(footer);
    
    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>CheckInfra - ${activeTab.querySelector('h2').textContent}</title>
                <style>
                    @media print {
                        @page {
                            margin: 20mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => {
                            window.close();
                        }, 500);
                    };
                <\/script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

// ====================
// FUNÇÕES DE AJUDA
// ====================
function showHelp() {
    const helpContent = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-question-circle"></i> Ajuda - Manual CheckInfra</h3>
            <p>Bem-vindo ao sistema de ajuda do Manual Técnico-Institucional CheckInfra.</p>
            
            <h4>Funcionalidades Principais:</h4>
            <ul>
                <li><strong>Navegação por Abas:</strong> Use as abas no topo para navegar entre as seções</li>
                <li><strong>Busca:</strong> Encontre termos específicos usando a busca no menu de ferramentas</li>
                <li><strong>Ferramentas:</strong> Acesse funções rápidas através do menu à direita (⚙️)</li>
                <li><strong>Exportação:</strong> Exporte a seção atual para PDF ou imprima</li>
                <li><strong>Temas:</strong> Alterne entre tema claro e escuro</li>
            </ul>
            
            <h4>Atalhos de Teclado:</h4>
            <ul>
                <li><kbd>Ctrl + P</kbd> - Imprimir seção atual</li>
                <li><kbd>ESC</kbd> - Fechar menu de ferramentas</li>
            </ul>
            
            <h4>Dúvidas Frequentes:</h4>
            <p>Consulte a seção "Manual do Usuário" para interpretação de indicadores e uso do sistema.</p>
        </div>
    `;
    
    showModal('Ajuda - Manual CheckInfra', helpContent);
}

function showVersionInfo() {
    const versionContent = `
        <div style="padding: 20px;">
            <h3><i class="fas fa-info-circle"></i> Informações da Versão</h3>
            
            <div style="background: #f0f4ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h4 style="color: #1f4fd8; margin-top: 0;">CheckInfra v3.0</h4>
                <p><strong>Data de Publicação:</strong> Janeiro 2025</p>
                <p><strong>Baseado em:</strong> Análise de 28 arquivos do sistema</p>
                <p><strong>Status:</strong> Documento Técnico-Institucional Completo</p>
            </div>
            
            <h4>Principais Atualizações:</h4>
            <ul>
                <li>Fórmula IPT atualizada para 50%-30%-20%</li>
                <li>Sistema de busca integrado</li>
                <li>Menu de ferramentas lateral</li>
                <li>Suporte a temas claro/escuro</li>
                <li>Conteúdo técnico expandido em accordion</li>
                <li>Exportação para PDF aprimorada</li>
            </ul>
            
            <h4>Notas Técnicas:</h4>
            <p>Este manual é um documento vivo e será atualizado conforme evolução do sistema.</p>
            <p><small>Desenvolvido por estudantes de Engenharia Civil | Projeto acadêmico em empreendedorismo</small></p>
        </div>
    `;
    
    showModal('Informações da Versão', versionContent);
}

function showModal(title, content) {
    // Remover modal existente
    const existingModal = document.getElementById('customModal');
    if (existingModal) existingModal.remove();
    
    // Criar overlay
    const overlay = document.createElement('div');
    overlay.id = 'customModal';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        padding: 20px;
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        background: white;
        border-radius: 12px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    `;
    
    // Criar cabeçalho
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        background: linear-gradient(135deg, #1f4fd8 0%, #163ca6 100%);
        color: white;
        border-radius: 12px 12px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = `
        <h3 style="margin: 0; font-size: 1.5rem;">${title}</h3>
        <button id="closeModalBtn" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Adicionar conteúdo
    const body = document.createElement('div');
    body.innerHTML = content;
    
    // Montar modal
    modal.appendChild(header);
    modal.appendChild(body);
    overlay.appendChild(modal);
    
    // Adicionar ao documento
    document.body.appendChild(overlay);
    
    // Configurar botão de fechar
    document.getElementById('closeModalBtn').addEventListener('click', () => {
        overlay.remove();
    });
    
    // Fechar ao clicar no overlay
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
    
    // Fechar ao pressionar ESC
    document.addEventListener('keydown', function closeOnEsc(e) {
        if (e.key === 'Escape') {
            overlay.remove();
            document.removeEventListener('keydown', closeOnEsc);
        }
    });
}

// ====================
// FUNÇÃO GLOBAL PARA ATIVAR ABA
// ====================
window.activateTab = function(tabId) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
    });
    tabContents.forEach(c => c.classList.remove('active'));
    
    const activeBtn = document.querySelector(`[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(tabId);
    
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
    }
    if (activeContent) activeContent.classList.add('active');
    
    localStorage.setItem('activeTab', tabId);
    
    // Fechar menu sanduíche após selecionar uma aba
    const sidebarTools = document.getElementById('sidebarTools');
    const menuOverlay = document.getElementById('menuOverlay');
    if (sidebarTools && menuOverlay) {
        sidebarTools.classList.remove('active');
        menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
};
