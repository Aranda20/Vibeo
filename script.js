// Elementos del DOM del Reproductor
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');

// Elementos del DOM del Buscador
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Playlist Oficial de Vibeo
const canciones = [
    {
        id: 0,
        titulo: "Morir de Amor - M. Bosé",
        audioUrl: "assets/canciones/cancion1.mp3",
        portadaUrl: "assets/imagenes/portada1.jfif"
    },
    {
        id: 1,
        titulo: "Segunda Canción de Vibeo",
        audioUrl: "assets/canciones/cancion2.mp3",
        portadaUrl: "assets/imagenes/portada2.jfif"
    },
    {
        id: 2,
        titulo: "Tercera Canción de Vibeo",
        audioUrl: "assets/canciones/cancion3.mp3",
        portadaUrl: "assets/imagenes/portada3.jfif"
        },
    {
        id: 3,
        titulo: "Hasta Que Amanezca - Joan Sebastian",
        audioUrl: "assets/canciones/cancion4.mp3",
        path: "assets/imagenes/portada4.jfif", // Temporal por consistencia interna
        portadaUrl: "assets/imagenes/portada4.jfif"
    },
    {
        id: 4,
        titulo: "Te Lo Pido de Rodillas - Los Iracundos",
        audioUrl: "assets/canciones/cancion5.mp3",
        portadaUrl: "assets/imagenes/portada5.jfif"
    },
    {
        id: 5,
        titulo: "Yo Esperaré Tu Cambiarás - Darwin del Ecuador",
        audioUrl: "assets/canciones/cancion6.mp3",
        portadaUrl: "assets/imagenes/portada6.jfif"
    },
    {
        id: 6,
        titulo: "¿Qué pasará mañana? - José Luis Perales",
        audioUrl: "assets/canciones/cancion7.mp3",
        portadaUrl: "assets/imagenes/portada7.jfif"
    },
    {
        id: 7,
        titulo: "Porque Te Vas - Jeanette",
        audioUrl: "assets/canciones/cancion8.mp3",
        portadaUrl: "assets/imagenes/portada8.jfif"
    }
    
];

let cancionActualIndex = 0;
let isPlaying = false;

// Cargar información de una canción específica
function cargarCancion(cancion) {
    trackTitle.textContent = cancion.titulo;
    audio.src = cancion.audioUrl;
    cover.src = cancion.portadaUrl;
}

// Inicializar reproductor con la primera pista de la lista
cargarCancion(canciones[cancionActualIndex]);

// Controles Play / Pause
function playSong() {
    isPlaying = true;
    playBtn.textContent = '⏸ Pausar';
    audio.play();
}

function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶ Reproducir';
    audio.pause();
}

// Cambiar de pista
function siguienteCancion() {
    cancionActualIndex++;
    if (cancionActualIndex > canciones.length - 1) {
        cancionActualIndex = 0;
    }
    cargarCancion(canciones[cancionActualIndex]);
    if (isPlaying) playSong();
}

function anteriorCancion() {
    cancionActualIndex--;
    if (cancionActualIndex < 0) {
        cancionActualIndex = canciones.length - 1;
    }
    cargarCancion(canciones[cancionActualIndex]);
    if (isPlaying) playSong();
}

// Sincronizar barra de tiempo transcurrido
function actualizarProgreso(e) {
    const { duration, currentTime } = e.srcElement;
    if (duration) {
        const porcentajeProgreso = (currentTime / duration) * 100;
        progressBar.value = porcentajeProgreso;

        let currentMinutes = Math.floor(currentTime / 60);
        let currentSeconds = Math.floor(currentTime % 60);
        if (currentSeconds < 10) currentSeconds = `0${currentSeconds}`;
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;

        let durationMinutes = Math.floor(duration / 60);
        let durationSeconds = Math.floor(duration % 60);
        if (durationSeconds < 10) durationSeconds = `0${durationSeconds}`;
        durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
    }
}

function fijarProgreso() {
    const anchoTotal = audio.duration;
    audio.currentTime = (progressBar.value / 100) * anchoTotal;
}

// ==========================================
// NUEVA LÓGICA: INTERACTIVIDAD DEL BUSCADOR
// ==========================================
searchInput.addEventListener('input', (e) => {
    const textoBuscado = e.target.value.toLowerCase().trim();

    // Si el campo de texto está vacío, ocultamos la caja flotante y paramos
    if (textoBuscado === '') {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        return;
    }

    // Filtramos las canciones que contengan la palabra escrita
    const cancionesFiltradas = canciones.filter(cancion => 
        cancion.titulo.toLowerCase().includes(textoBuscado)
    );

    // Si hay coincidencias, creamos los elementos visuales
    if (cancionesFiltradas.length > 0) {
        searchResults.innerHTML = ''; // Limpiar resultados anteriores
        searchResults.style.display = 'block'; // Mostrar contenedor flotante

        cancionesFiltradas.forEach(cancion => {
            const item = document.createElement('div');
            item.classList.add('search-result-item');
            
            item.innerHTML = `
                <img src="${cancion.portadaUrl}" alt="Cover">
                <div class="search-result-info">
                    <span class="search-result-title">${cancion.titulo}</span>
                    <span class="search-result-type">Canción</span>
                </div>
            `;

            // EVENTO CLICK: Al tocar el resultado, se reproduce automáticamente
            item.addEventListener('click', () => {
                cancionActualIndex = cancion.id; // Cambiar el índice global
                cargarCancion(cancion); // Cargar datos
                playSong(); // Forzar la reproducción inmediata
                
                // Limpiar buscador y cerrar el menú desplegable
                searchInput.value = '';
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            });

            searchResults.appendChild(item);
        });
    } else {
        // Si escribe pero no encuentra nada relevante
        searchResults.innerHTML = '<div style="padding: 16px; color: #b3b3b3; font-size: 0.9rem;">No se encontraron resultados</div>';
        searchResults.style.display = 'block';
    }
});

// Cerrar el buscador flotante si el usuario hace clic afuera de la barra
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = 'none';
    }
});

// Eventos de interacción
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);
audio.addEventListener('timeupdate', actualizarProgreso);
audio.addEventListener('ended', siguienteCancion);
progressBar.addEventListener('input', fijarProgreso);
// ==========================================
// NUEVA ADICIÓN: COMPORTAMIENTO PANEL MODAL
// ==========================================

// 1. Capturar los nuevos elementos del DOM del modal
const playerModal = document.getElementById('player-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');

const modalCover = document.getElementById('modal-cover');
const modalTrackTitle = document.getElementById('modal-track-title');
const modalTrackArtist = document.getElementById('modal-track-artist');

const modalProgressBar = document.getElementById('modal-progress-bar');
const modalCurrentTimeEl = document.getElementById('modal-current-time');
const modalDurationEl = document.getElementById('modal-duration');
const modalPlayBtn = document.getElementById('modal-play-btn');
const modalPrevBtn = document.getElementById('modal-prev-btn');
const modalNextBtn = document.getElementById('modal-next-btn');

// 2. Función para actualizar los textos y portada dentro del modal (Vista Espejo)
function sincronizarDatosModal() {
    const cancionActual = canciones[cancionActualIndex];
    
    // Separamos el título y el artista si vienen juntos en tu string (ej: "Morir de Amor - M. Bosé")
    if (cancionActual.titulo.includes(' - ')) {
        const partes = cancionActual.titulo.split(' - ');
        modalTrackTitle.textContent = partes[0];
        modalTrackArtist.textContent = partes[1];
    } else {
        modalTrackTitle.textContent = cancionActual.titulo;
        modalTrackArtist.textContent = "Artista";
    }
    
    modalCover.src = cancionActual.portadaUrl;
}

// 3. Eventos para abrir y cerrar la ventana flotante
openModalBtn.addEventListener('click', () => {
    sincronizarDatosModal();
    // Actualizar el estado visual del botón Play del modal inmediatamente
    modalPlayBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
    playerModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    playerModal.style.display = 'none';
});

// 4. Hacer que los botones del modal ejecuten tus funciones originales ya existentes
modalPlayBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
        modalPlayBtn.textContent = '▶ Reproducir';
    } else {
        playSong();
        modalPlayBtn.textContent = '⏸ Pausar';
    }
});

modalNextBtn.addEventListener('click', () => {
    siguienteCancion();       // Llama a tu función original
    sincronizarDatosModal();   // Actualiza los textos del modal
    modalPlayBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
});

modalPrevBtn.addEventListener('click', () => {
    anteriorCancion();        // Llama a tu función original
    sincronizarDatosModal();   // Actualiza los textos del modal
    modalPlayBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
});

// 5. Vincular el avance del tiempo y la barra con el reproductor principal
audio.addEventListener('timeupdate', () => {
    // Si el modal está visible, replicamos los tiempos de tu función actualizarProgreso
    if (playerModal.style.display === 'flex' && audio.duration) {
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        modalProgressBar.value = porcentaje;
        
        modalCurrentTimeEl.textContent = currentTimeEl.textContent;
        modalDurationEl.textContent = durationEl.textContent;
    }
});

// Permitir arrastrar la barra del modal para cambiar el tiempo de la canción
modalProgressBar.addEventListener('input', () => {
    audio.currentTime = (modalProgressBar.value / 100) * audio.duration;
});

// Sincronizar el botón de play del modal si la canción cambia o se pausa desde fuera
audio.addEventListener('play', () => { modalPlayBtn.textContent = '⏸ Pausar'; });
audio.addEventListener('pause', () => { modalPlayBtn.textContent = '▶ Reproducir'; });