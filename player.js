// Motor de reproducción de Vibeo: cola, aleatorio, repetir, favoritos y YouTube IFrame API
const Vibeo = (() => {
    const $ = (id) => document.getElementById(id);

    let yt = null, ytListo = false, pendiente = false;
    let cola = [], idx = -1, aleatorio = false, repetir = 'off'; // off | all | one
    let ids = [], intento = 0, peticion = 0, timer = null, arrastrando = false;

    const actual = () => cola[idx];
    const clave = (c) => `${c.titulo}|${c.artista}`.toLowerCase();
    const fmt = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const estado = (t) => { $('vp-status').textContent = t; };
    let ultimoError = '';

    // ---------- Favoritos (misma clave que script.js) ----------
    const getFavs = () => { try { return JSON.parse(localStorage.getItem('vibeo_favs')) || []; } catch { return []; } };
    const esFav = (c) => !!c && getFavs().some(f => clave(f) === clave(c));
    function pintarFav() { $('vp-fav').textContent = esFav(actual()) ? '♥' : '♡'; }
    function alternarFav() {
        const c = actual(); if (!c) return;
        let f = getFavs();
        if (esFav(c)) f = f.filter(x => clave(x) !== clave(c));
        else f.push({ titulo: c.titulo, artista: c.artista, portadaUrl: c.portadaUrl });
        localStorage.setItem('vibeo_favs', JSON.stringify(f));
        pintarFav();
        if (typeof renderizarBiblioteca === 'function') renderizarBiblioteca();
    }

    // ---------- Búsqueda del video ----------
    async function fetchJSON(url, ms = 6000) {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), ms);
        try {
            const r = await fetch(url, { signal: ctl.signal });
            if (!r.ok) throw new Error(r.status);
            return await r.json();
        } finally { clearTimeout(t); }
    }
    async function buscarAPI(q) {
        try {
            const d = await fetchJSON(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=5&q=${encodeURIComponent(q)}&key=${CONFIG.API_KEY}`);
            if (d.error) throw new Error(d.error.message);
            return d.items.map(v => v.id.videoId);
        } catch (e) {
            ultimoError = e.message || String(e);
            throw e;
        }
    }
    async function buscarPiped(base, q) {
        const d = await fetchJSON(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`);
        return (d.items || []).map(v => (v.url || '').split('v=')[1]).filter(Boolean).slice(0, 5);
    }
    async function buscarInvidious(base, q) {
        const d = await fetchJSON(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
        return d.map(v => v.videoId).filter(Boolean).slice(0, 5);
    }
    async function buscarWorker(c) {
        const d = await fetchJSON(`${CONFIG.WORKER_URL}?titulo=${encodeURIComponent(c.titulo)}&artista=${encodeURIComponent(c.artista)}`, 8000);
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

        ultimoError = '';
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

    // ---------- Reproducción ----------
    function cargarVideo() {
        if (intento >= ids.length) {
            try { localStorage.removeItem('vibeo_yt_' + clave(actual())); } catch {}
            estado('Este video no se puede reproducir. Prueba otra canción.');
            return;
        }
        if (!ytListo) { pendiente = true; return; }
        yt.loadVideoById(ids[intento]);
    }

    async function reproducirIndice(i) {
        if (i < 0 || i >= cola.length) return;
        idx = i;
        const c = actual();
        const mia = ++peticion;
        pintarCancion(c);
        estado('Buscando...');
        const r = await resolverIds(c);
        if (mia !== peticion) return; // el usuario ya cambió de canción
        if (!r.length) {
            estado(CONFIG.API_KEY
                ? 'Error de YouTube: ' + (ultimoError || 'sin resultados')
                : 'Falta la API key en config.js (los servidores sin clave no respondieron).');
            return;
        }
        ids = r; intento = 0;
        cargarVideo();
    }

    function siguiente(auto = false) {
        if (!cola.length) return;
        if (repetir === 'one' && auto) { yt.seekTo(0, true); yt.playVideo(); return; }
        let n;
        if (aleatorio && cola.length > 1) {
            do { n = Math.floor(Math.random() * cola.length); } while (n === idx);
        } else {
            n = idx + 1;
            if (n >= cola.length) {
                if (repetir === 'all') n = 0;
                else { if (auto) estado('Fin de la cola'); return; }
            }
        }
        reproducirIndice(n);
    }
    function anterior() {
        if (!cola.length) return;
        if (yt && yt.getCurrentTime && yt.getCurrentTime() > 3) { yt.seekTo(0, true); return; }
        reproducirIndice(Math.max(0, idx - 1));
    }
    function alternarPlay() {
        if (!yt || !ytListo) return;
        const s = yt.getPlayerState();
        if (s === YT.PlayerState.PLAYING || s === YT.PlayerState.BUFFERING) yt.pauseVideo();
        else yt.playVideo();
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
        pintarFav();
        renderCola();
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: c.titulo, artist: c.artista,
                artwork: [{ src: c.portadaUrl, sizes: '500x500', type: 'image/jpeg' }]
            });
        }
    }
    function pintarPlay(reproduciendo) {
        const t = reproduciendo ? '⏸' : '▶';
        $('vp-play').textContent = t;
        $('vp-mini-play').textContent = t;
    }
    function renderCola() {
        const box = $('vp-queue-list');
        box.innerHTML = '';
        cola.forEach((c, i) => {
            const fila = document.createElement('div');
            fila.className = 'vp-q-item' + (i === idx ? ' vp-q-active' : '');
            const img = document.createElement('img');
            img.src = c.portadaUrl;
            const txt = document.createElement('div');
            const a = document.createElement('div'); a.className = 'vp-q-title'; a.textContent = c.titulo;
            const b = document.createElement('div'); b.className = 'vp-q-artist'; b.textContent = c.artista;
            txt.appendChild(a); txt.appendChild(b);
            fila.appendChild(img); fila.appendChild(txt);
            fila.addEventListener('click', () => reproducirIndice(i));
            box.appendChild(fila);
        });
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
                    if (e.data === S.PLAYING) { pintarPlay(true); estado('Reproduciendo'); }
                    else if (e.data === S.PAUSED) { pintarPlay(false); estado('En pausa'); }
                    else if (e.data === S.BUFFERING) { estado('Cargando...'); }
                    else if (e.data === S.ENDED) { pintarPlay(false); siguiente(true); }
                },
                onError: () => { intento++; cargarVideo(); } // no incrustable: probamos el siguiente video
            }
        });
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    // Barra de progreso
    timer = setInterval(() => {
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
    $('vp-fav').addEventListener('click', alternarFav);

    $('vp-shuffle').addEventListener('click', () => {
        aleatorio = !aleatorio;
        $('vp-shuffle').classList.toggle('vp-on', aleatorio);
    });
    $('vp-repeat').addEventListener('click', () => {
        repetir = repetir === 'off' ? 'all' : repetir === 'all' ? 'one' : 'off';
        $('vp-repeat').textContent = repetir === 'one' ? '🔂' : '🔁';
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

    $('vp-queue-btn').addEventListener('click', () => $('vp-queue').classList.add('vp-show'));
    $('vp-queue-close').addEventListener('click', () => $('vp-queue').classList.remove('vp-show'));

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
            ms.setActionHandler('play', () => yt && yt.playVideo());
            ms.setActionHandler('pause', () => yt && yt.pauseVideo());
            ms.setActionHandler('previoustrack', anterior);
            ms.setActionHandler('nexttrack', () => siguiente(false));
        } catch {}
    }

    // API pública
    return {
        reproducirLista(canciones, indice) {
            cola = canciones.slice();
            reproducirIndice(indice);
            abrir();
        }
    };
})();
