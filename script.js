// Elementos del DOM del Reproductor General
const audio = document.getElementById('audio');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerFavBtn = document.getElementById('player-fav-btn');

// Elementos del DOM del Buscador
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Elementos de Navegación de Vistas
const viewHome = document.getElementById('view-home');
const viewArtist = document.getElementById('view-artist');
const viewLibrary = document.getElementById('view-library');
const logoHome = document.getElementById('logo-home');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const backToHomeBtn2 = document.getElementById('back-to-home-btn-2');
const viewFavoritesBtn = document.getElementById('view-favorites-btn');
const sidebarLibraryBtn = document.getElementById('sidebar-library-btn');

// Elementos de la vista del Artista
const artistProfileName = document.getElementById('artist-profile-name');
const artistSongsList = document.getElementById('artist-songs-list');

// Elementos de la biblioteca
const librarySongsList = document.getElementById('library-songs-list');
const favCountEl = document.getElementById('fav-count');

// Lista maestra de canciones (.jfif)
const canciones = [
    { id: 0, titulo: "Morir de Amor - Miguel Bosé", audioUrl: "assets/canciones/cancion1.mp3", portadaUrl: "assets/imagenes/portada1.jfif" },
    { id: 1, titulo: "Sé Que Te Amaré - Leo Dan", audioUrl: "assets/canciones/cancion2.mp3", portadaUrl: "assets/imagenes/portada2.jfif" },
    { id: 2, titulo: "Te He Prometido - Leo Dan", audioUrl: "assets/canciones/cancion3.mp3", portadaUrl: "assets/imagenes/portada3.jfif" },
    { id: 3, titulo: "Hasta Que Amanezca - Joan Sebastian", audioUrl: "assets/canciones/cancion4.mp3", portadaUrl: "assets/imagenes/portada4.jfif" },
    { id: 4, titulo: "Te Lo Pido de Rodillas - Los Iracundos", audioUrl: "assets/canciones/cancion5.mp3", portadaUrl: "assets/imagenes/portada5.jfif" },
    { id: 5, titulo: "Yo Esperaré Tu Cambiarás - Darwin del Ecuador", audioUrl: "assets/canciones/cancion6.mp3", portadaUrl: "assets/imagenes/portada6.jfif" },
    { id: 6, titulo: "¿Qué pasará mañana? - José Luis Perales", audioUrl: "assets/canciones/cancion7.mp3", portadaUrl: "assets/imagenes/portada7.jfif" },
    { id: 7, titulo: "Porque Te Vas - Jeanette", audioUrl: "assets/canciones/cancion8.mp3", portadaUrl: "assets/imagenes/portada8.jfif" }
];

let cancionActualIndex = 0;
let isPlaying = false;
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

// FUNCIÓN PARA CAMBIAR ENTRE PÁGINAS / VISTAS
function cambiarVista(vistaActiva) {
    viewHome.style.display = 'none';
    viewArtist.style.display = 'none';
    viewLibrary.style.display = 'none';
    vistaActiva.style.display = 'block';
}

// Eventos de botones para volver al Inicio
logoHome.addEventListener('click', () => cambiarVista(viewHome));
backToHomeBtn.addEventListener('click', () => cambiarVista(viewHome));
backToHomeBtn2.addEventListener('click', () => cambiarVista(viewHome));

// GESTIÓN DE FAVORITOS (LOCALSTORAGE)
function actualizarBotonesCorazon() {
    const cancionActual = canciones[cancionActualIndex];
    const esFavorito = favoritos.includes(cancionActual.id);
    
    playerFavBtn.textContent = esFavorito ? '❤️' : '♡';
    document.getElementById('modal-fav-btn').textContent = esFavorito ? '❤️' : '♡';
}

function alternarFavorito(id) {
    if (favoritos.includes(id)) {
        favoritos = favoritos.filter(favId => favId !== id);
    } else {
        favoritos.push(id);
    }
    localStorage.setItem('vibeo_favs', JSON.stringify(favoritos));
    actualizarBotonesCorazon();
    renderizarBiblioteca();
}

playerFavBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    alternarFavorito(canciones[cancionActualIndex].id);
});

// CARGAR CANCIÓN EN EL REPRODUCTOR
function cargarCancion(cancion) {
    trackTitle.textContent = cancion.titulo;
    audio.src = cancion.audioUrl;
    cover.src = cancion.portadaUrl;
    actualizarBotonesCorazon();
}

function playSong() {
    isPlaying = true;
    playBtn.textContent = '⏸ Pausar';
    audio.play();
    if (playerModal.style.display === 'flex') {
        modalPlayBtn.textContent = '⏸ Pausar';
    }
}

function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶ Reproducir';
    audio.pause();
    if (playerModal.style.display === 'flex') {
        modalPlayBtn.textContent = '▶ Reproducir';
    }
}

playBtn.addEventListener('click', () => {
    if (isPlaying) pauseSong(); else playSong();
});

function siguienteCancion() {
    cancionActualIndex = (cancionActualIndex + 1) % canciones.length;
    cargarCancion(canciones[cancionActualIndex]);
    playSong();
}

function anteriorCancion() {
    cancionActualIndex = (cancionActualIndex - 1 + canciones.length) % canciones.length;
    cargarCancion(canciones[cancionActualIndex]);
    playSong();
}

nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);

// Progreso de tiempo
audio.addEventListener('timeupdate', (e) => {
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
});

progressBar.addEventListener('input', () => {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
});

audio.addEventListener('ended', siguienteCancion);

// BUSCADOR PREDICTIVO
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

            item.addEventListener('click', () => {
                cancionActualIndex = cancion.id;
                cargarCancion(cancion);
                playSong();
                document.querySelector('.player-container').style.display = 'flex';
                searchInput.value = '';
                searchResults.style.display = 'none';
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

// NAVEGACIÓN A SECCIÓN DE ARTISTAS AL DAR CLIC A SU IMAGEN
document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
        const nombreArtista = card.getAttribute('data-artista');
        artistProfileName.textContent = nombreArtista;
        
        // Filtrar pistas que contengan el nombre del artista seleccionado
        const cancionesDelArtista = canciones.filter(c => c.titulo.toLowerCase().includes(nombreArtista.toLowerCase()));
        
        artistSongsList.innerHTML = '';
        
        if(cancionesDelArtista.length === 0) {
            artistSongsList.innerHTML = '<p style="color:#b3b3b3; padding:10px;">No hay canciones locales añadidas para este artista aún.</p>';
        } else {
            cancionesDelArtista.forEach((cancion, index) => {
                const fila = document.createElement('div');
                fila.classList.add('song-row-item');
                fila.innerHTML = `
                    <div class="song-left-part">
                        <span class="track-number">${index + 1}</span>
                        <img src="${cancion.portadaUrl}" class="mini-row-cover">
                        <span class="track-name-text">${cancion.titulo}</span>
                    </div>
                    <span class="play-row-icon">▶</span>
                `;
                
                fila.addEventListener('click', () => {
                    cancionActualIndex = cancion.id;
                    cargarCancion(cancion);
                    playSong();
                    document.querySelector('.player-container').style.display = 'flex';
                });
                
                artistSongsList.appendChild(fila);
            });
        }
        
        cambiarVista(viewArtist);
    });
});

// SISTEMA DE RENDERIZADO DE LA BIBLIOTECA (FAVORITOS)
function renderizarBiblioteca() {
    librarySongsList.innerHTML = '';
    favCountEl.textContent = `${favoritos.length} canciones guardadas`;

    if (favoritos.length === 0) {
        librarySongsList.innerHTML = '<p style="color:#b3b3b3; padding:20px 10px;">Aún no tienes canciones favoritas. ¡Haz clic en el corazón de cualquier tema!</p>';
        return;
    }

    favoritos.forEach((idFav, index) => {
        const cancion = canciones.find(c => c.id === idFav);
        if (cancion) {
            const fila = document.createElement('div');
            fila.classList.add('song-row-item');
            fila.innerHTML = `
                <div class="song-left-part">
                    <span class="track-number">${index + 1}</span>
                    <img src="${cancion.portadaUrl}" class="mini-row-cover">
                    <span class="track-name-text">${cancion.titulo}</span>
                </div>
                <button class="remove-fav-btn" data-id="${cancion.id}">❤️</button>
            `;

            // Clic en la fila para reproducir la canción favorita
            fila.addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-fav-btn')) return;
                cancionActualIndex = cancion.id;
                cargarCancion(cancion);
                playSong();
                document.querySelector('.player-container').style.display = 'flex';
            });

            // Eliminar de favoritos directo desde la lista de la biblioteca
            fila.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                alternarFavorito(cancion.id);
            });

            librarySongsList.appendChild(fila);
        }
    });
}

// Abrir la biblioteca con los botones laterales
viewFavoritesBtn.addEventListener('click', () => { renderizarBiblioteca(); cambiarVista(viewLibrary); });
sidebarLibraryBtn.addEventListener('click', () => { renderizarBiblioteca(); cambiarVista(viewLibrary); });

// =======================================================================
// MODAL EXPANDIDO (CON SOPORTE PARA CORAZÓN)
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
const modalFavBtn = document.getElementById('modal-fav-btn');

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
    actualizarBotonesCorazon();
}

openModalBtn.addEventListener('click', () => {
    sincronizarDatosModal();
    playerModal.style.display = 'flex';
    modalPlayBtn.textContent = isPlaying ? '⏸ Pausar' : '▶ Reproducir';
});

closeModalBtn.addEventListener('click', () => { playerModal.style.display = 'none'; });
modalPlayBtn.addEventListener('click', () => { if (isPlaying) pauseSong(); else playSong(); });
modalNextBtn.addEventListener('click', () => { siguienteCancion(); sincronizarDatosModal(); });
modalPrevBtn.addEventListener('click', () => { anteriorCancion(); sincronizarDatosModal(); });

modalFavBtn.addEventListener('click', () => {
    alternarFavorito(canciones[cancionActualIndex].id);
});

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