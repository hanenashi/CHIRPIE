const birdList = document.getElementById('bird-list');
const mp3List = document.getElementById('mp3-list');
const birdInfo = document.getElementById('bird-info');
const player = document.getElementById('player');
const settingsBtn = document.querySelector('.settings-btn');
const editBtn = document.querySelector('.edit-btn');
let currentButton = null;
let currentOverlay = null;
let currentFolder = null;
let birdOrder = JSON.parse(localStorage.getItem('birdOrder')) || [];
let draggedBird = null;
let placeholder = null;
let randomizeWobble = localStorage.getItem('randomizeWobble') !== 'false';

// Pinch-to-zoom variables
let initialDistance = 0;
let currentSize = localStorage.getItem('birdSize') ? parseFloat(localStorage.getItem('birdSize')) : 200;
const minSize = 20;
const maxSize = 400;
let pinchZoomEnabled = localStorage.getItem('pinchZoom') === 'false' ? false : true;
let editMode = localStorage.getItem('editMode') === 'true';

// Initialize edit button state
editBtn.innerHTML = editMode ? '📝' : '✏️';
editBtn.classList.toggle('active', editMode);
updateBirdListEditMode();

// Initialize bird sizes
updateBirdSizes(currentSize);

// Pinch event handlers
function addPinchListeners() {
    birdList.addEventListener('touchstart', handleTouchStart, { passive: false });
    birdList.addEventListener('touchmove', handleTouchMove, { passive: false });
    birdList.addEventListener('touchend', handleTouchEnd);
}

function removePinchListeners() {
    birdList.removeEventListener('touchstart', handleTouchStart);
    birdList.removeEventListener('touchmove', handleTouchMove);
    birdList.removeEventListener('touchend', handleTouchEnd);
}

function handleTouchStart(e) {
    if (e.touches.length === 2 && pinchZoomEnabled) {
        e.preventDefault();
        initialDistance = getTouchDistance(e.touches);
    }
    if (e.touches.length === 1 && !editMode) {
        return;
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 2 && pinchZoomEnabled) {
        e.preventDefault();
        const currentDistance = getTouchDistance(e.touches);
        const scale = currentDistance / initialDistance;
        let newSize = currentSize * scale;
        newSize = Math.max(minSize, Math.min(maxSize, newSize));
        updateBirdSizes(newSize);
    }
}

function handleTouchEnd(e) {
    if (e.changedTouches.length <= 1) {
        currentSize = parseFloat(document.querySelector('.bird img')?.style.width) || 200;
        localStorage.setItem('birdSize', currentSize);
        initialDistance = 0;
    }
}

if (pinchZoomEnabled) {
    addPinchListeners();
}

const speakers = ['🔈', '🔊', '🔉', '🔊', '🔈', '🔊', '🔉', '🔊'];
function animateSpeaker(button, index = 0) {
    if (!button.classList.contains('playing')) return;
    button.innerHTML = speakers[index % speakers.length];
    setTimeout(() => animateSpeaker(button, index + 1), 500);
}

function getTouchDistance(touches) {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateBirdSizes(size) {
    const images = document.querySelectorAll('#bird-list .bird img');
    const placeholders = document.querySelectorAll('.bird-placeholder');
    images.forEach(img => {
        img.style.width = `${size}px`;
        img.style.height = `${size}px`;
    });
    placeholders.forEach(ph => {
        ph.style.width = `${size}px`;
        ph.style.height = `${size}px`;
    });
    document.documentElement.style.setProperty('--bird-size', `${size * 0.9}px`);
}

// Parse .txt file content
function parseBirdInfo(text) {
    const info = {};
    text.split('\n').forEach(line => {
        const [key, value] = line.split('=').map(s => s.trim());
        if (key && value) info[key] = value;
    });
    return info;
}

// Apply randomized wobble
function applyWobbleStyles() {
    const birds = document.querySelectorAll('.bird.wiggle');
    birds.forEach(bird => {
        const id = bird.dataset.birdId;
        const styleId = `wiggle-${id}`;
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        if (randomizeWobble) {
            const duration = 0.4 + Math.random() * 0.2; // 0.4s–0.6s
            const angle = 2 + Math.random() * 3; // 2°–5°
            style.textContent = `
                .bird.wiggle[data-bird-id="${id}"] {
                    animation: wiggle-${id} ${duration}s ease-in-out infinite;
                }
                @keyframes wiggle-${id} {
                    0%, 100% { transform: rotate(-${angle}deg); }
                    50% { transform: rotate(${angle}deg); }
                }
            `;
        } else {
            style.textContent = `
                .bird.wiggle[data-bird-id="${id}"] {
                    animation: wiggle 0.5s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
            `;
        }
    });
}

// Update bird list for edit mode
function updateBirdListEditMode() {
    const birds = document.querySelectorAll('.bird');
    birds.forEach(bird => {
        bird.classList.toggle('wiggle', editMode);
        bird.draggable = editMode;
        bird.removeEventListener('dragstart', handleDragStart);
        bird.removeEventListener('dragover', handleDragOver);
        bird.removeEventListener('drop', handleDrop);
        bird.removeEventListener('touchstart', handleTouchDragStart);
        bird.removeEventListener('touchmove', handleTouchDragMove);
        bird.removeEventListener('touchend', handleTouchDragEnd);
        bird.removeEventListener('contextmenu', preventContextMenu);
        if (editMode) {
            bird.addEventListener('dragstart', handleDragStart);
            bird.addEventListener('dragover', handleDragOver);
            bird.addEventListener('drop', handleDrop);
            bird.addEventListener('touchstart', handleTouchDragStart, { passive: false });
            bird.addEventListener('touchmove', handleTouchDragMove, { passive: false });
            bird.addEventListener('touchend', handleTouchDragEnd);
            bird.addEventListener('contextmenu', preventContextMenu);
        }
    });
    applyWobbleStyles();
}

function preventContextMenu(e) {
    e.preventDefault();
}

// Drag-and-drop handlers (mouse)
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.birdId);
    e.target.classList.add('dragging');
    placeholder = document.createElement('div');
    placeholder.className = 'bird-placeholder';
    e.target.parentNode.insertBefore(placeholder, e.target);
    updateBirdSizes(currentSize);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = e.target.closest('.bird').dataset.birdId;
    const draggedIndex = birdOrder.indexOf(draggedId);
    const targetIndex = birdOrder.indexOf(targetId);
    if (draggedIndex > -1 && targetIndex > -1) {
        birdOrder.splice(draggedIndex, 1);
        birdOrder.splice(targetIndex, 0, draggedId);
        localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
        renderBirdList();
    }
    const dragging = document.querySelector('.dragging');
    if (dragging) dragging.classList.remove('dragging');
    if (placeholder) {
        placeholder.remove();
        placeholder = null;
    }
}

// Touch drag handlers (mobile)
function handleTouchDragStart(e) {
    if (!editMode) return;
    e.preventDefault();
    draggedBird = e.target.closest('.bird');
    if (draggedBird) {
        draggedBird.classList.add('dragging');
        draggedBird.style.position = 'absolute';
        draggedBird.style.zIndex = '1000';
        draggedBird.style.pointerEvents = 'none'; // Prevent self-targeting
        placeholder = document.createElement('div');
        placeholder.className = 'bird-placeholder';
        draggedBird.parentNode.insertBefore(placeholder, draggedBird);
        updateBirdSizes(currentSize);
        const touch = e.touches[0];
        const offsetX = touch.clientX - draggedBird.offsetWidth / 2;
        const offsetY = touch.clientY - draggedBird.offsetHeight / 2;
        draggedBird.style.left = `${offsetX}px`;
        draggedBird.style.top = `${offsetY}px`;
    }
}

function handleTouchDragMove(e) {
    if (!draggedBird || !editMode) return;
    e.preventDefault();
    const touch = e.touches[0];
    const offsetX = touch.clientX - draggedBird.offsetWidth / 2;
    const offsetY = touch.clientY - draggedBird.offsetHeight / 2;
    draggedBird.style.left = `${offsetX}px`;
    draggedBird.style.top = `${offsetY}px`;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetBird = target ? target.closest('.bird:not(.dragging)') : null;
    if (targetBird && targetBird !== draggedBird) {
        const rect = targetBird.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (touch.clientY < midY) {
            targetBird.parentNode.insertBefore(placeholder, targetBird);
        } else {
            targetBird.parentNode.insertBefore(placeholder, targetBird.nextSibling || null);
        }
    }
}

function handleTouchDragEnd(e) {
    if (!draggedBird || !editMode) return;
    draggedBird.style.position = 'relative';
    draggedBird.style.left = '';
    draggedBird.style.top = '';
    draggedBird.style.zIndex = '';
    draggedBird.style.pointerEvents = ''; // Restore pointer events
    draggedBird.classList.remove('dragging');
    if (placeholder) {
        placeholder.parentNode.replaceChild(draggedBird, placeholder);
        placeholder.remove();
        placeholder = null;
    }
    const newOrder = Array.from(document.querySelectorAll('.bird')).map(bird => bird.dataset.birdId);
    birdOrder = newOrder;
    localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
    draggedBird = null;
    updateBirdListEditMode();
    updateBirdSizes(currentSize);
}

// Render bird list with custom order
function renderBirdList(birdsData) {
    if (!birdsData) {
        fetch('birds.json')
            .then(r => r.json())
            .then(birds => renderBirdList(birds))
            .catch(error => console.error('Failed to fetch birds.json:', error));
        return;
    }
    birdList.innerHTML = '';
    const orderedBirds = birdOrder.length ? birdOrder : Object.keys(birdsData);
    orderedBirds.forEach(bird => {
        if (birdsData[bird]) {
            const folder = bird.startsWith('aogera') ? 'aogera' : 'aoji';
            const div = document.createElement('div');
            div.className = 'bird';
            div.dataset.birdId = bird;
            div.innerHTML = `<img src="birds/${folder}/${folder}.jpg" alt="${bird}">`;
            div.onclick = editMode ? null : () => openBirdOverlay(bird, folder);
            birdList.appendChild(div);
        }
    });
    updateBirdListEditMode();
    updateBirdSizes(currentSize);
}

// Open bird overlay
function openBirdOverlay(bird, folder) {
    console.log(`Clicked bird: ${bird}`);
    const overlay = document.createElement('div');
    overlay.id = 'overlay';
    overlay.innerHTML = `<img src="birds/${folder}/${folder}.jpg" alt="${bird}">`;
    birdInfo.innerHTML = '';
    mp3List.innerHTML = '';
    currentOverlay = overlay;
    currentFolder = folder;

    fetch(`/api/file/download?path=birds/${folder}/${folder}.txt&t=${Date.now()}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(text => {
            updateBirdInfo(text);
        })
        .catch(error => console.error('Error loading bird info:', error));

    overlay.appendChild(birdInfo);
    overlay.appendChild(mp3List);
    overlay.onclick = (e) => {
        if (e.target.id === 'overlay') {
            console.log('Closing overlay');
            player.pause();
            if (currentButton) {
                currentButton.classList.remove('playing');
                currentButton.innerHTML = '🔈';
                currentButton = null;
            }
            overlay.remove();
            currentOverlay = null;
            currentFolder = null;
        }
    };
    document.body.appendChild(overlay);
    overlay.classList.add('active');

    fetch('birds.json')
        .then(r => r.json())
        .then(birds => {
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
        });
}

// Update bird info display
function updateBirdInfo(text) {
    const info = parseBirdInfo(text);
    birdInfo.innerHTML = '';
    const fields = ['id', 'romanized', 'kanji', 'scientific', 'english', 'czech'];
    fields.forEach(field => {
        const value = info[field] || 'Unknown';
        const div = document.createElement('div');
        if (editMode) {
            div.innerHTML = `<input type="text" data-field="${field}" value="${value}">`;
        } else {
            div.textContent = value;
        }
        birdInfo.appendChild(div);
    });

    if (editMode) {
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-bird-btn';
        saveBtn.textContent = 'SAVE';
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            const data = {};
            fields.forEach(field => {
                data[field] = birdInfo.querySelector(`input[data-field="${field}"]`).value;
            });
            const textContent = fields.map(field => `${field}=${data[field]}`).join('\n');
            const formData = new FormData();
            formData.append('files[]', new Blob([textContent], { type: 'text/plain' }), `${currentFolder}.txt`);
            fetch(`/api/file/upload?path=/birds/${currentFolder}/`, {
                method: 'PUT',
                body: formData
            })
                .then(response => {
                    if (!response.ok) {
                        console.error('Upload response:', response.status, response.statusText);
                        throw new Error(`HTTP ${response.status}`);
                    }
                    console.log('Saved bird info:', data);
                })
                .catch(error => {
                    console.error('Save error:', error);
                    fetch(`/api/file/upload?path=/birds/${currentFolder}/`, {
                        method: 'POST',
                        body: formData
                    })
                        .then(response => {
                            if (!response.ok) {
                                console.error('Fallback POST response:', response.status, response.statusText);
                                throw new Error(`HTTP ${response.status}`);
                            }
                            console.log('Saved bird info (POST fallback):', data);
                        })
                        .catch(fallbackError => console.error('Fallback save error:', fallbackError));
                });
        };
        birdInfo.appendChild(saveBtn);
    }
}

// Edit mode toggle
editBtn.addEventListener('click', () => {
    editMode = !editMode;
    localStorage.setItem('editMode', editMode);
    editBtn.innerHTML = editMode ? '📝' : '✏️';
    editBtn.classList.toggle('active', editMode);
    updateBirdListEditMode();
    if (currentOverlay && currentFolder) {
        fetch(`/api/file/download?path=birds/${currentFolder}/${currentFolder}.txt&t=${Date.now()}`)
            .then(response => response.text())
            .then(updateBirdInfo)
            .catch(error => console.error('Error refreshing bird info:', error));
    }
});

// Settings overlay
settingsBtn.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.innerHTML = `
        <div class="settings-content">
            <label>Default Bird Size (px):</label>
            <input type="number" id="bird-size" value="${currentSize}" min="20" max="400">
            <label>Pinch Zoom:
                <input type="checkbox" id="pinch-zoom" ${pinchZoomEnabled ? 'checked' : ''}>
            </label>
            <label>Randomize Wobble:
                <input type="checkbox" id="randomize-wobble" ${randomizeWobble ? 'checked' : ''}>
            </label>
            <button id="save-settings">SAVE</button>
            <button id="restore-settings">RESTORE</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.classList.add('active');

    // Save settings
    document.getElementById('save-settings').onclick = () => {
        const size = parseFloat(document.getElementById('bird-size').value);
        const pinch = document.getElementById('pinch-zoom').checked;
        const randomWobble = document.getElementById('randomize-wobble').checked;
        if (size >= minSize && size <= maxSize) {
            localStorage.setItem('birdSize', size);
            currentSize = size;
            updateBirdSizes(size);
        }
        localStorage.setItem('pinchZoom', pinch);
        pinchZoomEnabled = pinch;
        if (pinch) {
            addPinchListeners();
        } else {
            removePinchListeners();
        }
        localStorage.setItem('randomizeWobble', randomWobble);
        randomizeWobble = randomWobble;
        applyWobbleStyles();
        const btn = document.getElementById('save-settings');
        btn.classList.add('flash');
        btn.textContent = 'SAVED';
        setTimeout(() => {
            btn.classList.remove('flash');
            btn.textContent = 'SAVE';
        }, 1000);
    };

    // Restore settings
    document.getElementById('restore-settings').onclick = () => {
        const savedSize = localStorage.getItem('birdSize');
        const savedPinch = localStorage.getItem('pinchZoom');
        const savedWobble = localStorage.getItem('randomizeWobble');
        if (savedSize) {
            currentSize = parseFloat(savedSize);
            updateBirdSizes(currentSize);
            document.getElementById('bird-size').value = currentSize;
        }
        if (savedPinch !== null) {
            pinchZoomEnabled = savedPinch === 'true';
            document.getElementById('pinch-zoom').checked = pinchZoomEnabled;
            if (pinchZoomEnabled) {
                addPinchListeners();
            } else {
                removePinchListeners();
            }
        }
        if (savedWobble !== null) {
            randomizeWobble = savedWobble === 'true';
            document.getElementById('randomize-wobble').checked = randomizeWobble;
            applyWobbleStyles();
        }
        const btn = document.getElementById('restore-settings');
        btn.classList.add('flash');
        btn.textContent = 'RESTORED';
        setTimeout(() => {
            btn.classList.remove('flash');
            btn.textContent = 'RESTORE';
        }, 1000);
    };

    // Close overlay
    overlay.onclick = (e) => {
        if (e.target.id === 'settings-overlay') {
            overlay.remove();
        }
    };
});

console.log('Fetching birds.json...');
fetch(`birds.json?t=${Date.now()}`)
    .then(response => {
        console.log('Fetch response:', response);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(birds => {
        console.log('Loaded birds:', birds);
        console.log('Bird keys:', JSON.stringify(Object.keys(birds)));
        if (!birdOrder.length) {
            birdOrder = Object.keys(birds);
            localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
        }
        renderBirdList(birds);
    })
    .catch(error => console.error('Error loading birds:', error));

function togglePlay(file, button) {
    console.log(`Toggling play for: ${file}`);
    if (player && player.src.includes(file) && !player.paused) {
        player.pause();
        button.classList.remove('playing');
        button.innerHTML = '🔈';
        currentButton = null;
    } else if (player) {
        player.src = file;
        player.play().catch(error => console.error('Playback error:', error));
        if (currentButton) {
            currentButton.classList.remove('playing');
            currentButton.innerHTML = '🔈';
        }
        button.className = 'speaker-btn playing';
        animateSpeaker(button);
        currentButton = button;
    } else {
        console.error('Audio player not found');
    }
    if (player) {
        player.onended = () => {
            console.log(`Playback ended: ${file}`);
            button.classList.remove('playing');
            button.innerHTML = '🔈';
            currentButton = null;
        };
    }
}