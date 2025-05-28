const birdList = document.getElementById('bird-list');
const mp3List = document.getElementById('mp3-list');
const player = document.getElementById('player');
let currentButton = null;

const speakers = ['🔈', '🔊', '🔉', '🔊', '🔈', '🔊', '🔉', '🔊'];
function animateSpeaker(button, index = 0) {
    if (!button.classList.contains('playing')) return;
    button.innerHTML = speakers[index % speakers.length];
    setTimeout(() => animateSpeaker(button, index + 1), 500);
}

fetch('birds.json')
    .then(response => response.json())
    .then(birds => {
        console.log('Loaded birds:', birds);
        Object.keys(birds).forEach(bird => {
            const div = document.createElement('div');
            div.className = 'bird';
            div.innerHTML = `<img src="birds/${bird}/${bird}.jpg" alt="${bird}">`;
            div.onclick = () => {
                const overlay = document.createElement('div');
                overlay.id = 'overlay';
                overlay.innerHTML = `<img src="birds/${bird}/${bird}.jpg" alt="${bird}">`;
                mp3List.innerHTML = '';
                birds[bird].forEach(mp3 => {
                    const btn = document.createElement('button');
                    btn.className = 'speaker-btn';
                    btn.innerHTML = '🔈';
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        togglePlay(mp3.file, btn);
                    };
                    mp3List.appendChild(btn);
                });
                overlay.appendChild(mp3List);
                overlay.onclick = () => overlay.remove();
                document.body.appendChild(overlay);
                overlay.classList.add('active');
            };
            birdList.appendChild(div);
        });
    })
    .catch(error => console.error('Error loading birds:', error));

function togglePlay(file, button) {
    if (player.src.endsWith(file) && !player.paused) {
        player.pause();
        button.classList.remove('playing');
        button.innerHTML = '🔈';
        currentButton = null;
    } else {
        player.src = file;
        player.play().catch(error => console.error('Playback error:', error));
        if (currentButton) {
            currentButton.classList.remove('playing');
            currentButton.innerHTML = '🔈';
        }
        button.classList.add('playing');
        animateSpeaker(button);
        currentButton = button;
    }
    player.onended = () => {
        button.classList.remove('playing');
        button.innerHTML = '🔈';
        currentButton = null;
    };
}