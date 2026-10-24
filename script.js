let playlistActual = [];
let favoritos = JSON.parse(localStorage.getItem('vibeo_favs')) || [];

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

function abrirReproductor(cancion) {
    if (!cancion) return;
    const url = `reproductor.html?titulo=${encodeURIComponent(cancion.titulo)}&artista=${encodeURIComponent(cancion.artista)}&portada=${encodeURIComponent(cancion.portadaUrl)}`;
    window.location.href = url;
}

document.getElementById('open-modal-btn').addEventListener('click', () => {
    if (playlistActual.length > 0) {
        abrirReproductor(playlistActual[0]);
    }
});

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
                        document.getElementById('track-title').textContent = `${cancion.titulo} - ${cancion.artista}`;
                        document.getElementById('cover').src = cancion.portadaUrl;
                        document.querySelector('.player-container').style.display = 'flex';
                        abrirReproductor(cancion);
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
                            abrirReproductor(cancion);
                        });
                        artistSongsList.appendChild(fila);
                    });
                }
            });
    });
});

function renderizarBiblioteca() {
    librarySongsList.innerHTML = '';
    document.getElementById('fav-count').textContent = `${favoritos.length} canciones guardadas`;
}

