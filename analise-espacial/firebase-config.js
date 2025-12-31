// firebase-config.js - VERSÃO 8 (compatível)
console.log('🔥 Configurando Firebase v8...');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

// Inicializar Firebase apenas uma vez
let firebaseApp, db, firebaseManager;

try {
  // Verificar se Firebase está disponível
  if (typeof firebase !== 'undefined') {
    // Inicializar Firebase
    firebaseApp = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    
    console.log('✅ Firebase v8 inicializado com sucesso!');
    console.log('📡 Conectado ao projeto:', firebaseConfig.projectId);
    
  } else {
    console.error('❌ Firebase não está disponível');
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

// Gerenciador do Firebase
const FirebaseManager = {
  // Buscar TODAS as avaliações
  async buscarTodasAvaliacoes() {
    try {
      if (!db) {
        console.warn('⚠️ Firestore não disponível');
        return [];
      }
      
      console.log('📡 Buscando avaliações do Firestore...');
      
      // Obter snapshot das avaliações
      const snapshot = await db.collection('avaliacoes')
        .orderBy('createdAt', 'desc')
        .get();
      
      const avaliacoes = [];
      
// Dentro de firebase-config.js

async buscarTodasAvaliacoes() {
  try {
    if (!db) {
      console.warn('⚠️ Firestore não disponível');
      return [];
    }
    
    console.log('📡 Buscando avaliações do Firestore...');
    
    const snapshot = await db.collection('avaliacoes')
      .orderBy('createdAt', 'desc')
      .get();
    
    const avaliacoes = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      // Tratamento de data
      let createdAt = new Date();
      if (data.createdAt) {
        createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date();
      }

      // --- CORREÇÃO AQUI ---
      // Pegamos o campo 'escola' do firebase. Se não existir, tentamos 'nome'.
      const nomeRealDaEscola = data.escola || data.nome || 'Escola sem nome';
      
      avaliacoes.push({
        id: doc.id,
        escola: nomeRealDaEscola, // Criamos a propriedade 'escola' explicitamente
        nome: nomeRealDaEscola,   // Mantemos 'nome' para compatibilidade
        lat: parseFloat(data.lat) || 0,
        lng: parseFloat(data.lng) || 0,
        classe: data.classe || data.status || 'não avaliada', // Adicionado fallback para 'status'
        pontuacao: parseInt(data.pontuacao) || 0,
        createdAt: createdAt,
        metadata: data.metadata || {}
      });
    });
    
    console.log(`✅ ${avaliacoes.length} avaliações carregadas.`);
    return avaliacoes;
    
  } catch (error) {
    console.error('❌ Erro ao buscar avaliações:', error);
    return [];
  }
},

      // Verificar se há dados
      if (avaliacoes.length > 0) {
        console.log('📊 Exemplo de avaliação:', avaliacoes[0]);
      }
      
      return avaliacoes;
      
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error.message || error);
      
      // Mostrar erro específico de permissão
      if (error.code === 'permission-denied') {
        console.error('🔒 Permissão negada. Verifique as regras do Firestore:');
        console.error('1. Acesse https://console.firebase.google.com/');
        console.error('2. Vá para Firestore Database > Regras');
        console.error('3. Use regras temporárias para teste:');
        console.error(`
          rules_version = '2';
          service cloud.firestore {
            match /databases/{database}/documents {
              match /{document=**} {
                allow read, write: if true;
              }
            }
          }
        `);
      }
      
      return [];
    }
  },
  
  // Testar conexão
  async testarConexao() {
    try {
      if (!db) return false;
      
      // Tentar uma consulta simples
      const snapshot = await db.collection('avaliacoes').limit(1).get();
      console.log('✅ Conexão com Firebase OK');
      return true;
    } catch (error) {
      console.error('❌ Falha na conexão Firebase:', error.message);
      return false;
    }
  },
  
  // Obter estatísticas
  async getEstatisticas() {
    const avaliacoes = await this.buscarTodasAvaliacoes();
    return {
      total: avaliacoes.length,
      porClasse: avaliacoes.reduce((acc, av) => {
        acc[av.classe] = (acc[av.classe] || 0) + 1;
        return acc;
      }, {})
    };
  }
};

// Exportar para uso global
window.firebaseManager = FirebaseManager;
window.firebaseDb = db;
window.PESOS_CLASSE = PESOS_CLASSE;
window.firebaseApp = firebaseApp;

console.log('🔥 Firebase v8 configurado para análise espacial');