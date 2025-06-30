const birdList = document.getElementById('bird-list');
const mp3List = document.getElementById('mp3-list');
const birdInfo = document.getElementById('bird-info');
const player = document.getElementById('player');
const settingsBtn = document.querySelector('.settings-btn');
const editBtn = document.querySelector('.edit-btn');
const serverIndicator = document.getElementById('server-indicator');
let currentButton = null;
let currentOverlay = null;
let currentFolder = null;
let birdOrder = JSON.parse(localStorage.getItem('birdOrder')) || [];
let draggedBird = null;
let latestBirdData = null;
let placeholder = null;
let randomizeWobble = localStorage.getItem('randomizeWobble') !== 'false';
let serverType = localStorage.getItem('serverType') || 'simple-http'; // 'python' or 'simple-http'
let authCredentials = JSON.parse(localStorage.getItem('authCredentials')) || null;

// Pinch-to-zoom variables
let initialDistance = 0;
let currentSize = localStorage.getItem('birdSize') ? parseFloat(localStorage.getItem('birdSize')) : 200;
const minSize = 20;
const maxSize = 400;
let pinchZoomEnabled = localStorage.getItem('pinchZoom') === 'false' ? false : true;
let editMode = localStorage.getItem('editMode') === 'true';
const BASE_URL = serverType === 'python' ? 'http://localhost:8000' : 'http://localhost:8080';

// Initialize edit button state
editBtn.innerHTML = editMode ? '📝' : '✏️';
editBtn.classList.toggle('active', editMode);
updateBirdListEditMode();

// Initialize server indicator
updateServerIndicator();

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

// Update server indicator
function updateServerIndicator() {
    serverIndicator.textContent = `Using: ${serverType === 'python' ? 'Python Server' : 'Simple HTTP Server PLUS'}`;
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
    const birds = document.querySelectorAll('.bird');
    birds.forEach(bird => {
        const id = bird.dataset.birdId;
        const styleId = `wiggle-${id}`;
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        if (editMode && randomizeWobble) {
            const duration = 0.4 + Math.random() * 0.2;
            const angle = 2 + Math.random() * 3;
            style.textContent = `
                .bird[data-bird-id="${id}"] {
                    animation: wiggle-${id} ${duration}s ease-in-out infinite;
                }
                @keyframes wiggle-${id} {
                    0%, 100% { transform: rotate(-${angle}deg); }
                    50% { transform: rotate(${angle}deg); }
                }
            `;
        } else if (editMode) {
            style.textContent = `
                .bird[data-bird-id="${id}"] {
                    animation: wiggle 0.5s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
            `;
        } else {
            style.textContent = '';
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
        bird.removeEventListener('dragend', handleDragEnd);
        bird.removeEventListener('drop', handleDrop);
        bird.removeEventListener('touchstart', handleTouchDragStart);
        bird.removeEventListener('touchmove', handleTouchDragMove);
        bird.removeEventListener('touchend', handleTouchDragEnd);
        bird.removeEventListener('contextmenu', preventContextMenu);
        if (editMode) {
            bird.addEventListener('dragstart', handleDragStart);
            bird.addEventListener('dragover', handleDragOver);
            bird.addEventListener('dragend', handleDragEnd);
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
    if (!editMode) return;
    const bird = e.target.closest('.bird');
    if (bird) {
        e.dataTransfer.setData('text/plain', bird.dataset.birdId);
        bird.classList.add('dragging');
        placeholder = document.createElement('div');
        placeholder.className = 'bird-placeholder';
        bird.parentNode.insertBefore(placeholder, bird.nextSibling);
        updateBirdSizes(currentSize);
    }
}

function handleDragOver(e) {
    if (!editMode) return;
    e.preventDefault();
    const target = e.target.closest('.bird');
    if (target && placeholder && target !== placeholder) {
        const rect = target.getBoundingClientRect();
        const midX = rect.left + rect.width / 2;
        if (e.clientX < midX) {
            target.parentNode.insertBefore(placeholder, target);
        } else {
            target.parentNode.insertBefore(placeholder, target.nextSibling || null);
        }
    }
}

function handleDragEnd(e) {
    if (!editMode) return;
    const dragging = document.querySelector('.dragging');
    if (dragging) {
        console.log('Dragging finished:', dragging.dataset.birdId);
        dragging.classList.remove('dragging');
        if (placeholder) {
            const placeholderIndex = Array.from(birdList.children).indexOf(placeholder);
            console.log('Placeholder index:', placeholderIndex);
            const draggingId = dragging.dataset.birdId;

            const fromIndex = birdOrder.indexOf(draggingId);
            console.log('From index:', fromIndex);

            if (fromIndex !== -1) {
                birdOrder.splice(fromIndex, 1);
                birdOrder.splice(placeholderIndex, 0, draggingId);
                localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
                console.log('Updated birdOrder:', birdOrder);
            } else {
                console.warn('Could not find draggingId in birdOrder:', draggingId);
            }

            placeholder.remove();
            placeholder = null;
        }
    } else {
        console.warn('No dragging element found on dragEnd');
    }
    if (latestBirdData) {
        console.log('Re-rendering bird list with latest data');
        renderBirdList(latestBirdData);
    } else {
        console.warn('No latest bird data available to render');
    }
}

function handleDrop(e) {
    if (!editMode) return;
    e.preventDefault();
}

function handleTouchDragStart(e) {
    if (!editMode) return;
    e.preventDefault();
    draggedBird = e.target.closest('.bird');
    if (draggedBird) {
        draggedBird.classList.add('dragging');
        draggedBird.style.position = 'absolute';
        draggedBird.style.zIndex = '1000';
        draggedBird.style.pointerEvents = 'none';
        placeholder = document.createElement('div');
        placeholder.className = 'bird-placeholder';
        draggedBird.parentNode.insertBefore(placeholder, draggedBird.nextSibling);
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
    draggedBird.style.position = '';
    draggedBird.style.left = '';
    draggedBird.style.top = '';
    draggedBird.style.zIndex = '';
    draggedBird.style.pointerEvents = '';
    draggedBird.classList.remove('dragging');
    if (placeholder) {
        placeholder.parentNode.replaceChild(draggedBird, placeholder);
        placeholder.remove();
        placeholder = null;
    }
    draggedBird = null;
    updateBirdOrder();
    fetchBirdData().then(renderBirdList);
    updateBirdListEditMode();
    updateBirdSizes(currentSize);
}

function updateBirdOrder() {
    const newOrder = Array.from(document.querySelectorAll('.bird')).map(bird => bird.dataset.birdId);
    birdOrder = newOrder;
    localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
}

// Fetch bird data with retry logic
async function fetchBirdData(retries = 3, delay = 1000) {
    const fetchOptions = authCredentials && serverType === 'simple-http' ? {
        headers: {
            'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
        }
    } : {};
    try {
        if (serverType === 'python') {
            const response = await fetch(`${BASE_URL}/api/birds?t=${encodeURIComponent(String(Date.now()))}`, fetchOptions);
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            return await response.json();
        } else {
            const birds = {};
            const folderResponse = await fetch(`${BASE_URL}/api/file/list?path=birds&t=${encodeURIComponent(String(Date.now()))}`, fetchOptions);
            if (!folderResponse.ok) {
                console.error(`Failed to list birds: HTTP ${folderResponse.status}: ${await folderResponse.text()}`);
                throw new Error(`Failed to list birds`);
            }
            const folders = await folderResponse.json();
            for (const folder of folders.filter(f => f.directory && f.name !== '..')) {
                try {
                    const mp3Response = await fetch(`${BASE_URL}/api/file/list?path=birds/${folder.name}&t=${encodeURIComponent(String(Date.now()))}`, fetchOptions);
                    if (!mp3Response.ok) {
                        console.warn(`Failed to fetch MP3s for ${folder.name}: HTTP ${mp3Response.status}`);
                        birds[folder.name] = [];
                        continue;
                    }
                    const files = await mp3Response.json();
                    birds[folder.name] = files
                        .filter(f => !f.directory && f.name.endsWith('.mp3'))
                        .map(f => ({
                            name: f.name.replace('.mp3', ''),
                            file: `birds/${folder.name}/${f.name}`
                        }));
                } catch (err) {
                    console.warn(`Error fetching MP3s for ${folder.name}:`, err.message);
                    birds[folder.name] = [];
                }
            }
            if (Object.keys(birds).length === 0) {
                console.warn('No valid bird folders found');
                throw new Error('No bird folders found');
            }
            return birds;
        }
    } catch (err) {
        if (retries > 0) {
            console.warn(`Retrying fetch (${retries} attempts left)...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return fetchBirdData(retries - 1, delay * 2);
        }
        console.error('Fetch bird data error:', err.message);
        throw err;
    }
}

// Render bird list with custom order
function renderBirdList(birdsData) {
    if (!birdsData) {
        fetchBirdData()
            .then(birds => renderBirdList(birds))
            .catch(error => console.error('Failed to fetch bird data:', error));
        return;
    }
    birdList.innerHTML = '';
    const orderedBirds = birdOrder.length ? birdOrder.filter(bird => birdsData[bird]) : Object.keys(birdsData);

    if (!birdOrder.length || orderedBirds.length !== Object.keys(birdsData).length) {
        birdOrder = Object.keys(birdsData);
        localStorage.setItem('birdOrder', JSON.stringify(birdOrder));
    }
    orderedBirds.forEach(bird => {
        if (birdsData[bird]) {
            const div = document.createElement('div');
            div.className = 'bird';
            div.dataset.birdId = bird;
            div.innerHTML = `<img src="${BASE_URL}/birds/${bird}/${bird}.jpg" alt="${bird}">`;
            div.onclick = () => {
    if (!editMode) openBirdOverlay(bird, bird);
};
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
    overlay.innerHTML = `<img src="${BASE_URL}/birds/${folder}/${folder}.jpg" alt="${bird}">`;
    birdInfo.innerHTML = '';
    mp3List.innerHTML = '';
    currentOverlay = overlay;
    currentFolder = folder;

    const fetchOptions = authCredentials && serverType === 'simple-http' ? {
        headers: {
            'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
        }
    } : {};

    fetch(`${BASE_URL}/api/file/download?path=birds/${folder}/${folder}.txt&t=${encodeURIComponent(String(Date.now()))}`, fetchOptions)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

    fetchBirdData()
        .then(birds => {
            if (birds[bird]) {
                birds[bird].forEach(mp3 => {
                    console.log(`Adding MP3: ${mp3.name}`);
                    const btn = document.createElement('button');
                    btn.className = 'speaker-btn';
                    btn.innerHTML = '🔈';
                    btn.title = mp3.name;
                    btn.onclick = (e) => {
                        e.stopPropagation();
                        togglePlay(`${BASE_URL}/${mp3.file}`, btn);
                    };
                    mp3List.appendChild(btn);
                });
            }
        })
        .catch(error => console.error('Failed to fetch MP3s:', error));
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
            const fetchOptions = authCredentials && serverType === 'simple-http' ? {
                headers: {
                    'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
                }
            } : {};
            if (serverType === 'python') {
                fetch(`${BASE_URL}/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        folder: currentFolder,
                        data: data
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Save response:', response.status, response.statusText);
                            throw new Error(`HTTP ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(result => {
                        console.log('Saved bird info:', result);
                        fetch(`${BASE_URL}/api/file/download?path=birds/${currentFolder}/${currentFolder}.txt&t=${encodeURIComponent(String(Date.now()))}`)
                            .then(response => response.text())
                            .then(updateBirdInfo)
                            .catch(error => console.error('Error refreshing bird info:', error));
                    })
                    .catch(error => console.error('Save error:', error));
            } else {
                const formData = new FormData();
                formData.append('files[]', new Blob([textContent], { type: 'text/plain' }), `${currentFolder}.txt`);
                fetch(`${BASE_URL}/api/file/upload?path=birds/${currentFolder}`, {
                    method: 'PUT',
                    body: formData,
                    ...fetchOptions
                })
                    .then(response => {
                        if (!response.ok) {
                            console.error('Save response:', response.status, response.statusText);
                            throw new Error(`HTTP ${response.status}`);
                        }
                        console.log('Saved bird info');
                        fetch(`${BASE_URL}/api/file/download?path=birds/${currentFolder}/${currentFolder}.txt&t=${encodeURIComponent(String(Date.now()))}`)
                            .then(response => response.text())
                            .then(updateBirdInfo)
                            .catch(error => console.error('Error refreshing bird info:', error));
                    })
                    .catch(error => console.error('Save error:', error));
            }
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
        const fetchOptions = authCredentials && serverType === 'simple-http' ? {
            headers: {
                'Authorization': 'Basic ' + btoa(`${authCredentials.username}:${authCredentials.password}`)
            }
        } : {};
        fetch(`${BASE_URL}/api/file/download?path=birds/${currentFolder}/${currentFolder}.txt&t=${encodeURIComponent(String(Date.now()))}`, fetchOptions)
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
            <fieldset>
                <legend>Serving files with:</legend>
                <label><input type="radio" name="server-type" id="server-python" value="python" ${serverType === 'python' ? 'checked' : ''}> Python Server (port 8000)</label>
                <label><input type="radio" name="server-type" id="server-simple-http" value="simple-http" ${serverType === 'simple-http' ? 'checked' : ''}> Simple HTTP Server PLUS (port 8080)</label>
            </fieldset>
            ${serverType === 'simple-http' ? `
            <label>Simple HTTP Server Username (optional):</label>
            <input type="text" id="auth-username" value="${authCredentials ? authCredentials.username : ''}">
            <label>Simple HTTP Server Password (optional):</label>
            <input type="password" id="auth-password" value="${authCredentials ? authCredentials.password : ''}">
            ` : ''}
            <button id="save-settings">SAVE</button>
            <button id="restore-settings">RESTORE</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.classList.add('active');

    // Save settings
    document.getElementById('save-settings').onclick = () => {
        const sizeInput = document.getElementById('bird-size');
        const pinchInput = document.getElementById('pinch-zoom');
        const wobbleInput = document.getElementById('randomize-wobble');
        const pythonRadio = document.getElementById('server-python');
        const usernameInput = document.getElementById('auth-username');
        const passwordInput = document.getElementById('auth-password');

        const size = sizeInput ? parseFloat(sizeInput.value) : currentSize;
        const pinch = pinchInput ? pinchInput.checked : pinchZoomEnabled;
        const randomWobble = wobbleInput ? wobbleInput.checked : randomizeWobble;
        const newServerType = pythonRadio && pythonRadio.checked ? 'python' : 'simple-http';
        let newAuthCredentials = authCredentials;
        if (newServerType === 'simple-http' && usernameInput && passwordInput) {
            const username = usernameInput.value;
            const password = passwordInput.value;
            if (username && password) {
                newAuthCredentials = { username, password };
            } else {
                newAuthCredentials = null;
            }
        } else {
            newAuthCredentials = null;
        }

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
        if (newServerType !== serverType || JSON.stringify(newAuthCredentials) !== JSON.stringify(authCredentials)) {
            localStorage.setItem('serverType', newServerType);
            serverType = newServerType;
            localStorage.setItem('authCredentials', JSON.stringify(newAuthCredentials));
            authCredentials = newAuthCredentials;
            updateServerIndicator();
            alert('Server settings changed. Please reload the page and ensure the selected server is running.');
        }
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
        const savedServer = localStorage.getItem('serverType');
        const savedAuth = localStorage.getItem('authCredentials');
        if (savedSize) {
            currentSize = parseFloat(savedSize);
            updateBirdSizes(currentSize);
            const sizeInput = document.getElementById('bird-size');
            if (sizeInput) sizeInput.value = currentSize;
        }
        if (savedPinch !== null) {
            pinchZoomEnabled = savedPinch === 'true';
            const pinchInput = document.getElementById('pinch-zoom');
            if (pinchInput) pinchInput.checked = pinchZoomEnabled;
            if (pinchZoomEnabled) {
                addPinchListeners();
            } else {
                removePinchListeners();
            }
        }
        if (savedWobble !== null) {
            randomizeWobble = savedWobble === 'true';
            const wobbleInput = document.getElementById('randomize-wobble');
            if (wobbleInput) wobbleInput.checked = randomizeWobble;
            applyWobbleStyles();
        }
        if (savedServer !== null) {
            serverType = savedServer;
            const pythonRadio = document.getElementById('server-python');
            const simpleHttpRadio = document.getElementById('server-simple-http');
            if (pythonRadio && simpleHttpRadio) {
                pythonRadio.checked = serverType === 'python';
                simpleHttpRadio.checked = serverType === 'simple-http';
            }
            updateServerIndicator();
        }
        if (savedAuth !== null) {
            authCredentials = JSON.parse(savedAuth);
            const usernameInput = document.getElementById('auth-username');
            const passwordInput = document.getElementById('auth-password');
            if (usernameInput && passwordInput) {
                usernameInput.value = authCredentials ? authCredentials.username : '';
                passwordInput.value = authCredentials ? authCredentials.password : '';
            }
        }
        const btn = document.getElementById('restore-settings');
        btn.classList.add('flash');
        btn.textContent = 'RESTORED';
        setTimeout(() => {
            btn.classList.remove('flash');
            btn.textContent = 'RESTORE';
        }, 1000);
    };

    overlay.onclick = (e) => {
        if (e.target.id === 'settings-overlay') {
            overlay.remove();
        }
    };
});

function togglePlay(file, button) {
    if (currentButton && currentButton !== button) {
        currentButton.classList.remove('playing');
        currentButton.innerHTML = '🔈';
        player.pause();
    }
    if (player.paused || player.src !== file) {
        player.src = file;
        player.play().then(() => {
            button.classList.add('playing');
            animateSpeaker(button);
            currentButton = button;
        }).catch(error => console.error('Playback error:', error));
    } else {
        player.pause();
        button.classList.remove('playing');
        button.innerHTML = '🔈';
        currentButton = null;
    }
}

console.log('Application started: Fetching bird data...');
fetchBirdData()
    .then(birds => {
        latestBirdData = birds;
        renderBirdList(birds);
    })
    .catch(error => console.error('Failed to fetch bird data:', error));