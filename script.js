const $ = (id) => document.getElementById(id);
const { IT, PAIS, norm } = Vibeo;
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
const homeBox = $('home-sections');

const navHome = $('nav-home');
const navSearch = $('nav-search');
const navLibrary = $('nav-library');
const navItems = document.querySelectorAll('.nav-item');

let vistaActual = viewHome;
let vistaPrevia = viewHome;
let resultados = { canciones: [], artistas: [], albumes: [], youtube: [] };
let ytEstado = 'idle'; // idle | cargando | listo | error
let ultimaQuery = '';
let busquedaId = 0;
let imgArtista = {};
let filtro = 'todo';
let homeFiltro = 'todas';
let libFiltro = '';
let detalleLista = [];
let artistaActual = null;
let abrirToken = 0;

const hayWorker = () => !!CONFIG.WORKER_URL;
const getFavoritos = () => { try { return JSON.parse(localStorage.getItem('vibeo_favs')) || []; } catch { return []; } };
const getSeguidos = () => { try { return JSON.parse(localStorage.getItem('vibeo_artistas')) || []; } catch { return []; } };
const api = (url) => Vibeo.api(url);
const mensaje = (cont, texto) => { cont.innerHTML = `<p style="color:#b3b3b3;padding:20px;text-align:center;">${texto}</p>`; };
const urlCss = (u) => 'url("' + String(u).replace(/"/g, '%22') + '")';
function el(tag, cls, texto) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (texto != null) e.textContent = texto;
    return e;
}
function intercalar(a, b) {
    const r = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) r.push(a[i]); if (b[i]) r.push(b[i]); }
    return r;
}
function sinDuplicados(lista, fn) {
    const v = new Set();
    return lista.filter(x => { const k = fn(x); if (v.has(k)) return false; v.add(k); return true; });
}
const claveCancion = (c) => `${norm(c.titulo)}|${norm(Vibeo.principal(c.artista))}`;

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
function agregarArtistas() {
    if (window.innerWidth > 768 && searchInputDesktop) { irAInicio(); searchInputDesktop.focus(); }
    else { irABuscar(); setTimeout(() => searchInputMobile.focus(), 60); }
}

navHome.addEventListener('click', irAInicio);
navSearch.addEventListener('click', irABuscar);
navLibrary.addEventListener('click', irABiblioteca);
$('logo-home').addEventListener('click', irAInicio);
$('view-favorites-btn').addEventListener('click', () => { irABiblioteca(); abrirFavoritos(); });
$('sidebar-library-btn').addEventListener('click', irABiblioteca);
$('lib-search-btn').addEventListener('click', agregarArtistas);
$('lib-add-btn').addEventListener('click', agregarArtistas);

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
// opciones.lista: cola a reproducir | opciones.sola: reproduce solo esa canción (y luego sugerencias parecidas)
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
        const src = a.portada || imgArtista[a.nombre.toLowerCase()];
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
    img.dataset.artista = a.nombre;
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
    img.dataset.artista = a.nombre;
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

// Cambia la portada de canción por la foto real del artista (Deezer), de a pocos para no saturar
async function mejorarFotosArtistas() {
    if (!hayWorker()) return;
    const imgs = [...homeBox.querySelectorAll('img[data-artista]')];
    for (let i = 0; i < imgs.length; i += 4) {
        await Promise.all(imgs.slice(i, i + 4).map(async (img) => {
            const f = await Vibeo.fotoArtista(img.dataset.artista);
            if (f && f.portada && img.isConnected) img.src = f.portada;
        }));
    }
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
    mejorarFotosArtistas();
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

// ---------- Resultados de búsqueda (iTunes + Deezer + YouTube) ----------
function actualizarChips() {
    document.querySelectorAll('#search-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.filtro === filtro));
}
document.querySelectorAll('#search-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
        filtro = btn.dataset.filtro; actualizarChips();
        if (filtro === 'youtube' && ytEstado === 'idle') cargarYouTube();
        else renderResultados();
    });
});

function seccion(titulo) { searchBody.appendChild(el('h3', 'section-title', titulo)); }
function nota(texto) { searchBody.appendChild(el('p', 'nota-resultados', texto)); }
function botonYouTube(texto) {
    const b = el('button', 'btn-yt', texto);
    b.addEventListener('click', cargarYouTube);
    searchBody.appendChild(b);
}

function renderYouTube(completo) {
    seccion('En YouTube');
    if (ytEstado === 'cargando') { nota('Buscando en YouTube...'); return; }
    if (ytEstado === 'error') { nota('No se pudo buscar en YouTube (puede que se haya agotado la cuota diaria).'); botonYouTube('Reintentar'); return; }
    if (ytEstado === 'idle') { botonYouTube('Buscar también en YouTube'); return; }
    if (!resultados.youtube.length) { nota('YouTube no encontró resultados.'); return; }
    const c = el('div', 'songs-list-container'); searchBody.appendChild(c);
    pintarCanciones(completo ? resultados.youtube : resultados.youtube.slice(0, 5), c, { sola: true });
}

function renderResultados() {
    searchBody.innerHTML = '';
    const { canciones, artistas, albumes } = resultados;
    const todo = filtro === 'todo';

    if (filtro === 'youtube') { renderYouTube(true); return; }

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
    if (todo && hayWorker()) renderYouTube(false);
    if (!searchBody.children.length) mensaje(searchBody, 'No se encontraron resultados.');
}

async function cargarYouTube() {
    if (ytEstado === 'cargando' || !ultimaQuery) return;
    const id = busquedaId;
    ytEstado = 'cargando'; renderResultados();
    try {
        const r = await Vibeo.buscarYouTube(ultimaQuery);
        resultados.youtube = r;
        ytEstado = 'listo';
    } catch (e) { ytEstado = 'error'; }
    if (id === busquedaId) renderResultados();
}

async function ejecutarBusqueda(query, porGenero = false) {
    query = (query || '').trim();
    if (!query) return;
    const id = ++busquedaId;
    ultimaQuery = query;

    searchResultsTitle.textContent = porGenero ? query : `Resultados para "${query}"`;
    filtro = 'todo'; actualizarChips();
    mensaje(searchBody, 'Buscando...');
    cambiarVista(viewSearchResults);

    const base = `${IT}/search?term=${enc(query)}&media=music&country=${PAIS}`;
    const attr = porGenero ? '&attribute=genreIndex' : '';
    const conDeezer = !porGenero && hayWorker();
    const [s, a, al, dzT, dzA, dzAl] = await Promise.all([
        api(base + '&entity=song&limit=25' + attr).catch(() => null),
        porGenero ? null : api(base + '&entity=musicArtist&limit=10').catch(() => null),
        api(base + '&entity=album&limit=15' + attr).catch(() => null),
        conDeezer ? Vibeo.dzBuscar('', query, 25) : [],
        conDeezer ? Vibeo.dzBuscar('artist', query, 8) : [],
        conDeezer ? Vibeo.dzBuscar('album', query, 12) : []
    ]);
    if (id !== busquedaId) return; // hubo otra búsqueda mientras tanto

    const itunesCanciones = ((s && s.results) || []).filter(x => x.trackName).map(Vibeo.mapear);
    // Si el género no devolvió nada útil, hacemos la búsqueda normal
    if (porGenero && itunesCanciones.length < 5) return ejecutarBusqueda(query, false);

    const deezerCanciones = dzT.filter(t => t.title && t.artist).map(Vibeo.dzTrack);
    resultados.canciones = sinDuplicados(intercalar(itunesCanciones, deezerCanciones), claveCancion);

    const itunesAlbumes = ((al && al.results) || []).filter(x => x.collectionName).map(Vibeo.mapAlbum);
    resultados.albumes = sinDuplicados(intercalar(itunesAlbumes, dzAl.map(Vibeo.dzAlbum)), x => `${norm(x.nombre)}|${norm(x.artista)}`);

    if (porGenero) {
        resultados.artistas = artistasDe(resultados.canciones).slice(0, 8);
    } else {
        const deezerArtistas = dzA.map(Vibeo.dzArtista);
        const itunesArtistas = ((a && a.results) || []).filter(x => x.artistName).map(x => ({ id: x.artistId, nombre: x.artistName }))
            .filter(x => !deezerArtistas.some(d => norm(d.nombre) === norm(x.nombre)));
        resultados.artistas = [...deezerArtistas, ...itunesArtistas];
    }

    // Respaldo de portadas de artistas: la portada de una de sus canciones o álbumes
    imgArtista = {};
    [...resultados.canciones.map(c => [c.artista, c.portadaUrl]), ...resultados.albumes.map(x => [x.artista, x.portada])]
        .forEach(([n, p]) => { const k = (n || '').toLowerCase(); if (k && p && !imgArtista[k]) imgArtista[k] = p; });

    resultados.youtube = []; ytEstado = 'idle';
    renderResultados();
    // Si casi no hay resultados en iTunes/Deezer, buscamos directamente en YouTube
    if (!porGenero && hayWorker() && resultados.canciones.length < 6) cargarYouTube();
}

searchInputMobile.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputMobile.value); });
if (searchInputDesktop) {
    searchInputDesktop.addEventListener('keydown', (e) => { if (e.key === 'Enter') ejecutarBusqueda(searchInputDesktop.value); });
}

// ---------- Perfil de artista / álbum / listas ----------
function cabecera(titulo, etiqueta, portada, fondo) {
    $('artist-profile-name').textContent = titulo;
    $('artist-badge').textContent = etiqueta;
    $('artist-header').style.backgroundImage = portada ? urlCss(portada) : (fondo || '');
    $('artist-songs-list').innerHTML = '';
    $('artist-albums-title').style.display = 'none';
    $('artist-albums-list').innerHTML = '';
    $('artist-follow').style.display = 'none';
    detalleLista = [];
    artistaActual = null;
}
$('artist-play').addEventListener('click', () => { if (detalleLista.length) Vibeo.reproducirLista(detalleLista, 0); });

// Seguir artistas (se guardan en tu biblioteca)
function sigueA(nombre) { return getSeguidos().some(a => norm(a.nombre) === norm(nombre)); }
function pintarSeguir() {
    if (!artistaActual) return;
    const on = sigueA(artistaActual.nombre);
    const b = $('artist-follow');
    b.textContent = on ? 'Siguiendo' : 'Seguir';
    b.classList.toggle('on', on);
}
$('artist-follow').addEventListener('click', () => {
    if (!artistaActual) return;
    let lista = getSeguidos();
    if (sigueA(artistaActual.nombre)) lista = lista.filter(a => norm(a.nombre) !== norm(artistaActual.nombre));
    else lista.unshift({ nombre: artistaActual.nombre, id: artistaActual.id, dzId: artistaActual.dzId, portada: artistaActual.portada });
    localStorage.setItem('vibeo_artistas', JSON.stringify(lista));
    pintarSeguir();
});

async function abrirArtista(a) {
    const mio = ++abrirToken;
    cabecera(a.nombre, 'Artista', a.portada || '');
    artistaActual = { id: a.id, dzId: a.dzId, nombre: a.nombre, portada: a.portada || '' };
    $('artist-follow').style.display = 'inline-flex';
    pintarSeguir();
    $('artist-songs-title').textContent = 'Canciones populares';
    const lista = $('artist-songs-list');
    mensaje(lista, 'Cargando...');
    cambiarVista(viewArtist);

    // Foto del artista (Deezer) para la portada del perfil
    Vibeo.fotoArtista(a.nombre).then(f => {
        if (mio !== abrirToken || !f) return;
        artistaActual.dzId = artistaActual.dzId || f.dzId;
        if (!a.portada && f.portada) {
            artistaActual.portada = f.portada;
            $('artist-header').style.backgroundImage = urlCss(f.portada);
        }
    });

    try {
        let id = a.id, canciones = [], albumes = [];
        if (!id) {
            const d = await api(`${IT}/search?term=${enc(a.nombre)}&media=music&entity=musicArtist&limit=1&country=${PAIS}`).catch(() => null);
            const x = d && d.results && d.results[0];
            if (x && norm(x.artistName) === norm(a.nombre)) id = x.artistId;
        }
        if (id) {
            const [s, al] = await Promise.all([
                api(`${IT}/lookup?id=${id}&entity=song&limit=25&country=${PAIS}`).catch(() => null),
                api(`${IT}/lookup?id=${id}&entity=album&limit=12&country=${PAIS}`).catch(() => null)
            ]);
            canciones = ((s && s.results) || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
            albumes = ((al && al.results) || []).filter(x => x.wrapperType === 'collection' && x.collectionName).map(Vibeo.mapAlbum);
        }
        // Si iTunes no tiene al artista, usamos Deezer
        if (!canciones.length && hayWorker()) {
            const dzId = a.dzId || (await Vibeo.fotoArtista(a.nombre) || {}).dzId;
            if (dzId) {
                const [top, alb] = await Promise.all([
                    Vibeo.deezer(`artist/${dzId}/top?limit=30`).catch(() => null),
                    Vibeo.deezer(`artist/${dzId}/albums?limit=20`).catch(() => null)
                ]);
                canciones = ((top && top.data) || []).filter(t => t.title).map(t => ({ ...Vibeo.dzTrack(t), deezerArtistId: dzId }));
                albumes = ((alb && alb.data) || []).filter(x => x.title).map(x => ({ ...Vibeo.dzAlbum(x), artista: a.nombre }));
            }
        }
        if (!canciones.length) {
            const d = await api(`${IT}/search?term=${enc(a.nombre)}&media=music&entity=song&limit=20&country=${PAIS}`);
            canciones = (d.results || []).filter(x => x.trackName).map(Vibeo.mapear);
        }
        if (mio !== abrirToken) return;
        detalleLista = canciones;
        if (canciones.length) {
            if (!artistaActual.portada) {
                artistaActual.portada = canciones[0].portadaUrl;
                $('artist-header').style.backgroundImage = urlCss(canciones[0].portadaUrl);
            }
            pintarCanciones(canciones, lista);
        } else mensaje(lista, 'No se encontraron canciones.');
        if (albumes.length) { $('artist-albums-title').style.display = 'block'; pintarAlbumes(albumes, $('artist-albums-list')); }
    } catch (e) {
        if (mio === abrirToken) mensaje(lista, 'Error al cargar las canciones.');
    }
}

async function abrirAlbum(al) {
    const mio = ++abrirToken;
    cabecera(al.nombre, `Álbum · ${al.artista}`, al.portada);
    $('artist-songs-title').textContent = 'Canciones';
    const lista = $('artist-songs-list');
    mensaje(lista, 'Cargando...');
    cambiarVista(viewArtist);

    try {
        let canciones = [];
        if (al.dzId) {
            const d = await Vibeo.deezer(`album/${al.dzId}`);
            canciones = ((d.tracks && d.tracks.data) || []).filter(t => t.title).map(t => ({
                id: 'dz:' + t.id, titulo: t.title, artista: (t.artist && t.artist.name) || al.artista,
                deezerArtistId: t.artist && t.artist.id, portadaUrl: al.portada, origen: 'deezer'
            }));
        } else {
            const d = await api(`${IT}/lookup?id=${al.id}&entity=song&country=${PAIS}`);
            canciones = (d.results || []).filter(x => x.wrapperType === 'track' && x.trackName).map(Vibeo.mapear);
        }
        if (mio !== abrirToken) return;
        detalleLista = canciones;
        if (canciones.length) pintarCanciones(canciones, lista);
        else mensaje(lista, 'No se encontraron canciones en este álbum.');
    } catch (e) {
        if (mio === abrirToken) mensaje(lista, 'Error al cargar el álbum.');
    }
}

// Listas guardadas en tu navegador (Tus me gusta, Escuchado recientemente)
function abrirListaLocal(titulo, etiqueta, lista, fondo) {
    abrirToken++;
    cabecera(titulo, etiqueta, '', fondo);
    $('artist-songs-title').textContent = 'Canciones';
    cambiarVista(viewArtist);
    detalleLista = lista;
    if (lista.length) pintarCanciones(lista, $('artist-songs-list'));
    else mensaje($('artist-songs-list'), 'Aún no hay canciones aquí.');
}
function abrirFavoritos() {
    const f = getFavoritos();
    abrirListaLocal('Tus me gusta', `Playlist · ${f.length} canciones`, f, 'linear-gradient(135deg, #450af5, #c4efd9)');
}
function abrirRecientes() {
    const h = Vibeo.historial();
    abrirListaLocal('Escuchado recientemente', `Playlist · ${h.length} canciones`, h, 'linear-gradient(135deg, #1e3264, #509bf5)');
}

// ---------- Tu biblioteca estilo Spotify ----------
function filaBiblioteca(tileClase, tileContenido, titulo, sub, alClick) {
    const fila = el('div', 'lib-row');
    const tile = el('div', 'lib-tile ' + tileClase);
    if (typeof tileContenido === 'string') tile.innerHTML = tileContenido;
    else if (tileContenido) tile.appendChild(tileContenido);
    const txt = el('div', 'lib-text');
    txt.appendChild(el('div', 'lib-title', titulo));
    txt.appendChild(el('div', 'lib-sub', sub));
    fila.appendChild(tile); fila.appendChild(txt);
    fila.addEventListener('click', alClick);
    return fila;
}

function renderizarBiblioteca() {
    const lista = $('lib-list');
    lista.innerHTML = '';
    const verPlaylists = libFiltro === '' || libFiltro === 'playlists';
    const verArtistas = libFiltro === '' || libFiltro === 'artistas';

    if (verPlaylists) {
        const nFav = getFavoritos().length, nHist = Vibeo.historial().length;
        lista.appendChild(filaBiblioteca('liked', '<svg class="ic solid"><use href="#i-heart"/></svg>',
            'Tus me gusta', `Playlist · ${nFav} canciones`, abrirFavoritos));
        if (nHist) lista.appendChild(filaBiblioteca('recientes', '<svg class="ic"><use href="#i-music"/></svg>',
            'Escuchado recientemente', `Playlist · ${nHist} canciones`, abrirRecientes));
    }
    if (verArtistas) {
        getSeguidos().forEach(a => {
            let contenido;
            if (a.portada) { contenido = el('img'); contenido.src = a.portada; contenido.alt = ''; }
            else contenido = a.nombre.charAt(0).toUpperCase();
            lista.appendChild(filaBiblioteca('circle', contenido, a.nombre, 'Artista', () => abrirArtista(a)));
        });
        lista.appendChild(filaBiblioteca('add', '<svg class="ic"><use href="#i-plus"/></svg>',
            'Agregar artistas', '', agregarArtistas));
    }
}

document.querySelectorAll('#lib-chips .chip').forEach(btn => {
    btn.addEventListener('click', () => {
        libFiltro = libFiltro === btn.dataset.filtro ? '' : btn.dataset.filtro; // tocar de nuevo quita el filtro
        document.querySelectorAll('#lib-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.filtro === libFiltro));
        renderizarBiblioteca();
    });
});

// ---------- Arranque y pantalla de carga ----------
const primeraCarga = renderHome();

(function pantallaDeCarga() {
    const splash = $('splash');
    if (!splash) return;
    const MINIMO = 1800;   // milisegundos que se ve la animación como mínimo
    const MAXIMO = 9000;   // si algo tarda demasiado, se quita igual
    const inicio = Date.now();
    const ventanaLista = new Promise(r => document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }));
    const limite = new Promise(r => setTimeout(r, MAXIMO));
    Promise.race([Promise.all([primeraCarga.catch(() => {}), ventanaLista]), limite]).then(() => {
        const espera = Math.max(0, MINIMO - (Date.now() - inicio));
        setTimeout(() => {
            splash.classList.add('splash-fuera');
            setTimeout(() => splash.remove(), 700);
        }, espera);
    });
})();
