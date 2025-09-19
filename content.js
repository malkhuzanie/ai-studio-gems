// ============================================================================
// AI STUDIO GEMS V2.7 
// ============================================================================

const DIALOG_TITLE_SELECTOR = 'div[mat-dialog-title] .title';
const TEXTAREA_SELECTOR = 'textarea[aria-label="System instructions"]';
const NEW_CHAT_BUTTON_SELECTOR = 'a[href="/prompts/new_chat"]';

let previousUrl = ''; 
let defaultGemApplied = false;

injectModalHTML()

const observer = new MutationObserver((mutations, obs) => {
    if (window.location.href !== previousUrl) {
        console.log("AI Studio Gems: URL changed, resetting default gem flag.");
        previousUrl = window.location.href;
        defaultGemApplied = false;
    }

    const dialogTitle = document.querySelector(DIALOG_TITLE_SELECTOR);
    if (dialogTitle && !dialogTitle.parentElement.querySelector('#gem-controls-container')) {
        injectControls(dialogTitle.parentElement);
    }
});

observer.observe(document.body, { childList: true, subtree: true });

document.body.addEventListener('click', (event) => {
    const chatButton = event.target.closest(NEW_CHAT_BUTTON_SELECTOR);
    if (chatButton) {
        console.log("AI Studio Gems: 'New Chat' button clicked, resetting default gem flag.");
        defaultGemApplied = false;
    }
}, true);


function injectModalHTML() {
    const modalHTML = `
        <div id="gem-modal-overlay" class="gem-control-hidden">
            <div id="gem-modal">
                <h3 id="gem-modal-title">Confirmation</h3>
                <p id="gem-modal-message">Are you sure?</p>
                <input type="text" id="gem-modal-input" class="gem-control-hidden" />
                <div id="gem-modal-buttons">
                    <button id="gem-modal-cancel" class="gem-modal-button">Cancel</button>
                    <button id="gem-modal-confirm" class="gem-modal-button">OK</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showCustomDialog(options) {
    return new Promise(resolve => {
        const overlay = document.getElementById('gem-modal-overlay');
        const titleEl = document.getElementById('gem-modal-title');
        const messageEl = document.getElementById('gem-modal-message');
        const inputEl = document.getElementById('gem-modal-input');
        const cancelBtn = document.getElementById('gem-modal-cancel');
        const confirmBtn = document.getElementById('gem-modal-confirm');

        titleEl.textContent = options.title || 'AI Studio Gems';
        messageEl.textContent = options.message || '';

        // Configure based on type
        inputEl.classList.add('gem-control-hidden');
        cancelBtn.classList.remove('gem-control-hidden');
        if (options.type === 'alert') {
            cancelBtn.classList.add('gem-control-hidden');
        } else if (options.type === 'prompt') {
            inputEl.classList.remove('gem-control-hidden');
            inputEl.value = '';
            inputEl.placeholder = options.placeholder || '';
        }

        overlay.classList.remove('gem-control-hidden');
        if(options.type === 'prompt') inputEl.focus();

        const close = (value) => {
            overlay.classList.add('gem-control-hidden');
            resolve(value);
        };

        confirmBtn.onclick = () => {
            const value = options.type === 'prompt' ? inputEl.value : true;
            close(value);
        };
        cancelBtn.onclick = () => {
            const value = options.type === 'prompt' ? null : false;
            close(value);
        };
    });
}



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
        <button id="gem-options-button" class="gem-header-button" title="More options">
            <span class="material-symbols-outlined">more_vert</span>
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
    document.getElementById('gem-options-button').addEventListener('click', toggleOptionsMenu);

    setTimeout(() => {
        syncUIToCurrentState();
        applyDefaultGemIfApplicable();
    }, 100);

}

async function syncUIToCurrentState() {
    const textarea = document.querySelector(TEXTAREA_SELECTOR);
    if (!textarea || !textarea.value) return;

    const currentText = textarea.value.trim();
    const { gems = {} } = await chrome.storage.local.get('gems');

    for (const gemName in gems) {
        if (gems[gemName].trim() === currentText) {
            // Found a match, update the UI without reloading the text
            handleLoadGem(gemName, false);
            return;
        }
    }
}

async function applyDefaultGemIfApplicable() {
    if (window.location.href.includes('/new_chat') && !defaultGemApplied) {
        const { defaultGemName } = await chrome.storage.local.get('defaultGemName');
        if (defaultGemName) {
            handleLoadGem(defaultGemName, true); // Load the text
            defaultGemApplied = true; // Ensure it only runs once per page load
        }
    }
}


// --- MENU & LOADING LOGIC ---
async function toggleGemMenu(event) {
    event.stopPropagation();
    closeAllMenus('gem-loader-menu'); // Close other menus first
    const existingMenu = document.getElementById('gem-loader-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    const { gems = {} } = await chrome.storage.local.get('gems');
    const menu = document.createElement('div');
    menu.id = 'gem-loader-menu';
    menu.className = 'gem-menu';
    Object.keys(gems).forEach(name => {
        const item = document.createElement('div');
        item.className = 'gem-menu-item';
        item.textContent = name;
        item.addEventListener('click', () => handleLoadGem(name, true));
        menu.appendChild(item);
    });
    document.getElementById('gem-controls-container').appendChild(menu);
}

function handleLoadGem(gemName, shouldLoadText) {
    chrome.storage.local.get('gems', ({ gems = {} }) => {
        const content = gems[gemName];
        const textarea = document.querySelector(TEXTAREA_SELECTOR);
        const loaderButton = document.getElementById('gem-loader-button');
        if (content !== undefined && textarea && loaderButton) {
            if (shouldLoadText) { // <<< MODIFIED: Conditional logic
                textarea.value = content;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
            }
            loaderButton.querySelector('span').textContent = gemName;
            loaderButton.dataset.currentGem = gemName;
        }
    });

    closeAllMenus();
}

async function toggleOptionsMenu(event) {
    event.stopPropagation();
    closeAllMenus('gem-options-menu'); // Close other menus first
    const existingMenu = document.getElementById('gem-options-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    const menu = document.createElement('div');
    menu.id = 'gem-options-menu';
    menu.className = 'gem-menu'; // Use the same styling
    menu.innerHTML = `<div id="set-default-gem" class="gem-menu-item">Set as Default</div>`;
    document.getElementById('gem-controls-container').appendChild(menu);
    document.getElementById('set-default-gem').addEventListener('click', handleSetAsDefault);
}


function closeGemMenuOnClickOutside(event) {
    const menu = document.getElementById('gem-menu');
    const isButtonClick = event.target.closest('#gem-loader-button');
    if (menu && !menu.contains(event.target) && !isButtonClick) {
        menu.remove();
        document.removeEventListener('click', closeGemMenuOnClickOutside);
    }
}

function closeAllMenus(excludeMenuId = null) {
    document.querySelectorAll('.gem-menu').forEach(menu => {
        if (menu.id !== excludeMenuId) {
            menu.remove();
        }
    });
}

// --- CRUD EVENT HANDLERS ---
async function handleSaveGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const currentGem = loaderButton.dataset.currentGem;
    if (!currentGem) {
        await showCustomDialog({ type: 'alert', message: 'Please load a Gem or create a new one before saving.' });
        alert("Please load a Gem or create a new one before saving.");
        return;
    }
    const textarea = document.querySelector(TEXTAREA_SELECTOR);
    const content = textarea.value.trim();
    const confirmed = await showCustomDialog({ type: 'confirm', message: `Are you sure you want to overwrite "${currentGem}"?` });
    if (confirmed) {
        saveGem(currentGem, content);
    }
}

function handleAddGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const nameInput = document.getElementById('gem-new-name-input');
    loaderButton.classList.add('gem-control-hidden');
    nameInput.classList.remove('gem-control-hidden');
    nameInput.focus();
    document.addEventListener('click', cancelAddModeOnClickOutside, true); 
}

async function handleDeleteGem() {
    const loaderButton = document.getElementById('gem-loader-button');
    const currentGem = loaderButton.dataset.currentGem;
    if (!currentGem) {
        await showCustomDialog({ type: 'alert', message: 'Please load a Gem to delete.' });
        return;
    }
    const confirmed = await showCustomDialog({ type: 'confirm', message: `Are you sure you want to permanently delete "${currentGem}"?` });
    if (confirmed) {
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

async function handleSetAsDefault() {
    const currentGem = document.getElementById('gem-loader-button').dataset.currentGem;
    if (!currentGem) {
        await showCustomDialog({ type: 'alert', message: 'Please load a Gem first to set it as default.' });
        return;
    }
    await chrome.storage.local.set({ defaultGemName: currentGem });
    await showCustomDialog({ type: 'alert', title: 'Success', message: `"${currentGem}" has been set as the default for new chats.` });
    closeAllMenus();
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

document.addEventListener('click', (event) => {
    const container = document.getElementById('gem-controls-container');
    if (container && !container.contains(event.target)) {
        closeAllMenus();
    }
});

