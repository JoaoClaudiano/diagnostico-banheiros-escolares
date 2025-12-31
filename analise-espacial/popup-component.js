// popup.js - Código JavaScript para popup com iFrame
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        popupId: 'dev-popup-iframe',
        iframeUrl: 'popup-content.html', // URL da página com a animação
        localStorageKey: 'devPopupHideUntil',
        hideDays: 7,
        showDelay: 800, // ms antes de mostrar
        zIndex: 9999
    };
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CRIAÇÃO DO CSS ====================
    const style = document.createElement('style');
    style.textContent = `
        .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: ${CONFIG.zIndex};
            backdrop-filter: blur(3px);
            animation: fadeIn 0.3s ease-out;
        }
        
        .popup-card {
            background: white;
            border-radius: 16px;
            width: 90%;
            max-width: 450px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            animation: slideUp 0.4s ease-out;
            border: 1px solid #e1e5e9;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .popup-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            position: relative;
        }
        
        .popup-header h3 {
            margin: 0;
            font-size: 20px;
            flex-grow: 1;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .pulsing-dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: #ff4757;
            border-radius: 50%;
            box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% {
                box-shadow: 0 0 0 0 rgba(255, 71, 87, 0.7);
                transform: scale(1);
            }
            70% {
                box-shadow: 0 0 0 8px rgba(255, 71, 87, 0);
                transform: scale(1.1);
            }
            100% {
                box-shadow: 0 0 0 0 rgba(255, 71, 87, 0);
                transform: scale(1);
            }
        }
        
        .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 24px;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .popup-content {
            padding: 20px;
            text-align: center;
        }
        
        .popup-content p {
            margin: 10px 0;
            color: #333;
            line-height: 1.5;
        }
        
        .iframe-container {
            width: 100%;
            height: 200px;
            border: none;
            overflow: hidden;
            border-radius: 8px;
            margin: 15px 0;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .iframe-container iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
        }
        
        .popup-footer {
            padding: 0 20px 20px;
            display: flex;
            gap: 12px;
        }
        
        .popup-btn {
            flex: 1;
            padding: 12px 20px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .primary-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .primary-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .secondary-btn {
            background: #f1f5f9;
            color: #64748b;
            border: 2px solid #e2e8f0;
        }
        
        .secondary-btn:hover {
            background: #e2e8f0;
        }
        
        .popup-options {
            padding: 0 20px 15px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
        
        .popup-options label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
        }
        
        @media (max-width: 480px) {
            .popup-card {
                width: 95%;
                max-width: 400px;
            }
            
            .popup-footer {
                flex-direction: column;
            }
            
            .iframe-container {
                height: 180px;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="popup-overlay">
            <div class="popup-card">
                <div class="popup-header">
                    <h3>
                        <span class="pulsing-dot"></span>
                        Atenção! Página em Desenvolvimento
                    </h3>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>
                
                <div class="popup-content">
                    <p><strong>Esta página está em construção</strong></p>
                    <p>Alguns recursos podem não estar disponíveis ou conter informações incompletas.</p>
                    
                    <div class="iframe-container">
                        <!-- iFrame será injetado aqui -->
                        <div id="iframe-placeholder" style="color: #94a3b8; padding: 20px;">
                            Carregando animação...
                        </div>
                    </div>
                    
                    <p style="font-size: 14px; color: #94a3b8; margin-top: 5px;">
                        Aguarde enquanto finalizamos os ajustes
                    </p>
                </div>
                
                <div class="popup-footer">
                    <button class="popup-btn primary-btn" id="understandBtn">Entendi</button>
                    <button class="popup-btn secondary-btn" id="feedbackBtn">Reportar</button>
                </div>
                
                <div class="popup-options">
                    <label>
                        <input type="checkbox" id="dontShowAgain">
                        Não mostrar novamente por ${CONFIG.hideDays} dias
                    </label>
                </div>
            </div>
        </div>
    `;
    
    // ==================== INJEÇÃO DO POPUP ====================
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(CONFIG.popupId);
    const closeBtn = popup.querySelector('.close-btn');
    const understandBtn = document.getElementById('understandBtn');
    const feedbackBtn = document.getElementById('feedbackBtn');
    const dontShowAgain = document.getElementById('dontShowAgain');
    
    // ==================== FUNÇÕES AUXILIARES ====================
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.localStorageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    function showPopup() {
        popup.style.display = 'flex';
        
        // Adiciona eventos de fechamento
        document.addEventListener('keydown', closeOnEscape);
        popup.addEventListener('click', closeOnOutsideClick);
        
        // Carrega o iframe
        loadIframe();
    }
    
    function closePopup() {
        popup.style.animation = 'fadeOut 0.3s ease-out forwards';
        
        // Salva preferência se marcado
        if (dontShowAgain.checked) {
            const hideUntil = Date.now() + (CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(CONFIG.localStorageKey, hideUntil.toString());
        }
        
        // Remove eventos
        document.removeEventListener('keydown', closeOnEscape);
        popup.removeEventListener('click', closeOnOutsideClick);
        
        // Esconde após animação
        setTimeout(() => {
            popup.style.display = 'none';
        }, 300);
    }
    
    function closeOnEscape(event) {
        if (event.key === 'Escape') closePopup();
    }
    
    function closeOnOutsideClick(event) {
        if (event.target === popup) closePopup();
    }
    
    function loadIframe() {
        const placeholder = document.getElementById('iframe-placeholder');
        if (!placeholder) return;
        
        // Cria o iframe
        const iframe = document.createElement('iframe');
        iframe.src = CONFIG.iframeUrl;
        iframe.title = "Animação de desenvolvimento";
        iframe.loading = "lazy";
        
        // Substitui o placeholder
        placeholder.parentNode.replaceChild(iframe, placeholder);
        
        // Trata erros no iframe
        iframe.onerror = function() {
            iframe.outerHTML = `
                <div style="color: #94a3b8; padding: 20px; text-align: center;">
                    <div style="font-size: 24px;">📚</div>
                    <div style="margin-top: 10px; font-size: 14px;">
                        Animação: Mulher lendo livro debaixo da árvore<br>
                        <small>(Arquivo popup-content.html não encontrado)</small>
                    </div>
                </div>
            `;
        };
    }
    
    // ==================== EVENT LISTENERS ====================
    closeBtn.addEventListener('click', closePopup);
    understandBtn.addEventListener('click', closePopup);
    feedbackBtn.addEventListener('click', function() {
        alert('Obrigado pelo interesse em reportar! Em um site real, isso abriria um formulário.');
        closePopup();
    });
    
    // ==================== INICIALIZAÇÃO ====================
    // Mostra o popup após delay
    setTimeout(showPopup, CONFIG.showDelay);
    
    // ==================== API PÚBLICA ====================
    window.devPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(CONFIG.localStorageKey);
            showPopup();
        }
    };
    
})();