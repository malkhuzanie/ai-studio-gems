// ============================================================================
// AI STUDIO GEMS V2.3 - FULL CRUD WORKFLOW
// ============================================================================

const DIALOG_TITLE_SELECTOR = 'div[mat-dialog-title] .title';
const TEXTAREA_SELECTOR = 'textarea[aria-label="System instructions"]';

const observer = new MutationObserver((mutations, obs) => {
    const dialogTitle = document.querySelector(DIALOG_TITLE_SELECTOR);
    if (dialogTitle && !dialogTitle.parentElement.querySelector('#gem-controls-container')) {
        injectControls(dialogTitle.parentElement);
    }
});
observer.observe(document.body, { childList: true, subtree: true });

function injectControls(headerElement) {
    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'gem-controls-container';
    controlsContainer.innerHTML = `
        <button id="gem-loader-button" data-current-gem="">
            <span>Load Gem...</span>
            <span class="material-symbols-outlined">expand_more</span>
        </button>
        <input type="text" id="gem-new-name-input" placeholder="New Gem name..." class="gem-control-hidden" />
        <button id="gem-save-button" class="gem-header-button" title="Save to current Gem">
            <span class="material-symbols-outlined">save</span>
        </button>
        <button id="gem-add-button" class="gem-header-button" title="Create new Gem">
            <span class="material-symbols-outlined">add_circle</span>
        </button>
        <button id="gem-delete-button" class="gem-header-button" title="Delete current Gem">
            <span class="material-symbols-outlined">delete</span>
        </button>
    `;

    const closeButton = headerElement.querySelector('button[mat-dialog-close]');
    if (closeButton) {
        headerElement.insertBefore(controlsContainer, closeButton);
    }

    // Attach event listeners
    document.getElementById('gem-loader-button').addEventListener('click', toggleGemMenu);
    document.getElementById('gem-save-button').addEventListener('click', handleSaveGem);
    document.getElementById('gem-add-button').addEventListener('click', handleAddGem);
    document.getElementById('gem-delete-button').addEventListener('click', handleDeleteGem);
    document.getElementById('gem-new-name-input').addEventListener('keydown', handleNewGemInput);
}

// --- MENU & LOADING LOGIC ---
async function toggleGemMenu(event) {
    event.stopPropagation();
    const existingMenu = document.getElementById('gem-menu');
    if (existingMenu) {
        existingMenu.remove();
        document.removeEventListener('click', closeGemMenuOnClickOutside);
        return;
    }
    const { gems = {} } = await chrome.storage.local.get('gems');
    const menu = document.createElement('div');
    menu.id = 'gem-menu';
    Object.keys(gems).forEach(name => {
        const item = document.createElement('div');
        item.className = 'gem-menu-item';
        item.textContent = name;
        item.addEventListener('click', () => handleLoadGem(name));
        menu.appendChild(item);
    });
    document.getElementById('gem-controls-container').appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeGemMenuOnClickOutside), 0);
}

function handleLoadGem(gemName) {
    chrome.storage.local.get('gems', ({ gems = {} }) => {
        const content = gems[gemName];
        const textarea = document.querySelector(TEXTAREA_SELECTOR);
        const loaderButton = document.getElementById('gem-loader-button');
        if (content && textarea && loaderButton) {
            textarea.value = content;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            loaderButton.querySelector('span').textContent = gemName;
            loaderButton.dataset.currentGem = gemName;
        }
    });

    const menu = document.getElementById('gem-menu'); 
    if (menu) menu.remove();
    document.removeEventListener('click', closeGemMenuOnClickOutside);
}

function closeGemMenuOnClickOutside(event) {
    const menu = document.getElementById('gem-menu');
    const isButtonClick = event.target.closest('#gem-loader-button');
    if (menu && !menu.contains(event.target) && !isButtonClick) {
        menu.remove();
        document.removeEventListener('click', closeGemMenuOnClickOutside);
    }
}

// --- CRUD EVENT HANDLERS ---
function handleSaveGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const currentGem = loaderButton.dataset.currentGem;
    if (!currentGem) {
        alert("Please load a Gem or create a new one before saving.");
        return;
    }
    const textarea = document.querySelector(TEXTAREA_SELECTOR);
    const content = textarea.value.trim();
    if (confirm(`Are you sure you want to overwrite "${currentGem}"?`)) {
        saveGem(currentGem, content);
    }
}

function handleAddGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const nameInput = document.getElementById('gem-new-name-input');
    loaderButton.classList.add('gem-control-hidden');
    nameInput.classList.remove('gem-control-hidden');
    nameInput.focus();
    document.addEventListener('click', cancelAddModeOnClickOutside, true); // Use capture phase
}

function handleDeleteGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const currentGem = loaderButton.dataset.currentGem;
    if (!currentGem) {
        alert("Please load a Gem to delete.");
        return;
    }
    if (confirm(`Are you sure you want to permanently delete "${currentGem}"?`)) {
        deleteGem(currentGem);
    }
}

function handleNewGemInput(event) {
    if (event.key === 'Enter') {
        const nameInput = event.target;
        const newName = nameInput.value.trim();
        const textarea = document.querySelector(TEXTAREA_SELECTOR);
        if (newName && textarea) {
            saveGem(newName, textarea.value.trim());
            handleLoadGem(newName); // Load the newly created gem
            cancelAddMode();
        }
    }
    if (event.key === 'Escape') {
        cancelAddMode();
    }
}

// --- UI & STATE MANAGEMENT ---
function cancelAddMode() {
    const loaderButton = document.getElementById('gem-loader-button');
    const nameInput = document.getElementById('gem-new-name-input');
    if (nameInput && !nameInput.classList.contains('gem-control-hidden')) {
        nameInput.value = '';
        nameInput.classList.add('gem-control-hidden');
        loaderButton.classList.remove('gem-control-hidden');
        document.removeEventListener('click', cancelAddModeOnClickOutside, true);
    }
}

function cancelAddModeOnClickOutside(event) {
    const container = document.getElementById('gem-controls-container');
    if (!container.contains(event.target)) {
        cancelAddMode();
    }
}

function resetLoaderButton() {
    const loaderButton = document.getElementById('gem-loader-button');
    if (loaderButton) {
        loaderButton.querySelector('span').textContent = 'Load Gem...';
        loaderButton.dataset.currentGem = '';
    }
}

// --- STORAGE FUNCTIONS ---
async function saveGem(name, content) {
    const { gems = {} } = await chrome.storage.local.get('gems');
    gems[name] = content;
    await chrome.storage.local.set({ gems });
    console.log(`Gem "${name}" saved.`);
}

async function deleteGem(name) {
    const { gems = {} } = await chrome.storage.local.get('gems');
    delete gems[name];
    await chrome.storage.local.set({ gems });
    console.log(`Gem "${name}" deleted.`);
    resetLoaderButton(); // Reset UI after deletion
}
