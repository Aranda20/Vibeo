let player;
let isYoutubeReady = false;

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'playsinline': 1,
            'controls': 1,
            'rel': 0
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    isYoutubeReady = true;
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playBtn.textContent = '⏸';
        if (modalPlayBtn) modalPlayBtn.textContent = '⏸';
    } else if (event.data == YT.PlayerState.PAUSED || event.data == YT.PlayerState.ENDED) {
        isPlaying = false;
        playBtn.textContent = '▶';
        if (modalPlayBtn) modalPlayBtn.textContent = '▶';
        if (event.data == YT.PlayerState.ENDED) {
            siguienteCancion();
        }
    }
}

const canciones = [
    { id: 0, titulo: "Morir de Amor - Miguel Bosé", youtubeId: "h1R6v9K63yY", portadaUrl: "assets/imagenes/portada1.jfif" },
    { id: 1, titulo: "Sé Que Te Amaré - Leo Dan", youtubeId: "X8c9L7G41wM", portadaUrl: "assets/imagenes/portada2.jfif" },
    { id: 2, titulo: "Te He Prometido - Leo Dan", youtubeId: "5b5L8_8k14Q", portadaUrl: "assets/imagenes/portada3.jfif" },
    { id: 3, titulo: "Hasta Que Amanezca - Joan Sebastian", youtubeId: "8x8qZ4L13vE", portadaUrl: "assets/imagenes/portada4.jfif" },
    { id: 4, titulo: "Te Lo Pido de Rodillas - Los Iracundos", youtubeId: "4Z8w1K9f31A", portadaUrl: "assets/imagenes/portada5.jfif" },
    { id: 5, titulo: "Yo Esperaré Tu Cambiarás - Darwin del Ecuador", youtubeId: "9V8x3L21s4Q", portadaUrl: "assets/imagenes/portada6.jfif" },
    { id: 6, titulo: "¿Qué pasará mañana? - José Luis Perales", youtubeId: "2L8v5K91x3A", portadaUrl: "assets/imagenes/portada7.jfif" },
    { id: 7, titulo: "Porque Te Vas - Jeanette", youtubeId: "6K9v1L438zE", portadaUrl: "assets/imagenes/portada8.jfif" }
];

let cancionActualIndex = 0;
let isPlaying = false;
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerFavBtn = document.getElementById('player-fav-btn');

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchInputMobile = document.getElementById('search-input-mobile');
const searchResultsMobile = document.getElementById('search-results-mobile');

const viewHome = document.getElementById('view-home');
const viewSearchMobile = document.getElementById('view-search-mobile');
const viewArtist = document.getElementById('view-artist');
const viewLibrary = document.getElementById('view-library');
const logoHome = document.getElementById('logo-home');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const backToHomeBtn2 = document.getElementById('back-to-home-btn-2');
const viewFavoritesBtn = document.getElementById('view-favorites-btn');
const sidebarLibraryBtn = document.getElementById('sidebar-library-btn');

const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navLibrary = document.getElementById('nav-library');
const navItems = document.querySelectorAll('.nav-item');

const artistProfileName = document.getElementById('artist-profile-name');
const artistSongsList = document.getElementById('artist-songs-list');
const librarySongsList = document.getElementById('library-songs-list');
const favCountEl = document.getElementById('fav-count');

function cambiarVista(vistaActiva) {
    viewHome.style.display = 'none';
    viewSearchMobile.style.display = 'none';
    viewArtist.style.display = 'none';
    viewLibrary.style.display = 'none';
    searchResultsMobile.style.display = 'none';
    searchResults.style.display = 'none';
    vistaActiva.style.display = 'block';
}

function resetActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

navHome.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
navSearch.addEventListener('click', () => { resetActiveNav(navSearch); cambiarVista(viewSearchMobile); });
navLibrary.addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });

logoHome.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
backToHomeBtn.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
backToHomeBtn2.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
viewFavoritesBtn.addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });
sidebarLibraryBtn.addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });

function actualizarBotonesCorazon() {
    const cancionActual = canciones[cancionActualIndex];
    if(!cancionActual) return;
    const esFavorito = favoritos.includes(cancionActual.id);
    playerFavBtn.textContent = esFavorito ? '❤️' : '♡';
    const modalFavBtn = document.getElementById('modal-fav-btn');
    if(modalFavBtn) modalFavBtn.textContent = esFavorito ? '❤️' : '♡';
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

playerFavBtn.addEventListener('click', (e) => { e.stopPropagation(); alternarFavorito(canciones[cancionActualIndex].id); });

function cargarCancion(cancion) {
    if (!cancion) return;
    trackTitle.textContent = cancion.titulo;
    cover.src = cancion.portadaUrl;
    actualizarBotonesCorazon();

    if (isYoutubeReady && player && player.loadVideoById) {
        player.loadVideoById(cancion.youtubeId);
    }
}

function playSong() {
    isPlaying = true;
    playBtn.textContent = '⏸';
    if (isYoutubeReady && player && player.playVideo) {
        player.playVideo();
    }
    const modalPlayBtn = document.getElementById('modal-play-btn');
    if (modalPlayBtn) modalPlayBtn.textContent = '⏸';
}

function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶';
    if (isYoutubeReady && player && player.pauseVideo) {
        player.pauseVideo();
    }
    const modalPlayBtn = document.getElementById('modal-play-btn');
    if (modalPlayBtn) modalPlayBtn.textContent = '▶';
}

playBtn.addEventListener('click', () => { if (isPlaying) pauseSong(); else playSong(); });
nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);

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

setInterval(() => {
    if (isPlaying && isYoutubeReady && player && player.getCurrentTime && player.getDuration) {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        if (duration) {
            progressBar.value = (currentTime / duration) * 100;
            const modalProg = document.getElementById('modal-progress-bar');
            if(modalProg) modalProg.value = progressBar.value;

            let curMin = Math.floor(currentTime / 60);
            let curSec = Math.floor(currentTime % 60);
            if (curSec < 10) curSec = `0${curSec}`;
            currentTimeEl.textContent = `${curMin}:${curSec}`;
            const modCur = document.getElementById('modal-current-time');
            if(modCur) modCur.textContent = currentTimeEl.textContent;

            let durMin = Math.floor(duration / 60);
            let durSec = Math.floor(duration % 60);
            if (durSec < 10) durSec = `0${durSec}`;
            durationEl.textContent = `${durMin}:${durSec}`;
            const modDur = document.getElementById('modal-duration');
            if(modDur) modDur.textContent = durationEl.textContent;
        }
    }
}, 500);

progressBar.addEventListener('input', () => {
    if (isYoutubeReady && player && player.getDuration) {
        const targetTime = (progressBar.value / 100) * player.getDuration();
        player.seekTo(targetTime, true);
    }
});

function procesarBusqueda(inputElement, dropdownElement) {
    const textoUsuario = inputElement.value.toLowerCase().trim();
    dropdownElement.innerHTML = '';

    if (textoUsuario === '') {
        dropdownElement.style.display = 'none';
        return;
    }

    const filtered = canciones.filter(c => c.titulo.toLowerCase().includes(textoUsuario));

    if (filtered.length > 0) {
        dropdownElement.style.display = 'block';
        filtered.forEach(cancion => {
            const item = document.createElement('div');
            item.classList.add('mobile-result-item');
            item.textContent = cancion.titulo;

            item.addEventListener('click', () => {
                const targetIndex = canciones.findIndex(c => c.id === cancion.id);
                if (targetIndex !== -1) {
                    cancionActualIndex = targetIndex;
                    cargarCancion(canciones[cancionActualIndex]);
                    playSong();
                    const containerReproductor = document.querySelector('.player-container');
                    if(containerReproductor) containerReproductor.style.display = 'flex';
                }
                inputElement.value = '';
                dropdownElement.style.display = 'none';
            });
            dropdownElement.appendChild(item);
        });
    } else {
        dropdownElement.style.display = 'block';
        const noResults = document.createElement('div');
        noResults.classList.add('mobile-result-item');
        noResults.style.color = '#b3b3b3';
        noResults.textContent = 'No se encontraron canciones';
        dropdownElement.appendChild(noResults);
    }
}

searchInput.addEventListener('input', () => procesarBusqueda(searchInput, searchResults));
searchInputMobile.addEventListener('input', () => procesarBusqueda(searchInputMobile, searchResultsMobile));

document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
        const nombreArtista = card.getAttribute('data-artista');
        artistProfileName.textContent = nombreArtista;
        const cancionesDelArtista = canciones.filter(c => c.titulo.toLowerCase().includes(nombreArtista.toLowerCase()));
        artistSongsList.innerHTML = '';
        
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
                const targetIndex = canciones.findIndex(c => c.id === cancion.id);
                if (targetIndex !== -1) {
                    cancionActualIndex = targetIndex;
                    cargarCancion(canciones[cancionActualIndex]);
                    playSong();
                    document.querySelector('.player-container').style.display = 'flex';
                }
            });
            artistSongsList.appendChild(fila);
        });
        cambiarVista(viewArtist);
    });
});

function renderizarBiblioteca() {
    librarySongsList.innerHTML = '';
    favCountEl.textContent = `${favoritos.length} canciones guardadas`;

    if (favoritos.length === 0) {
        librarySongsList.innerHTML = '<p style="color:#b3b3b3; padding:20px 10px;">Aún no tienes canciones favoritas.</p>';
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

            fila.addEventListener('click', (e) => {
                if(e.target.classList.contains('remove-fav-btn')) return;
                const targetIndex = canciones.findIndex(c => c.id === cancion.id);
                if (targetIndex !== -1) {
                    cancionActualIndex = targetIndex;
                    cargarCancion(canciones[cancionActualIndex]);
                    playSong();
                    document.querySelector('.player-container').style.display = 'flex';
                }
            });

            fila.querySelector('.remove-fav-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                alternarFavorito(cancion.id);
            });
            librarySongsList.appendChild(fila);
        }
    });
}

const playerModal = document.getElementById('player-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalCover = document.getElementById('modal-cover');
const modalTrackTitle = document.getElementById('modal-track-title');
const modalTrackArtist = document.getElementById('modal-track-artist');
const modalPlayBtn = document.getElementById('modal-play-btn');
const modalFavBtn = document.getElementById('modal-fav-btn');

const tabVideoBtn = document.getElementById('tab-video-btn');
const tabCoverBtn = document.getElementById('tab-cover-btn');
const videoContainerView = document.getElementById('video-container-view');
const coverContainerView = document.getElementById('cover-container-view');

tabVideoBtn.addEventListener('click', () => {
    tabVideoBtn.classList.add('active');
    tabCoverBtn.classList.remove('active');
    videoContainerView.style.display = 'block';
    coverContainerView.style.display = 'none';
});

tabCoverBtn.addEventListener('click', () => {
    tabCoverBtn.classList.add('active');
    tabVideoBtn.classList.remove('active');
    coverContainerView.style.display = 'block';
    videoContainerView.style.display = 'none';
});

function sincronizarDatosModal() {
    const cancionActual = canciones[cancionActualIndex];
    if(!cancionActual) return;
    modalCover.src = cancionActual.portadaUrl;
    if (cancionActual.titulo.includes(' - ')) {
        const partes = cancionActual.titulo.split(' - ');
        modalTrackTitle.textContent = partes[0];
        modalTrackArtist.textContent = partes[1];
    } else {
        modalTrackTitle.textContent = cancionActual.titulo;
        modalTrackArtist.textContent = "Artista Verificado";
    }
    actualizarBotonesCorazon();
}

openModalBtn.addEventListener('click', () => {
    sincronizarDatosModal();
    playerModal.style.display = 'flex';
    if(modalPlayBtn) modalPlayBtn.textContent = isPlaying ? '⏸' : '▶';
});

closeModalBtn.addEventListener('click', () => { playerModal.style.display = 'none'; });
if(modalPlayBtn) {
    modalPlayBtn.addEventListener('click', () => { if (isPlaying) pauseSong(); else playSong(); });
}
document.getElementById('modal-next-btn').addEventListener('click', () => { siguienteCancion(); sincronizarDatosModal(); });
document.getElementById('modal-prev-btn').addEventListener('click', () => { anteriorCancion(); sincronizarDatosModal(); });
modalFavBtn.addEventListener('click', () => { alternarFavorito(canciones[cancionActualIndex].id); });

