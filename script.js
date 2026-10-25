let playlistActual = [];

const searchInputMobile = document.getElementById('search-input-mobile');
const searchInputDesktop = document.getElementById('search-input');
const viewHome = document.getElementById('view-home');
const viewSearchMobile = document.getElementById('view-search-mobile');
const viewSearchResults = document.getElementById('view-search-results');
const searchResultsList = document.getElementById('search-results-list');
const searchResultsTitle = document.getElementById('search-results-title');
const viewArtist = document.getElementById('view-artist');
const viewLibrary = document.getElementById('view-library');
const librarySongsList = document.getElementById('library-songs-list');

const navHome = document.getElementById('nav-home');
const navSearch = document.getElementById('nav-search');
const navLibrary = document.getElementById('nav-library');
const navItems = document.querySelectorAll('.nav-item');

function getFavoritos() {
    return JSON.parse(localStorage.getItem('vibeo_favs')) || [];
}

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

function irABiblioteca() {
    resetActiveNav(navLibrary);
    renderizarBiblioteca();
    cambiarVista(viewLibrary);
}

navHome.addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
navSearch.addEventListener('click', () => { resetActiveNav(navSearch); cambiarVista(viewSearchMobile); });
navLibrary.addEventListener('click', irABiblioteca);

document.getElementById('logo-home').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('back-to-home-btn').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('back-to-home-btn-2').addEventListener('click', () => { resetActiveNav(navHome); cambiarVista(viewHome); });
document.getElementById('back-from-search-btn').addEventListener('click', () => { cambiarVista(viewSearchMobile); });
document.getElementById('view-favorites-btn').addEventListener('click', irABiblioteca);
document.getElementById('sidebar-library-btn').addEventListener('click', irABiblioteca);

function abrirReproductor(cancion) {
    if (!cancion) return;
    const url = `reproductor.html?titulo=${encodeURIComponent(cancion.titulo)}&artista=${encodeURIComponent(cancion.artista)}&portada=${encodeURIComponent(cancion.portadaUrl)}`;
    window.location.href = url;
}

// Convierte los resultados de iTunes en nuestro formato de canción
function mapearResultados(results) {
    return results.map(item => ({
        id: item.trackId,
        titulo: item.trackName,
        artista: item.artistName,
        portadaUrl: item.artworkUrl100.replace('100x100bb.jpg', '500x500bb.jpg')
    }));
}

// Dibuja una lista de canciones dentro de un contenedor
function pintarCanciones(canciones, contenedor) {
    contenedor.innerHTML = '';
    canciones.forEach((cancion, index) => {
        const fila = document.createElement('div');
        fila.classList.add('song-row-item');

        const izquierda = document.createElement('div');
        izquierda.classList.add('song-left-part');

        const num = document.createElement('span');
        num.classList.add('track-number');
        num.textContent = index + 1;

        const img = document.createElement('img');
        img.src = cancion.portadaUrl;
        img.classList.add('mini-row-cover');

        const textos = document.createElement('div');
        const nombre = document.createElement('div');
        nombre.classList.add('track-name-text');
        nombre.style.fontWeight = 'bold';
        nombre.textContent = cancion.titulo;
        const art = document.createElement('div');
        art.style.fontSize = '0.8rem';
        art.style.color = '#b3b3b3';
        art.textContent = cancion.artista;
        textos.appendChild(nombre);
        textos.appendChild(art);

        izquierda.appendChild(num);
        izquierda.appendChild(img);
        izquierda.appendChild(textos);

        const icono = document.createElement('span');
        icono.classList.add('play-row-icon');
        icono.textContent = '▶';

        fila.appendChild(izquierda);
        fila.appendChild(icono);
        fila.addEventListener('click', () => Vibeo.reproducirLista(canciones, index));
        contenedor.appendChild(fila);
    });
}

function mensaje(contenedor, texto) {
    contenedor.innerHTML = `<p style="color:#b3b3b3; padding:20px; text-align:center;">${texto}</p>`;
}

function ejecutarBusqueda(query) {
    if (!query || query.trim().length === 0) return;

    searchResultsTitle.textContent = `Resultados para "${query}"`;
    mensaje(searchResultsList, 'Buscando canciones...');
    cambiarVista(viewSearchResults);

    fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=25`)
        .then(res => res.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                playlistActual = mapearResultados(data.results);
                pintarCanciones(playlistActual, searchResultsList);
            } else {
                mensaje(searchResultsList, 'No se encontraron resultados.');
            }
        })
        .catch(() => mensaje(searchResultsList, 'Error al realizar la búsqueda.'));
}

searchInputMobile.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') ejecutarBusqueda(searchInputMobile.value);
});

if (searchInputDesktop) {
    searchInputDesktop.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') ejecutarBusqueda(searchInputDesktop.value);
    });
}

document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => {
        const nombreArtista = card.getAttribute('data-artista');
        document.getElementById('artist-profile-name').textContent = nombreArtista;
        const artistSongsList = document.getElementById('artist-songs-list');
        mensaje(artistSongsList, 'Cargando...');
        cambiarVista(viewArtist);

        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(nombreArtista)}&media=music&entity=song&limit=15`)
            .then(res => res.json())
            .then(data => {
                if (data.results && data.results.length > 0) {
                    playlistActual = mapearResultados(data.results);
                    pintarCanciones(playlistActual, artistSongsList);
                } else {
                    mensaje(artistSongsList, 'No se encontraron canciones.');
                }
            })
            .catch(() => mensaje(artistSongsList, 'Error al cargar las canciones.'));
    });
});

function renderizarBiblioteca() {
    const favoritos = getFavoritos();
    document.getElementById('fav-count').textContent = `${favoritos.length} canciones guardadas`;
    if (favoritos.length === 0) {
        mensaje(librarySongsList, 'Aún no tienes favoritas. Toca el ♡ en el reproductor para guardarlas.');
    } else {
        pintarCanciones(favoritos, librarySongsList);
    }
}
