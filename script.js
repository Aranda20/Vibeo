let player;
let isPlayerReady = false;
let playlistActual = [];
let indiceActual = 0;
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

function onYouTubeIframeAPIReady() {
    player = new YT.Player('yt-player', {
        height: '1',
        width: '1',
        playerVars: {
            'autoplay': 1,
            'controls': 0,
            'playsinline': 1
        },
        events: {
            'onReady': () => { isPlayerReady = true; },
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.PLAYING) {
        document.getElementById('play-btn').textContent = '⏸';
        const mPlay = document.getElementById('modal-play-btn');
        if (mPlay) mPlay.textContent = '⏸';
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
        document.getElementById('play-btn').textContent = '▶';
        const mPlay = document.getElementById('modal-play-btn');
        if (mPlay) mPlay.textContent = '▶';
        if (event.data === YT.PlayerState.ENDED) {
            siguienteCancion();
        }
    }
}

const playBtn = document.getElementById('play-btn');
const modalPlayBtn = document.getElementById('modal-play-btn');
const nextBtn = document.getElementById('next-btn');
const prevBtn = document.getElementById('prev-btn');
const trackTitle = document.getElementById('track-title');
const cover = document.getElementById('cover');
const progressBar = document.getElementById('progress-bar');
const modalProgressBar = document.getElementById('modal-progress-bar');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playerFavBtn = document.getElementById('player-fav-btn');
const modalFavBtn = document.getElementById('modal-fav-btn');

const searchInputMobile = document.getElementById('search-input-mobile');
const searchInputDesktop = document.getElementById('search-input');
const viewHome = document.getElementById('view-home');
const viewSearchMobile = document.getElementById('view-search-mobile');
const viewSearchResults = document.getElementById('view-search-results');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsTitle = document.getElementById('search-results-title');
const viewArtist = document.getElementById('view-artist');
const viewLibrary = document.getElementById('view-library');

const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navLibrary = document.getElementById('nav-library');
const navItems = document.querySelectorAll('.nav-item');

function cambiarVista(vistaActiva) {
    viewHome.style.display = 'none';
    viewSearchMobile.style.display = 'none';
    viewSearchResults.style.display = 'none';
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
document.getElementById('back-from-search-btn').addEventListener('click', () => { cambiarVista(viewSearchMobile); });
document.getElementById('view-favorites-btn').addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });
document.getElementById('sidebar-library-btn').addEventListener('click', () => { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); });

function cargarYReproducir(cancion) {
    if (!cancion) return;
    
    trackTitle.textContent = `${cancion.titulo} - ${cancion.artista}`;
    cover.src = cancion.portadaUrl;
    document.getElementById('modal-cover').src = cancion.portadaUrl;
    document.getElementById('modal-track-title').textContent = cancion.titulo;
    document.getElementById('modal-track-artist').textContent = cancion.artista;
    
    document.querySelector('.player-container').style.display = 'flex';
    actualizarCorazonEstado();

    const query = `${cancion.titulo} ${cancion.artista} audio`;
    
    // Consulta directa a la API pública para obtener el identificador de transmisión rápida
    fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`)
        .catch(() => {});

    if (isPlayerReady && player && player.loadPlaylist) {
        player.loadPlaylist({
            listType: 'search',
            list: query,
            index: 0
        });
    } else if (isPlayerReady && player && player.cuePlaylist) {
        player.cuePlaylist({
            listType: 'search',
            list: query,
            index: 0
        });
        player.playVideo();
    }
}

function alternarReproduccion() {
    if (!isPlayerReady || !player) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
}

playBtn.addEventListener('click', alternarReproduccion);
if (modalPlayBtn) modalPlayBtn.addEventListener('click', alternarReproduccion);
nextBtn.addEventListener('click', siguienteCancion);
prevBtn.addEventListener('click', anteriorCancion);

function siguienteCancion() {
    if (playlistActual.length === 0) return;
    indiceActual = (indiceActual + 1) % playlistActual.length;
    cargarYReproducir(playlistActual[indiceActual]);
}

function anteriorCancion() {
    if (playlistActual.length === 0) return;
    indiceActual = (indiceActual - 1 + playlistActual.length) % playlistActual.length;
    cargarYReproducir(playlistActual[indiceActual]);
}

setInterval(() => {
    if (isPlayerReady && player && player.getCurrentTime && player.getDuration) {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        if (dur > 0) {
            const prog = (cur / dur) * 100;
            progressBar.value = prog;
            if (modalProgressBar) modalProgressBar.value = prog;
            currentTimeEl.textContent = formatearTiempo(cur);
            durationEl.textContent = formatearTiempo(dur);
            const mCur = document.getElementById('modal-current-time');
            const mDur = document.getElementById('modal-duration');
            if (mCur) mCur.textContent = currentTimeEl.textContent;
            if (mDur) mDur.textContent = durationEl.textContent;
        }
    }
}, 500);

progressBar.addEventListener('input', () => {
    if (isPlayerReady && player && player.getDuration) {
        const target = (progressBar.value / 100) * player.getDuration();
        player.seekTo(target, true);
    }
});

if (modalProgressBar) {
    modalProgressBar.addEventListener('input', () => {
        if (isPlayerReady && player && player.getDuration) {
            const target = (modalProgressBar.value / 100) * player.getDuration();
            player.seekTo(target, true);
        }
    });
}

function formatearTiempo(segundos) {
    const min = Math.floor(segundos / 60);
    const sec = Math.floor(segundos % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

function ejecutarBusqueda(query) {
    if (!query || query.trim().length === 0) return;

    searchResultsTitle.textContent = `Resultados para "${query}"`;
    searchResultsList.innerHTML = '<p style="color:#b3b3b3; padding:20px; text-align:center;">Buscando canciones...</p>';
    cambiarVista(viewSearchResults);

    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`)
        .then(res => res.json())
        .then(data => {
            searchResultsList.innerHTML = '';
            if (data.results && data.results.length > 0) {
                playlistActual = data.results.map(item => ({
                    id: item.trackId,
                    titulo: item.trackName,
                    artista: item.artistName,
                    portadaUrl: item.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg')
                }));

                playlistActual.forEach((cancion, index) => {
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
                        <span class="play-row-icon">▶</span>
                    `;

                    fila.addEventListener('click', () => {
                        indiceActual = index;
                        cargarYReproducir(cancion);
                    });

                    searchResultsList.appendChild(fila);
                });
            } else {
                searchResultsList.innerHTML = '<p style="color:#b3b3b3; padding:20px; text-align:center;">No se encontraron resultados.</p>';
            }
        })
        .catch(() => {
            searchResultsList.innerHTML = '<p style="color:#b3b3b3; padding:20px; text-align:center;">Error al realizar la búsqueda.</p>';
        });
}

searchInputMobile.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        ejecutarBusqueda(searchInputMobile.value);
    }
});

if (searchInputDesktop) {
    searchInputDesktop.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            ejecutarBusqueda(searchInputDesktop.value);
        }
    });
}

document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
        const nombreArtista = card.getAttribute('data-artista');
        document.getElementById('artist-profile-name').textContent = nombreArtista;
        const artistSongsList = document.getElementById('artist-songs-list');
        artistSongsList.innerHTML = '<p style="color:#b3b3b3; padding:10px;">Cargando...</p>';
        cambiarVista(viewArtist);

        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nombreArtista)}&media=music&entity=song&limit=15`)
            .then(res => res.json())
            .then(data => {
                artistSongsList.innerHTML = '';
                if (data.results) {
                    playlistActual = data.results.map(item => ({
                        id: item.trackId,
                        titulo: item.trackName,
                        artista: item.artistName,
                        portadaUrl: item.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg')
                    }));

                    playlistActual.forEach((cancion, index) => {
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
                            <span class="play-row-icon">▶</span>
                        `;
                        fila.addEventListener('click', () => {
                            indiceActual = index;
                            cargarYReproducir(cancion);
                        });
                        artistSongsList.appendChild(fila);
                    });
                }
            });
    });
});

function actualizarCorazonEstado() {
    const cancion = playlistActual[indiceActual];
    if (!cancion) return;
    const esFav = favoritos.some(f => f.titulo === cancion.titulo);
    playerFavBtn.textContent = esFav ? '❤️' : '♡';
    if (modalFavBtn) modalFavBtn.textContent = esFav ? '❤️' : '♡';
}

function alternarFavoritoActual() {
    const cancion = playlistActual[indiceActual];
    if (!cancion) return;
    const idx = favoritos.findIndex(f => f.titulo === cancion.titulo);
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
    document.getElementById('fav-count').textContent = `${favoritos.length} canciones guardadas`;

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
                favoritos = favoritos.filter(f => f.titulo !== cancion.titulo);
                localStorage.setItem('vibeo_favs', JSON.stringify(favoritos));
                renderizarBiblioteca();
                actualizarCorazonEstado();
                return;
            }
            playlistActual = [cancion, ...favoritos];
            indiceActual = 0;
            cargarYReproducir(cancion);
        });
        librarySongsList.appendChild(fila);
    });
}

const playerModal = document.getElementById('player-modal');
document.getElementById('open-modal-btn').addEventListener('click', () => { playerModal.style.display = 'flex'; });
document.getElementById('close-modal-btn').addEventListener('click', () => { playerModal.style.display = 'none'; });

