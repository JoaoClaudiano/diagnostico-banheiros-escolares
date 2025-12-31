// popup-tetris-cafe.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO ====================
    const CONFIG = {
        popupId: 'tetris-cafe-popup',
        storageKey: 'tetrisPopupHidden',
        cafeStorageKey: 'cafeCount',
        hideDays: 7,
        showDelay: 1500,
        
        // CORES VIBRANTES
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            accent: '#6BC5FF',
            tetrisBlue: '#4D96FF',
            tetrisGreen: '#6BCB77',
            tetrisYellow: '#FFD93D',
            tetrisRed: '#FF6B6B'
        },
        
        // TETRIS
        tetris: {
            rows: 2,           // 2 linhas de blocos
            columns: 8,        // 8 blocos por linha
            blockSize: '10px', // tamanho dos blocos
            speed: '1.5s'      // velocidade da animação
        }
    };
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS ATUALIZADO ====================
    const style = document.createElement('style');
    style.textContent = `
        /* RESET E OVERLAY */
        .tetris-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            backdrop-filter: blur(4px);
            animation: overlayFade 0.4s ease-out;
        }
        
        @keyframes overlayFade {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* CARD RESPONSIVO */
        .tetris-popup-card {
            background: white;
            border-radius: 16px;
            width: 95%;
            max-width: 400px;
            overflow: hidden;
            position: relative;
            animation: cardSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
            
            /* Responsividade adicional */
            margin: 0 auto;
        }
        
        @keyframes cardSlide {
            0% {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        /* CABEÇALHO */
        .tetris-popup-header {
            background: linear-gradient(135deg, ${CONFIG.colors.primary} 0%, ${CONFIG.colors.primaryDark} 100%);
            color: white;
            padding: 20px 24px;
            position: relative;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        
        .tetris-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            flex: 1;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .close-btn-tetris {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 22px;
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
        
        .close-btn-tetris:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1) rotate(90deg);
        }
        
        /* CONTEÚDO */
        .tetris-popup-content {
            padding: 24px;
            color: #333;
            line-height: 1.5;
            text-align: center;
        }
        
        .popup-message {
            margin: 0 0 20px 0;
            font-size: 15px;
        }
        
        .popup-message strong {
            display: block;
            color: ${CONFIG.colors.primary};
            font-size: 17px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* MINI TETRIS HORIZONTAL */
        .tetris-container {
            margin: 25px 0;
            padding: 15px;
            background: #F8F9FA;
            border-radius: 10px;
            border: 1px solid #E9ECEF;
            position: relative;
            overflow: hidden;
        }
        
        .tetris-grid {
            display: flex;
            justify-content: center;
            gap: 4px;
            height: 40px;
            position: relative;
        }
        
        .tetris-row {
            display: flex;
            gap: 4px;
        }
        
        .tetris-cell {
            width: ${CONFIG.tetris.blockSize};
            height: ${CONFIG.tetris.blockSize};
            background: #E9ECEF;
            border-radius: 2px;
            position: relative;
            overflow: hidden;
        }
        
        .tetris-block {
            position: absolute;
            width: ${CONFIG.tetris.blockSize};
            height: ${CONFIG.tetris.blockSize};
            border-radius: 2px;
            top: -${CONFIG.tetris.blockSize};
            animation: tetrisFall ${CONFIG.tetris.speed} linear infinite;
        }
        
        /* Cores dos blocos do Tetris */
        .block-blue {
            background: ${CONFIG.colors.tetrisBlue};
            box-shadow: 0 2px 4px rgba(77, 150, 255, 0.3);
        }
        
        .block-green {
            background: ${CONFIG.colors.tetrisGreen};
            box-shadow: 0 2px 4px rgba(107, 203, 119, 0.3);
        }
        
        .block-yellow {
            background: ${CONFIG.colors.tetrisYellow};
            box-shadow: 0 2px 4px rgba(255, 217, 61, 0.3);
        }
        
        .block-red {
            background: ${CONFIG.colors.tetrisRed};
            box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
        }
        
        /* Animação de queda com delays diferentes */
        @keyframes tetrisFall {
            0% {
                top: -${CONFIG.tetris.blockSize};
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                top: calc(100% - ${CONFIG.tetris.blockSize});
                opacity: 0;
            }
        }
        
        /* Texto abaixo do Tetris */
        .tetris-text {
            font-size: 12px;
            color: #6C757D;
            margin-top: 10px;
            font-style: italic;
        }
        
        /* RODAPÉ COM BOTÕES */
        .tetris-popup-footer {
            padding: 0 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .tetris-btn {
            padding: 14px 20px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .primary-btn-tetris {
            background: linear-gradient(135deg, ${CONFIG.colors.primary} 0%, ${CONFIG.colors.primaryDark} 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
        }
        
        .primary-btn-tetris:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(255, 107, 107, 0.3);
        }
        
        .cafe-btn {
            background: linear-gradient(135deg, #FFD93D 0%, #FFB347 100%);
            color: #5A4B30;
            box-shadow: 0 4px 12px rgba(255, 217, 61, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .cafe-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 18px rgba(255, 217, 61, 0.3);
        }
        
        /* Efeito especial ao clicar no café */
        .cafe-btn:active::after {
            content: '☕';
            position: absolute;
            font-size: 24px;
            animation: coffeeFloat 0.6s ease-out forwards;
            opacity: 0;
        }
        
        @keyframes coffeeFloat {
            0% {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translateY(-40px) scale(1.5);
                opacity: 0;
            }
        }
        
        /* CONTADOR DE CAFÉS */
        .cafe-counter {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 8px;
            font-size: 14px;
            color: #6C757D;
            font-weight: 500;
        }
        
        .counter-number {
            background: ${CONFIG.colors.primary};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            animation: counterPulse 2s infinite;
        }
        
        @keyframes counterPulse {
            0%, 100% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.1);
            }
        }
        
        /* OPÇÕES */
        .tetris-popup-options {
            padding: 0 24px 20px;
            text-align: center;
        }
        
        .tetris-option-label {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            color: #6C757D;
            font-size: 13px;
        }
        
        .tetris-checkbox {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            border: 2px solid #DEE2E6;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .tetris-checkbox:checked {
            background: ${CONFIG.colors.primary};
            border-color: ${CONFIG.colors.primary};
        }
        
        /* ============================= */
        /* RESPONSIVIDADE AVANÇADA */
        /* ============================= */
        
        /* Telas muito pequenas (até 320px) */
        @media (max-width: 320px) {
            .tetris-popup-card {
                width: 98%;
                max-width: 300px;
                border-radius: 12px;
            }
            
            .tetris-popup-header {
                padding: 16px 20px;
            }
            
            .tetris-popup-header h3 {
                font-size: 16px;
            }
            
            .tetris-popup-content {
                padding: 20px;
            }
            
            .popup-message {
                font-size: 14px;
            }
            
            .popup-message strong {
                font-size: 15px;
            }
            
            .tetris-container {
                padding: 12px;
                margin: 20px 0;
            }
            
            .tetris-grid {
                height: 35px;
            }
            
            .tetris-cell {
                width: 8px;
                height: 8px;
            }
            
            .tetris-block {
                width: 8px;
                height: 8px;
            }
            
            .tetris-btn {
                padding: 12px 16px;
                font-size: 14px;
            }
            
            .tetris-popup-footer {
                padding: 0 20px 20px;
            }
        }
        
        /* Telas pequenas (321px a 480px) */
        @media (min-width: 321px) and (max-width: 480px) {
            .tetris-popup-card {
                width: 96%;
                max-width: 350px;
            }
            
            .tetris-popup-header h3 {
                font-size: 17px;
            }
            
            .tetris-popup-content {
                padding: 22px;
            }
            
            .tetris-btn {
                padding: 13px 18px;
            }
        }
        
        /* Telas em modo paisagem (altura pequena) */
        @media (max-height: 600px) and (orientation: landscape) {
            .tetris-popup-card {
                max-height: 85vh;
                overflow-y: auto;
                margin: 20px auto;
            }
            
            .tetris-container {
                margin: 15px 0;
                padding: 10px;
            }
            
            .tetris-grid {
                height: 30px;
            }
        }
        
        /* Ajuste para tablets */
        @media (min-width: 768px) and (max-width: 1024px) {
            .tetris-popup-card {
                max-width: 450px;
            }
            
            .tetris-container {
                margin: 30px 0;
            }
        }
        
        /* Animações reduzidas para acessibilidade */
        @media (prefers-reduced-motion: reduce) {
            .tetris-popup-card,
            .tetris-block,
            .counter-number,
            .close-btn-tetris,
            .tetris-btn {
                animation: none !important;
                transition: none !important;
            }
        }
        
        /* Suporte para dark mode */
        @media (prefers-color-scheme: dark) {
            .tetris-popup-card {
                background: #1E1E1E;
                color: #E0E0E0;
                border-color: #333;
            }
            
            .tetris-popup-content {
                color: #E0E0E0;
            }
            
            .popup-message strong {
                color: #FF8585;
            }
            
            .tetris-container {
                background: #2D2D2D;
                border-color: #404040;
            }
            
            .tetris-cell {
                background: #404040;
            }
            
            .tetris-text {
                color: #A0A0A0;
            }
            
            .cafe-btn {
                color: #FFF;
            }
            
            .cafe-counter {
                color: #A0A0A0;
            }
            
            .tetris-option-label {
                color: #A0A0A0;
            }
            
            .tetris-checkbox {
                border-color: #555;
                background: #333;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    const cafeCount = parseInt(localStorage.getItem(CONFIG.cafeStorageKey) || '0', 10);
    
    const popupHTML = `
        <div id="${CONFIG.popupId}" class="tetris-popup-overlay">
            <div class="tetris-popup-card">
                <div class="tetris-popup-header">
                    <div class="header-flex">
                        <h3>🚧 Página em Desenvolvimento</h3>
                        <button class="close-btn-tetris" aria-label="Fechar">&times;</button>
                    </div>
                </div>
                
                <div class="tetris-popup-content">
                    <div class="popup-message">
                        <strong>Atenção! Estamos trabalhando aqui</strong>
                        Esta seção do site está em construção ativa. Novas funcionalidades chegarão em breve!
                    </div>
                    
                    <div class="tetris-container">
                        <div class="tetris-grid" id="tetrisGrid"></div>
                        <div class="tetris-text">Carregando recursos...</div>
                    </div>
                </div>
                
                <div class="tetris-popup-footer">
                    <button class="tetris-btn primary-btn-tetris" id="understandBtn">
                        Entendi, obrigado!
                    </button>
                    
                    <button class="tetris-btn cafe-btn" id="sendCoffeeBtn">
                        <span>Enviar um ☕</span>
                        <span>Apoiar o desenvolvimento</span>
                    </button>
                    
                    <div class="cafe-counter">
                        <span>Cafés recebidos:</span>
                        <span class="counter-number" id="cafeCount">${cafeCount}</span>
                    </div>
                </div>
                
                <div class="tetris-popup-options">
                    <label class="tetris-option-label">
                        <input type="checkbox" class="tetris-checkbox" id="dontShowAgain">
                        Não mostrar novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(CONFIG.popupId);
    let popupShown = false;
    
    // Verifica se deve mostrar
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Cria animação do Tetris
    function createTetrisAnimation() {
        const grid = document.getElementById('tetrisGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        // Cria duas linhas de blocos
        for (let row = 0; row < CONFIG.tetris.rows; row++) {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'tetris-row';
            
            for (let col = 0; col < CONFIG.tetris.columns; col++) {
                const cell = document.createElement('div');
                cell.className = 'tetris-cell';
                
                // Cria um bloco caindo
                const block = document.createElement('div');
                const colors = ['block-blue', 'block-green', 'block-yellow', 'block-red'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                block.className = `tetris-block ${randomColor}`;
                
                // Delay aleatório para cada bloco
                const delay = Math.random() * 2;
                block.style.animationDelay = `${delay}s`;
                block.style.left = '0';
                
                cell.appendChild(block);
                rowDiv.appendChild(cell);
            }
            
            grid.appendChild(rowDiv);
        }
    }
    
    // Atualiza o contador de cafés
    function updateCoffeeCounter() {
        const count = parseInt(localStorage.getItem(CONFIG.cafeStorageKey) || '0', 10);
        const counterElement = document.getElementById('cafeCount');
        if (counterElement) {
            counterElement.textContent = count;
            
            // Efeito de animação no contador
            counterElement.style.transform = 'scale(1.3)';
            setTimeout(() => {
                counterElement.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    // Envia um café
    function sendCoffee() {
        let count = parseInt(localStorage.getItem(CONFIG.cafeStorageKey) || '0', 10);
        count++;
        localStorage.setItem(CONFIG.cafeStorageKey, count.toString());
        
        updateCoffeeCounter();
        
        // Efeito visual
        const coffeeBtn = document.getElementById('sendCoffeeBtn');
        if (coffeeBtn) {
            // Adiciona efeito de brilho
            coffeeBtn.style.boxShadow = '0 0 20px rgba(255, 217, 61, 0.5)';
            coffeeBtn.style.transform = 'scale(1.05)';
            
            // Reseta após um tempo
            setTimeout(() => {
                coffeeBtn.style.boxShadow = '';
                coffeeBtn.style.transform = '';
            }, 300);
        }
        
        // Cria efeito de café flutuante
        createCoffeeEffect();
        
        // Feedback para o usuário
        showCoffeeThankYou();
    }
    
    // Cria efeito visual de café
    function createCoffeeEffect() {
        const coffeeEmoji = document.createElement('div');
        coffeeEmoji.textContent = '☕';
        coffeeEmoji.style.position = 'fixed';
        coffeeEmoji.style.fontSize = '24px';
        coffeeEmoji.style.zIndex = '10000';
        coffeeEmoji.style.pointerEvents = 'none';
        coffeeEmoji.style.animation = 'coffeeFloat 1s ease-out forwards';
        
        // Posiciona no centro da tela
        coffeeEmoji.style.left = '50%';
        coffeeEmoji.style.top = '50%';
        coffeeEmoji.style.transform = 'translate(-50%, -50%)';
        
        document.body.appendChild(coffeeEmoji);
        
        // Remove após a animação
        setTimeout(() => {
            coffeeEmoji.remove();
        }, 1000);
    }
    
    // Mostra agradecimento pelo café
    function showCoffeeThankYou() {
        const coffeeBtn = document.getElementById('sendCoffeeBtn');
        if (!coffeeBtn) return;
        
        const originalText = coffeeBtn.innerHTML;
        coffeeBtn.innerHTML = '<span>☕ Obrigado pelo café!</span>';
        coffeeBtn.disabled = true;
        
        // Muda a cor do botão
        coffeeBtn.style.background = 'linear-gradient(135deg, #6BCB77 0%, #4CAF50 100%)';
        coffeeBtn.style.color = 'white';
        
        // Restaura após 2 segundos
        setTimeout(() => {
            coffeeBtn.innerHTML = originalText;
            coffeeBtn.disabled = false;
            coffeeBtn.style.background = 'linear-gradient(135deg, #FFD93D 0%, #FFB347 100%)';
            coffeeBtn.style.color = '#5A4B30';
        }, 2000);
    }
    
    // Mostra o popup
    function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Cria animação do Tetris
        createTetrisAnimation();
        
        // Atualiza contador de cafés
        updateCoffeeCounter();
        
        // Foco no botão principal
        setTimeout(() => {
            const understandBtn = document.getElementById('understandBtn');
            if (understandBtn) understandBtn.focus();
        }, 400);
        
        // Configura eventos
        setupEventListeners();
    }
    
    // Fecha o popup
    function closePopup() {
        popup.style.animation = 'overlayFade 0.3s ease-out reverse forwards';
        
        // Salva preferência
        const dontShowAgain = document.getElementById('dontShowAgain');
        if (dontShowAgain && dontShowAgain.checked) {
            const hideUntil = Date.now() + (CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(CONFIG.storageKey, hideUntil.toString());
        }
        
        // Remove eventos
        document.removeEventListener('keydown', handleKeyboard);
        popup.removeEventListener('click', closeOnOutsideClick);
        
        // Esconde após animação
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
    }
    
    // Handler para teclado
    function handleKeyboard(event) {
        if (event.key === 'Escape') closePopup();
        if (event.key === 'Enter' && event.target.id === 'sendCoffeeBtn') sendCoffee();
    }
    
    // Fecha ao clicar fora
    function closeOnOutsideClick(event) {
        if (event.target === popup) closePopup();
    }
    
    // Configura event listeners
    function setupEventListeners() {
        const closeBtn = popup.querySelector('.close-btn-tetris');
        const understandBtn = document.getElementById('understandBtn');
        const coffeeBtn = document.getElementById('sendCoffeeBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (understandBtn) understandBtn.addEventListener('click', closePopup);
        if (coffeeBtn) coffeeBtn.addEventListener('click', sendCoffee);
        
        document.addEventListener('keydown', handleKeyboard);
        popup.addEventListener('click', closeOnOutsideClick);
        
        // Atualiza Tetris quando a janela é redimensionada
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(createTetrisAnimation, 250);
        });
    }
    
    // Inicialização inteligente
    function initPopup() {
        // Mostra após delay
        setTimeout(showPopup, CONFIG.showDelay);
        
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
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
    
    // ==================== API PÚBLICA ====================
    window.tetrisPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(CONFIG.storageKey);
            popupShown = false;
            showPopup();
        },
        getCoffeeCount: function() {
            return parseInt(localStorage.getItem(CONFIG.cafeStorageKey) || '0', 10);
        },
        resetCoffeeCount: function() {
            localStorage.removeItem(CONFIG.cafeStorageKey);
            updateCoffeeCounter();
        },
        sendCoffee: sendCoffee,
        updateTetris: function(newConfig) {
            Object.assign(CONFIG.tetris, newConfig);
            createTetrisAnimation();
        }
    };
    
})();