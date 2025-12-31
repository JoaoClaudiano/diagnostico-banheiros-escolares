// popup-counter-api-corrigido.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API ====================
    // API CounterAPI v2 - NÃO requer Authorization header para chamadas GET/POST básicas
    const API_CONFIG = {
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        // Removemos o header Authorization pois a API pública não requer
    };
    
    // ==================== CONFIGURAÇÃO DO POPUP ====================
    const POPUP_CONFIG = {
        popupId: 'counter-api-popup',
        storageKey: 'counterApiPopupHidden',
        hideDays: 7,
        showDelay: 1500,
        
        // CORES
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            cafeBrown: '#A0522D',
            cafeLight: '#DEB887',
            success: '#10B981',
            warning: '#F59E0B',
            tetrisBlue: '#3498db',
            tetrisGreen: '#2ecc71',
            tetrisRed: '#e74c3c',
            tetrisYellow: '#f1c40f',
            tetrisPurple: '#9b59b6'
        }
    };
    
    // ==================== SISTEMA DE API SIMPLIFICADO ====================
    
    // Função para buscar o total de cafés
    async function fetchCoffeeCount() {
        try {
            console.log('Buscando total de cafés...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                mode: 'cors'
                // Removemos headers para evitar erro CORS
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resposta da API:', data);
            
            // Extrai o valor do contador
            let count = 0;
            
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else if (data && data.value !== undefined) {
                count = data.value;
            } else if (typeof data === 'number') {
                count = data;
            } else if (data && data.data && typeof data.data.count === 'number') {
                count = data.data.count;
            }
            
            return {
                success: true,
                count: count
            };
            
        } catch (error) {
            console.error('Erro ao buscar contador:', error);
            return {
                success: false,
                count: 0,
                error: error.message
            };
        }
    }
    
    // Função para enviar um café (incrementar contador)
    async function sendCoffee() {
        try {
            console.log('Enviando café...');
            
            // Faz POST sem headers para evitar CORS issues
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                mode: 'cors'
                // Removemos headers pois a API pública não requer
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Café enviado:', data);
            
            // Busca o novo total atualizado
            const updated = await fetchCoffeeCount();
            
            return {
                success: true,
                newCount: updated.success ? updated.count : 0
            };
            
        } catch (error) {
            console.error('Erro ao enviar café:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS COM TETRIS ANIMATION ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .counter-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(8px);
            animation: overlayFade 0.3s ease-out;
        }
        
        @keyframes overlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* CARD PRINCIPAL */
        .counter-popup-card {
            background: white;
            border-radius: 24px;
            width: 90%;
            max-width: 400px;
            overflow: hidden;
            animation: cardSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
            text-align: center;
            position: relative;
        }
        
        @keyframes cardSlide {
            0% {
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        /* ANIMAÇÃO TETRIS - LINHA HORIZONTAL */
        .tetris-animation {
            height: 30px;
            background: linear-gradient(90deg, 
                ${POPUP_CONFIG.colors.tetrisBlue} 0%,
                ${POPUP_CONFIG.colors.tetrisGreen} 20%,
                ${POPUP_CONFIG.colors.tetrisRed} 40%,
                ${POPUP_CONFIG.colors.tetrisYellow} 60%,
                ${POPUP_CONFIG.colors.tetrisPurple} 80%,
                ${POPUP_CONFIG.colors.tetrisBlue} 100%
            );
            background-size: 200% 100%;
            animation: tetrisMove 3s linear infinite;
            position: relative;
            overflow: hidden;
            border-bottom: 3px solid rgba(0, 0, 0, 0.1);
        }
        
        @keyframes tetrisMove {
            0% { background-position: 0% 0%; }
            100% { background-position: 200% 0%; }
        }
        
        .tetris-block {
            position: absolute;
            width: 20px;
            height: 20px;
            background: white;
            animation: tetrisFloat 15s linear infinite;
            opacity: 0.7;
            border-radius: 3px;
        }
        
        @keyframes tetrisFloat {
            0% {
                transform: translateY(-100px) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.7;
            }
            90% {
                opacity: 0.7;
            }
            100% {
                transform: translateY(100px) rotate(360deg);
                opacity: 0;
            }
        }
        
        /* CABEÇALHO */
        .counter-popup-header {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary} 0%, ${POPUP_CONFIG.colors.primaryDark} 100%);
            color: white;
            padding: 20px 25px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
        }
        
        .counter-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
        }
        
        .counter-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            flex: 1;
        }
        
        .counter-close-btn {
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
            flex-shrink: 0;
        }
        
        .counter-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: rotate(90deg);
        }
        
        /* CONTEÚDO */
        .counter-popup-content {
            padding: 25px;
            color: #333;
            line-height: 1.5;
        }
        
        .counter-message {
            margin: 0 0 25px 0;
            font-size: 15px;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* BOTÃO ENVIAR CAFÉ */
        .coffee-action-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            margin-bottom: 15px;
        }
        
        .coffee-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(160, 82, 45, 0.4);
        }
        
        .coffee-action-btn:active {
            transform: translateY(0);
        }
        
        .coffee-action-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .coffee-icon {
            font-size: 22px;
            animation: coffeeSteam 2s infinite;
        }
        
        @keyframes coffeeSteam {
            0%, 100% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-3px); opacity: 1; }
        }
        
        /* CONTADOR EM CÍRCULO PEQUENO */
        .coffee-counter-mini {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 15px 0;
        }
        
        .counter-circle {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeLight} 0%, ${POPUP_CONFIG.colors.cafeBrown} 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: 800;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            margin-bottom: 5px;
            border: 3px solid white;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .counter-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* BOTÕES */
        .counter-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 20px;
        }
        
        .primary-counter-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary} 0%, ${POPUP_CONFIG.colors.primaryDark} 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px 20px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            width: 100%;
        }
        
        .primary-counter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
        }
        
        /* OPÇÃO NÃO MOSTRAR */
        .counter-option {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #E0E0E0;
        }
        
        .counter-option-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #666;
            font-size: 13px;
        }
        
        .counter-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid #DEE2E6;
            cursor: pointer;
        }
        
        .counter-checkbox:checked {
            background: ${POPUP_CONFIG.colors.primary};
            border-color: ${POPUP_CONFIG.colors.primary};
        }
        
        /* EFEITO DE CAFÉ FLUTUANTE */
        .coffee-float {
            position: fixed;
            font-size: 24px;
            z-index: 10000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        }
        
        @keyframes floatUp {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) rotate(20deg);
                opacity: 0;
            }
        }
        
        /* NOTIFICAÇÃO */
        .coffee-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${POPUP_CONFIG.colors.success};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            font-size: 14px;
            max-width: 300px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* RESPONSIVIDADE */
        @media (max-width: 480px) {
            .counter-popup-card {
                width: 95%;
                max-width: 320px;
                border-radius: 20px;
            }
            
            .counter-popup-content {
                padding: 20px;
            }
            
            .counter-circle {
                width: 50px;
                height: 50px;
                font-size: 18px;
            }
            
            .counter-popup-header {
                padding: 15px 20px;
            }
        }
        
        /* DARK MODE */
        @media (prefers-color-scheme: dark) {
            .counter-popup-card {
                background: #1E1E1E;
                color: #E0E0E0;
                border-color: #333;
            }
            
            .counter-popup-content {
                color: #E0E0E0;
            }
            
            .counter-message strong {
                color: #FF8585;
            }
            
            .counter-circle {
                border-color: #1E1E1E;
            }
            
            .counter-label {
                color: #AAA;
            }
            
            .counter-option {
                border-color: #444;
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .counter-popup-card,
            .tetris-animation,
            .tetris-block,
            .coffee-icon,
            .counter-circle,
            .coffee-action-btn,
            .primary-counter-btn {
                animation: none !important;
                transition: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const popupHTML = `
        <div id="${POPUP_CONFIG.popupId}" class="counter-popup-overlay">
            <div class="counter-popup-card">
                <!-- ANIMAÇÃO TETRIS NO TOPO -->
                <div class="tetris-animation" id="tetrisContainer"></div>
                
                <div class="counter-popup-header">
                    <div class="counter-header-content">
                        <h3>🚧 Página em Desenvolvimento</h3>
                        <button class="counter-close-btn" aria-label="Fechar">&times;</button>
                    </div>
                </div>
                
                <div class="counter-popup-content">
                    <div class="counter-message">
                        <strong>Ajude-nos com um cafezinho! ☕</strong>
                        Estamos trabalhando duro para melhorar esta página. Cada café nos dá mais energia para continuar!
                    </div>
                    
                    <button class="coffee-action-btn" id="sendCoffeeBtn">
                        <span class="coffee-icon">☕</span>
                        <span>Enviar Café</span>
                    </button>
                    
                    <!-- CONTADOR EM CÍRCULO PEQUENO -->
                    <div class="coffee-counter-mini">
                        <div class="counter-circle" id="totalCoffeeCount">0</div>
                        <div class="counter-label">Total de Cafés</div>
                    </div>
                    
                    <div class="counter-buttons">
                        <button class="primary-counter-btn" id="understandBtn">
                            Entendi, obrigado!
                        </button>
                    </div>
                    
                    <div class="counter-option">
                        <label class="counter-option-label">
                            <input type="checkbox" class="counter-checkbox" id="dontShowAgain">
                            Não mostrar novamente por 7 dias
                        </label>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(POPUP_CONFIG.popupId);
    const sendBtn = document.getElementById('sendCoffeeBtn');
    const understandBtn = document.getElementById('understandBtn');
    const closeBtn = popup.querySelector('.counter-close-btn');
    const totalCountElement = document.getElementById('totalCoffeeCount');
    let currentCount = 0;
    let popupShown = false;
    
    // ==================== ANIMAÇÃO TETRIS ====================
    function createTetrisAnimation() {
        const container = document.getElementById('tetrisContainer');
        if (!container) return;
        
        // Limpa container
        container.innerHTML = '';
        
        // Cria blocos flutuantes
        for (let i = 0; i < 15; i++) {
            const block = document.createElement('div');
            block.className = 'tetris-block';
            
            // Posição aleatória
            const left = Math.random() * 100;
            const delay = Math.random() * 15;
            const size = 15 + Math.random() * 15;
            const colorIndex = Math.floor(Math.random() * 5);
            const colors = [
                POPUP_CONFIG.colors.tetrisBlue,
                POPUP_CONFIG.colors.tetrisGreen,
                POPUP_CONFIG.colors.tetrisRed,
                POPUP_CONFIG.colors.tetrisYellow,
                POPUP_CONFIG.colors.tetrisPurple
            ];
            
            block.style.left = `${left}%`;
            block.style.animationDelay = `${delay}s`;
            block.style.width = `${size}px`;
            block.style.height = `${size}px`;
            block.style.background = colors[colorIndex];
            block.style.boxShadow = `0 0 10px ${colors[colorIndex]}`;
            
            container.appendChild(block);
        }
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    // Verifica se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Busca e atualiza o contador
    async function updateCoffeeCounter() {
        try {
            const result = await fetchCoffeeCount();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                // Efeito visual ao atualizar
                totalCountElement.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
        }
    }
    
    // Envia um café
    async function handleSendCoffee() {
        if (sendBtn.disabled) return;
        
        // Desabilita o botão durante o envio
        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="coffee-icon">⏳</span><span>Enviando...</span>';
        
        try {
            // Efeito visual de cafés flutuantes
            createCoffeeFloats();
            
            // Envia para a API
            const result = await sendCoffee();
            
            if (result.success) {
                // Atualiza o contador
                await updateCoffeeCounter();
                
                // Mostra notificação
                showNotification('☕ Café enviado com sucesso!');
                
                // Efeito de confirmação no botão
                sendBtn.innerHTML = '<span class="coffee-icon">✅</span><span>Enviado!</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.success} 0%, #0DA271 100%)`;
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Erro ao enviar. Tente novamente.');
            sendBtn.innerHTML = '<span class="coffee-icon">❌</span><span>Erro</span>';
            sendBtn.style.background = `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`;
            
        } finally {
            // Restaura o botão após 2 segundos
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalText;
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%)`;
            }, 2000);
        }
    }
    
    // Cria efeito de cafés flutuantes
    function createCoffeeFloats() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const coffee = document.createElement('div');
                coffee.textContent = '☕';
                coffee.className = 'coffee-float';
                coffee.style.left = `${40 + Math.random() * 20}%`;
                coffee.style.top = '50%';
                coffee.style.fontSize = `${20 + Math.random() * 15}px`;
                coffee.style.color = POPUP_CONFIG.colors.cafeBrown;
                coffee.style.textShadow = '0 0 10px rgba(160, 82, 45, 0.5)';
                document.body.appendChild(coffee);
                
                setTimeout(() => coffee.remove(), 1000);
            }, i * 150);
        }
    }
    
    // Mostra notificação
    function showNotification(message) {
        // Remove notificação anterior se existir
        const existing = document.querySelector('.coffee-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'coffee-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse forwards';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Fecha o popup
    function closePopup() {
        // Salva preferência se marcado
        const dontShowAgain = document.getElementById('dontShowAgain');
        if (dontShowAgain && dontShowAgain.checked) {
            const hideUntil = Date.now() + (POPUP_CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(POPUP_CONFIG.storageKey, hideUntil.toString());
        }
        
        popup.style.animation = 'overlayFade 0.3s ease-out reverse forwards';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
    }
    
    // Mostra o popup
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Cria animação Tetris
        createTetrisAnimation();
        
        // Carrega o contador atual
        await updateCoffeeCounter();
        
        // Configura eventos
        setupEventListeners();
    }
    
    // Configura event listeners
    function setupEventListeners() {
        sendBtn.addEventListener('click', handleSendCoffee);
        understandBtn.addEventListener('click', closePopup);
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        
        // Fecha ao clicar fora
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        
        // Fecha com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
            if (e.key === 'Enter' && e.target === sendBtn) handleSendCoffee();
        });
    }
    
    // Inicialização
    function init() {
        // Mostra após delay
        setTimeout(showPopup, POPUP_CONFIG.showDelay);
        
        // Mostra mais cedo se houver interação
        const earlyShow = () => {
            if (!popupShown) {
                showPopup();
                ['click', 'scroll', 'mousemove'].forEach(event => {
                    window.removeEventListener(event, earlyShow);
                });
            }
        };
        
        ['click', 'scroll', 'mousemove'].forEach(event => {
            window.addEventListener(event, earlyShow, { once: true });
        });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // ==================== API PÚBLICA ====================
    window.coffeeCounterPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(POPUP_CONFIG.storageKey);
            popupShown = false;
            showPopup();
        },
        getCount: async () => {
            const result = await fetchCoffeeCount();
            return result.success ? result.count : 0;
        },
        sendCoffee: handleSendCoffee
    };
    
})();