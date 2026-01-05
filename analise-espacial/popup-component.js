// popup-counter-api-tetris-optimized.js
(function() {
    'use strict';
    
    // ==================== CONFIGURAÇÃO DA API ====================
    const API_CONFIG = {
        baseUrl: "https://api.counterapi.dev/v2/joao-claudianos-team-2325/first-counter-2325",
        // Esta API não usa token Bearer (corrigido)
    };
    
    // ==================== CONFIGURAÇÃO DO POPUP ====================
    const POPUP_CONFIG = {
        popupId: 'counter-api-popup',
        storageKey: 'counterApiPopupHidden',
        hideDays: 7,
        showDelay: 1500,
        
        colors: {
            primary: '#FF6B6B',
            primaryDark: '#FF4757',
            cafeBrown: '#A0522D',
            cafeLight: '#DEB887',
            success: '#10B981',
            warning: '#F59E0B'
        }
    };
    
    // ==================== FUNÇÕES DE API CORRIGIDAS ====================
    
    async function getCounterValue() {
        try {
            // API CounterAPI não requer autenticação Bearer
            const response = await fetch(API_CONFIG.baseUrl, {
                method: 'GET',
                // Removido headers de Authorization que não são necessários
            });
            
            if (!response.ok) {
                console.warn(`API retornou status ${response.status}, usando dados locais`);
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Dados da API:', data); // Para debug
            
            // A API CounterAPI retorna {count: número} ou {value: número}
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
            console.warn('Erro na API, usando dados locais:', error.message);
            return {
                success: false,
                count: getLocalCount(),
                error: error.message
            };
        }
    }
    
    async function incrementCounter() {
        try {
            // API CounterAPI: endpoint /up para incrementar
            const response = await fetch(`${API_CONFIG.baseUrl}/up`, {
                method: 'POST',
                // Sem headers de autenticação
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            // Retorna o novo valor
            const result = await getCounterValue();
            
            return {
                success: true,
                newCount: result.success ? result.count : 0,
            };
            
        } catch (error) {
            console.warn('Falha ao incrementar API, usando local:', error.message);
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
            const count = localStorage.getItem('coffeeCounter_local');
            return count ? parseInt(count) : 0;
        } catch {
            return 0;
        }
    }
    
    function incrementLocalCount() {
        try {
            const current = getLocalCount();
            const newCount = current + 1;
            localStorage.setItem('coffeeCounter_local', newCount.toString());
            return newCount;
        } catch {
            return 1;
        }
    }
    
    // ==================== VERIFICAÇÃO INICIAL ====================
    if (document.getElementById(POPUP_CONFIG.popupId)) {
        return; // Já existe
    }
    
    if (!shouldShowPopup()) {
        return; // Não deve mostrar
    }
    
    // ==================== CSS OTIMIZADO ====================
    const style = document.createElement('style');
    style.textContent = `
        /* OVERLAY */
        .counter-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
            backdrop-filter: blur(5px);
        }
        
        .counter-popup-overlay.show {
            opacity: 1;
            visibility: visible;
        }
        
        /* CARD PRINCIPAL */
        .counter-popup-card {
            background: white;
            border-radius: 20px;
            width: 90%;
            max-width: 500px;
            overflow: hidden;
            transform: translateY(20px) scale(0.98);
            opacity: 0;
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
            border: 1px solid rgba(0, 0, 0, 0.1);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }
        
        .counter-popup-overlay.show .counter-popup-card {
            transform: translateY(0) scale(1);
            opacity: 1;
        }
        
        /* CABEÇALHO */
        .counter-popup-header {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary}, ${POPUP_CONFIG.colors.primaryDark});
            color: white;
            padding: 20px;
            position: relative;
        }
        
        .counter-header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .counter-popup-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        
        .counter-close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .counter-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        /* CONTEÚDO */
        .counter-popup-content {
            padding: 25px;
        }
        
        .counter-message {
            margin: 0 0 20px 0;
            font-size: 15px;
            text-align: center;
            color: #333;
        }
        
        .counter-message strong {
            display: block;
            color: ${POPUP_CONFIG.colors.primary};
            font-size: 16px;
            margin-bottom: 8px;
        }
        
        /* TETRIS MINI GAME - OTIMIZADO */
        .tetris-container {
            background: #0a0a0a;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
            border: 3px solid #1a1a2e;
            height: 250px;
            position: relative;
        }
        
        .tetris-title {
            padding: 10px;
            text-align: center;
            background: rgba(0, 0, 0, 0.7);
            border-bottom: 2px solid #333;
        }
        
        .tetris-title h3 {
            margin: 0;
            font-size: 14px;
            color: #4FC3F7;
            font-family: 'Courier New', monospace;
            letter-spacing: 1px;
        }
        
        .tetris-canvas-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: calc(100% - 40px);
        }
        
        #tetrisCanvas {
            background: #000;
            border: 1px solid #333;
            image-rendering: pixelated;
        }
        
        /* BOTÕES */
        .counter-buttons-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 20px 0;
        }
        
        .primary-counter-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.primary}, ${POPUP_CONFIG.colors.primaryDark});
            color: white;
            border: none;
            border-radius: 10px;
            padding: 14px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .primary-counter-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 107, 107, 0.3);
        }
        
        .coffee-action-btn {
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeBrown}, #8B4513);
            color: white;
            border: none;
            border-radius: 10px;
            padding: 14px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .coffee-action-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
        }
        
        .coffee-action-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
        
        .coffee-icon {
            font-size: 18px;
        }
        
        /* CONTADOR */
        .coffee-counter-mini {
            text-align: center;
            margin: 20px 0;
        }
        
        .counter-circle {
            display: inline-block;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${POPUP_CONFIG.colors.cafeLight}, ${POPUP_CONFIG.colors.cafeBrown});
            color: white;
            font-size: 22px;
            font-weight: 800;
            line-height: 60px;
            box-shadow: 0 5px 15px rgba(160, 82, 45, 0.3);
            margin-bottom: 5px;
            transition: transform 0.3s;
        }
        
        .counter-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* STATUS */
        .api-status {
            text-align: center;
            margin: 15px 0;
            font-size: 13px;
            color: #666;
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 6px;
            background: ${POPUP_CONFIG.colors.success};
        }
        
        .status-indicator.offline {
            background: ${POPUP_CONFIG.colors.warning};
        }
        
        .status-indicator.error {
            background: #EF4444;
        }
        
        /* OPÇÃO */
        .counter-option {
            margin-top: 20px;
            padding-top: 20px;
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
        
        /* ANIMAÇÕES */
        .coffee-float {
            position: fixed;
            font-size: 20px;
            z-index: 10000;
            pointer-events: none;
            animation: floatUp 1s ease-out forwards;
        }
        
        @keyframes floatUp {
            0% { transform: translateY(0) rotate(0); opacity: 1; }
            100% { transform: translateY(-80px) rotate(20deg); opacity: 0; }
        }
        
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
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        /* RESPONSIVO */
        @media (max-width: 480px) {
            .counter-popup-card {
                width: 95%;
                max-width: 350px;
            }
            
            .counter-buttons-row {
                grid-template-columns: 1fr;
            }
            
            .tetris-container {
                height: 200px;
            }
        }
    `;
    
    document.head.appendChild(style);
    
    // ==================== HTML DO POPUP ====================
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
                    
                    <!-- TETRIS OTIMIZADO -->
                    <div class="tetris-container">
                        <div class="tetris-title">
                            <h3>MINI TETRIS</h3>
                        </div>
                        <div class="tetris-canvas-container">
                            <canvas width="240" height="200" id="tetrisCanvas"></canvas>
                        </div>
                    </div>
                    
                    <!-- BOTÕES -->
                    <div class="counter-buttons-row">
                        <button class="primary-counter-btn" id="understandBtn">
                            Obrigado!
                        </button>
                        <button class="coffee-action-btn" id="sendCoffeeBtn">
                            <span class="coffee-icon">☕</span>
                            <span>Enviar Café</span>
                        </button>
                    </div>
                    
                    <!-- CONTADOR -->
                    <div class="coffee-counter-mini">
                        <div class="counter-circle" id="totalCoffeeCount">0</div>
                        <div class="counter-label">Total de Cafés</div>
                    </div>
                    
                    <!-- STATUS -->
                    <div class="api-status">
                        <span class="status-indicator" id="apiStatusIndicator"></span>
                        <span id="apiStatusText">Conectando à API...</span>
                    </div>
                    
                    <!-- OPÇÃO -->
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
    
    // ==================== TETRIS OTIMIZADO ====================
    class MiniTetris {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.gridSize = 20;
            this.cols = 12;
            this.rows = 10;
            
            // Tetrominós
            this.pieces = [
                { shape: [[1,1,1,1]], color: '#00FFFF' }, // I
                { shape: [[1,1],[1,1]], color: '#FFFF00' }, // O
                { shape: [[0,1,0],[1,1,1]], color: '#800080' }, // T
                { shape: [[1,1,0],[0,1,1]], color: '#00FF00' }, // S
                { shape: [[0,1,1],[1,1,0]], color: '#FF0000' }, // Z
                { shape: [[1,0,0],[1,1,1]], color: '#0000FF' }, // J
                { shape: [[0,0,1],[1,1,1]], color: '#FFA500' }  // L
            ];
            
            this.reset();
            this.start();
        }
        
        reset() {
            this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
            this.score = 0;
            this.level = 1;
            this.gameOver = false;
            this.spawnPiece();
        }
        
        spawnPiece() {
            const piece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
            this.currentPiece = {
                shape: piece.shape,
                color: piece.color,
                x: Math.floor(this.cols / 2) - Math.floor(piece.shape[0].length / 2),
                y: 0
            };
            
            // Verifica se já perdeu
            if (this.checkCollision(this.currentPiece.x, this.currentPiece.y)) {
                this.gameOver = true;
                setTimeout(() => this.reset(), 1000);
            }
        }
        
        checkCollision(x, y, shape = this.currentPiece.shape) {
            for (let r = 0; r < shape.length; r++) {
                for (let c = 0; c < shape[r].length; c++) {
                    if (shape[r][c]) {
                        const newX = x + c;
                        const newY = y + r;
                        
                        if (newX < 0 || newX >= this.cols || 
                            newY >= this.rows || 
                            (newY >= 0 && this.board[newY][newX])) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        
        mergePiece() {
            for (let r = 0; r < this.currentPiece.shape.length; r++) {
                for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                    if (this.currentPiece.shape[r][c]) {
                        const y = this.currentPiece.y + r;
                        const x = this.currentPiece.x + c;
                        if (y >= 0) {
                            this.board[y][x] = this.currentPiece.color;
                        }
                    }
                }
            }
            
            // Verifica linhas completas
            this.checkLines();
            this.spawnPiece();
        }
        
        checkLines() {
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.board[r].every(cell => cell !== 0)) {
                    // Remove a linha
                    this.board.splice(r, 1);
                    this.board.unshift(Array(this.cols).fill(0));
                    this.score += 100;
                    
                    // Efeito visual
                    this.createLineEffect(r);
                }
            }
        }
        
        createLineEffect(row) {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.style.position = 'absolute';
                    particle.style.width = '4px';
                    particle.style.height = '4px';
                    particle.style.background = this.currentPiece.color;
                    particle.style.borderRadius = '50%';
                    particle.style.left = `${Math.random() * 100}%`;
                    particle.style.top = `${20 + (row * 8)}%`;
                    particle.style.pointerEvents = 'none';
                    document.querySelector('.tetris-container').appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 500);
                }, i * 50);
            }
        }
        
        moveDown() {
            if (this.gameOver) return;
            
            if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y + 1)) {
                this.currentPiece.y++;
            } else {
                this.mergePiece();
            }
        }
        
        moveLeft() {
            if (!this.checkCollision(this.currentPiece.x - 1, this.currentPiece.y)) {
                this.currentPiece.x--;
            }
        }
        
        moveRight() {
            if (!this.checkCollision(this.currentPiece.x + 1, this.currentPiece.y)) {
                this.currentPiece.x++;
            }
        }
        
        rotate() {
            const rotated = this.currentPiece.shape[0].map((_, index) =>
                this.currentPiece.shape.map(row => row[index]).reverse()
            );
            
            if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, rotated)) {
                this.currentPiece.shape = rotated;
            }
        }
        
        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Desenha o tabuleiro
            for (let r = 0; r < this.rows; r++) {
                for (let c = 0; c < this.cols; c++) {
                    if (this.board[r][c]) {
                        this.ctx.fillStyle = this.board[r][c];
                        this.ctx.fillRect(c * this.gridSize, r * this.gridSize, 
                                       this.gridSize - 1, this.gridSize - 1);
                    }
                }
            }
            
            // Desenha a peça atual
            if (this.currentPiece && !this.gameOver) {
                this.ctx.fillStyle = this.currentPiece.color;
                for (let r = 0; r < this.currentPiece.shape.length; r++) {
                    for (let c = 0; c < this.currentPiece.shape[r].length; c++) {
                        if (this.currentPiece.shape[r][c]) {
                            this.ctx.fillRect(
                                (this.currentPiece.x + c) * this.gridSize,
                                (this.currentPiece.y + r) * this.gridSize,
                                this.gridSize - 1,
                                this.gridSize - 1
                            );
                        }
                    }
                }
            }
            
            // Grade
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 0.5;
            for (let c = 0; c <= this.cols; c++) {
                this.ctx.beginPath();
                this.ctx.moveTo(c * this.gridSize, 0);
                this.ctx.lineTo(c * this.gridSize, this.rows * this.gridSize);
                this.ctx.stroke();
            }
            for (let r = 0; r <= this.rows; r++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, r * this.gridSize);
                this.ctx.lineTo(this.cols * this.gridSize, r * this.gridSize);
                this.ctx.stroke();
            }
        }
        
        start() {
            let lastTime = 0;
            const speed = 800; // ms por movimento
            
            const gameLoop = (currentTime) => {
                if (!lastTime) lastTime = currentTime;
                const delta = currentTime - lastTime;
                
                if (delta > speed) {
                    this.moveDown();
                    this.draw();
                    lastTime = currentTime;
                }
                
                if (!this.gameOver) {
                    requestAnimationFrame(gameLoop);
                }
            };
            
            // Movimentos automáticos ocasionais
            setInterval(() => {
                if (Math.random() > 0.7 && !this.gameOver) {
                    Math.random() > 0.5 ? this.moveLeft() : this.moveRight();
                }
                if (Math.random() > 0.9 && !this.gameOver) {
                    this.rotate();
                }
            }, 500);
            
            requestAnimationFrame(gameLoop);
        }
    }
    
    // ==================== LÓGICA DO POPUP ====================
    const popup = document.getElementById(POPUP_CONFIG.popupId);
    const sendBtn = document.getElementById('sendCoffeeBtn');
    const understandBtn = document.getElementById('understandBtn');
    const closeBtn = popup.querySelector('.counter-close-btn');
    const totalCountElement = document.getElementById('totalCoffeeCount');
    const apiStatusIndicator = document.getElementById('apiStatusIndicator');
    const apiStatusText = document.getElementById('apiStatusText');
    
    let currentCount = 0;
    let tetrisGame = null;
    
    // ==================== FUNÇÕES AUXILIARES ====================
    
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem(POPUP_CONFIG.storageKey);
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil);
    }
    
    function updateApiStatus(status, message = '') {
        if (!apiStatusIndicator || !apiStatusText) return;
        
        apiStatusIndicator.className = 'status-indicator';
        
        switch(status) {
            case 'connected':
                apiStatusIndicator.classList.add('connected');
                apiStatusText.textContent = message || 'API Conectada';
                break;
            case 'connecting':
                apiStatusText.textContent = message || 'Conectando...';
                break;
            case 'offline':
                apiStatusIndicator.classList.add('offline');
                apiStatusText.textContent = message || 'Modo Offline';
                break;
            case 'error':
                apiStatusIndicator.classList.add('error');
                apiStatusText.textContent = message || 'Erro na API';
                break;
        }
    }
    
    async function updateCoffeeCounter() {
        try {
            updateApiStatus('connecting', 'Buscando dados da API...');
            
            const result = await getCounterValue();
            
            if (result.success) {
                currentCount = result.count;
                totalCountElement.textContent = currentCount;
                
                updateApiStatus('connected', `API Online - ${currentCount} cafés`);
                
                // Efeito visual
                totalCountElement.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    totalCountElement.style.transform = 'scale(1)';
                }, 300);
            } else {
                updateApiStatus('offline', 'Modo Offline - Dados Locais');
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
            // Animações
            createCoffeeFloats();
            updateApiStatus('connecting', 'Enviando café...');
            
            const result = await incrementCounter();
            
            // Atualiza contador
            currentCount = result.newCount;
            totalCountElement.textContent = currentCount;
            
            // Efeito visual
            totalCountElement.style.transform = 'scale(1.3)';
            setTimeout(() => {
                totalCountElement.style.transform = 'scale(1)';
            }, 300);
            
            // Notificação
            showNotification(
                result.success 
                    ? '☕ Café enviado para a API!' 
                    : '☕ Café salvo localmente!',
                result.success ? 'success' : 'warning'
            );
            
            // Feedback do botão
            sendBtn.innerHTML = result.success 
                ? '<span class="coffee-icon">✅</span><span>Enviado!</span>'
                : '<span class="coffee-icon">📱</span><span>Salvo Local</span>';
            
            updateApiStatus(
                result.success ? 'connected' : 'offline',
                result.success ? 'Café enviado com sucesso!' : 'Modo Local Ativo'
            );
            
        } catch (error) {
            console.error('Erro:', error);
            showNotification('⚠️ Erro ao enviar café', 'error');
            updateApiStatus('error', 'Erro ao enviar');
            
            sendBtn.innerHTML = '<span class="coffee-icon">❌</span><span>Erro</span>';
            
        } finally {
            setTimeout(() => {
                sendBtn.disabled = false;
                sendBtn.innerHTML = originalText;
            }, 2000);
        }
    }
    
    function createCoffeeFloats() {
        const btnRect = sendBtn.getBoundingClientRect();
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const coffee = document.createElement('div');
                coffee.textContent = '☕';
                coffee.className = 'coffee-float';
                coffee.style.left = `${btnRect.left + Math.random() * 50}px`;
                coffee.style.top = `${btnRect.top - 20}px`;
                coffee.style.fontSize = `${18 + Math.random() * 10}px`;
                document.body.appendChild(coffee);
                
                setTimeout(() => coffee.remove(), 1000);
            }, i * 150);
        }
    }
    
    function showNotification(message, type = 'success') {
        const existing = document.querySelector('.coffee-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = 'coffee-notification';
        notification.textContent = message;
        notification.style.background = type === 'success' 
            ? POPUP_CONFIG.colors.success 
            : type === 'warning' 
                ? POPUP_CONFIG.colors.warning 
                : '#EF4444';
        
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
        
        popup.classList.remove('show');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.remove();
                document.querySelector('#counter-popup-styles')?.remove();
            }
        }, 300);
    }
    
    async function showPopup() {
        popup.classList.add('show');
        
        // Inicia Tetris
        const canvas = document.getElementById('tetrisCanvas');
        if (canvas) {
            tetrisGame = new MiniTetris(canvas);
        }
        
        // Atualiza contador
        await updateCoffeeCounter();
        
        // Event listeners
        sendBtn.addEventListener('click', handleSendCoffee);
        understandBtn.addEventListener('click', closePopup);
        closeBtn.addEventListener('click', closePopup);
        
        popup.addEventListener('click', (e) => {
            if (e.target === popup) closePopup();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closePopup();
        });
    }
    
    // ==================== INICIALIZAÇÃO ====================
    function init() {
        setTimeout(() => {
            showPopup();
        }, POPUP_CONFIG.showDelay);
    }
    
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
            localStorage.removeItem('coffeeCounter_local');
            popup.classList.add('show');
        },
        getCount: async () => {
            const result = await getCounterValue();
            return result.count;
        }
    };
    
})();