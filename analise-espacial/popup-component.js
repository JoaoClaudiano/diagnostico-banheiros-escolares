// popup-mobile-dev.js - Código JS para popup com animação de desenvolvimento mobile
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        popupId: 'mobile-dev-popup',
        iframeUrl: 'mobile-dev-animation.html', // Arquivo com a animação
        localStorageKey: 'mobileDevPopupHide',
        hideDays: 7,
        showDelay: 500, // ms (reduzido para melhor UX)
        zIndex: 10000,
        // Configurações do ponto pulsante
        dotSize: '14px', // Tamanho aumentado
        dotAnimation: 'pulseDot 1.8s infinite cubic-bezier(0.4, 0, 0.6, 1)'
    };
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CRIAÇÃO DO CSS ====================
    const style = document.createElement('style');
    style.textContent = `
        /* ESTILOS DO POPUP */
        .mobile-dev-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.88);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: ${CONFIG.zIndex};
            backdrop-filter: blur(4px);
            animation: overlayFadeIn 0.4s ease-out;
        }
        
        @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .mobile-dev-card {
            background: white;
            border-radius: 18px;
            width: 92%;
            max-width: 460px;
            box-shadow: 0 25px 70px rgba(0, 0, 0, 0.35);
            overflow: hidden;
            animation: cardSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            border: 1px solid rgba(255, 255, 255, 0.1);
            transform-origin: center;
        }
        
        @keyframes cardSlideUp {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.96);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        /* CABEÇALHO COM PONTO PULSANTE */
        .popup-header-mobile {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            padding: 22px 25px;
            position: relative;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .popup-header-mobile h3 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 14px;
            letter-spacing: -0.01em;
        }
        
        /* PONTO PULSANTE MELHORADO */
        .pulsing-dot-enhanced {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: ${CONFIG.dotSize};
            height: ${CONFIG.dotSize};
            background: #FF6B6B;
            border-radius: 50%;
            position: relative;
            animation: ${CONFIG.dotAnimation};
            box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
            flex-shrink: 0;
        }
        
        @keyframes pulseDot {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
                transform: scale(1);
            }
            50% {
                box-shadow: 0 0 0 12px rgba(255, 107, 107, 0);
                transform: scale(1.08);
            }
        }
        
        .pulsing-dot-enhanced::before {
            content: '';
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.9;
        }
        
        .close-btn-mobile {
            position: absolute;
            top: 18px;
            right: 18px;
            background: rgba(255, 255, 255, 0.15);
            border: none;
            color: white;
            font-size: 26px;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s ease;
            font-weight: 300;
            line-height: 1;
        }
        
        .close-btn-mobile:hover {
            background: rgba(255, 255, 255, 0.25);
            transform: rotate(90deg) scale(1.1);
        }
        
        /* CONTEÚDO PRINCIPAL */
        .popup-content-mobile {
            padding: 28px 25px 20px;
            text-align: center;
        }
        
        .popup-content-mobile p {
            margin: 0 0 18px 0;
            color: #374151;
            line-height: 1.6;
            font-size: 16px;
        }
        
        .popup-content-mobile strong {
            color: #1F2937;
            font-weight: 600;
        }
        
        /* CONTAINER DO IFRAME */
        .iframe-container-mobile {
            width: 100%;
            height: 200px;
            border-radius: 12px;
            margin: 20px 0 10px;
            overflow: hidden;
            background: linear-gradient(145deg, #F9FAFB, #F3F4F6);
            border: 1px solid #E5E7EB;
            position: relative;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        
        .iframe-container-mobile iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: transparent;
        }
        
        .iframe-placeholder {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: #9CA3AF;
            font-size: 15px;
            flex-direction: column;
            gap: 12px;
        }
        
        .placeholder-icon {
            font-size: 48px;
            opacity: 0.6;
        }
        
        /* RODAPÉ COM BOTÕES */
        .popup-footer-mobile {
            padding: 0 25px 25px;
            display: flex;
            gap: 14px;
        }
        
        .popup-btn-mobile {
            flex: 1;
            padding: 14px 22px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
            letter-spacing: -0.01em;
        }
        
        .primary-btn-mobile {
            background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
        }
        
        .primary-btn-mobile:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(79, 70, 229, 0.35);
        }
        
        .primary-btn-mobile:active {
            transform: translateY(0);
        }
        
        .secondary-btn-mobile {
            background: #F9FAFB;
            color: #4B5563;
            border: 1.5px solid #E5E7EB;
        }
        
        .secondary-btn-mobile:hover {
            background: #F3F4F6;
            border-color: #D1D5DB;
        }
        
        /* OPÇÕES DO POPUP */
        .popup-options-mobile {
            padding: 0 25px 22px;
            text-align: center;
        }
        
        .option-label {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            color: #6B7280;
            font-size: 14px;
            transition: color 0.2s;
        }
        
        .option-label:hover {
            color: #4B5563;
        }
        
        .option-checkbox {
            width: 18px;
            height: 18px;
            border-radius: 4px;
            border: 2px solid #D1D5DB;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            flex-shrink: 0;
        }
        
        .option-checkbox:checked {
            background: #4F46E5;
            border-color: #4F46E5;
        }
        
        .option-checkbox:checked::after {
            content: '✓';
            position: absolute;
            color: white;
            font-size: 12px;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
        }
        
        /* MENSAGEM FINAL */
        .final-message {
            font-size: 14px;
            color: #9CA3AF;
            margin-top: 8px;
            font-style: italic;
        }
        
        /* RESPONSIVO */
        @media (max-width: 480px) {
            .mobile-dev-card {
                width: 95%;
                max-width: 380px;
                border-radius: 16px;
            }
            
            .popup-header-mobile {
                padding: 20px;
            }
            
            .popup-header-mobile h3 {
                font-size: 18px;
                gap: 12px;
            }
            
            .popup-content-mobile {
                padding: 24px 20px 18px;
            }
            
            .popup-footer-mobile {
                flex-direction: column;
                gap: 12px;
                padding: 0 20px 22px;
            }
            
            .iframe-container-mobile {
                height: 180px;
                margin: 18px 0 8px;
            }
            
            .pulsing-dot-enhanced {
                width: 12px;
                height: 12px;
            }
            
            .pulsing-dot-enhanced::before {
                width: 5px;
                height: 5px;
            }
        }
        
        @media (max-width: 350px) {
            .iframe-container-mobile {
                height: 160px;
            }
            
            .popup-header-mobile h3 {
                font-size: 17px;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="mobile-dev-popup">
            <div class="mobile-dev-card">
                <div class="popup-header-mobile">
                    <h3>
                        <span class="pulsing-dot-enhanced"></span>
                        Atenção! Página em Desenvolvimento
                    </h3>
                    <button class="close-btn-mobile" aria-label="Fechar">&times;</button>
                </div>
                
                <div class="popup-content-mobile">
                    <p><strong>Estamos desenvolvendo a versão mobile desta página</strong></p>
                    <p>A experiência otimizada para dispositivos móveis está em construção e será disponibilizada em breve.</p>
                    
                    <div class="iframe-container-mobile" id="iframe-container">
                        <div class="iframe-placeholder">
                            <div class="placeholder-icon">📱</div>
                            <div>Carregando animação de desenvolvimento mobile...</div>
                        </div>
                    </div>
                    
                    <p class="final-message">Aguarde enquanto criamos algo incrível para você!</p>
                </div>
                
                <div class="popup-footer-mobile">
                    <button class="popup-btn-mobile primary-btn-mobile" id="understandBtnMobile">Entendi</button>
                    <button class="popup-btn-mobile secondary-btn-mobile" id="feedbackBtnMobile">Ver Progresso</button>
                </div>
                
                <div class="popup-options-mobile">
                    <label class="option-label">
                        <input type="checkbox" class="option-checkbox" id="dontShowAgainMobile">
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
    const closeBtn = popup.querySelector('.close-btn-mobile');
    const understandBtn = document.getElementById('understandBtnMobile');
    const feedbackBtn = document.getElementById('feedbackBtnMobile');
    const dontShowAgain = document.getElementById('dontShowAgainMobile');
    const iframeContainer = document.getElementById('iframe-container');
    
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
        
        // Carrega o iframe após um pequeno delay
        setTimeout(loadIframe, 300);
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
        // Remove placeholder
        const placeholder = iframeContainer.querySelector('.iframe-placeholder');
        if (placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => {
                placeholder.remove();
                
                // Cria o iframe
                const iframe = document.createElement('iframe');
                iframe.src = CONFIG.iframeUrl;
                iframe.title = "Animação de Desenvolvimento Mobile";
                iframe.loading = "eager";
                iframe.style.cssText = `
                    width: 100%;
                    height: 100%;
                    border: none;
                    background: transparent;
                `;
                
                iframeContainer.appendChild(iframe);
                
                // Trata erros no iframe
                iframe.onerror = function() {
                    iframe.outerHTML = `
                        <div style="color: #9CA3AF; padding: 30px; text-align: center; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            <div style="font-size: 40px; margin-bottom: 15px;">🚀</div>
                            <div style="font-weight: 500; margin-bottom: 8px; color: #4B5563;">Desenvolvimento Mobile</div>
                            <div style="font-size: 14px; opacity: 0.8;">
                                Animação: Construindo experiências móveis
                            </div>
                        </div>
                    `;
                };
            }, 200);
        }
    }
    
    function simulateProgress() {
        feedbackBtn.innerHTML = '<span style="display: inline-block; animation: spin 1s linear infinite;">⟳</span> Verificando...';
        feedbackBtn.disabled = true;
        
        // Adiciona animação de spin
        const spinStyle = document.createElement('style');
        spinStyle.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinStyle);
        
        setTimeout(() => {
            feedbackBtn.innerHTML = 'Em andamento (75%)';
            feedbackBtn.disabled = false;
            
            setTimeout(() => {
                feedbackBtn.innerHTML = 'Ver Progresso';
            }, 2000);
        }, 1500);
    }
    
    // ==================== EVENT LISTENERS ====================
    closeBtn.addEventListener('click', closePopup);
    understandBtn.addEventListener('click', closePopup);
    feedbackBtn.addEventListener('click', simulateProgress);
    
    // ==================== INICIALIZAÇÃO ====================
    // Mostra o popup após delay
    setTimeout(showPopup, CONFIG.showDelay);
    
    // ==================== API PÚBLICA ====================
    window.mobileDevPopup = {
        show: function() {
            popup.style.display = 'flex';
            popup.style.animation = 'overlayFadeIn 0.4s ease-out';
            loadIframe();
        },
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(CONFIG.localStorageKey);
            this.show();
        },
        updateAnimation: function(newUrl) {
            CONFIG.iframeUrl = newUrl;
            const iframe = iframeContainer.querySelector('iframe');
            if (iframe) {
                iframe.src = newUrl;
            } else {
                loadIframe();
            }
        }
    };
    
})();