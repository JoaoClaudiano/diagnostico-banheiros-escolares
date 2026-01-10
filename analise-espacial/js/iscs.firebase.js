/* =========================
   ISCS — Firebase
========================= */

import { collection, getDocs } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase.js";

const pesoStatus = {
    "Adequado": 0.2,
    "Alerta": 0.6,
    "Critico": 1.0
};

export async function calcularISCSFirebase() {
    const snapshot = await getDocs(collection(db, "avaliacoes"));
    const porEscola = {};

    snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.escola) return;

        if (!porEscola[d.escola]) {
            porEscola[d.escola] = [];
        }

        porEscola[d.escola].push(d);
    });

    const resultado = {};

    for (const escola in porEscola) {
        const avals = porEscola[escola];

        const mediaPontuacao =
            avals.reduce((s, a) => s + (a.pontuacao || 0), 0) / avals.length;

        const impactoStatus =
            avals.reduce((s, a) => s + (pesoStatus[a.status] || 0), 0) /
            avals.length;

        const iscs = (mediaPontuacao / 10) * 0.6 + impactoStatus * 0.4;

        resultado[escola] = {
            iscs,
            statusDominante: avals[0].status,
            lat: avals[0].lat,
            lng: avals[0].lng
        };
    }

    return resultado;
}
