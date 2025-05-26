const birdList = document.getElementById('bird-list');
const mp3List = document.getElementById('mp3-list');
const player = document.getElementById('player');
let currentButton = null;

fetch('birds.json')
    .then(response => response.json())
    .then(birds => {
        console.log('Loaded birds:', birds); // Debug log to check JSON
        Object.keys(birds).forEach(bird => {
            const div = document.createElement('div');
            div.className = 'bird';
            div.innerHTML = `<img src="birds/${bird}/${bird}.jpg" alt="">`;
            div.onclick = () => {
                mp3List.innerHTML = '';
                birds[bird].forEach(mp3 => {
                    const btn = document.createElement('button');
                    btn.className = 'mp3-btn';
                    btn.innerHTML = mp3.name.replace(/_/g, ' ');
                    btn.onclick = () => togglePlay(mp3.file, btn);
                    mp3List.appendChild(btn);
                });
            };
            birdList.appendChild(div);
        });
    })
    .catch(error => console.error('Error loading birds:', error));

function togglePlay(file, button) {
    if (player.src.endsWith(file) && !player.paused) {
        player.pause();
        button.classList.remove('playing');
        currentButton = null;
    } else {
        player.src = file;
        player.play().catch(error => console.error('Playback error:', error));
        if (currentButton) currentButton.classList.remove('playing');
        button.classList.add('playing');
        currentButton = button;
    }
}