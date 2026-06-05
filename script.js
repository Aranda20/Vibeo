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

// Playlist Oficial de Vibeo (Actualizada con tus 8 canciones y portadas .jfif)
const canciones = [
    {
        id: 0,
        titulo: "Morir de Amor - Miguel Bosé",
        audioUrl: "assets/canciones/cancion1.mp3",
        portadaUrl: "assets/imagenes/portada1.jfif"
    },
    {
        id: 1,
        titulo: "Sé Que Te Amaré - Leo Dan",
        audioUrl: "assets/canciones/cancion2.mp3",
        portadaUrl: "assets/imagenes/portada2.jfif"
    },
    {
        id: 2,
        titulo: "Te He Prometido - Leo Dan",
        audioUrl: "assets/canciones/cancion3.mp3",
        portadaUrl: "assets/imagenes/portada3.jfif"
    },
    {
        id: 3,
        titulo: "Hasta Que Amanezca - Joan Sebastian",
        audioUrl: "assets/canciones/cancion4.mp3",
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

// Función para cargar los datos de una canción en el reproductor principal
function cargarCancion(cancion) {
    trackTitle.textContent = cancion.titulo;
    audio.src = cancion.audioUrl;
    cover.src = cancion.portadaUrl;
}

// Función para reproducir
function playSong() {
    isPlaying = true;
    playBtn.textContent = '⏸ Pausar';
    audio.play();
    if (playerModal.style.display === 'flex') {
        modalPlayBtn.textContent = '⏸ Pausar';
    }
}

// Función para pausar
function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶ Reproducir';
    audio.pause();
    if (playerModal.style.display === 'flex') {
        modalPlayBtn.textContent = '▶ Reproducir';
    }
}

// Evento del botón de Play/Pausa principal
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// Cambiar a la siguiente canción
function siguienteCancion() {
    cancionActualIndex = (cancionActualIndex + 1) % canciones.length;
    cargarCancion(canciones[cancionActualIndex]);
    playSong();
}

// Cambiar a la canción anterior
function anteriorCancion() {
    cancionActualIndex = (cancionActualIndex - 1 + canciones.length) % canciones.length;
    cargarCancion(canciones[cancionActualIndex]);
    playSong();
}

nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);

// Actualizar barra de progreso y tiempos
function actualizarProgreso(e) {
    const { duration, currentTime } = e.srcElement;
    if (duration) {
        const porcentajeProgreso = (currentTime / duration) * 100;
        progressBar.value = porcentajeProgreso;

        // Calcular minutos y segundos actuales
        let currentMinutes = Math.floor(currentTime / 60);
        let currentSeconds = Math.floor(currentTime % 60);
        if (currentSeconds < 10) currentSeconds = `0${currentSeconds}`;
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;

        // Calcular minutos y segundos totales
        let durationMinutes = Math.floor(duration / 60);
        let durationSeconds = Math.floor(duration % 60);
        if (durationSeconds < 10) durationSeconds = `0${durationSeconds}`;
        durationEl.textContent = `${durationMinutes}:${durationSeconds}`;
    }
}

audio.addEventListener('timeupdate', actualizarProgreso);

// Permitir saltar a cualquier punto de la canción arrastrando la barra
progressBar.addEventListener('input', () => {
    const nuevoTiempo = (progressBar.value / 100) * audio.duration;
    audio.currentTime = nuevoTiempo;
});

// Al terminar una canción, pasa a la siguiente automáticamente
audio.addEventListener('ended', siguienteCancion);

// LÓGICA INTEGRADAL DEL BUSCADOR PREDICTIVO
searchInput.addEventListener('input', () => {
    const textoUsuario = searchInput.value.toLowerCase().trim();
    searchResults.innerHTML = '';

    if (textoUsuario === '') {
        searchResults.style.display = 'none';
        return;
    }

    const cancionesFiltradas = canciones.filter(cancion => 
        cancion.titulo.toLowerCase().includes(textoUsuario)
    );

    if (cancionesFiltradas.length > 0) {
        searchResults.style.display = 'block';
        cancionesFiltradas.forEach(cancion => {
            const item = document.createElement('div');
            item.classList.add('search-result-item');
            item.textContent = cancion.titulo;

            // Al hacer clic en un resultado del buscador
            item.addEventListener('click', () => {
                cancionActualIndex = cancion.id;
                cargarCancion(cancion);
                playSong();

                // HACE VISIBLE EL REPRODUCTOR AUTOMÁTICAMENTE
                document.querySelector('.player-container').style.display = 'flex';

                // Limpiar buscador y cerrar lista
                searchInput.value = '';
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            });

            searchResults.appendChild(item);
        });
    } else {
        searchResults.style.display = 'block';
        const noResults = document.createElement('div');
        noResults.classList.add('search-result-item');
        noResults.style.color = '#b3b3b3';
        noResults.textContent = 'No se encontraron canciones';
        searchResults.appendChild(noResults);
    }
});

// Cerrar buscador si se hace clic fuera del cuadro
document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== searchResults) {
        searchResults.style.display = 'none';
    }
});

// =======================================================================
// LÓGICA COMPLETA DEL MODAL EXPANDIBLE (VISTA COMPLETA MÓVIL)
// =======================================================================
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

// Función para extraer el artista y separar el título de forma limpia
function sincronizarDatosModal() {
    const cancionActual = canciones[cancionActualIndex];
    modalCover.src = cancionActual.portadaUrl;

    if (cancionActual.titulo.includes(' - ')) {
        const partes = cancionActual.titulo.split(' - ');
        modalTrackTitle.textContent = partes[0];
        modalTrackArtist.textContent = partes[1];
    } else {
        modalTrackTitle.textContent = cancionActual.titulo;
        modalTrackArtist.textContent = "Artista Desconocido";
    }
}

// Abrir Modal
openModalBtn.addEventListener('click', () => {
    sincronizarDatosModal();
    playerModal.style.display = 'flex';
    modalPlayBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
});

// Cerrar Modal
closeModalBtn.addEventListener('click', () => {
    playerModal.style.display = 'none';
});

// Controles dentro del Modal
modalPlayBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

modalNextBtn.addEventListener('click', () => {
    siguienteCancion();
    sincronizarDatosModal();
});

modalPrevBtn.addEventListener('click', () => {
    anteriorCancion();
    sincronizarDatosModal();
});

// Sincronización del tiempo transcurrido en el modal
audio.addEventListener('timeupdate', () => {
    if (playerModal.style.display === 'flex' && audio.duration) {
        const porcentaje = (audio.currentTime / audio.duration) * 100;
        modalProgressBar.value = porcentaje;
        modalCurrentTimeEl.textContent = currentTimeEl.textContent;
        modalDurationEl.textContent = durationEl.textContent;
    }
});

modalProgressBar.addEventListener('input', () => {
    audio.currentTime = (modalProgressBar.value / 100) * audio.duration;
});

audio.addEventListener('play', () => { modalPlayBtn.textContent = '⏸ Pausar'; });
audio.addEventListener('pause', () => { modalPlayBtn.textContent = '▶ Reproducir'; });