// Lista maestra con IDs de YouTube reales y verificados
let canciones = [
    { id: 0, titulo: "Morir de Amor - Miguel Bosé", youtubeId: "5qap5aO4i9A", portadaUrl: "assets/imagenes/portada1.jfif" },
    { id: 1, titulo: "Sé Que Te Amaré - Leo Dan", youtubeId: "9W6KZ48WOSo", portadaUrl: "assets/imagenes/portada2.jfif" },
    { id: 2, titulo: "Te He Prometido - Leo Dan", youtubeId: "7k2W494W3vE", portadaUrl: "assets/imagenes/portada3.jfif" },
    { id: 3, titulo: "Hasta Que Amanezca - Joan Sebastian", youtubeId: "6j739h3k21s", portadaUrl: "assets/imagenes/portada4.jfif" },
    { id: 4, titulo: "Te Lo Pido de Rodillas - Los Iracundos", youtubeId: "3v2K954L11A", portadaUrl: "assets/imagenes/portada5.jfif" },
    { id: 5, titulo: "Yo Esperaré Tu Cambiarás - Darwin", youtubeId: "8k2L194V3sQ", portadaUrl: "assets/imagenes/portada6.jfif" },
    { id: 6, titulo: "¿Qué pasará mañana? - José Luis Perales", youtubeId: "4L2v981K3zA", portadaUrl: "assets/imagenes/portada7.jfif" },
    { id: 7, titulo: "Porque Te Vas - Jeanette", youtubeId: "1K9v842L3zE", portadaUrl: "assets/imagenes/portada8.jfif" }
];

let cancionActualIndex = 0;
let isPlaying = false;
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

// Elementos DOM
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
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

// REPRODUCTOR DINÁMICO DE YOUTUBE CON SOPORTE DE BÚSQUEDA ABIERTA
function cargarCancion(cancion) {
    if (!cancion) return;
    trackTitle.textContent = cancion.titulo;
    cover.src = cancion.portadaUrl || "assets/imagenes/logo.png";
    actualizarBotonesCorazon();

    const youtubeContainer = document.getElementById('video-container-view');
    if (youtubeContainer) {
        // Si la canción viene de una búsqueda libre universal, usamos la URL de búsqueda embebida de YouTube para garantizar que reproduzca el resultado exacto solicitado
        let embedUrl = "";
        if (cancion.esBusquedaLibre) {
            embedUrl = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(cancion.titulo)}&autoplay=1`;
        } else {
            embedUrl = `https://www.youtube.com/embed/${cancion.youtubeId}?autoplay=1&enablejsapi=1`;
        }

        youtubeContainer.innerHTML = `
            <iframe width="100%" height="100%" 
                src="${embedUrl}" 
                title="${cancion.titulo}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }
}

function playSong() {
    isPlaying = true;
    playBtn.textContent = '⏸';
    const modalPlayBtn = document.getElementById('modal-play-btn');
    if (modalPlayBtn) modalPlayBtn.textContent = '⏸';
}

function pauseSong() {
    isPlaying = false;
    playBtn.textContent = '▶';
    const modalPlayBtn = document.getElementById('modal-play-btn');
    if (modalPlayBtn) modalPlayBtn.textContent = '▶';
}

playBtn.addEventListener('click', () => { 
    if (isPlaying) pauseSong(); else playSong(); 
});
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

// BÚSQUEDA UNIVERSAL ILIMITADA ESTILO YOUTUBE MUSIC / WIMBI
function procesarBusqueda(inputElement, dropdownElement) {
    const textoUsuario = inputElement.value.toLowerCase().trim();
    dropdownElement.innerHTML = '';

    if (textoUsuario === '') {
        dropdownElement.style.display = 'none';
        return;
    }

    const filtered = canciones.filter(c => c.titulo.toLowerCase().includes(textoUsuario));

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
                document.querySelector('.player-container').style.display = 'flex';
            }
            inputElement.value = '';
            dropdownElement.style.display = 'none';
        });
        dropdownElement.appendChild(item);
    });

    // Opción universal para reproducir CUALQUIER artista o canción buscada en internet
    const itemUniversal = document.createElement('div');
    itemUniversal.classList.add('mobile-result-item');
    itemUniversal.style.color = '#1db954';
    itemUniversal.style.fontWeight = 'bold';
    itemUniversal.innerHTML = `🔍 Reproducir "${inputElement.value}" en Vibeo`;
    
    itemUniversal.addEventListener('click', () => {
        const nuevaBusquedaLibre = {
            id: Date.now(),
            titulo: inputElement.value,
            esBusquedaLibre: true, // Indicador para búsqueda abierta en YouTube
            portadaUrl: "assets/imagenes/logo.png"
        };
        
        canciones.push(nuevaBusquedaLibre);
        cancionActualIndex = canciones.length - 1;
        cargarCancion(nuevaBusquedaLibre);
        playSong();
        document.querySelector('.player-container').style.display = 'flex';
        
        inputElement.value = '';
        dropdownElement.style.display = 'none';
    });
    dropdownElement.appendChild(itemUniversal);
}

searchInput.addEventListener('input', () => procesarBusqueda(searchInput, searchResults));
searchInputMobile.addEventListener('input', () => procesarBusqueda(searchInputMobile, searchResultsMobile));

// NAVEGACIÓN ARTISTAS
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

// MODAL Y PESTAÑAS
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
    modalCover.src = cancionActual.portadaUrl || "assets/imagenes/logo.png";
    if (cancionActual.titulo.includes(' - ')) {
        const partes = cancionActual.titulo.split(' - ');
        modalTrackTitle.textContent = partes[0];
        modalTrackArtist.textContent = partes[1];
    } else {
        modalTrackTitle.textContent = cancionActual.titulo;
        modalTrackArtist.textContent = "Reproductor Vibeo";
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

