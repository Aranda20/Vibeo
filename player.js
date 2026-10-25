// Motor de reproducción de Vibeo: cola, sugerencias, favoritos y YouTube IFrame API
const Vibeo = (() => {
    const $ = (id) => document.getElementById(id);

    let yt = null, ytListo = false, pendiente = false;
    let cola = [], idx = -1, aleatorio = false, repetir = 'off'; // off | all | one
    let ids = [], intento = 0, peticion = 0, arrastrando = false;
    let pausaUsuario = false, reintentos = 0, ultimoReintento = 0;
    let sugeridas = [], autoplay = true, tokenSug = 0, buscandoSug = false;

    const actual = () => cola[idx];
    const clave = (c) => `${c.titulo}|${c.artista}`.toLowerCase();
    const fmt = (s) => { s = Math.floor(s || 0); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

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
        const d = await fetchJSON(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoEmbeddable=true&videoCategoryId=10&maxResults=5&q=${encodeURIComponent(q)}&key=${CONFIG.API_KEY}`);
        if (d.error) throw new Error(d.error.message);
        return d.items.map(v => v.id.videoId);
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

    // ---------- Sugerencias (misma artista + mismo género, vía iTunes) ----------
    async function cargarSugeridas(semilla) {
        if (!semilla) return;
        const mia = ++tokenSug;
        sugeridas = []; buscandoSug = true; renderCola();
        const vacio = { results: [] };
        const [a, g] = await Promise.all([
            semilla.artistaId
                ? fetchJSON(`https://itunes.apple.com/lookup?id=${semilla.artistaId}&entity=song&limit=20`).catch(() => vacio)
                : vacio,
            semilla.genero
                ? fetchJSON(`https://itunes.apple.com/search?term=${encodeURIComponent(semilla.genero)}&media=music&entity=song&limit=30`).catch(() => vacio)
                : vacio
        ]);
        if (mia !== tokenSug) return;

        const vistas = new Set(cola.map(clave));
        const aceptar = (x) => { const k = clave(x); if (vistas.has(k)) return false; vistas.add(k); return true; };
        const delArtista = (a.results || []).filter(x => x.wrapperType === 'track' && x.trackName)
            .map(mapear).filter(aceptar).slice(0, 6);
        const delGenero = (g.results || []).filter(x => x.trackName).map(mapear)
            .filter(x => x.artistaId !== semilla.artistaId).filter(aceptar).slice(0, 14);

        sugeridas = [...delArtista, ...delGenero].sort(() => Math.random() - 0.5);
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
        const c = actual();
        if (c) { titulo('Reproduciendo ahora'); body.appendChild(filaCola(c, null, true)); }

        const sig = cola.slice(idx + 1);
        if (sig.length) {
            titulo('A continuación');
            sig.forEach((s, i) => body.appendChild(filaCola(s, () => reproducirIndice(idx + 1 + i))));
        }
        if (autoplay) {
            titulo('Sugeridas');
            if (buscandoSug) {
                const p = document.createElement('div'); p.className = 'vp-q-empty';
                p.textContent = 'Buscando canciones similares...';
                body.appendChild(p);
            } else if (!sugeridas.length) {
                const p = document.createElement('div'); p.className = 'vp-q-empty';
                p.textContent = 'No hay sugerencias por ahora.';
                body.appendChild(p);
            } else {
                sugeridas.forEach(s => body.appendChild(filaCola(s, () => {
                    sugeridas = sugeridas.filter(x => x !== s);
                    cola.push(s);
                    reproducirIndice(cola.length - 1);
                })));
            }
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
        mapear,
        esFav,
        alternarFavCancion,
        reproducirLista(canciones, indice) {
            cola = canciones.slice();
            reproducirIndice(indice);
            cargarSugeridas(canciones[indice]);
            abrir();
        }
    };
})();
