// popup-counter-api-final.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API (SEGUNDO SUA DOCUMENTAÇÃO) ====================
    const API_CONFIG = {
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        apiToken: "ut_CldwAFarCYi9tYcS4IZToYMDqjoUsRa0ToUv46zN"
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
            warning: '#F59E0B'
        }
    };
    
    // ==================== FUNÇÕES DE API SEGUINDO A DOCUMENTAÇÃO ====================
    
    async function getCounterValue() {
        try {
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.apiToken}`
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            
            let count = 0;
            if (data && typeof data.count === 'number') {
                count = data.count;
            } else if (data && typeof data.value === 'number') {
                count = data.value;
            } else if (typeof data === 'number') {
                count = data;
            }
            
            return {
                success: true,
                count: count,
                rawData: data
            };
            
        } catch (error) {
            console.error('Erro ao buscar contador:', error);
            return {
                success: false,
                count: getLocalCount(),
                error: error.message
            };
        }
    }
    
    async function incrementCounter() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_CONFIG.apiToken}`
                },
                mode: 'cors'
            });
            
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            
            const data = await response.json();
            const updatedCount = await getCounterValue();
            
            return {
                success: true,
                newCount: updatedCount.success ? updatedCount.count : 0,
                rawData: data
            };
            
        } catch (error) {
            console.error('Erro ao incrementar contador:', error);
            const newCount = incrementLocalCount();
            return {
                success: false,
                newCount: newCount,
                error: error.message
            };
        }
    }
    
    function getLocalCount() {
        try {
            const localData = JSON.parse(localStorage.getItem('coffeeCount') || '{"count": 0}');
            return localData.count || 0;
        } catch (e) {
            return 0;
        }
    }
    
    function incrementLocalCount() {
        try {
            const localData = JSON.parse(localStorage.getItem('coffeeCount') || '{"count": 0}');
            localData.count = (localData.count || 0) + 1;
            localStorage.setItem('coffeeCount', JSON.stringify(localData));
            return localData.count;
        } catch (e) {
            return 1;
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId) || !shouldShowPopup()) {
        return;
    }
    
    // ==================== CSS DO POPUP ====================
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
            max-width: 500px;
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
            display: flex;
            flex-direction: column;
            height: 500px;
        }
        
        .counter-message {
            margin: 0 0 20px 0;
            font-size: 15px;
            text-align: center;
            flex-shrink: 0;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        
        /* JOGO TETRIS - OCUPA O CARD */
        .tetris-container {
            flex: 1;
            background: #0a0a1a;
            border-radius: 12px;
            overflow: hidden;
            position: relative;
            margin: 10px 0;
            border: 3px solid #1a1a2e;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
        }
        
        .tetris-title {
            padding: 10px;
            text-align: center;
            background: rgba(0, 0, 0, 0.7);
            border-bottom: 2px solid #333;
        }
        
        .tetris-title h3 {
            margin: 0;
            font-size: 1.2rem;
            color: #ffeb3b;
            text-shadow: 0 0 10px rgba(255, 235, 59, 0.5);
            font-family: 'Courier New', monospace;
        }
        
        .tetris-canvas-container {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 10px;
        }
        
        .tetris-canvas-container canvas {
            border: 2px solid #333;
            background: #000;
            display: block;
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            image-rendering: pixelated;
        }
        
        /* BOTÕES LADO A LADO */
        .counter-buttons-row {
            display: flex;
            gap: 12px;
            margin: 20px 0 15px 0;
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
            margin: 10px 0 5px 0;
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
        
        .status-indicator.error {
            background: #EF4444;
        }
        
        @keyframes statusBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        /* OPÇÃO NÃO MOSTRAR */
        .counter-option {
            margin-top: 15px;
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
                max-width: 350px;
                border-radius: 20px;
            }
            
            .counter-popup-content {
                padding: 20px;
                height: 450px;
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
                        Estamos trabalhando duro para melhorar esta página.
                    </div>
                    
                    <!-- JOGO TETRIS OCUPANDO O CARD -->
                    <div class="tetris-container" id="tetrisContainer">
                        <div class="tetris-title">
                            <h3>MINI TETRIS</h3>
                        </div>
                        <div class="tetris-canvas-container">
                            <canvas width="300" height="300" id="tetrisCanvas"></canvas>
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
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    
    let currentCount = 0;
    let popupShown = false;
    let apiConnected = false;
    let tetrisGame = null;
    
    // ==================== JOGO TETRIS AUTOMÁTICO E INTELIGENTE ====================
    function createTetrisGame() {
        const canvas = document.getElementById('tetrisCanvas');
        const context = canvas.getContext('2d');
        const grid = 20;
        const tetrominoSequence = [];
        const playfield = [];
        
        // Tamanho do campo ajustado para o canvas
        const COLS = 10;
        const ROWS = 15;
        
        // Inicializar campo de jogo
        for (let row = -2; row < ROWS; row++) {
            playfield[row] = [];
            for (let col = 0; col < COLS; col++) {
                playfield[row][col] = 0;
            }
        }
        
        // Definir tetrominós
        const tetrominos = {
            'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
            'J': [[1,0,0],[1,1,1],[0,0,0]],
            'L': [[0,0,1],[1,1,1],[0,0,0]],
            'O': [[1,1],[1,1]],
            'S': [[0,1,1],[1,1,0],[0,0,0]],
            'Z': [[1,1,0],[0,1,1],[0,0,0]],
            'T': [[0,1,0],[1,1,1],[0,0,0]]
        };
        
        const colors = {
            'I': '#00f0f0', // cyan
            'O': '#f0f000', // yellow
            'T': '#a000f0', // purple
            'S': '#00f000', // green
            'Z': '#f00000', // red
            'J': '#0000f0', // blue
            'L': '#f0a000'  // orange
        };
        
        // Funções auxiliares
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
        
        function generateSequence() {
            const sequence = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
            while (sequence.length) {
                const rand = getRandomInt(0, sequence.length - 1);
                tetrominoSequence.push(sequence.splice(rand, 1)[0]);
            }
        }
        
        function getNextTetromino() {
            if (tetrominoSequence.length === 0) {
                generateSequence();
            }
            const name = tetrominoSequence.pop();
            const matrix = tetrominos[name];
            const col = Math.floor(COLS / 2 - matrix[0].length / 2);
            const row = name === 'I' ? -1 : -2;
            return { name, matrix, row, col };
        }
        
        function rotate(matrix) {
            const N = matrix.length;
            const result = [];
            for (let i = 0; i < N; i++) {
                result[i] = [];
                for (let j = 0; j < N; j++) {
                    result[i][j] = matrix[N - j - 1][i];
                }
            }
            return result;
        }
        
        function isValidMove(matrix, cellRow, cellCol) {
            for (let r = 0; r < matrix.length; r++) {
                for (let c = 0; c < matrix[r].length; c++) {
                    if (matrix[r][c] && (
                        cellCol + c < 0 ||
                        cellCol + c >= COLS ||
                        cellRow + r >= ROWS ||
                        (cellRow + r >= 0 && playfield[cellRow + r][cellCol + c])
                    )) {
                        return false;
                    }
                }
            }
            return true;
        }
        
        // Função inteligente para encontrar a melhor posição
        function findBestPosition(tetromino) {
            let bestScore = -Infinity;
            let bestRotation = 0;
            let bestCol = 0;
            
            // Testa todas as rotações (0, 1, 2, 3)
            for (let rotation = 0; rotation < 4; rotation++) {
                let currentMatrix = tetromino.matrix;
                for (let r = 0; r < rotation; r++) {
                    currentMatrix = rotate(currentMatrix);
                }
                
                // Testa todas as colunas possíveis
                for (let col = 0; col <= COLS - currentMatrix[0].length; col++) {
                    // Encontra a linha mais baixa onde a peça pode ser colocada
                    let row = tetromino.row;
                    while (isValidMove(currentMatrix, row + 1, col)) {
                        row++;
                    }
                    
                    // Calcula pontuação baseada em:
                    // 1. Altura (quanto mais baixo, melhor)
                    // 2. Linhas completas potenciais
                    // 3. Buracos criados
                    let score = row * 10; // Quanto mais baixo, melhor
                    
                    // Bônus por preencher linhas
                    for (let r = 0; r < currentMatrix.length; r++) {
                        for (let c = 0; c < currentMatrix[r].length; c++) {
                            if (currentMatrix[r][c] && row + r >= 0) {
                                // Verifica se completa uma linha
                                let lineComplete = true;
                                for (let cc = 0; cc < COLS; cc++) {
                                    if (!playfield[row + r][cc] && 
                                        !(cc >= col && cc < col + currentMatrix[r].length && 
                                          currentMatrix[r][cc - col])) {
                                        lineComplete = false;
                                        break;
                                    }
                                }
                                if (lineComplete) score += 100;
                            }
                        }
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestRotation = rotation;
                        bestCol = col;
                    }
                }
            }
            
            return { rotation: bestRotation, col: bestCol };
        }
        
        function placeTetromino() {
            for (let r = 0; r < tetromino.matrix.length; r++) {
                for (let c = 0; c < tetromino.matrix[r].length; c++) {
                    if (tetromino.matrix[r][c]) {
                        if (tetromino.row + r < 0) {
                            restartGame();
                            return;
                        }
                        playfield[tetromino.row + r][tetromino.col + c] = tetromino.name;
                    }
                }
            }
            
            // Verificar e remover linhas completas
            let linesCleared = 0;
            for (let row = ROWS - 1; row >= 0; ) {
                if (playfield[row].every(cell => !!cell)) {
                    // Remove a linha
                    for (let r = row; r >= 0; r--) {
                        for (let c = 0; c < COLS; c++) {
                            playfield[r][c] = r > 0 ? playfield[r-1][c] : 0;
                        }
                    }
                    linesCleared++;
                } else {
                    row--;
                }
            }
            
            // Efeito visual para linhas limpas
            if (linesCleared > 0) {
                createLineClearEffect(linesCleared);
            }
            
            tetromino = getNextTetromino();
            // Encontra a melhor posição para a nova peça
            const bestPos = findBestPosition(tetromino);
            
            // Aplica a rotação
            for (let i = 0; i < bestPos.rotation; i++) {
                tetromino.matrix = rotate(tetromino.matrix);
            }
            
            // Move para a melhor coluna
            tetromino.col = bestPos.col;
            
            // Move para baixo até encontrar obstáculo
            while (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
                tetromino.row++;
            }
        }
        
        function createLineClearEffect(lines) {
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.style.position = 'absolute';
                    particle.style.width = '4px';
                    particle.style.height = '4px';
                    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.borderRadius = '50%';
                    particle.style.left = `${Math.random() * 100}%`;
                    particle.style.top = `${Math.random() * 100}%`;
                    particle.style.pointerEvents = 'none';
                    particle.style.zIndex = '1000';
                    particle.style.animation = 'floatUp 0.5s ease-out forwards';
                    document.getElementById('tetrisContainer').appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 500);
                }, i * 20);
            }
        }
        
        function restartGame() {
            // Limpa o campo
            for (let row = -2; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    playfield[row][col] = 0;
                }
            }
            
            // Reseta sequência
            tetrominoSequence.length = 0;
            
            // Reseta tetrominó atual
            tetromino = getNextTetromino();
            
            // Encontra a melhor posição inicial
            const bestPos = findBestPosition(tetromino);
            for (let i = 0; i < bestPos.rotation; i++) {
                tetromino.matrix = rotate(tetromino.matrix);
            }
            tetromino.col = bestPos.col;
        }
        
        // Variáveis do jogo
        let tetromino = getNextTetromino();
        let rAF = null;
        let lastTime = 0;
        const dropInterval = 300; // Velocidade aumentada (ms entre quedas)
        
        // Encontra a melhor posição inicial
        const bestPos = findBestPosition(tetromino);
        for (let i = 0; i < bestPos.rotation; i++) {
            tetromino.matrix = rotate(tetromino.matrix);
        }
        tetromino.col = bestPos.col;
        
        // Loop do jogo otimizado
        function loop(timestamp) {
            rAF = requestAnimationFrame(loop);
            
            if (!lastTime) lastTime = timestamp;
            const delta = timestamp - lastTime;
            
            if (delta > dropInterval) {
                lastTime = timestamp;
                
                // Move para baixo
                if (isValidMove(tetromino.matrix, tetromino.row + 1, tetromino.col)) {
                    tetromino.row++;
                } else {
                    placeTetromino();
                }
            }
            
            // Renderização
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            // Desenha o campo
            for (let r = 0; r < ROWS; r++) {
                for (let c = 0; c < COLS; c++) {
                    if (playfield[r] && playfield[r][c]) {
                        context.fillStyle = colors[playfield[r][c]];
                        context.fillRect(c * grid, r * grid, grid-1, grid-1);
                    }
                }
            }
            
            // Desenha o tetrominó atual
            context.fillStyle = colors[tetromino.name];
            for (let r = 0; r < tetromino.matrix.length; r++) {
                for (let c = 0; c < tetromino.matrix[r].length; c++) {
                    if (tetromino.matrix[r][c]) {
                        context.fillRect(
                            (tetromino.col + c) * grid,
                            (tetromino.row + r) * grid,
                            grid-1,
                            grid-1
                        );
                    }
                }
            }
            
            // Grade
            context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            context.lineWidth = 0.5;
            for (let c = 0; c <= COLS; c++) {
                context.beginPath();
                context.moveTo(c * grid, 0);
                context.lineTo(c * grid, ROWS * grid);
                context.stroke();
            }
            for (let r = 0; r <= ROWS; r++) {
                context.beginPath();
                context.moveTo(0, r * grid);
                context.lineTo(COLS * grid, r * grid);
                context.stroke();
            }
        }
        
        // Inicia o jogo
        rAF = requestAnimationFrame(loop);
        
        // Retorna função para limpar
        return {
            cleanup: () => {
                if (rAF) {
                    cancelAnimationFrame(rAF);
                    rAF = null;
                }
            },
            restart: restartGame
        };
    }
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil, 10);
    }
    
    function updateApiStatus(status, message = '') {
        apiConnected = status === 'connected';
        
        if (apiStatusIndicator && apiStatusText) {
            apiStatusIndicator.className = 'status-indicator';
            
            switch(status) {
                case 'connected':
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.success;
                    apiStatusText.textContent = message || 'API Conectada';
                    break;
                case 'connecting':
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Conectando...';
                    break;
                case 'offline':
                    apiStatusIndicator.classList.add('offline');
                    apiStatusIndicator.style.background = POPUP_CONFIG.colors.warning;
                    apiStatusText.textContent = message || 'Modo Offline';
                    break;
                case 'error':
                    apiStatusIndicator.classList.add('error');
                    apiStatusIndicator.style.background = '#EF4444';
                    apiStatusText.textContent = message || 'Erro na API';
                    break;
                default:
                    apiStatusText.textContent = message || 'Desconectado';
            }
        }
    }
    
    async function updateCoffeeCounter() {
        try {
            updateApiStatus('connecting', 'Buscando dados...');
            
            const result = await getCounterValue();
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                
                updateApiStatus('connected', `API Online (${currentCount} cafés)`);
                
                // Efeito visual
                totalCountElement.style.transform = 'scale(1.3)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            } else {
                updateApiStatus('offline', 'Usando dados locais');
            }
        } catch (error) {
            console.error('Erro ao atualizar contador:', error);
            updateApiStatus('error', 'Erro de conexão');
        }
    }
    
    async function handleSendCoffee() {
        if (sendBtn.disabled) return;
        
        sendBtn.disabled = true;
        const originalText = sendBtn.innerHTML;
        sendBtn.innerHTML = '<span class="coffee-icon">⏳</span><span>Enviando...</span>';
        
        try {
            createCoffeeFloats();
            updateApiStatus('connecting', 'Enviando café...');
            const result = await incrementCounter();
            
            if (result.success) {
                currentCount = result.newCount;
                totalCountElement.textContent = currentCount;
                
                totalCountElement.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
                
                showNotification('☕ Café enviado com sucesso!');
                
                sendBtn.innerHTML = '<span class="coffee-icon">✅</span><span>Enviado!</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.success} 0%, #0DA271 100%)`;
                
                updateApiStatus('connected', `Café enviado! Total: ${currentCount}`);
                
            } else {
                currentCount = result.newCount;
                totalCountElement.textContent = currentCount;
                
                totalCountElement.style.transform = 'scale(1.5)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
                
                showNotification('☕ Café salvo localmente!');
                
                sendBtn.innerHTML = '<span class="coffee-icon">☕</span><span>Salvo Local</span>';
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.warning} 0%, #D97706 100%)`;
                
                updateApiStatus('offline', 'Modo Local Ativo');
            }
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Erro ao enviar café');
            
            sendBtn.innerHTML = '<span class="coffee-icon">❌</span><span>Erro</span>';
            sendBtn.style.background = `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)`;
            
            updateApiStatus('error', 'Erro ao enviar');
            
        } finally {
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalText;
                sendBtn.style.background = `linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown} 0%, #8B4513 100%)`;
            }, 2000);
        }
    }
    
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
    
    function showNotification(message) {
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
    
    function closePopup() {
        const dontShowAgain = document.getElementById('dontShowAgain');
        if (dontShowAgain && dontShowAgain.checked) {
            const hideUntil = Date.now() + (POPUP_CONFIG.hideDays * 24 * 60 * 60 * 1000);
            localStorage.setItem(POPUP_CONFIG.storageKey, hideUntil.toString());
        }
        
        if (tetrisGame && tetrisGame.cleanup) {
            tetrisGame.cleanup();
        }
        
        popup.style.animation = 'overlayFade 0.3s ease-out reverse forwards';
        setTimeout(() => {
            popup.style.display = 'none';
            popup.style.animation = '';
        }, 300);
    }
    
    async function showPopup() {
        if (popupShown) return;
        popupShown = true;
        
        popup.style.display = 'flex';
        
        tetrisGame = createTetrisGame();
        await updateCoffeeCounter();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        sendBtn.addEventListener('click', handleSendCoffee);
        understandBtn.addEventListener('click', closePopup);
        if (closeBtn) closeBtn.addEventListener('click', closePopup);
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });
    }
    
    function init() {
        setTimeout(showPopup, POPUP_CONFIG.showDelay);
        
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
    
    window.coffeeCounterPopup = {
        show: showPopup,
        hide: closePopup,
        reset: function() {
            localStorage.removeItem(POPUP_CONFIG.storageKey);
            localStorage.removeItem('coffeeCount');
            popupShown = false;
            showPopup();
        },
        getCount: async () => {
            const result = await getCounterValue();
            return result.success ? result.count : getLocalCount();
        },
        sendCoffee: handleSendCoffee
    };
    
})();