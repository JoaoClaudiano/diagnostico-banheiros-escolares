// popup-ux-refinado.js
(function() {
    'use strict';
    
    // Configurações
    const CONFIG = {
        showDelay: 4000, // 4 segundos
        hideDays: 7,
        popupId: 'ux-popup',
        storageKey: 'uxPopupHidden'
    };
    
    // Verifica se deve mostrar
    function shouldShow() {
        const hiddenUntil = localStorage.getItem(CONFIG.storageKey);
        return !hiddenUntil || Date.now() > parseInt(hiddenUntil);
    }
    
    // Não mostrar se já existe ou não deve
    if (document.getElementById(CONFIG.popupId) || !shouldShow()) {
        return;
    }
    
    // Adiciona CSS
    const style = document.createElement('style');
    style.textContent = `
        .ux-popup-overlay {
            position: fixed; top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            display: none; justify-content: center; align-items: center;
            z-index: 9999; backdrop-filter: blur(2px);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            animation: uxFadeIn 0.3s ease;
        }
        @keyframes uxFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes uxFadeOut { from { opacity:1; } to { opacity:0; } }
        
        .ux-popup-card {
            background: white; border-radius: 12px;
            width: 90%; max-width: 380px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            animation: uxSlideIn 0.4s cubic-bezier(0.16,1,0.3,1);
            border: 1px solid rgba(0,0,0,0.08);
        }
        @keyframes uxSlideIn {
            0% { opacity:0; transform: translateY(15px) scale(0.98); }
            100% { opacity:1; transform: translateY(0) scale(1); }
        }
        
        .ux-popup-header {
            background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
            color: white; padding: 18px 24px;
            display: flex; align-items: center; gap: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .ux-popup-icon {
            font-size:20px; background:rgba(255,255,255,0.15);
            width:36px; height:36px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
        }
        .ux-popup-header h3 {
            margin:0; font-size:16px; font-weight:600;
            line-height:1.3; flex:1;
        }
        .ux-close-btn {
            background:rgba(255,255,255,0.15); border:none;
            color:white; font-size:20px; width:32px; height:32px;
            border-radius:50%; cursor:pointer; display:flex;
            align-items:center; justify-content:center;
            transition:all 0.2s; flex-shrink:0; padding:0;
        }
        .ux-close-btn:hover { background:rgba(255,255,255,0.25); transform:scale(1.1); }
        
        .ux-popup-content { padding:24px; color:#374151; line-height:1.5; }
        .ux-popup-message {
            margin:0 0 20px 0; font-size:14px; text-align:center;
        }
        .ux-popup-message strong {
            display:block; color:#1F2937; font-size:15px;
            margin-bottom:8px; font-weight:600;
        }
        .ux-progress { display:flex; gap:8px; justify-content:center; margin:20px 0; }
        .ux-progress-dot {
            width:6px; height:6px; background:#D1D5DB;
            border-radius:50%; animation:uxPulse 2s infinite;
        }
        .ux-progress-dot:nth-child(2) { animation-delay:0.2s; }
        .ux-progress-dot:nth-child(3) { animation-delay:0.4s; }
        @keyframes uxPulse {
            0%,100% { opacity:0.3; transform:scale(0.8); }
            50% { opacity:1; transform:scale(1); }
        }
        
        .ux-popup-footer { padding:0 24px 24px; display:flex; flex-direction:column; gap:10px; }
        .ux-popup-btn {
            padding:12px 20px; border:none; border-radius:8px;
            font-size:14px; font-weight:500; cursor:pointer;
            transition:all 0.2s; font-family:inherit;
        }
        .ux-primary-btn {
            background:linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%);
            color:white; box-shadow:0 2px 4px rgba(124,58,237,0.2);
        }
        .ux-primary-btn:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(124,58,237,0.3); }
        .ux-secondary-btn {
            background:transparent; color:#6B7280; border:1px solid #E5E7EB;
        }
        .ux-secondary-btn:hover { background:#F9FAFB; border-color:#D1D5DB; }
        
        .ux-popup-options { padding:0 24px 20px; text-align:center; }
        .ux-option-label {
            display:inline-flex; align-items:center; gap:8px;
            cursor:pointer; color:#6B7280; font-size:12px;
        }
        .ux-option-checkbox {
            width:14px; height:14px; border-radius:3px;
            border:1.5px solid #D1D5DB; cursor:pointer;
            position:relative; flex-shrink:0;
        }
        .ux-option-checkbox:checked {
            background:#7C3AED; border-color:#7C3AED;
        }
        .ux-option-checkbox:checked::after {
            content:''; position:absolute; top:1px; left:4px;
            width:3px; height:7px; border:solid white;
            border-width:0 2px 2px 0; transform:rotate(45deg);
        }
        .ux-hint { font-size:11px; color:#9CA3AF; text-align:center; margin-top:8px; }
        
        @media (max-width:480px) {
            .ux-popup-card { width:92%; max-width:320px; }
            .ux-popup-header { padding:16px 20px; }
            .ux-popup-content { padding:20px; }
            .ux-popup-footer { padding:0 20px 20px; }
            .ux-popup-options { padding:0 20px 18px; }
            .ux-popup-header h3 { font-size:15px; }
        }
    `;
    document.head.appendChild(style);
    
    // Adiciona HTML
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="ux-popup-overlay">
            <div class="ux-popup-card">
                <div class="ux-popup-header">
                    <div class="ux-popup-icon">⚠️</div>
                    <h3>Página em construção</h3>
                    <button class="ux-close-btn" aria-label="Fechar">&times;</button>
                </div>
                <div class="ux-popup-content">
                    <div class="ux-popup-message">
                        <strong>Estamos ajustando alguns detalhes</strong>
                        Esta seção do site ainda está em desenvolvimento. Algumas funcionalidades podem estar temporariamente indisponíveis.
                    </div>
                    <div class="ux-progress">
                        <div class="ux-progress-dot"></div>
                        <div class="ux-progress-dot"></div>
                        <div class="ux-progress-dot"></div>
                    </div>
                    <div class="ux-hint">Obrigado pela paciência</div>
                </div>
                <div class="ux-popup-footer">
                    <button class="ux-popup-btn ux-primary-btn" id="uxUnderstandBtn">
                        Entendi, obrigado!
                    </button>
                    <button class="ux-popup-btn ux-secondary-btn" id="uxFeedbackBtn">
                        Avisar sobre problemas
                    </button>
                </div>
                <div class="ux-popup-options">
                    <label class="ux-option-label">
                        <input type="checkbox" class="ux-option-checkbox" id="uxDontShowAgain">
                        Não mostrar novamente por uma semana
                    </label>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Lógica do popup
    let popupShown = false;
    
    function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        const popup = document.getElementById(CONFIG.popupId);
        popup.style.display = 'flex';
        
        // Foco no botão principal
        setTimeout(() => {
            document.getElementById('uxUnderstandBtn').focus();
        }, 300);
        
        // Event listeners
        const closeBtn = popup.querySelector('.ux-close-btn');
        const understandBtn = document.getElementById('uxUnderstandBtn');
        const feedbackBtn = document.getElementById('uxFeedbackBtn');
        const dontShowAgain = document.getElementById('uxDontShowAgain');
        
        function closePopup() {
            popup.style.animation = 'uxFadeOut 0.2s ease-out forwards';
            
            if (dontShowAgain.checked) {
                const hideUntil = Date.now() + (CONFIG.hideDays * 24 * 60 * 60 * 1000);
                localStorage.setItem(CONFIG.storageKey, hideUntil.toString());
            }
            
            setTimeout(() => {
                popup.style.display = 'none';
            }, 200);
        }
        
        function handleFeedback() {
            feedbackBtn.textContent = 'Obrigado!';
            feedbackBtn.disabled = true;
            setTimeout(closePopup, 800);
        }
        
        closeBtn.addEventListener('click', closePopup);
        understandBtn.addEventListener('click', closePopup);
        feedbackBtn.addEventListener('click', handleFeedback);
        
        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });
        
        // Fecha ao clicar fora
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
    }
    
    // Lógica de exibição inteligente
    function initPopup() {
        // Mostra após interação do usuário ou timeout
        const triggerPopup = () => {
            if (!popupShown) showPopup();
        };
        
        // Eventos de interação
        ['scroll', 'mousemove', 'click', 'touchstart'].forEach(event => {
            window.addEventListener(event, triggerPopup, { once: true });
        });
        
        // Fallback após delay
        setTimeout(() => {
            if (!popupShown) showPopup();
        }, CONFIG.showDelay);
    }
    
    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
    
    // API pública
    window.uxPopup = {
        show: showPopup,
        hide: function() {
            const popup = document.getElementById(CONFIG.popupId);
            if (popup) popup.style.display = 'none';
        },
        reset: function() {
            localStorage.removeItem(CONFIG.storageKey);
            showPopup();
        }
    };
    
})();