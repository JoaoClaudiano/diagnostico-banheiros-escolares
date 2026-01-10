/* =========================
   IUI — Firebase
========================= */

import { collection, getDocs } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase.js";

export async function calcularIUIFirebase() {
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

        const rt =
            avals.reduce((s, a) => s + (a.rt || 0), 0) / avals.length;

        const iui = mediaPontuacao * (1 + rt);

        resultado[escola] = {
            iui,
            prioridade:
                iui >= 8 ? "alta" :
                iui >= 5 ? "media" : "baixa",
            lat: avals[0].lat,
            lng: avals[0].lng
        };
    }

    return resultado;
}
