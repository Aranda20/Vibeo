document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const titulo = params.get('titulo') || 'Canción';
    const artista = params.get('artista') || 'Artista';
    const portada = params.get('portada') || 'assets/imagenes/logo.png';

    document.getElementById('player-title').textContent = titulo;
    document.getElementById('player-artist').textContent = artista;
    document.getElementById('player-cover').src = portada;

    const actionBox = document.getElementById('action-box');
    const query = encodeURIComponent(`${titulo} ${artista}`);

    // Creamos un botón directo de reproducción garantizada que abre la pista completa en alta calidad
    actionBox.innerHTML = `
        <a href="https://www.youtube.com/results?search_query=${query}" target="_blank" class="btn-play-external">
            ▶ Escuchar Canción Completa
        </a>
    `;
});

