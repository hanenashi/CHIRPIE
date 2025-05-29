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

console.log('Fetching birds.json...');
fetch('birds.json')
    .then(response => {
        console.log('Fetch response:', response);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(birds => {
        console.log('Loaded birds:', birds);
        console.log('Bird keys:', JSON.stringify(Object.keys(birds)));
        Object.keys(birds).forEach(bird => {
            console.log(`Creating button for bird: ${bird}`);
            // Map bird key to folder (e.g., aogera1 -> aogera)
            const folder = bird.startsWith('aogera') ? 'aogera' : 'aoji';
            const div = document.createElement('div');
            div.className = 'bird';
            div.innerHTML = `<img src="birds/${folder}/${folder}.jpg" alt="${bird}">`;
            div.onclick = () => {
                console.log(`Clicked bird: ${bird}`);
                const overlay = document.createElement('div');
                overlay.id = 'overlay';
                overlay.innerHTML = `<img src="birds/${folder}/${folder}.jpg" alt="${bird}">`;
                mp3List.innerHTML = '';
                birds[bird].forEach(mp3 => {
                    console.log(`Adding MP3 button for: ${mp3.name}`);
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
                overlay.onclick = () => {
                    console.log('Closing overlay');
                    player.pause();
                    if (currentButton) {
                        currentButton.classList.remove('playing');
                        currentButton.innerHTML = '🔈';
                        currentButton = null;
                    }
                    overlay.remove();
                };
                document.body.appendChild(overlay);
                overlay.classList.add('active');
            };
            birdList.appendChild(div);
        });
    })
    .catch(error => console.error('Error loading birds:', error));

function togglePlay(file, button) {
    console.log(`Toggling play for: ${file}`);
    if (player.src.includes(file) && !player.paused) {
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
        button.className = 'speaker-btn playing';
        animateSpeaker(button);
        currentButton = button;
    }
    player.onended = () => {
        console.log(`Playback ended: ${file}`);
        button.classList.remove('playing');
        button.innerHTML = '🔈';
        currentButton = null;
    };
}