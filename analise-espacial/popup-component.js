// popup-original.js
(function() {
    'use strict';
    
    // Verifica se já existe ou se não deve mostrar
    if (document.getElementById('devPopup') || !shouldShowPopup()) {
        return;
    }
    
    // Adiciona CSS
    const style = document.createElement('style');
    style.textContent = `
        .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .popup-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .popup-header h3 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        }
        .close-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: white;
            font-size: 28px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
        }
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        .popup-content {
            padding: 28px;
            color: #333;
            line-height: 1.6;
            text-align: center;
        }
        .popup-content p { margin: 10px 0; }
        .popup-footer {
            padding: 0 28px 28px;
            display: flex;
            gap: 12px;
        }
        .popup-btn {
            flex: 1;
            padding: 14px 28px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
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
        .secondary-btn:hover { background: #e2e8f0; }
        .popup-options {
            padding: 0 28px 24px;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        .popup-options label {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            cursor: pointer;
        }
        @media (max-width: 480px) {
            .popup-card { width: 95%; }
            .popup-footer { flex-direction: column; }
            .popup-header { padding: 18px; }
            .popup-content { padding: 20px; }
        }
    `;
    document.head.appendChild(style);
    
    // Adiciona HTML
    const popupHTML = `
        <div id="devPopup" class="popup-overlay">
            <div class="popup-card">
                <div class="popup-header">
                    <h3>Atenção! Página em Desenvolvimento</h3>
                    <button class="close-btn" aria-label="Fechar">&times;</button>
                </div>
                <div class="popup-content">
                    <p><strong>Esta página está em construção</strong></p>
                    <p>Alguns recursos podem não estar disponíveis ou conter informações incompletas. Agradecemos sua compreensão!</p>
                </div>
                <div class="popup-footer">
                    <button class="popup-btn primary-btn" id="understandBtn">Entendi</button>
                    <button class="popup-btn secondary-btn" id="feedbackBtn">Reportar Problema</button>
                </div>
                <div class="popup-options">
                    <label>
                        <input type="checkbox" id="dontShowAgain">
                        Não mostrar novamente por 7 dias
                    </label>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Lógica do popup
    function shouldShowPopup() {
        const hideUntil = localStorage.getItem('devPopupHideUntil');
        if (!hideUntil) return true;
        return Date.now() > parseInt(hideUntil);
    }
    
    function showPopup() {
        const popup = document.getElementById('devPopup');
        popup.style.display = 'flex';
        document.addEventListener('keydown', closeOnEscape);
        popup.addEventListener('click', closeOnOutsideClick);
    }
    
    function closePopup() {
        const popup = document.getElementById('devPopup');
        const dontShowAgain = document.getElementById('dontShowAgain');
        
        popup.style.display = 'none';
        document.removeEventListener('keydown', closeOnEscape);
        popup.removeEventListener('click', closeOnOutsideClick);
        
        if (dontShowAgain.checked) {
            const hideUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
            localStorage.setItem('devPopupHideUntil', hideUntil.toString());
        }
    }
    
    function closeOnEscape(event) {
        if (event.key === 'Escape') closePopup();
    }
    
    function closeOnOutsideClick(event) {
        if (event.target.id === 'devPopup') closePopup();
    }
    
    // Event Listeners
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn = document.querySelector('.close-btn');
        const understandBtn = document.getElementById('understandBtn');
        const feedbackBtn = document.getElementById('feedbackBtn');
        
        closeBtn.addEventListener('click', closePopup);
        understandBtn.addEventListener('click', closePopup);
        feedbackBtn.addEventListener('click', function() {
            alert('Obrigado pelo interesse em reportar um problema!');
            closePopup();
        });
        
        // Mostra automaticamente
        if (shouldShowPopup()) {
            setTimeout(showPopup, 800);
        }
        
        // API pública
        window.showDevPopup = showPopup;
        window.hideDevPopup = closePopup;
        window.resetDevPopup = function() {
            localStorage.removeItem('devPopupHideUntil');
            showPopup();
        };
    });
    
})();