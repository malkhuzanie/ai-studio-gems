# AI Studio Gems

An open-source Chrome extension that supercharges Google's AI Studio with powerful workflow features, allowing you to save, manage, and reuse your best system instructions as "Gems".

---

## Features

This extension seamlessly integrates into the AI Studio interface to provide a native-feeling experience. All your data is stored locally and securely on your machine using `chrome.storage.local`.

### 1. Reusable System Instructions (Gems)
- **Save & Load:** Never lose a powerful system instruction again. Save any text from the "System Instructions" panel as a named Gem. Load it back instantly from a clean, native-style dropdown menu.
- **Support for Large Prompts:** Built with `chrome.storage.local`, allowing you to save massive, complex system instructions (up to 5MB).

### 2. Full CRUD Operations
- **Create:** Click the `+` icon to create a new Gem. The dropdown cleverly transforms into an input field for a seamless workflow.
- **Update (Save):** Modify your instructions and click the `Save` icon to overwrite and update the currently selected Gem.
- **Delete:** Remove gems you no longer need with a dedicated `Delete` icon.

### 3. Smart State Persistence
- The extension is smart. If you load a Gem, close the panel, and reopen it later in the same session, it will remember which Gem is active and display its name correctly.

### 4. Default Gem for New Chats
- **Set as Default:** Use the 3-dot menu to set any Gem as your default.
- **Auto-Load:** When you start a new chat session, the extension automatically loads your default Gem into the System Instructions panel the first time you open it, streamlining your workflow.

### 5. SPA-Aware Logic
- Designed to work flawlessly with AI Studio's Single Page Application (SPA) architecture. The "Default Gem" feature works reliably whether you're doing a full page reload or navigating internally by clicking the "New Chat" button.

---

## Installation

Since this extension is not yet on the Chrome Web Store, you can install it locally in developer mode.

1.  **Download the Repository:**
    -   Click the green `<> Code` button on this GitHub page.
    -   Select `Download ZIP`.
    -   Unzip the downloaded file to a permanent location on your computer (e.g., in a `Documents/chrome-extensions` folder).

2.  **Install in Chrome:**
    -   Open Google Chrome and navigate to `chrome://extensions`.
    -   In the top-right corner, toggle on **"Developer mode"**.
    -   Click the **"Load unpacked"** button that appears.
    -   In the file dialog, select the entire `ai-studio-gems` folder (the one containing `manifest.json`) and click "Select Folder".

The "AI Studio Gems" extension will now appear in your list of extensions and will be active in Google AI Studio.

---

## How to Use

1.  Navigate to [Google AI Studio](https://aistudio.google.com/).
2.  Open the **"System Instructions"** panel from the right-hand "Run settings" menu.
3.  You will now see the Gems controls integrated directly into the panel's header.
    -   Use the dropdown to load an existing Gem.
    -   Use the `+` icon to create a new one.
    -   Use the `Save` and `Delete` icons to manage the currently loaded Gem.
    -   Use the `⋮` menu to set a default Gem for new chats.

Enjoy your supercharged AI Studio experience!
