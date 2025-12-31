// popup-counter-api-v2.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API V2 ====================
    const API_CONFIG = {
        // URL base da API v2 com SEU namespace específico
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
        userCafeKey: 'userCafeContributions',
        hideDays: 7,
        showDelay: 1500,
        
        // CORES
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            cafeBrown: '#A0522D',
            cafeLight: '#DEB887',
            cafeCream: '#FFF8DC',
            success: '#10B981',
            warning: '#F59E0B'
        }
    };
    
    // ==================== SISTEMA DE API V2 ====================
    
    // Função para buscar o contador atual da API v2
    async function fetchCafeCount() {
        try {
            console.log('Buscando contador da API v2...');
            
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Resposta da API v2:', data);
            
            // Extrai o valor do contador baseado na estrutura da API v2
            let count = 0;
            
            // Tenta diferentes formatos possíveis da resposta
            if (data && typeof data.count === 'number') {
                // Formato: { count: 123 }
                count = data.count;
            } else if (data && data.value !== undefined) {
                // Formato: { value: 123 }
                count = data.value;
            } else if (typeof data === 'number') {
                // Formato: 123 (apenas o número)
                count = data;
            } else if (data && data.data && typeof data.data.count === 'number') {
                // Formato aninhado: { data: { count: 123 } }
                count = data.data.count;
            }
            
            return {
                success: true,
                count: count,
                rawData: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar contador da API:', error);
            return {
                success: false,
                count: getFallbackCount(),
                error: error.message
            };
        }
    }
    
    // Função para incrementar o contador via API v2 (endpoint /up)
    async function incrementCafeCount() {
        try {
            console.log('Incrementando contador via API v2 /up endpoint...');
            
            // Faz POST para o endpoint /up conforme documentação
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resposta do incremento v2:', data);
            
            // Busca o valor atualizado após o incremento
            const updatedResult = await fetchCafeCount();
            const newCount = updatedResult.success ? updatedResult.count : 0;
            
            // Salva a contribuição do usuário localmente
            saveUserContribution();
            
            return {
                success: true,
                newCount: newCount,
                rawData: data,
                userCount: getUserContributionCount()
            };
            
        } catch (error) {
            console.error('Erro ao incrementar contador:', error);
            
            // Fallback: incrementa localmente se a API falhar
            return {
                success: false,
                newCount: incrementFallbackCount(),
                error: error.message,
                userCount: getUserContributionCount()
            };
        }
    }
    
    // Função para obter estatísticas da API v2 (opcional)
    async function getCounterStats() {
        try {
            console.log('Buscando estatísticas da API v2...');
            
            const response = await fetch(`${API_CONFIG.baseUrl}/stats`, {
                method: 'GET',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Estatísticas da API v2:', data);
            
            return {
                success: true,
                stats: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Função para decrementar o contador (opcional - endpoint /down)
    async function decrementCafeCount() {
        try {
            console.log('Decrementando contador via API v2 /down endpoint...');
            
            const response = await fetch(`${API_CONFIG.baseUrl}/down`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Resposta do decremento v2:', data);
            
            return {
                success: true,
                data: data
            };
            
        } catch (error) {
            console.error('Erro ao decrementar contador:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // ==================== FALLBACK LOCAL ====================
    
    function getFallbackCount() {
        try {
            const fallbackData = JSON.parse(localStorage.getItem('cafeFallbackData') || '{"count": 247, "lastUpdated": 0}');
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            
            // Incremento diário simulado para fallback
            if (now - fallbackData.lastUpdated > oneDay) {
                const daysPassed = Math.floor((now - fallbackData.lastUpdated) / oneDay);
                fallbackData.count += Math.floor(daysPassed * (3 + Math.random() * 7));
                fallbackData.lastUpdated = now;
                localStorage.setItem('cafeFallbackData', JSON.stringify(fallbackData));
            }
            
            return fallbackData.count;
        } catch (e) {
            return 247; // Valor inicial de fallback
        }
    }
    
    function incrementFallbackCount() {
        try {
            const fallbackData = JSON.parse(localStorage.getItem('cafeFallbackData') || '{"count": 247, "lastUpdated": 0}');
            fallbackData.count += 1;
            fallbackData.lastUpdated = Date.now();
            localStorage.setItem('cafeFallbackData', JSON.stringify(fallbackData));
            return fallbackData.count;
        } catch (e) {
            return 248;
        }
    }
    
    function saveUserContribution() {
        try {
            let userData = JSON.parse(localStorage.getItem(POPUP_CONFIG.userCafeKey) || '{"count": 0, "contributions": []}');
            userData.count = (userData.count || 0) + 1;
            userData.contributions.push({
                timestamp: Date.now(),
                count: userData.count
            });
            
            // Mantém apenas as últimas 100 contribuições
            if (userData.contributions.length > 100) {
                userData.contributions = userData.contributions.slice(-100);
            }
            
            localStorage.setItem(POPUP_CONFIG.userCafeKey, JSON.stringify(userData));
        } catch (e) {
            console.error('Erro ao salvar contribuição:', e);
        }
    }
    
    function getUserContributionCount() {
        try {
            const userData = JSON.parse(localStorage.getItem(POPUP_CONFIG.userCafeKey) || '{"count": 0}');
            return userData.count || 0;
        } catch (e) {
            return 0;
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS (MANTIDO IGUAL) ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .counter-popup-overlay {
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
        .counter-popup-card {
            background: white;
            border-radius: 16px;
            width: 95%;
            max-width: 420px;
            overflow: hidden;
            position: relative;
            animation: cardSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
            margin: 0 auto;
            display: flex;
            flex-direction: column;
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
            padding: 20px 24px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            flex-shrink: 0;
        }
        
        .counter-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        
        .counter-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            flex: 1;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .counter-close-btn {
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
        
        .counter-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1) rotate(90deg);
        }
        
        /* CONTEÚDO PRINCIPAL */
        .counter-popup-content {
            padding: 24px;
            color: #333;
            line-height: 1.5;
            text-align: center;
            flex: 1;
        }
        
        .counter-message {
            margin: 0 0 24px 0;
            font-size: 15px;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 17px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        /* CONTADOR DE CAFÉS */
        .counter-stats-container {
            background: ${POPUP_CONFIG.colors.cafeCream};
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid ${POPUP_CONFIG.colors.cafeLight};
            box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.05);
        }
        
        .counter-stats-title {
            font-size: 14px;
            color: ${POPUP_CONFIG.colors.cafeBrown};
            margin-bottom: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            font-weight: 500;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 800;
            color: ${POPUP_CONFIG.colors.primary};
            background: white;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border: 3px solid ${POPUP_CONFIG.colors.primary};
            animation: statPulse 3s infinite;
        }
        
        .user-stat .stat-value {
            color: ${POPUP_CONFIG.colors.cafeBrown};
            border-color: ${POPUP_CONFIG.colors.cafeBrown};
        }
        
        @keyframes statPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .api-status {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 12px;
            color: #666;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px dashed ${POPUP_CONFIG.colors.cafeLight};
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
        
        /* BOTÕES */
        .counter-popup-footer {
            padding: 0 24px 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex-shrink: 0;
        }
        
        .counter-popup-btn {
            padding: 16px 20px;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: inherit;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .primary-counter-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary} 0%, ${POPUP_CONFIG.colors.primaryDark} 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.2);
        }
        
        .primary-counter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
        }
        
        .coffee-api-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%);
            color: white;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.2);
            position: relative;
            overflow: hidden;
        }
        
        .coffee-api-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(160, 82, 45, 0.3);
        }
        
        .coffee-api-btn:active::after {
            content: '☕';
            position: absolute;
            font-size: 24px;
            animation: coffeeFloat 0.6s ease-out forwards;
            opacity: 0;
        }
        
        @keyframes coffeeFloat {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(-60px) rotate(20deg);
                opacity: 0;
            }
        }
        
        .coffee-api-icon {
            font-size: 20px;
            animation: coffeeSteam 2s infinite;
        }
        
        @keyframes coffeeSteam {
            0%, 100% { transform: translateY(0); opacity: 0.8; }
            50% { transform: translateY(-5px); opacity: 1; }
        }
        
        /* OPÇÕES */
        .counter-popup-options {
            padding: 0 24px 20px;
            text-align: center;
            flex-shrink: 0;
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
            transition: all 0.2s;
        }
        
        .counter-checkbox:checked {
            background: ${POPUP_CONFIG.colors.primary};
            border-color: ${POPUP_CONFIG.colors.primary};
        }
        
        /* ============================= */
        /* RESPONSIVIDADE */
        /* ============================= */
        
        @media (max-width: 320px) {
            .counter-popup-card {
                width: 98%;
                max-width: 300px;
                border-radius: 12px;
            }
            
            .counter-popup-header {
                padding: 16px 20px;
            }
            
            .counter-popup-header h3 {
                font-size: 16px;
            }
            
            .counter-popup-content {
                padding: 20px;
            }
            
            .counter-message {
                font-size: 14px;
            }
            
            .counter-message strong {
                font-size: 15px;
            }
            
            .counter-stats-container {
                padding: 15px;
                margin: 15px 0;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .stat-value {
                width: 50px;
                height: 50px;
                font-size: 24px;
            }
            
            .counter-popup-btn {
                padding: 14px 16px;
                font-size: 14px;
            }
            
            .counter-popup-footer {
                padding: 0 20px 20px;
            }
        }
        
        @media (min-width: 321px) and (max-width: 480px) {
            .counter-popup-card {
                width: 96%;
                max-width: 360px;
            }
            
            .counter-popup-header h3 {
                font-size: 17px;
            }
            
            .counter-popup-content {
                padding: 22px;
            }
            
            .counter-popup-btn {
                padding: 15px 18px;
            }
        }
        
        @media (max-height: 600px) and (orientation: landscape) {
            .counter-popup-card {
                max-height: 90vh;
                overflow-y: auto;
                margin: 20px auto;
            }
            
            .counter-stats-container {
                margin: 15px 0;
                padding: 15px;
            }
            
            .stat-value {
                width: 50px;
                height: 50px;
                font-size: 24px;
            }
        }
        
        /* Dark mode */
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
            
            .counter-stats-container {
                background: #2D2D2D;
                border-color: #444;
            }
            
            .counter-stats-title {
                color: #DEB887;
            }
            
            .stat-value {
                background: #2D2D2D;
                color: #FF8585;
                border-color: #FF8585;
            }
            
            .user-stat .stat-value {
                color: #DEB887;
                border-color: #DEB887;
            }
            
            .stat-label {
                color: #AAA;
            }
            
            .api-status {
                color: #AAA;
                border-color: #444;
            }
        }
        
        @media (prefers-reduced-motion: reduce) {
            .counter-popup-card,
            .stat-value,
            .counter-close-btn,
            .counter-popup-btn,
            .coffee-api-icon {
                animation: none !important;
                transition: none !important;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== CRIAÇÃO DO HTML ====================
    // Busca os dados iniciais de forma síncrona (usaremos fallback inicial)
    const initialUserCount = getUserContributionCount();
    
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
                    
                    <div class="counter-stats-container">
                        <div class="counter-stats-title">Estatísticas de Cafés</div>
                        
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-label">Você enviou</div>
                                <div class="stat-value user-stat" id="userCafeStat">${initialUserCount}</div>
                            </div>
                            
                            <div class="stat-item">
                                <div class="stat-label">Total Global</div>
                                <div class="stat-value" id="globalCafeStat">Carregando...</div>
                            </div>
                        </div>
                        
                        <div class="api-status">
                            <span class="status-indicator" id="apiStatusIndicator"></span>
                            <span id="apiStatusText">Conectando à API...</span>
                        </div>
                    </div>
                    
                    <div style="font-size: 12px; color: #888; margin-top: 15px; font-style: italic;">
                        💡 Cada café enviado atualiza o contador global em tempo real!
                    </div>
                </div>
                
                <div class="counter-popup-footer">
                    <button class="counter-popup-btn primary-counter-btn" id="understandBtn">
                        Entendi, obrigado!
                    </button>
                    
                    <button class="counter-popup-btn coffee-api-btn" id="sendCoffeeBtn">
                        <span class="coffee-api-icon">☕</span>
                        <span>Enviar Café via API</span>
                    </button>
                </div>
                
                <div class="counter-popup-options">
                    <label class="counter-option-label">
                        <input type="checkbox" class="counter-checkbox" id="dontShowAgain">
                        Não mostrar novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(POPUP_CONFIG.popupId);
    let popupShown = false;
    let currentGlobalCount = 0;
    let apiStatus = 'connecting';
    
    // Verifica se deve mostrar o popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    // Atualiza a UI com os contadores
    function updateCountersUI(globalCount, userCount) {
        const globalElement = document.getElementById('globalCafeStat');
        const userElement = document.getElementById('userCafeStat');
        
        if (globalElement) {
            globalElement.textContent = globalCount;
            globalElement.style.transform = 'scale(1.3)';
            setTimeout(() => {
                globalElement.style.transform = 'scale(1)';
            }, 300);
        }
        
        if (userElement) {
            userElement.textContent = userCount;
            userElement.style.transform = 'scale(1.3)';
            setTimeout(() => {
                userElement.style.transform = 'scale(1)';
            }, 300);
        }
    }
    
    // Atualiza o status da API na UI
    function updateApiStatus(status, message = '') {
        apiStatus = status;
        const indicator = document.getElementById('apiStatusIndicator');
        const text = document.getElementById('apiStatusText');
        
        if (!indicator || !text) return;
        
        switch(status) {
            case 'connected':
                indicator.className = 'status-indicator';
                indicator.style.background = POPUP_CONFIG.colors.success;
                text.textContent = message || 'Conectado à API v2';
                break;
            case 'offline':
                indicator.className = 'status-indicator offline';
                indicator.style.background = POPUP_CONFIG.colors.warning;
                text.textContent = message || 'Usando modo offline';
                break;
            case 'error':
                indicator.className = 'status-indicator offline';
                indicator.style.background = '#EF4444';
                text.textContent = message || 'Erro na conexão';
                break;
            default:
                indicator.className = 'status-indicator';
                text.textContent = message || 'Conectando...';
        }
    }
    
    // Carrega os dados iniciais da API
    async function loadInitialData() {
        updateApiStatus('connecting', 'Buscando dados da API v2...');
        
        const result = await fetchCafeCount();
        const userCount = getUserContributionCount();
        
        if (result.success) {
            currentGlobalCount = result.count;
            updateApiStatus('connected', `API v2 conectada (${result.count} cafés)`);
            console.log('Dados da API v2 carregados:', result);
        } else {
            currentGlobalCount = result.count;
            updateApiStatus('offline', `Modo offline (${result.count} cafés)`);
            console.warn('Usando fallback:', result.error);
        }
        
        updateCountersUI(currentGlobalCount, userCount);
    }
    
    // Envia um café via API v2
    async function sendCoffee() {
        const sendBtn = document.getElementById('sendCoffeeBtn');
        if (!sendBtn) return;
        
        // Desabilita o botão durante o processamento
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="coffee-api-icon">⏳</span><span>Enviando...</span>';
        sendBtn.disabled = true;
        
        try {
            updateApiStatus('connecting', 'Enviando café...');
            
            const result = await incrementCafeCount();
            const userCount = getUserContributionCount();
            
            if (result.success) {
                currentGlobalCount = result.newCount;
                updateApiStatus('connected', `Café enviado! Total: ${result.newCount}`);
                
                // Efeito visual
                createCoffeeEffect();
                showSuccessMessage(userCount);
                
                console.log('Café enviado com sucesso via API v2:', result);
            } else {
                currentGlobalCount = result.newCount;
                updateApiStatus('offline', `Café salvo localmente (${result.newCount} total)`);
                
                // Efeito visual mesmo no fallback
                createCoffeeEffect();
                showSuccessMessage(userCount);
                
                console.warn('Café salvo localmente:', result.error);
            }
            
            updateCountersUI(currentGlobalCount, userCount);
            
        } catch (error) {
            console.error('Erro ao enviar café:', error);
            updateApiStatus('error', 'Erro ao enviar café');
            showErrorMessage();
        } finally {
            // Restaura o botão após 2 segundos
            setTimeout(() => {
                sendBtn.innerHTML = originalText;
                sendBtn.disabled = false;
            }, 2000);
        }
    }
    
    // Cria efeito visual de café
    function createCoffeeEffect() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const coffee = document.createElement('div');
                coffee.textContent = '☕';
                coffee.style.position = 'fixed';
                coffee.style.fontSize = '24px';
                coffee.style.zIndex = '10000';
                coffee.style.pointerEvents = 'none';
                coffee.style.animation = `coffeeFloat 1s ease-out forwards`;
                
                // Posição aleatória
                const startX = 40 + Math.random() * 20;
                coffee.style.left = startX + '%';
                coffee.style.top = '50%';
                
                document.body.appendChild(coffee);
                
                setTimeout(() => coffee.remove(), 1000);
            }, i * 200);
        }
    }
    
    // Mostra mensagem de sucesso
    function showSuccessMessage(userCount) {
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `
            <div style="
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
            ">
                ☕ Café enviado! Você já contribuiu com ${userCount} cafés!
            </div>
        `;
        
        // Adiciona animação CSS se não existir
        if (!document.getElementById('slideInStyle')) {
            const style = document.createElement('style');
            style.id = 'slideInStyle';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(messageDiv);
        
        // Remove após 3 segundos
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    // Mostra mensagem de erro
    function showErrorMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #EF4444;
                color: white;
                padding: 12px 20px;
                border-radius: 10px;
                z-index: 10001;
                animation: slideIn 0.3s ease-out;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                font-size: 14px;
            ">
                ⚠️ Erro ao conectar com a API. Café salvo localmente.
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.animation = 'slideIn 0.3s ease-out reverse forwards';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }
    
    // Mostra o popup
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        // Carrega dados da API
        await loadInitialData();
        
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
            const hideUntil = Date.now() + (POPUP_CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(POPUP_CONFIG.storageKey, hideUntil.toString());
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
        const closeBtn = popup.querySelector('.counter-close-btn');
        const understandBtn = document.getElementById('understandBtn');
        const coffeeBtn = document.getElementById('sendCoffeeBtn');
        
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        if (understandBtn) understandBtn.addEventListener('click', closePopup);
        if (coffeeBtn) coffeeBtn.addEventListener('click', sendCoffee);
        
        document.addEventListener('keydown', handleKeyboard);
        popup.addEventListener('click', closeOnOutsideClick);
        
        // Atualiza os dados a cada 60 segundos
        setInterval(async () => {
            const result = await fetchCafeCount();
            if (result.success) {
                currentGlobalCount = result.count;
                updateCountersUI(currentGlobalCount, getUserContributionCount());
                updateApiStatus('connected', `API v2 sincronizada (${result.count} cafés)`);
            }
        }, 60000);
    }
    
    // Inicialização
    function initPopup() {
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
        document.addEventListener('DOMContentLoaded', initPopup);
    } else {
        initPopup();
    }
    
    // ==================== API PÚBLICA ====================
    window.counterApiPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(POPUP_CONFIG.storageKey);
            popupShown = false;
            showPopup();
        },
        getStats: async function() {
            const apiResult = await fetchCafeCount();
            const userCount = getUserContributionCount();
            
            return {
                global: apiResult.success ? apiResult.count : currentGlobalCount,
                user: userCount,
                apiStatus: apiStatus,
                apiConnected: apiResult.success,
                rawApiResponse: apiResult.rawData
            };
        },
        sendCoffee: sendCoffee,
        // Novas funções da API v2
        incrementCounter: incrementCafeCount,
        decrementCounter: decrementCafeCount,
        getCounterStats: getCounterStats,
        // Funções para debug
        debug: {
            testApiConnection: async function() {
                console.log('=== Teste de Conexão API v2 ===');
                console.log('URL base:', API_CONFIG.baseUrl);
                console.log('Headers:', API_CONFIG.headers);
                
                // Testa GET
                console.log('Testando GET...');
                const getResult = await fetchCafeCount();
                console.log('Resultado GET:', getResult);
                
                // Testa estatísticas
                console.log('Testando GET /stats...');
                const statsResult = await getCounterStats();
                console.log('Resultado estatísticas:', statsResult);
                
                return { getResult, statsResult };
            },
            testIncrement: async function() {
                console.log('=== Teste de Incremento ===');
                const result = await incrementCafeCount();
                console.log('Resultado incremento:', result);
                return result;
            },
            resetLocalData: function() {
                localStorage.removeItem(POPUP_CONFIG.userCafeKey);
                localStorage.removeItem('cafeFallbackData');
                console.log('Dados locais resetados');
            },
            simulateRawApiCall: async function(endpoint = '') {
                const url = `${API_CONFIG.baseUrl}${endpoint}`;
                console.log('Simulando chamada API para:', url);
                console.log('Headers:', API_CONFIG.headers);
                
                try {
                    const response = await fetch(url, {
                        method: endpoint.includes('/up') || endpoint.includes('/down') ? 'POST' : 'GET',
                        headers: API_CONFIG.headers
                    });
                    console.log('Status:', response.status);
                    console.log('Headers:', Object.fromEntries(response.headers.entries()));
                    const text = await response.text();
                    console.log('Resposta texto:', text);
                    try {
                        return JSON.parse(text);
                    } catch {
                        return text;
                    }
                } catch (error) {
                    console.error('Erro na simulação:', error);
                    throw error;
                }
            }
        }
    };
    
})();