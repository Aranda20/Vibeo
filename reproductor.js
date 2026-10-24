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

    // Insertamos un reproductor de audio nativo estético directamente en tu página
    actionBox.innerHTML = `
        <div style="width: 100%; display: flex; flex-direction: column; gap: 10px;">
            <audio id="audio-nativo" controls autoplay style="width: 100%; border-radius: 30px;"></audio>
            <p id="status-text" style="font-size: 0.8rem; color: #b3b3b3; margin: 0;">Conectando con el servidor de audio...</p>
        </div>
    `;

    const audioElement = document.getElementById('audio-nativo');
    const statusText = document.getElementById('status-text');

    // Usamos pasarelas de audio estables para extraer el flujo directamente en la web
    fetch(`https://pipedapi.kavin.rocks/search?q=${query}&filter=music_songs`)
        .then(res => res.json())
        .then(data => {
            if (data && data.items && data.items.length > 0) {
                const videoId = data.items[0].url.split("v=")[1];
                return fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
            } else {
                throw new Error("No encontrado");
            }
        })
        .then(res => res.json())
        .then(streamData => {
            if (streamData && streamData.audioStreams && streamData.audioStreams.length > 0) {
                const bestAudio = streamData.audioStreams.find(s => s.mimeType.includes("audio/mp4")) || streamData.audioStreams[0];
                audioElement.src = bestAudio.url;
                audioElement.play().then(() => {
                    statusText.textContent = "Reproduciendo audio completo";
                }).catch(() => {
                    statusText.textContent = "Presiona play para iniciar";
                });
            } else {
                throw new Error("Stream no disponible");
            }
        })
        .catch(() => {
            // Respaldo secundario automático con pasarela de audio global
            audioElement.src = `https://invidious.io.lol/api/v1/search?q=${query}`;
            audioElement.play().then(() => {
                statusText.textContent = "Reproduciendo (Modo Alternativo)";
            }).catch(() => {
                statusText.textContent = "Haz clic en el botón Play del reproductor";
            });
        });
});

