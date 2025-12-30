// firebase-config.js - VERSÃO CORRIGIDA
// IMPORTANTE: Use Firebase v9+ (modular)

// 🔥 Configuração do Firebase (mantenha suas credenciais)
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

// Inicializar Firebase apenas uma vez
let firebaseApp, firestoreDb, firebaseManager;

try {
  // Verificar se Firebase já foi carregado
  if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firestoreDb = firebase.firestore();
    
    console.log('✅ Firebase inicializado com sucesso!');
  } else if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    firebaseApp = firebase.app();
    firestoreDb = firebase.firestore();
    console.log('✅ Firebase já estava inicializado');
  } else {
    console.warn('⚠️ Firebase não encontrado. Usando modo offline.');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}

// Mapeamento de classes para pesos
const PESOS_CLASSE = {
  'adequada': 1,
  'alerta': 2,
  'atenção': 3,
  'crítico': 5,
  'não avaliada': 0.5
};

// Gerenciador simplificado do Firebase
const FirebaseManager = {
  async buscarTodasAvaliacoes() {
    try {
      if (!firestoreDb) {
        console.warn('⚠️ Firestore não disponível. Retornando array vazio.');
        return [];
      }
      
      console.log('📡 Buscando avaliações do Firebase...');
      const snapshot = await firestoreDb.collection('avaliacoes')
        .orderBy('createdAt', 'desc')
        .limit(100) // Limitar para evitar sobrecarga
        .get();
      
      const avaliacoes = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Tratar timestamps corretamente
        let createdAt = new Date();
        if (data.createdAt) {
          if (data.createdAt.toDate) {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          }
        }
        
        avaliacoes.push({
          id: doc.id,
          nome: data.nome || 'Escola não identificada',
          lat: parseFloat(data.lat) || -3.717,
          lng: parseFloat(data.lng) || -38.543,
          classe: data.classe || 'não avaliada',
          pontuacao: parseInt(data.pontuacao) || 0,
          createdAt: createdAt,
          metadata: data.metadata || {}
        });
      });
      
      console.log(`✅ ${avaliacoes.length} avaliações carregadas do Firebase`);
      return avaliacoes;
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error);
      // Retornar array vazio para continuar funcionando
      return [];
    }
  },
  
  async adicionarAvaliacao(avaliacao) {
    try {
      if (!firestoreDb) {
        console.warn('⚠️ Firestore não disponível. Não foi possível salvar.');
        return null;
      }
      
      const docRef = await firestoreDb.collection('avaliacoes').add({
        ...avaliacao,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Avaliação salva com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar avaliação:', error);
      return null;
    }
  },
  
  // Testar conexão
  async testarConexao() {
    try {
      if (!firestoreDb) return false;
      await firestoreDb.collection('avaliacoes').limit(1).get();
      return true;
    } catch (error) {
      console.error('❌ Teste de conexão falhou:', error);
      return false;
    }
  }
};

// Exportar para uso global
window.firebaseManager = FirebaseManager;
window.firestoreDb = firestoreDb;
window.PESOS_CLASSE = PESOS_CLASSE;
window.firebaseApp = firebaseApp;

console.log('🔥 Firebase configurado para análise espacial');