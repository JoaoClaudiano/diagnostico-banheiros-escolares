// firebase-config.js
// Configuração do Firebase para análise espacial

// Configuração do projeto (substitua com suas credenciais)
// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

// Verificar se Firebase já foi inicializado
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // Se já estiver inicializado, use essa instância
}

// Referências do Firestore
const db = firebase.firestore();
const avaliacoesRef = db.collection('avaliacoes');
const escolasRef = db.collection('escolas'); // Se quiser armazenar também

// Mapeamento de classes para pesos (para análise ponderada)
const PESOS_CLASSE = {
  'adequada': 1,
  'alerta': 2,
  'atenção': 3,
  'crítico': 5,
  'não avaliada': 0.5
};

// Gerenciador do Firebase
const FirebaseManager = {
  
  // Buscar TODAS as avaliações
  async buscarTodasAvaliacoes() {
    try {
      console.log('📡 Buscando avaliações do Firebase...');
      const snapshot = await avaliacoesRef.orderBy('createdAt', 'desc').get();
      const avaliacoes = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Formatar dados para garantir consistência
        avaliacoes.push({
          id: doc.id,
          nome: data.nome || 'Escola não identificada',
          lat: parseFloat(data.lat) || -3.717,
          lng: parseFloat(data.lng) || -38.543,
          classe: data.classe || 'não avaliada',
          pontuacao: parseInt(data.pontuacao) || 0,
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          metadata: data.metadata || {}
        });
      });
      
      console.log(`✅ ${avaliacoes.length} avaliações carregadas do Firebase`);
      return avaliacoes;
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error);
      return [];
    }
  },
  
  // Buscar avaliações de uma escola específica
  async buscarAvaliacoesEscola(nomeEscola) {
    try {
      const snapshot = await avaliacoesRef
        .where('nome', '==', nomeEscola)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Erro ao buscar avaliações de ${nomeEscola}:`, error);
      return [];
    }
  },
  
  // Adicionar nova avaliação
  async adicionarAvaliacao(avaliacao) {
    try {
      const docRef = await avaliacoesRef.add({
        ...avaliacao,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Avaliação adicionada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao adicionar avaliação:', error);
      return null;
    }
  },
  
  // Estatísticas rápidas
  async getEstatisticas() {
    const avaliacoes = await this.buscarTodasAvaliacoes();
    const estatisticas = {
      total: avaliacoes.length,
      porClasse: {},
      dataMaisRecente: null
    };
    
    // Contar por classe
    avaliacoes.forEach(av => {
      estatisticas.porClasse[av.classe] = (estatisticas.porClasse[av.classe] || 0) + 1;
    });
    
    // Data mais recente
    if (avaliacoes.length > 0) {
      estatisticas.dataMaisRecente = avaliacoes[0].createdAt;
    }
    
    return estatisticas;
  }
};

// Exportar para uso global
window.firebaseManager = FirebaseManager;
window.firebaseDb = db;
window.PESOS_CLASSE = PESOS_CLASSE;

console.log('🔥 Firebase configurado para análise espacial');