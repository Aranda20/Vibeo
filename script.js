// Catálogo inicial predeterminado
let playlistActual = [
    { id: 1, titulo: "Morir de Amor", artista: "Miguel Bosé", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/9e/72/7e/9e727e57-1941-831b-7a87-211181881cf4/mza_11707923485773641775.plus.aac.p.m4a", portadaUrl: "assets/imagenes/portada1.jfif" },
    { id: 2, titulo: "Te He Prometido", artista: "Leo Dan", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/e2/2e/0f/e22e0f31-7b06-e784-2a07-8e62d499380f/mza_1033481236531988849.plus.aac.p.m4a", portadaUrl: "assets/imagenes/portada3.jfif" },
    { id: 3, titulo: "Hasta Que Amanezca", artista: "Joan Sebastian", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/4a/07/8a/4a078a17-38d5-1718-2c49-05d0e2e9cb0c/mza_13401768472918899532.plus.aac.p.m4a", portadaUrl: "assets/imagenes/portada4.jfif" },
    { id: 4, titulo: "Te Lo Pido de Rodillas", artista: "Los Iracundos", previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a5/cb/a1/a5cba1d0-14e9-122e-13c2-5d9c79ae6b01/mza_11867140417865917457.plus.aac.p.m4a", portadaUrl: "assets/imagenes/portada5.jfif" }
];

let indiceActual = 0;
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

// Elementos del DOM
const audioElement = document.getElementById('audio-element');
const playBtn = document.getElementById('play-btn');
const modalPlayBtn = document.getElementById('modal-play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const modalPrevBtn = document.getElementById('modal-prev-btn');
const modalNextBtn = document.getElementById('modal-next-btn');

const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
const progressBar = document.getElementById('progress-bar');
const modalProgressBar = document.getElementById('modal-progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const modalCurrentTime = document.getElementById('modal-current-time');
const modalDuration = document.getElementById('modal-duration');
const playerFavBtn = document.getElementById('player-fav-btn');
const modalFavBtn = document.getElementById('modal-fav-btn');

const searchInputMobile = document.getElementById('search-input-mobile');
const searchResultsMobile = document.getElementById('search-results-mobile');

const viewHome = document.getElementById('view-home');
const viewSearchMobile = document.getElementById('view-search-mobile');
const viewArtist = document.getElementById('view-artist');
const viewLibrary = document.getElementById('view-library');

const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navLibrary = document.getElementById('nav-library');
const navItems = document.querySelectorAll('.nav-item');

const artistProfileName = document.getElementById('artist-profile-name');
const artistSongsList = document.getElementById('artist-songs-list');
const librarySongsList = document.getElementById('library-songs-list');
const favCountEl = document.getElementById('fav-count');

// Navegación de vistas
function cambiarVista(vistaActiva) {
    viewHome.style.display = 'none';
    viewSearchMobile.style.display = 'none';
    viewArtist.style.display = 'none';
    viewLibrary.style.display = 'none';
    vistaActiva.style.display = 'block';
}

function resetActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

navHome.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
navSearch.addEventListener('click', () => { resetActiveNav(navSearch); cambiarVista(viewSearchMobile); });
navLibrary.addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });

document.getElementById('logo-home').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('back-to-home-btn').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('back-to-home-btn-2').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('view-favorites-btn').addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });
document.getElementById('sidebar-library-btn').addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });

// Cargar y reproducir pista
function cargarCancion(cancion) {
    if (!cancion) return;
    trackTitle.textContent = `${cancion.titulo} - ${cancion.artista}`;
    cover.src = cancion.portadaUrl;
    document.getElementById('modal-cover').src = cancion.portadaUrl;
    document.getElementById('modal-track-title').textContent = cancion.titulo;
    document.getElementById('modal-track-artist').textContent = cancion.artista;
    
    audioElement.src = cancion.previewUrl;
    audioElement.load();
    actualizarCorazonEstado();
}

function alternarReproduccion() {
    if (audioElement.paused) {
        audioElement.play().then(() => {
            playBtn.textContent = '⏸';
            if (modalPlayBtn) modalPlayBtn.textContent = '⏸';
        }).catch(err => console.log("Reproducción pausada por política del navegador", err));
    } else {
        audioElement.pause();
        playBtn.textContent = '▶';
        if (modalPlayBtn) modalPlayBtn.textContent = '▶';
    }
}

playBtn.addEventListener('click', alternarReproduccion);
if (modalPlayBtn) modalPlayBtn.addEventListener('click', alternarReproduccion);

nextBtn.addEventListener('click', siguienteCancion);
modalNextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);
modalPrevBtn.addEventListener('click', anteriorCancion);

function siguienteCancion() {
    indiceActual = (indiceActual + 1) % playlistActual.length;
    cargarCancion(playlistActual[indiceActual]);
    audioElement.play();
    playBtn.textContent = '⏸';
}

function anteriorCancion() {
    indiceActual = (indiceActual - 1 + playlistActual.length) % playlistActual.length;
    cargarCancion(playlistActual[indiceActual]);
    audioElement.play();
    playBtn.textContent = '⏸';
}

audioElement.addEventListener('ended', siguienteCancion);

// Sincronizar barra de progreso
audioElement.addEventListener('timeupdate', () => {
    if (audioElement.duration) {
        const progreso = (audioElement.currentTime / audioElement.duration) * 100;
        progressBar.value = progreso;
        if (modalProgressBar) modalProgressBar.value = progreso;

        currentTimeEl.textContent = formatearTiempo(audioElement.currentTime);
        durationEl.textContent = formatearTiempo(audioElement.duration);
        if (modalCurrentTime) modalCurrentTime.textContent = currentTimeEl.textContent;
        if (modalDuration) modalDuration.textContent = durationEl.textContent;
    }
});

progressBar.addEventListener('input', () => {
    if (audioElement.duration) {
        audioElement.currentTime = (progressBar.value / 100) * audioElement.duration;
    }
});

if (modalProgressBar) {
    modalProgressBar.addEventListener('input', () => {
        if (audioElement.duration) {
            audioElement.currentTime = (modalProgressBar.value / 100) * audioElement.duration;
        }
    });
}

function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

// BUSCADOR GLOBAL EN TIEMPO REAL (Conecta con la base de datos mundial de música)
let timeoutBusqueda = null;
searchInputMobile.addEventListener('input', (e) => {
    clearTimeout(timeoutBusqueda);
    const query = e.target.value.trim();
    
    if (query.length === 0) {
        searchResultsMobile.innerHTML = '<p class="search-placeholder-text">¿Qué te apetece escuchar hoy?</p>';
        return;
    }

    searchResultsMobile.innerHTML = '<p class="search-placeholder-text">Buscando en el catálogo mundial...</p>';

    timeoutBusqueda = setTimeout(() => {
        // Consulta directa a la API pública de Apple Music / iTunes Search para obtener cualquier canción del mundo
        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`)
            .then(res => res.json())
            .then(data => {
                searchResultsMobile.innerHTML = '';
                
                if (data.results && data.results.length > 0) {
                    const contenedorResultados = document.createElement('div');
                    contenedorResultados.classList.add('songs-list-container');

                    data.results.forEach((item, index) => {
                        const cancionObj = {
                            id: item.trackId,
                            titulo: item.trackName,
                            artista: item.artistName,
                            previewUrl: item.previewUrl,
                            portadaUrl: item.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg') // Imagen en alta calidad
                        };

                        const fila = document.createElement('div');
                        fila.classList.add('song-row-item');
                        fila.innerHTML = `
                            <div class="song-left-part">
                                <span class="track-number">${index + 1}</span>
                                <img src="${cancionObj.portadaUrl}" class="mini-row-cover">
                                <div>
                                    <div class="track-name-text" style="font-weight:bold;">${cancionObj.titulo}</div>
                                    <div style="font-size:0.8rem; color:#b3b3b3;">${cancionObj.artista}</div>
                                </div>
                            </div>
                            <span class="play-row-icon">▶</span>
                        `;

                        fila.addEventListener('click', () => {
                            playlistActual.unshift(cancionObj); // Agrega la canción al principio de la lista
                            indiceActual = 0;
                            cargarCancion(cancionObj);
                            audioElement.play();
                            playBtn.textContent = '⏸';
                            document.querySelector('.player-container').style.display = 'flex';
                        });

                        contenedorResultados.appendChild(fila);
                    });

                    searchResultsMobile.appendChild(contenedorResultados);
                } else {
                    searchResultsMobile.innerHTML = '<p class="search-placeholder-text">No se encontraron resultados para tu búsqueda.</p>';
                }
            })
            .catch(() => {
                searchResultsMobile.innerHTML = '<p class="search-placeholder-text">Error de conexión al buscar.</p>';
            });
    }, 400);
});

// Artistas Populares en Inicio
document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
        const nombreArtista = card.getAttribute('data-artista');
        artistProfileName.textContent = nombreArtista;
        artistSongsList.innerHTML = '<p style="color:#b3b3b3; padding:10px;">Cargando canciones de ' + nombreArtista + '...</p>';
        cambiarVista(viewArtist);

        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nombreArtista)}&media=music&entity=song&limit=10`)
            .then(res => res.json())
            .then(data => {
                artistSongsList.innerHTML = '';
                if(data.results) {
                    data.results.forEach((item, index) => {
                        const cancionObj = {
                            id: item.trackId,
                            titulo: item.trackName,
                            artista: item.artistName,
                            previewUrl: item.previewUrl,
                            portadaUrl: item.artworkUrl100.replace('100x100bb.jpg', '400x400bb.jpg')
                        };

                        const fila = document.createElement('div');
                        fila.classList.add('song-row-item');
                        fila.innerHTML = `
                            <div class="song-left-part">
                                <span class="track-number">${index + 1}</span>
                                <img src="${cancionObj.portadaUrl}" class="mini-row-cover">
                                <div>
                                    <div class="track-name-text" style="font-weight:bold;">${cancionObj.titulo}</div>
                                    <div style="font-size:0.8rem; color:#b3b3b3;">${cancionObj.artista}</div>
                                </div>
                            </div>
                            <span class="play-row-icon">▶</span>
                        `;
                        fila.addEventListener('click', () => {
                            playlistActual.unshift(cancionObj);
                            indiceActual = 0;
                            cargarCancion(cancionObj);
                            audioElement.play();
                            playBtn.textContent = '⏸';
                            document.querySelector('.player-container').style.display = 'flex';
                        });
                        artistSongsList.appendChild(fila);
                    });
                }
            });
    });
});

// Sistema de Favoritos
function actualizarCorazonEstado() {
    const cancion = playlistActual[indiceActual];
    if (!cancion) return;
    const esFav = favoritos.some(f => f.id === cancion.id);
    playerFavBtn.textContent = esFav ? '❤️' : '♡';
    if (modalFavBtn) modalFavBtn.textContent = esFav ? '❤️' : '♡';
}

function alternarFavoritoActual() {
    const cancion = playlistActual[indiceActual];
    if (!cancion) return;
    const idx = favoritos.findIndex(f => f.id === cancion.id);
    if (idx >= 0) {
        favoritos.splice(idx, 1);
    } else {
        favoritos.push(cancion);
    }
    localStorage.setItem('vibeo_favs', JSON.stringify(favoritos));
    actualizarCorazonEstado();
}

playerFavBtn.addEventListener('click', alternarFavoritoActual);
if (modalFavBtn) modalFavBtn.addEventListener('click', alternarFavoritoActual);

function renderizarBiblioteca() {
    librarySongsList.innerHTML = '';
    favCountEl.textContent = `${favoritos.length} canciones guardadas`;

    if (favoritos.length === 0) {
        librarySongsList.innerHTML = '<p style="color:#b3b3b3; padding:20px 10px;">Aún no tienes canciones favoritas.</p>';
        return;
    }

    favoritos.forEach((cancion, index) => {
        const fila = document.createElement('div');
        fila.classList.add('song-row-item');
        fila.innerHTML = `
            <div class="song-left-part">
                <span class="track-number">${index + 1}</span>
                <img src="${cancion.portadaUrl}" class="mini-row-cover">
                <div>
                    <div class="track-name-text" style="font-weight:bold;">${cancion.titulo}</div>
                    <div style="font-size:0.8rem; color:#b3b3b3;">${cancion.artista}</div>
                </div>
            </div>
            <button class="remove-fav-btn" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">❤️</button>
        `;

        fila.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-fav-btn')) {
                favoritos = favoritos.filter(f => f.id !== cancion.id);
                localStorage.setItem('vibeo_favs', JSON.stringify(favoritos));
                renderizarBiblioteca();
                actualizarCorazonEstado();
                return;
            }
            playlistActual.unshift(cancion);
            indiceActual = 0;
            cargarCancion(cancion);
            audioElement.play();
            playBtn.textContent = '⏸';
            document.querySelector('.player-container').style.display = 'flex';
        });
        librarySongsList.appendChild(fila);
    });
}

// Control del Modal
const playerModal = document.getElementById('player-modal');
document.getElementById('open-modal-btn').addEventListener('click', () => { playerModal.style.display = 'flex'; });
document.getElementById('close-modal-btn').addEventListener('click', () => { playerModal.style.display = 'none'; });

