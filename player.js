// Motor de Vibeo: reproducción, cola, sugerencias por género, favoritos, historial y datos de iTunes/Apple
const Vibeo = (() => {
    const $ = (id) => document.getElementById(id);
    const IT = 'https://itunes.apple.com';
    const PAIS = 'co'; // tienda de Colombia

    let yt = null, ytListo = false, pendiente = false;
    let cola = [], idx = -1, aleatorio = false, repetir = 'off'; // off | all | one
    let ids = [], intento = 0, peticion = 0, arrastrando = false;
    let pausaUsuario = false, reintentos = 0, ultimoReintento = 0;
    let sugeridas = [], autoplay = true, tokenSug = 0, buscandoSug = false;
    let chartsMem = null, chartsProm = null;

    const actual = () => cola[idx];
    const clave = (c) => `${c.titulo}|${c.artista}`.toLowerCase();
    const fmt = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const mezclar = (a) => a.sort(() => Math.random() - 0.5);
    const enc = encodeURIComponent;

    function icono(btnId, nombre, solid) {
        const svg = $(btnId).querySelector('svg');
        svg.querySelector('use').setAttribute('href', '#i-' + nombre);
        svg.classList.toggle('solid', !!solid);
    }

    // Convierte un resultado de iTunes en nuestro formato de canción
    function mapear(item) {
        return {
            id: item.trackId,
            titulo: item.trackName,
            artista: item.artistName,
            artistaId: item.artistId,
            genero: item.primaryGenreName,
            albumId: item.collectionId,
            album: item.collectionName,
            portadaUrl: (item.artworkUrl100 || '').replace('100x100bb', '500x500bb')
        };
    }
    // Primer artista de un nombre compuesto ("A, B & C" -> "A")
    const principal = (n) => (n || '').split(/\s*(?:,|&|\sy\s|\sfeat\.?\s|\sft\.?\s|\sx\s|\/)\s*/i)[0].trim();

    // ---------- Red (con caché en memoria) ----------
    async function fetchJSON(url, ms = 7000) {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), ms);
        try {
            const r = await fetch(url, { signal: ctl.signal });
            if (!r.ok) throw new Error(r.status);
            return await r.json();
        } finally { clearTimeout(t); }
    }
    const memo = new Map();
    function api(url, ms = 8000, ttl = 600000) {
        const h = memo.get(url);
        if (h && Date.now() - h.t < ttl) return Promise.resolve(h.d);
        return fetchJSON(url, ms).then(d => { memo.set(url, { t: Date.now(), d }); return d; });
    }

    // ---------- Géneros ----------
    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const VACIAS = new Set(['musica', 'music', 'de', 'y', 'and', 'la', 'el', 'los', 'las', 'en', 'del', 'latin', 'latino', 'latina', 'hip', 'hop']);
    const tokens = (s) => norm(s).split(/[^a-z0-9]+/).filter(t => t && !VACIAS.has(t)).map(t => t.slice(0, 5));
    function mismoGenero(a, b) {
        if (!a || !b) return false;
        if (norm(a) === norm(b)) return true;
        const B = tokens(b);
        return tokens(a).some(t => B.includes(t));
    }

    // ---------- Lo más escuchado (inicio y sugerencias) ----------
    const RSS = ['https://rss.applemarketingtools.com', 'https://rss.marketingtools.apple.com'];
    const SEMILLAS = ['Bad Bunny', 'Karol G', 'Feid', 'Peso Pluma', 'Shakira', 'Maluma', 'J Balvin', 'Rauw Alejandro', 'Taylor Swift', 'Don Omar'];
    const generoLimpio = (g) => (g || []).map(x => x.name).find(n => n && !/^(music|música|musica)$/i.test(n));
    const mapAlbum = (x) => ({
        id: x.collectionId, nombre: x.collectionName, artista: x.artistName, artistaId: x.artistId,
        portada: (x.artworkUrl100 || '').replace('100x100bb', '400x400bb'), anio: (x.releaseDate || '').slice(0, 4)
    });

    async function chartsDesdeRSS() {
        for (const base of RSS) {
            try {
                const [s, a] = await Promise.all([
                    fetchJSON(`${base}/api/v2/${PAIS}/music/most-played/50/songs.json`),
                    fetchJSON(`${base}/api/v2/${PAIS}/music/most-played/25/albums.json`)
                ]);
                const canciones = (s.feed.results || []).map(r => ({
                    id: r.id, titulo: r.name, artista: r.artistName, artistaId: r.artistId,
                    genero: generoLimpio(r.genres), portadaUrl: (r.artworkUrl100 || '').replace('100x100bb', '500x500bb')
                }));
                const albumes = (a.feed.results || []).map(r => ({
                    id: r.id, nombre: r.name, artista: r.artistName, artistaId: r.artistId,
                    portada: (r.artworkUrl100 || '').replace('100x100bb', '400x400bb'), anio: (r.releaseDate || '').slice(0, 4)
                }));
                if (canciones.length) return { canciones, albumes };
            } catch (e) { /* probamos el siguiente servidor */ }
        }
        return null;
    }
    // Respaldo si el servidor de listas de Apple no responde: canciones de artistas muy escuchados
    async function chartsDesdeBusqueda() {
        const res = await Promise.all(SEMILLAS.map(n =>
            fetchJSON(`${IT}/search?term=${enc(n)}&media=music&entity=song&limit=6&country=${PAIS}`).catch(() => null)));
        const canciones = [], albumes = [], vistos = new Set();
        res.forEach(r => ((r && r.results) || []).filter(x => x.trackName).forEach(x => {
            canciones.push(mapear(x));
            if (x.collectionId && !vistos.has(x.collectionId)) { vistos.add(x.collectionId); albumes.push(mapAlbum(x)); }
        }));
        return canciones.length ? { canciones, albumes } : null;
    }
    function cargarCharts() {
        if (chartsMem) return Promise.resolve(chartsMem);
        if (!chartsProm) {
            chartsProm = (async () => {
                try {
                    const g = JSON.parse(localStorage.getItem('vibeo_charts'));
                    if (g && Date.now() - g.t < 6 * 3600e3 && g.d && g.d.canciones && g.d.canciones.length) return g.d;
                } catch {}
                const d = (await chartsDesdeRSS()) || (await chartsDesdeBusqueda());
                if (d) { try { localStorage.setItem('vibeo_charts', JSON.stringify({ t: Date.now(), d })); } catch {} }
                return d;
            })().then(d => { if (d) chartsMem = d; else chartsProm = null; return d; });
        }
        return chartsProm;
    }

    // ---------- Historial ----------
    const getHist = () => { try { return JSON.parse(localStorage.getItem('vibeo_hist')) || []; } catch { return []; } };
    function registrarHistorial(c) {
        let h = getHist().filter(x => clave(x) !== clave(c));
        h.unshift({ titulo: c.titulo, artista: c.artista, artistaId: c.artistaId, genero: c.genero, portadaUrl: c.portadaUrl });
        try { localStorage.setItem('vibeo_hist', JSON.stringify(h.slice(0, 12))); } catch {}
    }

    // ---------- Estado visual (animación de carga, mensajes) ----------
    function setCargando(v) {
        $('vp-stage').classList.toggle('vp-loading', v);
        $('vp-mini').classList.toggle('vp-loading', v);
    }
    function setMensaje(t) {
        const m = $('vp-msg');
        m.textContent = t || '';
        m.classList.toggle('vp-show', !!t);
    }
    function pintarPlay(reproduciendo) {
        icono('vp-play', reproduciendo ? 'pause' : 'play', true);
        icono('vp-mini-play', reproduciendo ? 'pause' : 'play', true);
    }

    // ---------- Favoritos (misma clave que script.js) ----------
    const getFavs = () => { try { return JSON.parse(localStorage.getItem('vibeo_favs')) || []; } catch { return []; } };
    const esFav = (c) => !!c && getFavs().some(f => clave(f) === clave(c));
    function pintarFav() { icono('vp-fav', 'heart', esFav(actual())); }
    function alternarFavCancion(c) {
        let f = getFavs(), ahora;
        if (esFav(c)) { f = f.filter(x => clave(x) !== clave(c)); ahora = false; }
        else {
            f.push({ titulo: c.titulo, artista: c.artista, artistaId: c.artistaId, genero: c.genero, portadaUrl: c.portadaUrl });
            ahora = true;
        }
        localStorage.setItem('vibeo_favs', JSON.stringify(f));
        if (actual()) pintarFav();
        if (typeof renderizarBiblioteca === 'function') renderizarBiblioteca();
        return ahora;
    }

    // ---------- Búsqueda del video ----------
    async function buscarAPI(q) {
        const d = await fetchJSON(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=5&q=${enc(q)}&key=${CONFIG.API_KEY}`);
        if (d.error) throw new Error(d.error.message);
        return d.items.map(v => v.id.videoId);
    }
    async function buscarPiped(base, q) {
        const d = await fetchJSON(`${base}/search?q=${enc(q)}&filter=videos`);
        return (d.items || []).map(v => (v.url || '').split('v=')[1]).filter(Boolean).slice(0, 5);
    }
    async function buscarInvidious(base, q) {
        const d = await fetchJSON(`${base}/api/v1/search?q=${enc(q)}&type=video`);
        return d.map(v => v.videoId).filter(Boolean).slice(0, 5);
    }
    async function buscarWorker(c) {
        const d = await fetchJSON(`${CONFIG.WORKER_URL}?titulo=${enc(c.titulo)}&artista=${enc(c.artista)}`, 8000);
        if (d.error) throw new Error(d.error);
        return d.ids || [];
    }
    async function resolverIds(c) {
        const k = clave(c);
        if (CONFIG.VIDEOS_FIJOS[k]) return [].concat(CONFIG.VIDEOS_FIJOS[k]);
        try {
            const cache = localStorage.getItem('vibeo_yt_' + k);
            if (cache) return JSON.parse(cache);
        } catch {}

        const q = `${c.titulo} ${c.artista} audio`;
        const intentos = [];
        if (CONFIG.WORKER_URL) intentos.push(() => buscarWorker(c));
        if (CONFIG.API_KEY) intentos.push(() => buscarAPI(q));
        CONFIG.INSTANCIAS_PIPED.forEach(b => intentos.push(() => buscarPiped(b, q)));
        CONFIG.INSTANCIAS_INVIDIOUS.forEach(b => intentos.push(() => buscarInvidious(b, q)));

        for (const f of intentos) {
            try {
                const r = await f();
                if (r && r.length) {
                    try { localStorage.setItem('vibeo_yt_' + k, JSON.stringify(r)); } catch {}
                    return r;
                }
            } catch (e) { /* probamos la siguiente fuente */ }
        }
        return [];
    }

    // ---------- Sugerencias: mismo género (+ otras del artista y lo popular del género) ----------
    async function cargarSugeridas(semilla) {
        if (!semilla) return;
        const mia = ++tokenSug;
        sugeridas = []; buscandoSug = true; renderCola();
        const vacio = { results: [] };

        const art = semilla.artistaId
            ? await api(`${IT}/lookup?id=${semilla.artistaId}&entity=song&limit=20&country=${PAIS}`).catch(() => vacio)
            : vacio;
        if (mia !== tokenSug) return;

        let genero = semilla.genero;
        if (!genero) {
            const a0 = (art.results || []).find(x => x.wrapperType === 'artist');
            genero = a0 && a0.primaryGenreName;
        }
        const gen = genero
            ? await api(`${IT}/search?term=${enc(genero)}&media=music&entity=song&attribute=genreIndex&limit=50&country=${PAIS}`).catch(() => vacio)
            : vacio;
        if (mia !== tokenSug) return;

        const vistas = new Set(cola.map(clave));
        const aceptar = (x) => { const k = clave(x); if (vistas.has(k)) return false; vistas.add(k); return true; };
        const chart = chartsMem ? chartsMem.canciones : [];

        const delArtista = mezclar((art.results || []).filter(x => x.wrapperType === 'track' && x.trackName).map(mapear)).filter(aceptar).slice(0, 5);
        const delChart = mezclar(chart.filter(x => genero && mismoGenero(x.genero, genero))).filter(aceptar).slice(0, 6);
        const delGenero = mezclar((gen.results || []).filter(x => x.trackName).map(mapear))
            .filter(x => String(x.artistaId) !== String(semilla.artistaId)).filter(aceptar).slice(0, 10);

        let lista = [...delArtista, ...delChart, ...delGenero];
        if (lista.length < 5) lista = lista.concat(mezclar(chart.slice()).filter(aceptar).slice(0, 8)); // respaldo: lo popular
        sugeridas = mezclar(lista);
        buscandoSug = false;
        renderCola();
    }

    // ---------- Reproducción ----------
    function cargarVideo() {
        if (intento >= ids.length) {
            try { localStorage.removeItem('vibeo_yt_' + clave(actual())); } catch {}
            setCargando(false); pintarPlay(false);
            setMensaje('Este video no se puede reproducir. Prueba otra canción.');
            return;
        }
        if (!ytListo) { pendiente = true; return; }
        const mia = peticion;
        yt.loadVideoById(ids[intento]);
        // Si el navegador bloqueó el inicio automático, dejamos de mostrar la carga
        setTimeout(() => {
            if (mia !== peticion || !ytListo) return;
            const st = yt.getPlayerState();
            if (st === -1 || st === 5) {
                setCargando(false); pintarPlay(false);
                setMensaje('Toca reproducir para iniciar');
            }
        }, 6000);
    }

    async function reproducirIndice(i) {
        if (i < 0 || i >= cola.length) return;
        idx = i;
        pausaUsuario = false;
        const c = actual();
        const mia = ++peticion;
        registrarHistorial(c);
        pintarCancion(c);
        setMensaje('');
        setCargando(true);
        const r = await resolverIds(c);
        if (mia !== peticion) return; // el usuario ya cambió de canción
        if (!r.length) {
            setCargando(false); pintarPlay(false);
            setMensaje('No se encontró esta canción.');
            return;
        }
        ids = r; intento = 0;
        cargarVideo();
    }

    function siguiente(auto = false) {
        if (!cola.length) return;
        if (repetir === 'one' && auto) { yt.seekTo(0, true); yt.playVideo(); return; }
        let n, rellenar = false;
        if (aleatorio && cola.length > 1) {
            do { n = Math.floor(Math.random() * cola.length); } while (n === idx);
        } else {
            n = idx + 1;
            if (n >= cola.length) {
                if (repetir === 'all') n = 0;
                else if (autoplay && sugeridas.length) {
                    cola.push(...sugeridas.splice(0));
                    rellenar = true;
                } else { setCargando(false); pintarPlay(false); return; }
            }
        }
        reproducirIndice(n);
        if (rellenar) cargarSugeridas(cola[n]);
    }
    function anterior() {
        if (!cola.length) return;
        if (yt && yt.getCurrentTime && yt.getCurrentTime() > 3) { yt.seekTo(0, true); return; }
        reproducirIndice(Math.max(0, idx - 1));
    }
    function alternarPlay() {
        if (!yt || !ytListo) return;
        const s = yt.getPlayerState();
        if (s === YT.PlayerState.PLAYING || s === YT.PlayerState.BUFFERING) {
            pausaUsuario = true; yt.pauseVideo();
        } else {
            pausaUsuario = false; setMensaje(''); yt.playVideo();
        }
    }

    // ---------- Color de fondo según la portada ----------
    function colorDe(url) {
        return new Promise(res => {
            if (!url) return res(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const c = document.createElement('canvas');
                    c.width = c.height = 12;
                    const x = c.getContext('2d');
                    x.drawImage(img, 0, 0, 12, 12);
                    const d = x.getImageData(0, 0, 12, 12).data;
                    let r = 0, g = 0, b = 0, n = 0;
                    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
                    res([r / n, g / n, b / n]);
                } catch { res(null); }
            };
            img.onerror = () => res(null);
            img.src = url;
        });
    }
    async function tintar(c) {
        const rgb = await colorDe(c.portadaUrl);
        if (actual() !== c) return;
        const st = document.documentElement.style;
        if (!rgb) { st.removeProperty('--vp-tint'); st.removeProperty('--vp-tint-dark'); return; }
        const f = (k) => `rgb(${rgb.map(v => Math.round(v * k)).join(',')})`;
        st.setProperty('--vp-tint', f(0.75));
        st.setProperty('--vp-tint-dark', f(0.5));
    }

    // ---------- Acerca del artista (foto y biografía desde Wikipedia, si existe) ----------
    const infoCache = new Map();
    const ES_ARTISTA = /cantante|cantautor|músic|musico|rapero|banda|grupo|dúo|duo|\bdj\b|productor|compositor|agrupaci|trío|singer|musician|rapper|band|songwriter|group|artist|producer/i;
    async function wiki(lang, titulo) {
        const d = await fetchJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc(titulo.replace(/ /g, '_'))}?redirect=true`, 5000);
        if (d.type !== 'standard') return null;
        if (!ES_ARTISTA.test((d.description || '') + ' ' + (d.extract || '').slice(0, 300))) return null;
        const foto = d.originalimage && d.originalimage.width <= 1600 ? d.originalimage.source : (d.thumbnail && d.thumbnail.source);
        return { foto, bio: d.extract, url: d.content_urls && d.content_urls.desktop && d.content_urls.desktop.page };
    }
    async function infoArtista(nombre) {
        const n = principal(nombre);
        if (!n) return null;
        if (infoCache.has(n)) return infoCache.get(n);
        let r = null;
        for (const [l, t] of [['es', n], ['es', n + ' (cantante)'], ['en', n], ['en', n + ' (singer)']]) {
            try { r = await wiki(l, t); if (r) break; } catch {}
        }
        infoCache.set(n, r);
        return r;
    }
    const urlCss = (u) => 'url("' + String(u).replace(/"/g, '%22') + '")';
    async function pintarAcerca(c) {
        $('vp-about-name').textContent = principal(c.artista) || c.artista;
        $('vp-about-meta').textContent = c.genero || '';
        $('vp-about-img').style.backgroundImage = urlCss(c.portadaUrl);
        const bio = $('vp-about-bio');
        bio.textContent = ''; bio.classList.remove('open');
        $('vp-about-more').style.display = 'none';
        $('vp-about-src').innerHTML = '';

        const info = await infoArtista(c.artista);
        if (actual() !== c || !info) return;
        if (info.foto) $('vp-about-img').style.backgroundImage = urlCss(info.foto);
        if (info.bio) {
            bio.textContent = info.bio;
            if (info.bio.length > 220) { $('vp-about-more').textContent = 'ver más'; $('vp-about-more').style.display = 'inline-block'; }
            if (info.url) {
                const src = $('vp-about-src');
                src.textContent = 'Fuente: ';
                const a = document.createElement('a');
                a.href = info.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Wikipedia';
                src.appendChild(a);
            }
        }
    }

    // ---------- Interfaz ----------
    function pintarCancion(c) {
        document.body.classList.add('vp-active');
        $('vp-mini-cover').src = c.portadaUrl;
        $('vp-mini-title').textContent = c.titulo;
        $('vp-mini-artist').textContent = c.artista;
        $('vp-cover').src = c.portadaUrl;
        $('vp-title').textContent = c.titulo;
        $('vp-artist').textContent = c.artista;
        $('vp-from-title').textContent = c.titulo;
        $('vp-progress').value = 0;
        $('vp-time-cur').textContent = '0:00';
        $('vp-time-tot').textContent = '0:00';
        $('vp-scroll').scrollTop = 0;
        pintarFav();
        renderCola();
        tintar(c);
        pintarAcerca(c);
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: c.titulo, artist: c.artista,
                artwork: [{ src: c.portadaUrl, sizes: '500x500', type: 'image/jpeg' }]
            });
        }
    }

    function filaCola(c, onClick, activa) {
        const f = document.createElement('div');
        f.className = 'vp-q-item' + (activa ? ' vp-q-active' : '');
        const img = document.createElement('img');
        img.src = c.portadaUrl;
        const txt = document.createElement('div');
        const a = document.createElement('div'); a.className = 'vp-q-title'; a.textContent = c.titulo;
        const b = document.createElement('div'); b.className = 'vp-q-artist'; b.textContent = c.artista;
        txt.appendChild(a); txt.appendChild(b);
        f.appendChild(img); f.appendChild(txt);
        if (onClick) f.addEventListener('click', onClick);
        return f;
    }
    function renderCola() {
        const body = $('vp-queue-body');
        body.innerHTML = '';
        const titulo = (t) => {
            const h = document.createElement('div');
            h.className = 'vp-q-section'; h.textContent = t;
            body.appendChild(h);
        };
        const nota = (t) => {
            const p = document.createElement('div'); p.className = 'vp-q-empty'; p.textContent = t;
            body.appendChild(p);
        };
        const c = actual();
        if (c) { titulo('Reproduciendo ahora'); body.appendChild(filaCola(c, null, true)); }

        const sig = cola.slice(idx + 1);
        if (sig.length) {
            titulo('A continuación');
            sig.forEach((s, i) => body.appendChild(filaCola(s, () => reproducirIndice(idx + 1 + i))));
        }
        if (autoplay) {
            titulo('Sugeridas');
            if (buscandoSug) nota('Buscando canciones del mismo género...');
            else if (!sugeridas.length) nota('No hay sugerencias por ahora.');
            else sugeridas.forEach(s => body.appendChild(filaCola(s, () => {
                sugeridas = sugeridas.filter(x => x !== s);
                cola.push(s);
                reproducirIndice(cola.length - 1);
            })));
        }
    }

    // ---------- YouTube IFrame API ----------
    window.onYouTubeIframeAPIReady = () => {
        yt = new YT.Player('yt-player', {
            width: '100%', height: '100%',
            playerVars: { controls: 0, playsinline: 1, rel: 0, disablekb: 1, modestbranding: 1 },
            events: {
                onReady: () => {
                    ytListo = true;
                    yt.setVolume(100);
                    if (pendiente) { pendiente = false; cargarVideo(); }
                },
                onStateChange: (e) => {
                    const S = YT.PlayerState;
                    if (e.data === S.PLAYING) {
                        setCargando(false); setMensaje(''); pintarPlay(true);
                        reintentos = 0;
                    } else if (e.data === S.PAUSED) {
                        setCargando(false); pintarPlay(false);
                        // Pausa que NO hizo la persona (el navegador la cortó): reanudamos
                        if (!pausaUsuario && !arrastrando) {
                            const ahora = Date.now();
                            if (ahora - ultimoReintento > 10000) reintentos = 0;
                            if (reintentos < 3) {
                                reintentos++; ultimoReintento = ahora;
                                setTimeout(() => {
                                    if (!pausaUsuario && yt.getPlayerState() === YT.PlayerState.PAUSED) yt.playVideo();
                                }, 400);
                            }
                        }
                    } else if (e.data === S.BUFFERING) {
                        setCargando(true);
                    } else if (e.data === S.ENDED) {
                        pintarPlay(false); siguiente(true);
                    }
                },
                onError: () => { intento++; cargarVideo(); } // no incrustable: probamos el siguiente video
            }
        });
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    // Al volver a la página (desbloquear pantalla, cambiar de app), reanudar si no la pausó la persona
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && ytListo && !pausaUsuario && idx >= 0) {
            if (yt.getPlayerState() === YT.PlayerState.PAUSED) yt.playVideo();
        }
    });

    // Barra de progreso
    setInterval(() => {
        if (!ytListo || !yt.getDuration || arrastrando) return;
        const d = yt.getDuration(), t = yt.getCurrentTime();
        if (d > 0) {
            $('vp-progress').value = (t / d) * 100;
            $('vp-time-cur').textContent = fmt(t);
            $('vp-time-tot').textContent = fmt(d);
        }
    }, 500);

    // ---------- Eventos ----------
    const overlay = $('vp-overlay');
    const abrir = () => overlay.classList.add('vp-open');
    const cerrar = () => { overlay.classList.remove('vp-open'); $('vp-queue').classList.remove('vp-show'); };

    $('vp-mini').addEventListener('click', abrir);
    $('vp-mini-play').addEventListener('click', (e) => { e.stopPropagation(); alternarPlay(); });
    $('vp-close').addEventListener('click', cerrar);
    $('vp-play').addEventListener('click', alternarPlay);
    $('vp-next').addEventListener('click', () => siguiente(false));
    $('vp-prev').addEventListener('click', anterior);
    $('vp-fav').addEventListener('click', () => { if (actual()) alternarFavCancion(actual()); });

    $('vp-shuffle').addEventListener('click', () => {
        aleatorio = !aleatorio;
        $('vp-shuffle').classList.toggle('vp-on', aleatorio);
    });
    $('vp-repeat').addEventListener('click', () => {
        repetir = repetir === 'off' ? 'all' : repetir === 'all' ? 'one' : 'off';
        icono('vp-repeat', repetir === 'one' ? 'repeat-one' : 'repeat', false);
        $('vp-repeat').classList.toggle('vp-on', repetir !== 'off');
    });

    document.querySelectorAll('.vp-tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.vp-tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            overlay.classList.toggle('vp-tab-video', btn.dataset.tab === 'video');
            overlay.classList.toggle('vp-tab-cover', btn.dataset.tab === 'cover');
        });
    });

    $('vp-queue-btn').addEventListener('click', () => { renderCola(); $('vp-queue').classList.add('vp-show'); });
    $('vp-queue-close').addEventListener('click', () => $('vp-queue').classList.remove('vp-show'));
    $('vp-autoplay').addEventListener('change', (e) => { autoplay = e.target.checked; renderCola(); });

    $('vp-about-more').addEventListener('click', () => {
        const b = $('vp-about-bio');
        const abierto = b.classList.toggle('open');
        $('vp-about-more').textContent = abierto ? 'ver menos' : 'ver más';
    });
    $('vp-about-open').addEventListener('click', () => {
        const c = actual();
        if (!c) return;
        cerrar();
        if (typeof abrirArtista === 'function') abrirArtista({ id: c.artistaId, nombre: principal(c.artista) || c.artista });
    });

    $('vp-progress').addEventListener('input', () => {
        arrastrando = true;
        const d = ytListo ? yt.getDuration() : 0;
        $('vp-time-cur').textContent = fmt((Number($('vp-progress').value) / 100) * d);
    });
    $('vp-progress').addEventListener('change', () => {
        if (ytListo) yt.seekTo((Number($('vp-progress').value) / 100) * yt.getDuration(), true);
        arrastrando = false;
    });

    // Controles de la pantalla de bloqueo / notificaciones
    if ('mediaSession' in navigator) {
        const ms = navigator.mediaSession;
        try {
            ms.setActionHandler('play', () => { pausaUsuario = false; if (yt) yt.playVideo(); });
            ms.setActionHandler('pause', () => { pausaUsuario = true; if (yt) yt.pauseVideo(); });
            ms.setActionHandler('previoustrack', anterior);
            ms.setActionHandler('nexttrack', () => siguiente(false));
        } catch {}
    }

    // API pública
    return {
        IT, PAIS,
        api, mapear, mapAlbum, principal, mezclar,
        esFav, alternarFavCancion,
        cargarCharts,
        historial: getHist,
        reproducirLista(canciones, indice) {
            cola = canciones.slice();
            reproducirIndice(indice);
            cargarSugeridas(canciones[indice]);
            abrir();
        }
    };
})();
