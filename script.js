const $ = (id) => document.getElementById(id);

const searchInputMobile = $('search-input-mobile');
const searchInputDesktop = $('search-input');
const viewHome = $('view-home');
const viewSearchMobile = $('view-search-mobile');
const viewSearchResults = $('view-search-results');
const viewArtist = $('view-artist');
const viewLibrary = $('view-library');
const searchResultsTitle = $('search-results-title');
const searchBody = $('search-results-body');
const librarySongsList = $('library-songs-list');

const navHome = $('nav-home');
const navSearch = $('nav-search');
const navLibrary = $('nav-library');
const navItems = document.querySelectorAll('.nav-item');

let vistaActual = viewHome;
let vistaPrevia = viewHome;
let resultados = { canciones: [], artistas: [], albumes: [] };
let imgArtista = {};
let filtro = 'todo';

const getFavoritos = () => { try { return JSON.parse(localStorage.getItem('vibeo_favs')) || []; } catch { return []; } };
const api = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
const mensaje = (cont, texto) => { cont.innerHTML = `<p style="color:#b3b3b3; padding:20px; text-align:center;">${texto}</p>`; };

function cambiarVista(vista) {
    [viewHome, viewSearchMobile, viewSearchResults, viewArtist, viewLibrary].forEach(v => v.style.display = 'none');
    vista.style.display = 'block';
    if (vista === viewArtist && vistaActual !== viewArtist) vistaPrevia = vistaActual;
    vistaActual = vista;
}

function resetActiveNav(activeItem) {
    navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
}

function irAInicio() { resetActiveNav(navHome); cambiarVista(viewHome); }
function irABiblioteca() { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); }

navHome.addEventListener('click', irAInicio);
navSearch.addEventListener('click', () => { resetActiveNav(navSearch); cambiarVista(viewSearchMobile); });
navLibrary.addEventListener('click', irABiblioteca);
$('logo-home').addEventListener('click', irAInicio);
$('back-to-home-btn-2').addEventListener('click', irAInicio);
$('view-favorites-btn').addEventListener('click', irABiblioteca);
$('sidebar-library-btn').addEventListener('click', irABiblioteca);

$('back-to-home-btn').addEventListener('click', () => {
    cambiarVista(vistaPrevia);
    if (vistaPrevia === viewHome) resetActiveNav(navHome);
});
$('back-from-search-btn').addEventListener('click', () => {
    if (window.innerWidth > 768) irAInicio();
    else cambiarVista(viewSearchMobile);
});

// ---------- Listas de canciones ----------
function pintarCanciones(canciones, contenedor, lista) {
    const cola = lista || canciones;
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

        const corazon = document.createElement('button');
        corazon.className = 'row-heart';
        corazon.setAttribute('aria-label', 'Favorito');
        corazon.innerHTML = '<svg class="ic"><use href="#i-heart"/></svg>';
        const pintar = () => {
            const on = Vibeo.esFav(cancion);
            corazon.classList.toggle('on', on);
            corazon.firstChild.classList.toggle('solid', on);
        };
        pintar();
        corazon.addEventListener('click', (e) => {
            e.stopPropagation();
            Vibeo.alternarFavCancion(cancion);
            pintar();
        });

        fila.appendChild(izquierda);
        fila.appendChild(corazon);
        fila.addEventListener('click', () => Vibeo.reproducirLista(cola, cola.indexOf(cancion)));
        contenedor.appendChild(fila);
    });
}

function mapearAlbum(x) {
    return {
        id: x.collectionId,
        nombre: x.collectionName,
        artista: x.artistName,
        artistaId: x.artistId,
        portada: (x.artworkUrl100 || '').replace('100x100bb', '400x400bb'),
        anio: (x.releaseDate || '').slice(0, 4)
    };
}

function pintarAlbumes(albumes, contenedor) {
    contenedor.innerHTML = '';
    albumes.forEach(al => {
        const card = document.createElement('div');
        card.className = 'album-card';
        const img = document.createElement('img');
        img.src = al.portada; img.alt = '';
        const n = document.createElement('div'); n.className = 'album-name'; n.textContent = al.nombre;
        const s = document.createElement('div'); s.className = 'album-sub';
        s.textContent = [al.anio, al.artista].filter(Boolean).join(' · ');
        card.appendChild(img); card.appendChild(n); card.appendChild(s);
        card.addEventListener('click', () => abrirAlbum(al));
        contenedor.appendChild(card);
    });
}

function pintarArtistas(artistas, contenedor) {
    contenedor.innerHTML = '';
    artistas.forEach(a => {
        const fila = document.createElement('div');
        fila.className = 'artist-row';
        const av = document.createElement('div');
        av.className = 'artist-avatar';
        const src = imgArtista[a.nombre.toLowerCase()];
        if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; av.appendChild(img); }
        else av.textContent = a.nombre.charAt(0).toUpperCase();
        const n = document.createElement('div'); n.className = 'name'; n.textContent = a.nombre;
        fila.appendChild(av); fila.appendChild(n);
        fila.insertAdjacentHTML('beforeend', '<svg class="ic"><use href="#i-chevron-right"/></svg>');
        fila.addEventListener('click', () => abrirArtista(a));
        contenedor.appendChild(fila);
    });
}

// ---------- Búsqueda estilo Spotify (canciones, artistas, álbumes) ----------
function actualizarChips() {
    document.querySelectorAll('#search-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.filtro === filtro));
}
document.querySelectorAll('#search-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => { filtro = btn.dataset.filtro; actualizarChips(); renderResultados(); });
});

function seccion(titulo) {
    const h = document.createElement('h3');
    h.className = 'section-title';
    h.textContent = titulo;
    searchBody.appendChild(h);
}

function renderResultados() {
    searchBody.innerHTML = '';
    const { canciones, artistas, albumes } = resultados;
    if (!canciones.length && !artistas.length && !albumes.length) {
        mensaje(searchBody, 'No se encontraron resultados.');
        return;
    }
    const todo = filtro === 'todo';

    if ((todo || filtro === 'canciones') && canciones.length) {
        seccion('Canciones');
        const c = document.createElement('div'); c.className = 'songs-list-container';
        searchBody.appendChild(c);
        pintarCanciones(todo ? canciones.slice(0, 5) : canciones, c, canciones);
    }
    if ((todo || filtro === 'artistas') && artistas.length) {
        seccion('Artistas');
        const c = document.createElement('div');
        searchBody.appendChild(c);
        pintarArtistas(todo ? artistas.slice(0, 4) : artistas, c);
    }
    if ((todo || filtro === 'albumes') && albumes.length) {
        seccion('Álbumes');
        const c = document.createElement('div'); c.className = 'albums-grid';
        searchBody.appendChild(c);
        pintarAlbumes(todo ? albumes.slice(0, 6) : albumes, c);
    }
    if (!searchBody.children.length) mensaje(searchBody, 'Sin resultados en esta categoría.');
}

async function ejecutarBusqueda(query) {
    query = (query || '').trim();
    if (!query) return;

    searchResultsTitle.textContent = `Resultados para "${query}"`;
    filtro = 'todo'; actualizarChips();
    mensaje(searchBody, 'Buscando...');
    cambiarVista(viewSearchResults);

    const base = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music`;
    const [s, a, al] = await Promise.all([
        api(base + '&entity=song&limit=25'),
        api(base + '&entity=musicArtist&limit=10'),
        api(base + '&entity=album&limit=15')
    ].map(p => p.catch(() => null)));

    if (!s && !a && !al) { mensaje(searchBody, 'Error al realizar la búsqueda.'); return; }

    resultados.canciones = ((s && s.results) || []).filter(x => x.trackName).map(Vibeo.mapear);
    resultados.albumes = ((al && al.results) || []).filter(x => x.collectionName).map(mapearAlbum);
    resultados.artistas = ((a && a.results) || []).filter(x => x.artistName).map(x => ({ id: x.artistId, nombre: x.artistName }));

    // iTunes no entrega fotos de artistas: usamos la portada de una de sus canciones o álbumes
    imgArtista = {};
    [...resultados.canciones.map(c => [c.artista, c.portadaUrl]), ...resultados.albumes.map(x => [x.artista, x.portada])]
        .forEach(([n, p]) => { const k = (n || '').toLowerCase(); if (k && !imgArtista[k]) imgArtista[k] = p; });

    renderResultados();
}

searchInputMobile.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputMobile.value); });
if (searchInputDesktop) {
    searchInputDesktop.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputDesktop.value); });
}

// ---------- Perfil de artista y de álbum ----------
async function abrirArtista(a) {
    $('artist-profile-name').textContent = a.nombre;
    $('artist-badge').textContent = 'Artista';
    $('artist-songs-title').textContent = 'Canciones populares';
    const lista = $('artist-songs-list');
    const albumsTitle = $('artist-albums-title');
    const albums = $('artist-albums-list');
    mensaje(lista, 'Cargando...');
    albums.innerHTML = ''; albumsTitle.style.display = 'none';
    cambiarVista(viewArtist);

    try {
        let id = a.id;
        if (!id) {
            const d = await api(`https://itunes.apple.com/search?term=${encodeURIComponent(a.nombre)}&media=music&entity=musicArtist&limit=1`);
            id = d.results && d.results[0] && d.results[0].artistId;
        }
        let canciones = [], albumes = [];
        if (id) {
            const [s, al] = await Promise.all([
                api(`https://itunes.apple.com/lookup?id=${id}&entity=song&limit=25`).catch(() => null),
                api(`https://itunes.apple.com/lookup?id=${id}&entity=album&limit=12`).catch(() => null)
            ]);
            canciones = ((s && s.results) || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
            albumes = ((al && al.results) || []).filter(x => x.wrapperType === 'collection' && x.collectionName).map(mapearAlbum);
        }
        if (!canciones.length) {
            const d = await api(`https://itunes.apple.com/search?term=${encodeURIComponent(a.nombre)}&media=music&entity=song&limit=20`);
            canciones = (d.results || []).filter(x => x.trackName).map(Vibeo.mapear);
        }
        if (canciones.length) pintarCanciones(canciones, lista);
        else mensaje(lista, 'No se encontraron canciones.');
        if (albumes.length) { albumsTitle.style.display = 'block'; pintarAlbumes(albumes, albums); }
    } catch (e) {
        mensaje(lista, 'Error al cargar las canciones.');
    }
}

async function abrirAlbum(al) {
    $('artist-profile-name').textContent = al.nombre;
    $('artist-badge').textContent = `Álbum · ${al.artista}`;
    $('artist-songs-title').textContent = 'Canciones';
    const lista = $('artist-songs-list');
    $('artist-albums-title').style.display = 'none';
    $('artist-albums-list').innerHTML = '';
    mensaje(lista, 'Cargando...');
    cambiarVista(viewArtist);

    try {
        const d = await api(`https://itunes.apple.com/lookup?id=${al.id}&entity=song`);
        const canciones = (d.results || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
        if (canciones.length) pintarCanciones(canciones, lista);
        else mensaje(lista, 'No se encontraron canciones en este álbum.');
    } catch (e) {
        mensaje(lista, 'Error al cargar el álbum.');
    }
}

document.querySelectorAll('.artist-card').forEach(card => {
    card.addEventListener('click', () => abrirArtista({ nombre: card.getAttribute('data-artista') }));
});

// ---------- Biblioteca ----------
function renderizarBiblioteca() {
    const favoritos = getFavoritos();
    $('fav-count').textContent = `${favoritos.length} canciones guardadas`;
    if (favoritos.length === 0) {
        mensaje(librarySongsList, 'Aún no tienes favoritas. Toca el corazón en cualquier canción para guardarla.');
    } else {
        pintarCanciones(favoritos, librarySongsList);
    }
}
