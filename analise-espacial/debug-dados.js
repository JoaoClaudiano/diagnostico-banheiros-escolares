// debug-dados.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DEBUG: Verificando dados...');
  
  // Aguardar 3 segundos e mostrar status
  setTimeout(() => {
    console.log('=== STATUS DO SISTEMA ===');
    console.log('Firebase disponível?', !!window.firebaseManager);
    console.log('Escolas no window?', !!window.escolas, window.escolas?.length);
    console.log('DadosManager?', !!window.dadosManager);
    
    if (window.dadosManager) {
      console.log('Status:', window.dadosManager.getStatus());
      console.log('Escolas carregadas:', window.dadosManager.getEscolas()?.length);
      console.log('Métricas:', window.dadosManager.getMetricas());
    }
  }, 3000);
});