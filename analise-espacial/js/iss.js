/* =========================
   ISS — Firebase
========================= */

import { collection, getDocs } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase.js";

export async function calcularISSFirebase() {
    const snapshot = await getDocs(collection(db, "avaliacoes"));

    const porEscola = {};

    snapshot.forEach(doc => {
        const d = doc.data();
        if (!d.escola || typeof d.pontuacao !== "number") return;

        if (!porEscola[d.escola]) {
            porEscola[d.escola] = [];
        }

        porEscola[d.escola].push(d.pontuacao);
    });

    const resultado = {};

    for (const escola in porEscola) {
        const mediaPontuacao =
            porEscola[escola].reduce((a, b) => a + b, 0) /
            porEscola[escola].length;

        resultado[escola] = {
            iss: mediaPontuacao,
            amostras: porEscola[escola].length
        };
    }

    return resultado;
}
