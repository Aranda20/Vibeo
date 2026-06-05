// 1. Elementos obtenidos del HTML
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');

// 2. Lista de reproducción (Playlist)
// Puedes cambiar los títulos y nombres de archivos por los que tú quieras
const canciones = [
    {
        titulo: "Morir de Amor - M. Bosé",
        audioUrl: "assets/canciones/cancion1.mp3",
        portadaUrl: "assets/imagenes/portada1.jfif"
    },
    {
        titulo: "Sé Que Te Amaré",
        audioUrl: "assets/canciones/cancion2.mp3",
        portadaUrl: "assets/imagenes/portada2.jfif"
    },
    {
        titulo: "Te He Prometido",
        audioUrl: "assets/canciones/cancion3.mp3",
        portadaUrl: "assets/imagenes/portada3.jfif"
    }
];

// Control del estado del reproductor
let cancionActualIndex = 0;
let isPlaying = false;

// 3. Función para actualizar visualmente el reproductor
function cargarCancion(cancion) {
    trackTitle.textContent = cancion.titulo;
    audio.src = cancion.audioUrl;
    cover.src = cancion.portadaUrl;
}

// Cargar la primera canción por defecto al abrir la página
cargarCancion(canciones[cancionActualIndex]);

// 4. Funciones de control: Play y Pause
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

// 5. Funciones para navegar en la Playlist
function siguienteCancion() {
    cancionActualIndex++;
    
    // Si pasa de la última canción, regresa a la primera (0)
    if (cancionActualIndex > canciones.length - 1) {
        cancionActualIndex = 0;
    }
    
    cargarCancion(canciones[cancionActualIndex]);
    if (isPlaying) playSong(); // Si ya estaba sonando, reproduce la siguiente de golpe
}

function anteriorCancion() {
    cancionActualIndex--;
    
    // Si retrocede de la primera canción, va a la última de la lista
    if (cancionActualIndex < 0) {
        cancionActualIndex = canciones.length - 1;
    }
    
    cargarCancion(canciones[cancionActualIndex]);
    if (isPlaying) playSong();
}

// 6. Asignación de eventos a los botones
playBtn.addEventListener('click', () => {
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);

// Automático: Cuando la canción termine, saltará sola a la siguiente
audio.addEventListener('ended', siguienteCancion);