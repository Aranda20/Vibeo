// =====================================================
// CONFIGURACIÓN DE VIBEO
// El reproductor de YouTube NO necesita clave. Solo la búsqueda
// de "qué video corresponde a esta canción". Se prueba en orden:
//   1) VIDEOS_FIJOS  (tú eliges el video, 100% estable, sin clave)
//   2) Caché del navegador
//   3) API_KEY de YouTube (opcional, la más estable de las búsquedas)
//   4) Instancias públicas Piped / Invidious (sin clave, pero pueden caerse)
// =====================================================
const CONFIG = {
    // Opcional. Déjala vacía ("") si no quieres usar clave.
    API_KEY: "",

    // Videos que tú eliges. Clave: "titulo|artista" en minúsculas.
    // Valor: ID del video (lo que va después de "v=" en la URL de YouTube).
    // Puedes poner una lista de IDs de respaldo: ["ID1", "ID2"]
    VIDEOS_FIJOS: {
        // "addicted|maluma": "AQUI_EL_ID_DEL_VIDEO",
    },

    // Búsqueda sin clave (solo se usa para obtener el ID del video;
    // el audio siempre suena con el reproductor oficial de YouTube).
    // Son servidores comunitarios: si alguno se cae, se prueba el siguiente.
    INSTANCIAS_PIPED: [
        "https://pipedapi.kavin.rocks",
        "https://pipedapi.adminforge.de"
    ],
    INSTANCIAS_INVIDIOUS: [
        "https://inv.nadeko.net",
        "https://yewtu.be"
    ]
};
