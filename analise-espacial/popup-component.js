// popup-counter-api-corrigido.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API ====================
    const API_CONFIG = {
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        apiToken: "ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN",
        headers: {
            'Authorization': 'Bearer ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN',
            'Content-Type': 'application/json'
        }
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
    
    // ==================== SISTEMA DE API CORRIGIDO ====================
    
    // Testa se a API está funcionando
    async function testApiConnection() {
        try {
            console.log('Testando conexão com API...');
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            console.log('Status da API:', response.status);
            return response.ok;
        } catch (error) {
            console.error('Erro ao testar API:', error);
            return false;
        }
    }
    
    // Função para buscar o total de cafés
    async function fetchCoffeeCount() {
        try {
            console.log('Buscando total de cafés...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resposta da API:', data);
            
            // Extrai o valor do contador
            let count = extractCountFromData(data);
            
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
    
    // Função para extrair contador de diferentes formatos
    function extractCountFromData(data) {
        if (data && typeof data.count === 'number') {
            return data.count;
        } else if (data && data.value !== undefined) {
            return data.value;
        } else if (typeof data === 'number') {
            return data;
        } else if (data && data.data && typeof data.data.count === 'number') {
            return data.data.count;
        }
        return 0;
    }
    
    // Função para enviar um café (incrementar contador)
    async function sendCoffee() {
        try {
            console.log('Enviando café...');
            
            // Primeiro testa a conexão
            const apiWorking = await testApiConnection();
            if (!apiWorking) {
                throw new Error('API não está respondendo');
            }
            
            // Faz POST para o endpoint /up
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            console.log('Status do envio:', response.status);
            
            if (!response.ok) {
                // Se /up não funcionar, tenta PUT na raiz
                console.log('Tentando método alternativo (PUT)...');
                return await tryPutMethod();
            }
            
            const data = await response.json();
            console.log('Café enviado com sucesso:', data);
            
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
    
    // Método alternativo usando PUT
    async function tryPutMethod() {
        try {
            // Primeiro pega o valor atual
            const current = await fetchCoffeeCount();
            if (!current.success) {
                throw new Error('Não foi possível obter valor atual');
            }
            
            // Incrementa e faz PUT
            const newCount = current.count + 1;
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'PUT',
                headers: API_CONFIG.headers,
                body: JSON.stringify({ count: newCount }),
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`PUT failed: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('PUT bem sucedido:', data);
            
            return {
                success: true,
                newCount: newCount
            };
            
        } catch (error) {
            console.error('Erro no método PUT:', error);
            throw error;
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS COM ANIMAÇÃO TETRIS DE PREENCHIMENTO ====================
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
            max-width: 450px;
            overflow: hidden;
            animation: cardSlide 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
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
            margin: 0 0 20px 0;
            font-size: 15px;
            text-align: center;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* ANIMAÇÃO TETRIS - BARRA DE PROGRESSO */
        .tetris-progress-container {
            height: 40px;
            background: #f8f9fa;
            border-radius: 20px;
            overflow: hidden;
            position: relative;
            margin: 25px 0;
            border: 2px solid #e9ecef;
        }
        
        .tetris-progress-bar {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, 
                ${POPUP_CONFIG.colors.tetrisBlue},
                ${POPUP_CONFIG.colors.tetrisGreen},
                ${POPUP_CONFIG.colors.tetrisYellow},
                ${POPUP_CONFIG.colors.tetrisRed},
                ${POPUP_CONFIG.colors.tetrisPurple}
            );
            background-size: 400% 100%;
            animation: gradientMove 3s linear infinite;
            border-radius: 20px;
            transition: width 2s cubic-bezier(0.34, 1.56, 0.64, 1);
            position: relative;
            overflow: hidden;
        }
        
        @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            100% { background-position: 400% 50%; }
        }
        
        .tetris-block {
            position: absolute;
            width: 30px;
            height: 30px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 5px;
            animation: blockFall 15s linear infinite;
            opacity: 0;
        }
        
        @keyframes blockFall {
            0% {
                transform: translateY(-40px) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 0.7;
            }
            90% {
                opacity: 0.7;
            }
            100% {
                transform: translateY(40px) rotate(360deg);
                opacity: 0;
            }
        }
        
        .progress-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            font-weight: 600;
            color: #333;
            text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
            z-index: 2;
        }
        
        /* BOTÕES LADO A LADO */
        .counter-buttons-row {
            display: flex;
            gap: 12px;
            margin: 25px 0 20px 0;
        }
        
        .counter-buttons-row button {
            flex: 1;
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
        }
        
        .primary-counter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
        }
        
        .primary-counter-btn:active {
            transform: translateY(0);
        }
        
        .coffee-action-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 14px 20px;
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
        
        .coffee-action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
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
            font-size: 18px;
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
            margin: 15px 0 5px 0;
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
        
        /* STATUS DA API */
        .api-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${POPUP_CONFIG.colors.success};
            animation: statusBlink 2s infinite;
        }
        
        .status-indicator.offline {
            background: ${POPUP_CONFIG.colors.warning};
        }
        
        @keyframes statusBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* OPÇÃO NÃO MOSTRAR */
        .counter-option {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px dashed #E0E0E0;
            text-align: center;
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
            
            .counter-buttons-row {
                flex-direction: column;
                gap: 10px;
            }
            
            .counter-circle {
                width: 50px;
                height: 50px;
                font-size: 18px;
            }
            
            .tetris-progress-container {
                height: 35px;
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
            
            .tetris-progress-container {
                background: #2D2D2D;
                border-color: #444;
            }
            
            .progress-label {
                color: #E0E0E0;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
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
            .tetris-progress-bar,
            .tetris-block,
            .coffee-icon,
            .counter-circle,
            .coffee-action-btn,
            .primary-counter-btn,
            .status-indicator {
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
                    
                    <!-- ANIMAÇÃO TETRIS - BARRA DE PROGRESSO -->
                    <div class="tetris-progress-container">
                        <div class="tetris-progress-bar" id="tetrisProgressBar">
                            <div class="progress-label" id="progressLabel">Carregando...</div>
                        </div>
                    </div>
                    
                    <!-- BOTÕES LADO A LADO -->
                    <div class="counter-buttons-row">
                        <button class="primary-counter-btn" id="understandBtn">
                            Obrigado!
                        </button>
                        <button class="coffee-action-btn" id="sendCoffeeBtn">
                            <span class="coffee-icon">☕</span>
                            <span>Enviar Café</span>
                        </button>
                    </div>
                    
                    <!-- CONTADOR EM CÍRCULO PEQUENO -->
                    <div class="coffee-counter-mini">
                        <div class="counter-circle" id="totalCoffeeCount">0</div>
                        <div class="counter-label">Total de Cafés</div>
                    </div>
                    
                    <!-- STATUS DA API -->
                    <div class="api-status">
                        <span class="status-indicator" id="apiStatusIndicator"></span>
                        <span id="apiStatusText">Conectando à API...</span>
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
    const tetrisProgressBar = document.getElementById('tetrisProgressBar');
    const progressLabel = document.getElementById('progressLabel');
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    
    let currentCount = 0;
    let popupShown = false;
    let apiConnected = false;
    
    // ==================== ANIMAÇÃO TETRIS DE BARRA DE PROGRESSO ====================
    function createTetrisAnimation() {
        if (!tetrisProgressBar) return;
        
        // Cria blocos flutuantes
        for (let i = 0; i < 10; i++) {
            const block = document.createElement('div');
            block.className = 'tetris-block';
            
            // Posição aleatória
            const left = Math.random() * 100;
            const delay = Math.random() * 15;
            const size = 20 + Math.random() * 15;
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
            
            tetrisProgressBar.appendChild(block);
        }
        
        // Inicia animação da barra
        updateTetrisProgress(0);
    }
    
    function updateTetrisProgress(percentage) {
        if (!tetrisProgressBar || !progressLabel) return;
        
        const targetWidth = Math.min(100, Math.max(0, percentage));
        tetrisProgressBar.style.width = `${targetWidth}%`;
        
        // Atualiza label
        if (percentage >= 100) {
            progressLabel.textContent = '🎉 Completo!';
        } else if (percentage >= 75) {
            progressLabel.textContent = 'Quase lá!';
        } else if (percentage >= 50) {
            progressLabel.textContent = 'Metade do caminho!';
        } else if (percentage >= 25) {
            progressLabel.textContent = 'Em progresso...';
        } else {
            progressLabel.textContent = 'Iniciando...';
        }
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    // Verifica se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Atualiza status da API
    function updateApiStatus(status, message = '') {
        apiConnected = status === 'connected';
        
        if (apiStatusIndicator && apiStatusText) {
            switch(status) {
                case 'connected':
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.success;
                    apiStatusText.textContent = message || 'API Conectada';
                    break;
                case 'connecting':
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Conectando...';
                    break;
                case 'error':
                    apiStatusIndicator.className = 'status-indicator offline';
                    apiStatusIndicator.style.background = '#EF4444';
                    apiStatusText.textContent = message || 'Erro na API';
                    break;
                default:
                    apiStatusIndicator.className = 'status-indicator';
                    apiStatusText.textContent = message || 'Desconectado';
            }
        }
    }
    
    // Busca e atualiza o contador
    async function updateCoffeeCounter() {
        try {
            updateApiStatus('connecting', 'Buscando dados...');
            
            const result = await fetchCoffeeCount();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                
                // Atualiza barra de progresso (limitada a 100%)
                const progressPercentage = Math.min(100, (currentCount % 100));
                updateTetrisProgress(progressPercentage);
                
                updateApiStatus('connected', `API Online (${currentCount} cafés)`);
                
                // Efeito visual ao atualizar
                totalCountElement.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            } else {
                updateApiStatus('error', 'Erro ao conectar');
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
            updateApiStatus('error', 'Conexão falhou');
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
            
            // Efeito na barra de progresso
            tetrisProgressBar.style.filter = 'brightness(1.5)';
            
            // Envia para a API
            updateApiStatus('connecting', 'Enviando café...');
            const result = await sendCoffee();
            
            if (result.success) {
                // Atualiza o contador
                await updateCoffeeCounter();
                
                // Mostra notificação
                showNotification('☕ Café enviado com sucesso!');
                
                // Efeito de confirmação no botão
                sendBtn.innerHTML = '<span class="coffee-icon">✅</span><span>Enviado!</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.success} 0%, #0DA271 100%)`;
                
                // Efeito especial na barra
                tetrisProgressBar.style.animation = 'gradientMove 1s linear infinite';
                
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Erro ao enviar café');
            
            // Fallback local
            currentCount++;
            totalCountElement.textContent = currentCount;
            
            // Atualiza barra de progresso
            const progressPercentage = Math.min(100, (currentCount % 100));
            updateTetrisProgress(progressPercentage);
            
            sendBtn.innerHTML = '<span class="coffee-icon">☕</span><span>Salvo Local</span>';
            sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.warning} 0%, #D97706 100%)`;
            
            updateApiStatus('error', 'Modo Local Ativo');
            
        } finally {
            // Restaura efeitos
            setTimeout(() => {
                tetrisProgressBar.style.filter = '';
                tetrisProgressBar.style.animation = 'gradientMove 3s linear infinite';
            }, 1000);
            
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
                coffee.style.zIndex = '10001';
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
        
        // Atualiza periodicamente
        setInterval(async () => {
            if (apiConnected) {
                await updateCoffeeCounter();
            }
        }, 30000); // A cada 30 segundos
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
        sendCoffee: handleSendCoffee,
        
        // Debug functions
        debug: {
            testApi: async function() {
                console.log('=== Testando API CounterAPI v2 ===');
                console.log('URL:', API_CONFIG.baseUrl);
                console.log('Token:', API_CONFIG.apiToken);
                console.log('Headers:', API_CONFIG.headers);
                
                // Test GET
                try {
                    console.log('Testando GET...');
                    const getResponse = await fetch(API_CONFIG.baseUrl, {
                        method: 'GET',
                        headers: API_CONFIG.headers
                    });
                    console.log('GET Status:', getResponse.status);
                    const getData = await getResponse.json();
                    console.log('GET Data:', getData);
                } catch (error) {
                    console.error('GET Error:', error);
                }
                
                // Test POST /up
                try {
                    console.log('Testando POST /up...');
                    const postResponse = await fetch(`${API_CONFIG.baseUrl}/up`, {
                        method: 'POST',
                        headers: API_CONFIG.headers
                    });
                    console.log('POST /up Status:', postResponse.status);
                    if (postResponse.ok) {
                        const postData = await postResponse.json();
                        console.log('POST /up Data:', postData);
                    }
                } catch (error) {
                    console.error('POST /up Error:', error);
                }
            },
            
            testWithoutAuth: async function() {
                console.log('=== Testando SEM autenticação ===');
                try {
                    const response = await fetch(API_CONFIG.baseUrl);
                    console.log('Status sem auth:', response.status);
                    const data = await response.json();
                    console.log('Data sem auth:', data);
                } catch (error) {
                    console.error('Error sem auth:', error);
                }
            }
        }
    };
    
})();