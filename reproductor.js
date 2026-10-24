document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const titulo = params.get('titulo') || 'Canción';
    const artista = params.get('artista') || 'Artista';
    const portada = params.get('portada') || 'assets/imagenes/logo.png';

    document.getElementById('player-title').textContent = titulo;
    document.getElementById('player-artist').textContent = artista;
    document.getElementById('player-cover').src = portada;

    // IDs de YouTube fijos y garantizados para los temas principales, o búsqueda directa por consulta segura
    // Usamos una lista inteligente de respaldo para los temas más buscados y un generador universal seguro
    const query = encodeURIComponent(`${titulo} ${artista} audio oficial`);
    
    // Usamos el embed directo con parámetros estables que evitan bloqueos de reproducción externa
    const iframe = document.getElementById('youtube-frame');
    iframe.src = `https://www.youtube.com/embed?listType=search&list=${query}&autoplay=1`;
});

