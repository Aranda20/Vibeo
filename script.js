const $ = (id) => document.getElementById(id);
const { IT, PAIS } = Vibeo;
const enc = encodeURIComponent;

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
const homeBox = $('home-sections');

const navHome = $('nav-home');
const navSearch = $('nav-search');
const navLibrary = $('nav-library');
const navItems = document.querySelectorAll('.nav-item');

let vistaActual = viewHome;
let vistaPrevia = viewHome;
let resultados = { canciones: [], artistas: [], albumes: [] };
let imgArtista = {};
let filtro = 'todo';
let homeFiltro = 'todas';
let detalleLista = [];

const getFavoritos = () => { try { return JSON.parse(localStorage.getItem('vibeo_favs')) || []; } catch { return []; } };
const api = (url) => Vibeo.api(url);
const mensaje = (cont, texto) => { cont.innerHTML = `<p style="color:#b3b3b3;padding:20px;text-align:center;">${texto}</p>`; };
const urlCss = (u) => 'url("' + String(u).replace(/"/g, '%22') + '")';
function el(tag, cls, texto) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
}

// ---------- Navegación ----------
function cambiarVista(vista) {
    [viewHome, viewSearchMobile, viewSearchResults, viewArtist, viewLibrary].forEach(v => v.style.display = 'none');
    vista.style.display = 'block';
    if (vista === viewArtist && vistaActual !== viewArtist) vistaPrevia = vistaActual;
    vistaActual = vista;
}
function resetActiveNav(item) {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
}
function limpiarBusqueda() {
    searchInputMobile.value = '';
    if (searchInputDesktop) searchInputDesktop.value = '';
}
function irAInicio() { resetActiveNav(navHome); cambiarVista(viewHome); renderHome(); }
function irABuscar() { resetActiveNav(navSearch); limpiarBusqueda(); cambiarVista(viewSearchMobile); }
function irABiblioteca() { resetActiveNav(navLibrary); renderizarBiblioteca(); cambiarVista(viewLibrary); }

navHome.addEventListener('click', irAInicio);
navSearch.addEventListener('click', irABuscar);
navLibrary.addEventListener('click', irABiblioteca);
$('logo-home').addEventListener('click', irAInicio);
$('back-to-home-btn-2').addEventListener('click', irAInicio);
$('view-favorites-btn').addEventListener('click', irABiblioteca);
$('sidebar-library-btn').addEventListener('click', irABiblioteca);

$('back-to-home-btn').addEventListener('click', () => {
    if (vistaPrevia === viewHome) irAInicio();
    else cambiarVista(vistaPrevia);
});
$('back-from-search-btn').addEventListener('click', () => {
    limpiarBusqueda(); // al volver, el buscador queda vacío
    if (window.innerWidth > 768) irAInicio();
    else { resetActiveNav(navSearch); cambiarVista(viewSearchMobile); }
});

// ---------- Listas de canciones ----------
// opciones.lista: cola a reproducir | opciones.sola: reproduce solo esa canción (y luego sugerencias del género)
function pintarCanciones(canciones, contenedor, opciones = {}) {
    const lista = opciones.lista || canciones;
    contenedor.innerHTML = '';
    canciones.forEach((cancion, index) => {
        const fila = el('div', 'song-row-item');
        const izq = el('div', 'song-left-part');
        const img = el('img', 'mini-row-cover');
        img.src = cancion.portadaUrl; img.alt = '';
        const textos = el('div');
        const nombre = el('div', 'track-name-text', cancion.titulo);
        nombre.style.fontWeight = 'bold';
        const art = el('div', null, cancion.artista);
        art.style.fontSize = '0.8rem'; art.style.color = '#b3b3b3';
        textos.appendChild(nombre); textos.appendChild(art);
        izq.appendChild(el('span', 'track-number', index + 1));
        izq.appendChild(img); izq.appendChild(textos);

        const corazon = el('button', 'row-heart');
        corazon.setAttribute('aria-label', 'Favorito');
        corazon.innerHTML = '<svg class="ic"><use href="#i-heart"/></svg>';
        const pintar = () => {
            const on = Vibeo.esFav(cancion);
            corazon.classList.toggle('on', on);
            corazon.firstChild.classList.toggle('solid', on);
        };
        pintar();
        corazon.addEventListener('click', (e) => { e.stopPropagation(); Vibeo.alternarFavCancion(cancion); pintar(); });

        fila.appendChild(izq); fila.appendChild(corazon);
        fila.addEventListener('click', () => {
            if (opciones.sola) Vibeo.reproducirLista([cancion], 0);
            else Vibeo.reproducirLista(lista, lista.indexOf(cancion));
        });
        contenedor.appendChild(fila);
    });
}

function pintarAlbumes(albumes, contenedor) {
    contenedor.innerHTML = '';
    albumes.forEach(al => {
        const card = el('div', 'album-card');
        const img = el('img'); img.src = al.portada; img.alt = '';
        card.appendChild(img);
        card.appendChild(el('div', 'album-name', al.nombre));
        card.appendChild(el('div', 'album-sub', [al.anio, al.artista].filter(Boolean).join(' · ')));
        card.addEventListener('click', () => abrirAlbum(al));
        contenedor.appendChild(card);
    });
}

function pintarArtistas(artistas, contenedor) {
    contenedor.innerHTML = '';
    artistas.forEach(a => {
        const fila = el('div', 'artist-row');
        const av = el('div', 'artist-avatar');
        const src = imgArtista[a.nombre.toLowerCase()];
        if (src) { const img = el('img'); img.src = src; img.alt = ''; av.appendChild(img); }
        else av.textContent = a.nombre.charAt(0).toUpperCase();
        fila.appendChild(av);
        fila.appendChild(el('div', 'name', a.nombre));
        fila.insertAdjacentHTML('beforeend', '<svg class="ic"><use href="#i-chevron-right"/></svg>');
        fila.addEventListener('click', () => abrirArtista(a));
        contenedor.appendChild(fila);
    });
}

// ---------- INICIO estilo Spotify ----------
const COLORES_RADIO = ['#9be8b0', '#d8a3ff', '#ff9ec4', '#8fd3ff', '#ffd27a', '#b8f2e6', '#ffb38a', '#c9c2ff'];
let homeToken = 0;

function seccionHome(titulo, sub) {
    const s = el('section', 'home-section');
    s.appendChild(el('h2', null, titulo));
    if (sub) s.appendChild(el('p', 'sub', sub));
    homeBox.appendChild(s);
    return s;
}
function hscroll(sec) { const d = el('div', 'hscroll'); sec.appendChild(d); return d; }

function cardCancion(c) {
    const d = el('div', 'h-card');
    const img = el('img', 'h-cover'); img.src = c.portadaUrl; img.alt = '';
    d.appendChild(img);
    d.appendChild(el('div', 'h-title', c.titulo));
    d.appendChild(el('div', 'h-sub', c.artista));
    d.addEventListener('click', () => Vibeo.reproducirLista([c], 0));
    return d;
}
function cardAlbum(al) {
    const d = el('div', 'h-card');
    const img = el('img', 'h-cover'); img.src = al.portada; img.alt = '';
    d.appendChild(img);
    d.appendChild(el('div', 'h-kind', 'Álbum'));
    d.appendChild(el('div', 'h-title', al.nombre));
    d.appendChild(el('div', 'h-sub', al.artista));
    d.addEventListener('click', () => abrirAlbum(al));
    return d;
}
function cardArtista(a) {
    const d = el('div', 'h-card circle');
    const img = el('img', 'h-cover'); img.src = a.portada; img.alt = '';
    d.appendChild(img);
    d.appendChild(el('div', 'h-title', a.nombre));
    d.addEventListener('click', () => abrirArtista({ id: a.id, nombre: a.nombre }));
    return d;
}
function cardRadio(a, color) {
    const d = el('div', 'h-card');
    const r = el('div', 'radio-card');
    r.style.background = color;
    r.appendChild(el('span', 'radio-tag', 'RADIO'));
    const img = el('img', 'radio-img'); img.src = a.portada; img.alt = '';
    r.appendChild(img);
    r.appendChild(el('div', 'radio-name', a.nombre));
    d.appendChild(r);
    d.appendChild(el('div', 'h-sub', a.genero || 'Mezcla de sus mejores canciones'));
    d.addEventListener('click', () => iniciarRadio(a, d));
    return d;
}

function artistasDe(canciones) {
    const m = new Map();
    canciones.forEach(c => {
        const nombre = Vibeo.principal(c.artista) || c.artista;
        const k = c.artistaId || nombre;
        if (!m.has(k)) m.set(k, { id: c.artistaId, nombre, portada: c.portadaUrl, genero: c.genero });
    });
    return [...m.values()];
}

async function iniciarRadio(a, card) {
    card.classList.add('cargando');
    try {
        const d = await api(`${IT}/lookup?id=${a.id}&entity=song&limit=30&country=${PAIS}`);
        const lista = Vibeo.mezclar((d.results || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear));
        if (lista.length) Vibeo.reproducirLista(lista, 0);
    } catch (e) { /* sin conexión: no hacemos nada */ }
    card.classList.remove('cargando');
}

function esqueleto() {
    const d = el('div', 'skeleton-row');
    for (let i = 0; i < 4; i++) d.appendChild(el('div', 'skeleton'));
    return d;
}

async function renderHome() {
    const mio = ++homeToken;
    const f = homeFiltro, todas = f === 'todas';
    const favs = getFavoritos(), hist = Vibeo.historial();
    homeBox.innerHTML = '';

    if ((todas || f === 'canciones') && favs.length) {
        const s = seccionHome('Tus favoritos del momento');
        const c = el('div', 'songs-list-container'); s.appendChild(c);
        pintarCanciones(favs.slice(0, 3), c, { lista: favs });
    }
    if ((todas || f === 'canciones') && hist.length) {
        const s = seccionHome('Escuchado recientemente');
        const h = hscroll(s);
        hist.forEach(c => h.appendChild(cardCancion(c)));
    }

    const sk = esqueleto();
    homeBox.appendChild(sk);
    const charts = await Vibeo.cargarCharts();
    if (mio !== homeToken) return; // cambiaron de vista o de filtro mientras cargaba
    sk.remove();

    if (!charts) {
        if (!homeBox.children.length) mensaje(homeBox, 'No se pudo cargar el inicio. Revisa tu conexión e inténtalo de nuevo.');
        return;
    }
    const artistas = artistasDe(charts.canciones);

    if ((todas || f === 'artistas') && artistas.length) {
        const s = seccionHome('Estaciones populares');
        const h = hscroll(s);
        artistas.slice(0, 8).forEach((a, i) => h.appendChild(cardRadio(a, COLORES_RADIO[i % COLORES_RADIO.length])));
    }
    if ((todas || f === 'albumes') && charts.albumes.length) {
        const s = seccionHome('Álbumes y sencillos populares');
        const h = hscroll(s);
        charts.albumes.slice(0, 14).forEach(al => h.appendChild(cardAlbum(al)));
    }
    if (todas || f === 'canciones') {
        const s = seccionHome('Escuchar ahora', 'Lo más escuchado en Colombia');
        const c = el('div', 'songs-list-container'); s.appendChild(c);
        pintarCanciones(charts.canciones.slice(0, 8), c, { sola: true });
    }
    if ((todas || f === 'artistas') && artistas.length) {
        const s = seccionHome('Artistas populares');
        const h = hscroll(s);
        artistas.slice(0, 14).forEach(a => h.appendChild(cardArtista(a)));
    }
}

document.querySelectorAll('#home-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
        homeFiltro = btn.dataset.filtro;
        document.querySelectorAll('#home-chips .chip').forEach(c => c.classList.toggle('active', c === btn));
        renderHome();
    });
});

// ---------- BUSCAR: explorar por género ----------
const GENEROS = [
    ['Pop', '#e8115b'], ['Reggaeton', '#1e3264'], ['Rock', '#e13300'], ['Salsa', '#dc148c'],
    ['Vallenato', '#477d95'], ['Hip hop', '#bc5900'], ['Regional mexicano', '#148a08'], ['Baladas', '#8d67ab'],
    ['Electrónica', '#509bf5'], ['Cumbia', '#c7366f'], ['Bachata', '#af2896'], ['Merengue', '#ba5d07'],
    ['Jazz', '#2d46b9'], ['Clásica', '#7d4b32'], ['R&B', '#8c1932'], ['Indie', '#006450']
];
GENEROS.forEach(([nombre, color]) => {
    const t = el('div', 'genre-tile', nombre);
    t.style.background = color;
    t.insertAdjacentHTML('beforeend', '<svg class="ic"><use href="#i-music"/></svg>');
    t.addEventListener('click', () => ejecutarBusqueda(nombre, true));
    $('genre-grid').appendChild(t);
});

// ---------- Resultados de búsqueda (canciones, artistas, álbumes) ----------
function actualizarChips() {
    document.querySelectorAll('#search-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.filtro === filtro));
}
document.querySelectorAll('#search-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => { filtro = btn.dataset.filtro; actualizarChips(); renderResultados(); });
});

function seccion(titulo) { searchBody.appendChild(el('h3', 'section-title', titulo)); }

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
        const c = el('div', 'songs-list-container'); searchBody.appendChild(c);
        pintarCanciones(todo ? canciones.slice(0, 5) : canciones, c, { sola: true });
    }
    if ((todo || filtro === 'artistas') && artistas.length) {
        seccion('Artistas');
        const c = el('div'); searchBody.appendChild(c);
        pintarArtistas(todo ? artistas.slice(0, 4) : artistas, c);
    }
    if ((todo || filtro === 'albumes') && albumes.length) {
        seccion('Álbumes');
        const c = el('div', 'albums-grid'); searchBody.appendChild(c);
        pintarAlbumes(todo ? albumes.slice(0, 6) : albumes, c);
    }
    if (!searchBody.children.length) mensaje(searchBody, 'Sin resultados en esta categoría.');
}

async function ejecutarBusqueda(query, porGenero = false) {
    query = (query || '').trim();
    if (!query) return;

    searchResultsTitle.textContent = porGenero ? query : `Resultados para "${query}"`;
    filtro = 'todo'; actualizarChips();
    mensaje(searchBody, 'Buscando...');
    cambiarVista(viewSearchResults);

    const base = `${IT}/search?term=${enc(query)}&media=music&country=${PAIS}`;
    const attr = porGenero ? '&attribute=genreIndex' : '';
    const [s, a, al] = await Promise.all([
        api(base + '&entity=song&limit=25' + attr),
        porGenero ? Promise.resolve(null) : api(base + '&entity=musicArtist&limit=10'),
        api(base + '&entity=album&limit=15' + attr)
    ].map(p => p.catch(() => null)));

    if (!s && !a && !al) { mensaje(searchBody, 'Error al realizar la búsqueda.'); return; }

    resultados.canciones = ((s && s.results) || []).filter(x => x.trackName).map(Vibeo.mapear);
    // Si el género no devolvió nada útil, hacemos la búsqueda normal
    if (porGenero && resultados.canciones.length < 5) return ejecutarBusqueda(query, false);

    resultados.albumes = ((al && al.results) || []).filter(x => x.collectionName).map(Vibeo.mapAlbum);
    resultados.artistas = porGenero
        ? artistasDe(resultados.canciones).slice(0, 8)
        : ((a && a.results) || []).filter(x => x.artistName).map(x => ({ id: x.artistId, nombre: x.artistName }));

    // iTunes no entrega fotos de artistas: usamos la portada de una de sus canciones o álbumes
    imgArtista = {};
    [...resultados.canciones.map(c => [c.artista, c.portadaUrl]), ...resultados.albumes.map(x => [x.artista, x.portada])]
        .forEach(([n, p]) => { const k = (n || '').toLowerCase(); if (k && !imgArtista[k]) imgArtista[k] = p; });
    resultados.artistas.forEach(x => { const k = x.nombre.toLowerCase(); if (!imgArtista[k] && x.portada) imgArtista[k] = x.portada; });

    renderResultados();
}

searchInputMobile.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputMobile.value); });
if (searchInputDesktop) {
    searchInputDesktop.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputDesktop.value); });
}

// ---------- Perfil de artista / álbum ----------
function cabecera(titulo, etiqueta, portada) {
    $('artist-profile-name').textContent = titulo;
    $('artist-badge').textContent = etiqueta;
    $('artist-header').style.backgroundImage = portada ? urlCss(portada) : '';
    $('artist-songs-list').innerHTML = '';
    $('artist-albums-title').style.display = 'none';
    $('artist-albums-list').innerHTML = '';
    detalleLista = [];
}
$('artist-play').addEventListener('click', () => { if (detalleLista.length) Vibeo.reproducirLista(detalleLista, 0); });

async function abrirArtista(a) {
    cabecera(a.nombre, 'Artista', '');
    $('artist-songs-title').textContent = 'Canciones populares';
    const lista = $('artist-songs-list');
    mensaje(lista, 'Cargando...');
    cambiarVista(viewArtist);

    try {
        let id = a.id;
        if (!id) {
            const d = await api(`${IT}/search?term=${enc(a.nombre)}&media=music&entity=musicArtist&limit=1&country=${PAIS}`);
            id = d.results && d.results[0] && d.results[0].artistId;
        }
        let canciones = [], albumes = [];
        if (id) {
            const [s, al] = await Promise.all([
                api(`${IT}/lookup?id=${id}&entity=song&limit=25&country=${PAIS}`).catch(() => null),
                api(`${IT}/lookup?id=${id}&entity=album&limit=12&country=${PAIS}`).catch(() => null)
            ]);
            canciones = ((s && s.results) || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
            albumes = ((al && al.results) || []).filter(x => x.wrapperType === 'collection' && x.collectionName).map(Vibeo.mapAlbum);
        }
        if (!canciones.length) {
            const d = await api(`${IT}/search?term=${enc(a.nombre)}&media=music&entity=song&limit=20&country=${PAIS}`);
            canciones = (d.results || []).filter(x => x.trackName).map(Vibeo.mapear);
        }
        detalleLista = canciones;
        if (canciones.length) {
            $('artist-header').style.backgroundImage = urlCss(canciones[0].portadaUrl);
            pintarCanciones(canciones, lista);
        } else mensaje(lista, 'No se encontraron canciones.');
        if (albumes.length) { $('artist-albums-title').style.display = 'block'; pintarAlbumes(albumes, $('artist-albums-list')); }
    } catch (e) {
        mensaje(lista, 'Error al cargar las canciones.');
    }
}

async function abrirAlbum(al) {
    cabecera(al.nombre, `Álbum · ${al.artista}`, al.portada);
    $('artist-songs-title').textContent = 'Canciones';
    const lista = $('artist-songs-list');
    mensaje(lista, 'Cargando...');
    cambiarVista(viewArtist);

    try {
        const d = await api(`${IT}/lookup?id=${al.id}&entity=song&country=${PAIS}`);
        const canciones = (d.results || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
        detalleLista = canciones;
        if (canciones.length) pintarCanciones(canciones, lista);
        else mensaje(lista, 'No se encontraron canciones en este álbum.');
    } catch (e) {
        mensaje(lista, 'Error al cargar el álbum.');
    }
}

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

// ---------- Arranque ----------
renderHome();
