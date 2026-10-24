document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const titulo = params.get('titulo') || 'Canción';
    const artista = params.get('artista') || 'Artista';
    const portada = params.get('portada') || 'assets/imagenes/logo.png';

    document.getElementById('player-title').textContent = titulo;
    document.getElementById('player-artist').textContent = artista;
    document.getElementById('player-cover').src = portada;

    const audioElement = document.getElementById('main-audio');

    // Conexión a proveedor de audio directo mediante API con CORS habilitado
    const query = encodeURIComponent(`${titulo} ${artista}`);
    
    fetch(`https://corsproxy.io/?${encodeURIComponent(`https://api.deezer.com/search?q=${query}`)}`)
        .then(res => res.json())
        .then(data => {
            if (data && data.data && data.data.length > 0) {
                // Audio streaming directo de alta fidelidad y respuesta inmediata
                audioElement.src = data.data[0].preview;
                audioElement.play().catch(e => console.log("Autoplay interactivo requerido:", e));
            } else {
                alert("No se pudo obtener el audio de esta canción.");
            }
        })
        .catch(err => {
            console.error("Error al obtener la canción:", err);
        });
});

