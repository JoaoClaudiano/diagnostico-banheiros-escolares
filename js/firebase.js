import { initializeApp } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🌐 FUNÇÃO GLOBAL
window.salvarAvaliacao = async function (dados) {
  await setDoc(
    doc(db, "avaliacoes", dados.id),
    {
      ...dados,
      createdAt: serverTimestamp()
    }
  );
};
