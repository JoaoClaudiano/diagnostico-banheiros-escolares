const DB_NAME = "checkinfra_db";
const DB_VERSION = 1;
const STORE_NAME = "avaliacoes";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true
        });
        store.createIndex("pendente_sync", "pendente_sync", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Erro ao abrir IndexedDB");
  });
}

async function salvarAvaliacaoOffline(dados) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  store.add({
    ...dados,
    data_avaliacao: new Date().toISOString(),
    pendente_sync: true
  });

  return tx.complete;
}
