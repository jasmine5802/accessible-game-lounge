'use strict';

(() => {
  const SOUND_KEY = 'loungeSoundVolume';
  const SPEECH_KEY = 'loungeSpeechVolume';
  const BLIND_MODE_KEY = 'loungeBlindMode';
  const ACCESSIBLE_MODE_KEY = 'loungeAccessibleMode';
  const clamp = (value, maximum=100) => Math.max(0, Math.min(maximum, Number(value) || 0));
  const readFlag = (key, fallback=false) => {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return fallback;
      return value === '1' || value === 'true';
    } catch {
      return fallback;
    }
  };
  const readSetting = (key, fallback, maximum=100) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : clamp(value, maximum);
    } catch {
      return fallback;
    }
  };

  let soundVolume = readSetting(SOUND_KEY, 125, 200);
  let speechVolume = readSetting(SPEECH_KEY, 80);
  let accessibleMode = readFlag(ACCESSIBLE_MODE_KEY, readFlag(BLIND_MODE_KEY, false));
  const audioMasters = new Set();
  const accessibleModeControls = new Set();

  function saveSetting(key, value) {
    try { localStorage.setItem(key, String(value)); } catch {}
  }

  function updateAudioMasters() {
    for (const master of audioMasters) master.gain.value = soundVolume / 100;
  }

  function installAudioMasterVolume() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass || AudioContextClass.prototype.__loungeVolumeInstalled) return;
    const audioNodePrototype = window.AudioNode?.prototype;
    if (!audioNodePrototype) return;
    const originalConnect = audioNodePrototype.connect;
    const masters = new WeakMap();
    audioNodePrototype.connect = function (destination, ...args) {
      const context = this.context;
      if (context && destination === context.destination) {
        let master = masters.get(context);
        if (!master) {
          master = context.createGain();
          master.__loungeMaster = true;
          master.gain.value = soundVolume / 100;
          originalConnect.call(master, context.destination);
          masters.set(context, master);
          audioMasters.add(master);
        }
        if (!this.__loungeMaster) return originalConnect.call(this, master, ...args);
      }
      return originalConnect.call(this, destination, ...args);
    };
    AudioContextClass.prototype.__loungeVolumeInstalled = true;
  }

  function speak(message) {
    if (!('speechSynthesis' in window) || !message) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(String(message));
    utterance.volume = speechVolume / 100;
    speechSynthesis.speak(utterance);
  }

  function applyAccessibleMode(active) {
    accessibleMode = Boolean(active);
    document.documentElement.classList.toggle('lounge-accessible-mode', accessibleMode);
    document.body?.classList.toggle('lounge-accessible-mode', accessibleMode);
    syncGameplayChromeAccessibility();
  }

  function syncGameplayChromeAccessibility() {
    const onGameplayPage = !(location.pathname === '/' || location.pathname.endsWith('/lobby.html') || location.pathname.endsWith('/index.html'));
    const hideChrome = accessibleMode && onGameplayPage;
    for (const selector of ['.lounge-client-titlebar', '.lounge-client-menubar', '.lounge-client-workspace > header', '.lounge-client-workspace > footer', 'body > header', 'body > footer']) {
      const node = document.querySelector(selector);
      if (!node) continue;
      node.setAttribute('aria-hidden', hideChrome ? 'true' : 'false');
    }
  }

  function setAccessibleMode(active) {
    applyAccessibleMode(active);
    saveSetting(BLIND_MODE_KEY, accessibleMode ? '1' : '0');
    saveSetting(ACCESSIBLE_MODE_KEY, accessibleMode ? '1' : '0');
    for (const control of accessibleModeControls) {
      if (!control || !control.isConnected) continue;
      control.textContent = accessibleMode ? 'Accessible Mode: On (F4)' : 'Accessible Mode: Off (F4)';
      control.setAttribute('aria-pressed', accessibleMode ? 'true' : 'false');
    }
  }

  function toggleAccessibleMode() {
    setAccessibleMode(!accessibleMode);
    speak(accessibleMode ? 'Accessible mode enabled.' : 'Accessible mode disabled.');
  }

  function setBlindMode(active) {
    setAccessibleMode(active);
  }

  function toggleBlindMode() {
    toggleAccessibleMode();
  }

  function createGameStateController(options = {}) {
    const state = {
      mode: options.mode || 'GAME',
      menuIndex: 0,
      items: Array.isArray(options.items) ? [...options.items] : [],
      players: Array.isArray(options.players) ? [...options.players] : [],
      scores: options.scores && typeof options.scores === 'object' ? { ...options.scores } : {}
    };
    const menuListEl = options.menuListEl || document.getElementById('menu-items') || null;
    const statusEl = options.statusEl || document.getElementById('status-message') || document.getElementById('status') || document.getElementById('announcement') || null;
    const hotkeys = {
      scores: Array.isArray(options.hotkeys?.scores) ? options.hotkeys.scores.map(key => String(key).toLowerCase()) : ['s'],
      players: Array.isArray(options.hotkeys?.players) ? options.hotkeys.players.map(key => String(key).toLowerCase()) : ['p'],
      help: Array.isArray(options.hotkeys?.help) ? options.hotkeys.help.map(key => String(key).toLowerCase()) : ['h', '?']
    };

    function speakWithLiveRegion(text) {
      if (!text) return;
      if (statusEl) {
        statusEl.textContent = '';
        requestAnimationFrame(() => { statusEl.textContent = String(text); });
      }
      if (typeof options.speak === 'function') options.speak(String(text));
      else speak(String(text));
    }

    function renderMenu() {
      if (!menuListEl) return;
      menuListEl.innerHTML = '';
      menuListEl.setAttribute('aria-activedescendant', state.items.length ? `item-${state.menuIndex}` : '');
      state.items.forEach((item, index) => {
        const node = document.createElement(options.menuItemTag || 'div');
        node.id = `item-${index}`;
        node.className = `menu-item ${index === state.menuIndex ? 'focused' : ''}`;
        node.setAttribute('role', 'option');
        node.setAttribute('aria-selected', index === state.menuIndex ? 'true' : 'false');
        node.tabIndex = index === state.menuIndex ? 0 : -1;
        node.textContent = item.label;
        node.addEventListener('click', () => {
          state.menuIndex = index;
          announceCurrentItem();
          node.focus();
        });
        node.addEventListener('keydown', event => {
          if (event.key !== 'Enter' || event.defaultPrevented) return;
          event.preventDefault();
          event.stopPropagation();
          state.menuIndex = index;
          selectMenuItem();
        });
        node.addEventListener('dblclick', () => {
          state.menuIndex = index;
          selectMenuItem();
        });
        menuListEl.appendChild(node);
      });
    }

    function updateVisualFocus() {
      if (!menuListEl) return;
      menuListEl.setAttribute('aria-activedescendant', state.items.length ? `item-${state.menuIndex}` : '');
      const nodes = menuListEl.querySelectorAll('[role="option"], .menu-item');
      nodes.forEach((node, index) => {
        const focused = index === state.menuIndex;
        node.classList.toggle('focused', focused);
        node.setAttribute('aria-selected', focused ? 'true' : 'false');
        node.tabIndex = focused ? 0 : -1;
      });
    }

    function announceCurrentItem() {
      if (!state.items.length) return;
      const current = state.items[state.menuIndex];
      speakWithLiveRegion(`${current.label}, item ${state.menuIndex + 1} of ${state.items.length}`);
      updateVisualFocus();
      options.onCurrentItemChange?.(current, state.menuIndex);
    }

    function announceScores() {
      const currentScores = typeof options.getScores === 'function' ? options.getScores() : state.scores;
      if (!currentScores || !Object.keys(currentScores).length) {
        speakWithLiveRegion(options.emptyScoresText || 'Scores are not available right now.');
        return;
      }
      const scoreStrings = Object.entries(currentScores)
        .map(([player, score]) => `${player}: ${score}`)
        .join(', ');
      speakWithLiveRegion(`Current scores: ${scoreStrings}`);
    }

    function announcePlayers() {
      const currentPlayers = typeof options.getPlayers === 'function' ? options.getPlayers() : state.players;
      if (!currentPlayers || !currentPlayers.length) {
        speakWithLiveRegion(options.emptyPlayersText || 'No players are currently connected.');
        return;
      }
      const list = currentPlayers.join(', ');
      speakWithLiveRegion(`${currentPlayers.length} players online: ${list}`);
    }

    function announceHelp() {
      const helpText = typeof options.getHelpText === 'function'
        ? options.getHelpText()
        : options.helpText || 'Keyboard shortcuts: Press Up or Down arrows to navigate menus. Press Enter to select. Press S for current scores. Press P for connected players. Press H for help.';
      speakWithLiveRegion(helpText);
    }

    function selectMenuItem() {
      if (!state.items.length) return;
      const selected = state.items[state.menuIndex];
      if (selected.type === 'help') {
        announceHelp();
        return;
      }
      if (selected.type === 'exit') {
        speakWithLiveRegion('Exiting game lounge.');
        options.onExit?.(selected);
        return;
      }
      if (selected.type === 'game') {
        speakWithLiveRegion(`Selected ${selected.label}. Connecting to server...`);
      }
      options.onSelect?.(selected, state.menuIndex);
    }

    function handleKey(event) {
      if (!event || event.altKey || event.ctrlKey || event.metaKey) return false;
      if (typeof options.shouldIgnoreKeyEvent === 'function' && options.shouldIgnoreKeyEvent(event)) return false;
      const tagName = event.target?.tagName;
      if (tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) return false;

      if (state.mode === 'MENU' && state.items.length) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          state.menuIndex = (state.menuIndex + 1) % state.items.length;
          announceCurrentItem();
          return true;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          state.menuIndex = (state.menuIndex - 1 + state.items.length) % state.items.length;
          announceCurrentItem();
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          selectMenuItem();
          return true;
        }
      }

      const key = String(event.key || '').toLowerCase();
      if (hotkeys.scores.includes(key)) {
        event.preventDefault();
        announceScores();
        return true;
      }
      if (hotkeys.players.includes(key)) {
        event.preventDefault();
        announcePlayers();
        return true;
      }
      if (hotkeys.help.includes(key)) {
        event.preventDefault();
        announceHelp();
        return true;
      }
      return false;
    }

    function setMode(mode) { state.mode = mode === 'MENU' ? 'MENU' : 'GAME'; }
    function setItems(items) {
      state.items = Array.isArray(items) ? [...items] : [];
      if (state.menuIndex >= state.items.length) state.menuIndex = Math.max(0, state.items.length - 1);
      renderMenu();
      updateVisualFocus();
    }
    function setPlayers(players) { state.players = Array.isArray(players) ? [...players] : []; }
    function setScores(scores) { state.scores = scores && typeof scores === 'object' ? { ...scores } : {}; }

    if (state.mode === 'MENU' && state.items.length && menuListEl) {
      renderMenu();
      announceCurrentItem();
    }

    return {
      state,
      renderMenu,
      announceCurrentItem,
      announceScores,
      announcePlayers,
      announceHelp,
      selectMenuItem,
      handleKey,
      setMode,
      setItems,
      setPlayers,
      setScores
    };
  }

  function addStyles() {
    document.documentElement.classList.add('lounge-desktop-client');
    const style = document.createElement('style');
    style.textContent = `
      html.lounge-desktop-client { color-scheme:light; background:#b9b4a4; }
      html.lounge-desktop-client body {
        margin:0!important;
        min-height:100vh;
        background:#b9b4a4!important;
        background-image:none!important;
        color:#141414;
        font:1rem/1.45 "Segoe UI",system-ui,sans-serif!important;
      }
      html.lounge-desktop-client .lounge-client-shell {
        width:min(98rem,100%);
        min-height:100vh;
        margin:0 auto;
        background:#d9d4c7;
        border-left:1px solid #fff;
        border-right:1px solid #5f5a4f;
        box-shadow:0 0 0 1px #867f71;
      }
      html.lounge-desktop-client .lounge-client-titlebar {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:.6rem;
        padding:.4rem .75rem;
        color:#fff;
        background:linear-gradient(180deg,#3f6aa2 0%,#22477a 100%);
        border-bottom:1px solid #112a4a;
      }
      html.lounge-desktop-client .lounge-client-titlebar strong {
        font-size:1.02rem;
        letter-spacing:.01em;
      }
      html.lounge-desktop-client .lounge-client-titlebar span {
        color:#edf4ff;
        font-size:.92rem;
      }
      html.lounge-desktop-client .lounge-client-menubar {
        display:flex;
        gap:1rem;
        padding:.28rem .75rem;
        color:#1a1a1a;
        background:#e8e4d7;
        border-top:1px solid #fffdf5;
        border-bottom:1px solid #8b8578;
        font-size:.9rem;
      }
      html.lounge-desktop-client .lounge-client-menubar span::first-letter { text-decoration:underline; }
      html.lounge-desktop-client .lounge-client-workspace { padding:.7rem .85rem 1rem; }
      html.lounge-desktop-client .lounge-client-workspace > header,
      html.lounge-desktop-client body > header {
        box-sizing:border-box;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        padding:.55rem .8rem!important;
        background:#e8e4d7!important;
        border-bottom:1px solid #8b8578;
        box-shadow:none!important;
      }
      html.lounge-desktop-client .lounge-client-workspace > header h1,
      html.lounge-desktop-client body > header h1 {
        margin:0!important;
        color:#1b1b1b!important;
        font:700 1.26rem/1.25 "Segoe UI",system-ui,sans-serif!important;
        letter-spacing:0!important;
        text-shadow:none!important;
      }
      html.lounge-desktop-client .lounge-client-workspace > header p,
      html.lounge-desktop-client body > header p { margin:.2rem 0 0!important; color:#232323; }
      html.lounge-desktop-client .lounge-client-workspace > main,
      html.lounge-desktop-client body > main {
        box-sizing:border-box;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        padding:.55rem 0 1rem!important;
      }
      html.lounge-desktop-client .lounge-client-workspace > footer,
      html.lounge-desktop-client body > footer {
        width:100%!important;
        margin:0!important;
        padding:.5rem 0 1rem!important;
        color:#333;
        border-top:1px solid #8b8578;
      }
      html.lounge-desktop-client h2 { font-size:1.15rem!important; margin:.15rem 0 .65rem!important; }
      html.lounge-desktop-client h3 { font-size:1rem!important; }
      html.lounge-desktop-client .panel,
      html.lounge-desktop-client section.panel {
        margin:.75rem 0!important;
        padding:.7rem!important;
        background:#ece6d9!important;
        background-image:none!important;
        border:1px solid #8b8578!important;
        border-radius:0!important;
        box-shadow:inset 1px 1px 0 #fffdf5,inset -1px -1px 0 #b7b0a3!important;
      }
      html.lounge-desktop-client .panel h2,
      html.lounge-desktop-client section.panel h2 {
        color:#1b1b1b!important;
        border-bottom:1px solid #b7b0a3;
        padding-bottom:.28rem;
      }
      html.lounge-desktop-client .toolbar,
      html.lounge-desktop-client .controls,
      html.lounge-desktop-client .actions {
        gap:.4rem!important;
        padding:.45rem!important;
        background:#d7d0c0;
        border:1px solid #8b8578;
        border-radius:0!important;
      }
      html.lounge-desktop-client button,
      html.lounge-desktop-client select,
      html.lounge-desktop-client input {
        min-height:2.35rem!important;
        border:1px solid #dbe8f7!important;
        border-radius:1px!important;
        box-shadow:none!important;
        font:600 .98rem/1.25 "Segoe UI",system-ui,sans-serif!important;
        text-shadow:none!important;
      }
      html.lounge-desktop-client button {
        padding:.35rem .65rem!important;
        background:linear-gradient(180deg,#f9f6ed 0%,#d7d0c0 100%)!important;
        color:#1a1a1a!important;
      }
      html.lounge-desktop-client button:hover {
        background:linear-gradient(180deg,#fffdf5 0%,#e2dccf 100%)!important;
      }
      html.lounge-desktop-client button:active {
        background:linear-gradient(180deg,#c8c1b4 0%,#f2ecdf 100%)!important;
        transform:translateY(1px);
      }
      html.lounge-desktop-client button:disabled {
        background:#b8b2a6!important;
        color:#5c5c5c!important;
        border-color:#a49d8e!important;
        cursor:not-allowed!important;
        transform:none!important;
      }
      html.lounge-desktop-client button.secondary {
        background:linear-gradient(180deg,#efeadb 0%,#d0cabd 100%)!important;
        color:#1a1a1a!important;
      }
      html.lounge-desktop-client select,
      html.lounge-desktop-client input {
        background:#fffdf6!important;
        color:#111!important;
      }
      html.lounge-desktop-client input::placeholder {
        color:#6d6455!important;
      }
      html.lounge-desktop-client p[role="status"],
      html.lounge-desktop-client #status,
      html.lounge-desktop-client #announcement,
      html.lounge-desktop-client #turn,
      html.lounge-desktop-client #turn-status {
        margin:.4rem 0!important;
        padding:.4rem .5rem!important;
        border:1px inset #b6aea0!important;
        background:#fffdf5!important;
        color:#111!important;
      }
      html.lounge-desktop-client #announcement,
      html.lounge-desktop-client #turn,
      html.lounge-desktop-client #turn-status {
        border-left:6px solid #8a6b2e!important;
      }
      html.lounge-desktop-client ul[role="listbox"],
      html.lounge-desktop-client .menu {
        border:1px solid #8b8578!important;
        background:#ffffff!important;
        color:#111!important;
        box-shadow:inset 1px 1px #f7f2e8!important;
      }
      html.lounge-desktop-client ul[role="listbox"] li,
      html.lounge-desktop-client .menu li {
        border-bottom:1px solid #e7dfd0!important;
        color:#111!important;
      }
      html.lounge-desktop-client ul[role="listbox"] li[aria-selected="true"],
      html.lounge-desktop-client .menu li[aria-selected="true"] {
        background:#24558f!important;
        color:#fff!important;
      }
      html.lounge-desktop-client a[href="/"] {
        display:inline-block;
        padding:.35rem .65rem;
        color:#1a1a1a!important;
        background:linear-gradient(180deg,#f9f6ed 0%,#d7d0c0 100%);
        border:1px solid #8b8578;
        border-radius:2px;
        text-decoration:none;
        font-weight:700;
      }
      html.lounge-desktop-client :focus-visible {
        outline:4px solid #24558f!important;
        outline-offset:2px!important;
      }
      html.lounge-desktop-client li:focus-visible,
      html.lounge-desktop-client .space:focus-visible,
      html.lounge-desktop-client .card:focus-visible {
        box-shadow:0 0 0 2px #fffdf5,0 0 0 6px #24558f!important;
      }
      html.lounge-desktop-client dialog {
        border-radius:2px!important;
        box-shadow:0 6px 18px #000a!important;
      }
      html.lounge-desktop-client .card,
      html.lounge-desktop-client .space,
      html.lounge-desktop-client .slot,
      html.lounge-desktop-client .lane,
      html.lounge-desktop-client .players li {
        border-radius:2px!important;
        text-shadow:none!important;
      }
      .lounge-settings-button { position:fixed; right:1rem; top:1rem; z-index:900; width:auto!important; }
      .lounge-accessible-mode-button { position:fixed; right:1rem; top:4.15rem; z-index:900; width:auto!important; }
      .lounge-dialog { color:#111; background:#ece6d9; border:2px solid #8b8578; border-radius:2px; width:min(34rem,92vw); }
      .lounge-dialog::backdrop { background:#0008; }
      .lounge-dialog label { display:block; margin-top:1rem; font-weight:800; }
      .lounge-dialog input[type="range"] { width:100%; min-height:2.8rem; }
      .lounge-dialog-output { font-weight:900; }
      .lounge-key-prompt { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:1rem; background:#0008; }
      .lounge-key-prompt > div { width:min(38rem,96vw); padding:1.25rem; color:#111; background:#ece6d9; border:2px solid #8b8578; border-radius:2px; }
      .lounge-key-prompt:focus-visible, .lounge-key-prompt > div:focus-visible { outline:6px solid #24558f; outline-offset:-10px; }
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .lounge-client-titlebar,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .lounge-client-menubar,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay header h1,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay header p,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .toolbar,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .controls,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .actions,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .action-menu,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #board,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #players,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #cards-panel,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .qcp-side,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay button:not(.lounge-settings-button),
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay select,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay input {
        display:none!important;
      }
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .panel,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay section.panel {
        border:none!important;
        box-shadow:none!important;
        background:transparent!important;
        padding:.2rem 0!important;
        margin:.35rem 0!important;
      }
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #announcement,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #turn,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #turn-status,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay #status {
        position:absolute!important;
        width:1px!important;
        height:1px!important;
        padding:0!important;
        margin:-1px!important;
        overflow:hidden!important;
        clip:rect(0,0,0,0)!important;
        white-space:nowrap!important;
        border:0!important;
      }
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay .lounge-client-workspace > main,
      html.lounge-desktop-client.lounge-accessible-mode body.rs-clean-gameplay body > main {
        padding-top:.25rem!important;
      }
      @media (max-width: 860px) {
        html.lounge-desktop-client .lounge-client-workspace { padding:.5rem .5rem .8rem; }
        html.lounge-desktop-client .toolbar,
        html.lounge-desktop-client .controls,
        html.lounge-desktop-client .actions { padding:.35rem!important; }
        html.lounge-desktop-client button,
        html.lounge-desktop-client select,
        html.lounge-desktop-client input { min-height:2.7rem!important; }
      }
    `;
    document.head.append(style);
  }

  function installDesktopFrame() {
    if (!document.body || document.querySelector('.lounge-client-shell') || document.querySelector('.app-shell')) return;
    const shell = document.createElement('div');
    shell.className = 'lounge-client-shell';
    const titlebar = document.createElement('div');
    titlebar.className = 'lounge-client-titlebar';
    const title = document.createElement('strong');
    title.textContent = "Jazzy Jay's Accessible Game Lounge";
    const view = document.createElement('span');
    view.textContent = document.title || 'Game Window';
    titlebar.append(title, view);
    const menubar = document.createElement('nav');
    menubar.className = 'lounge-client-menubar';
    menubar.setAttribute('aria-label', 'Desktop menu');
    menubar.innerHTML = '<span>Game</span><span>Table</span><span>Player</span><span>Audio</span><span>Help</span>';
    const workspace = document.createElement('div');
    workspace.className = 'lounge-client-workspace';
    shell.append(titlebar, menubar, workspace);
    document.body.prepend(shell);
    const movable = [...document.body.children].filter(node => node !== shell && node.tagName !== 'SCRIPT');
    movable.forEach(node => workspace.appendChild(node));
    syncGameplayChromeAccessibility();
  }

  function announceValue(name, value, output) {
    const message = `${name} ${value} percent.`;
    output.textContent = message;
    output.setAttribute('aria-label', message);
    speak(message);
  }

  function addSettings() {
    if (!document.body || document.querySelector('#lounge-audio-settings')) return;
    const accessibleButton = document.createElement('button');
    accessibleButton.type = 'button';
    accessibleButton.className = 'lounge-accessible-mode-button';
    accessibleButton.setAttribute('aria-keyshortcuts', 'F4');
    accessibleButton.addEventListener('click', () => {
      toggleAccessibleMode();
      const input = document.querySelector('#lounge-blind-mode');
      if (input) input.checked = accessibleMode;
    });
    accessibleModeControls.add(accessibleButton);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lounge-settings-button';
    button.textContent = 'Settings';
    button.setAttribute('aria-keyshortcuts', 'F2');

    const dialog = document.createElement('dialog');
    dialog.id = 'lounge-audio-settings';
    dialog.className = 'lounge-dialog';
    dialog.setAttribute('aria-labelledby', 'lounge-settings-title');
    dialog.innerHTML = `
      <h2 id="lounge-settings-title">Audio and Display Settings</h2>
      <p>Sound effects and synthesized speech are controlled separately. Sound can be boosted up to 200 percent. Changes are saved automatically.</p>
      <label for="lounge-sound-volume">Sound volume</label>
      <input id="lounge-sound-volume" type="range" min="0" max="200" step="5">
      <output id="lounge-sound-output" class="lounge-dialog-output" for="lounge-sound-volume"></output>
      <label for="lounge-speech-volume">Speech volume</label>
      <input id="lounge-speech-volume" type="range" min="0" max="100" step="5">
      <output id="lounge-speech-output" class="lounge-dialog-output" for="lounge-speech-volume"></output>
      <label for="lounge-blind-mode">Accessible mode</label>
      <p id="lounge-blind-mode-help">When enabled, gameplay uses an RS or Playroom-style minimal visual layout. Sighted board and button-heavy visuals stay enabled when this is off.</p>
      <p><input id="lounge-blind-mode" type="checkbox" aria-describedby="lounge-blind-mode-help"> <span>Enable minimal gameplay visuals</span></p>
      <p><button id="lounge-test-speech" type="button">Test Speech</button> <button id="lounge-close-settings" type="button">Close</button></p>
    `;
    document.body.append(accessibleButton, button, dialog);
    const sound = dialog.querySelector('#lounge-sound-volume');
    const speech = dialog.querySelector('#lounge-speech-volume');
    const soundOutput = dialog.querySelector('#lounge-sound-output');
    const speechOutput = dialog.querySelector('#lounge-speech-output');
    const blindModeInput = dialog.querySelector('#lounge-blind-mode');
    sound.value = String(soundVolume);
    speech.value = String(speechVolume);
    blindModeInput.checked = accessibleMode;
    soundOutput.textContent = `Sound volume ${soundVolume} percent.`;
    speechOutput.textContent = `Speech volume ${speechVolume} percent.`;
    sound.addEventListener('input', () => {
      soundVolume = clamp(sound.value, 200); saveSetting(SOUND_KEY, soundVolume); updateAudioMasters();
      announceValue('Sound volume', soundVolume, soundOutput);
    });
    speech.addEventListener('input', () => {
      speechVolume = clamp(speech.value); saveSetting(SPEECH_KEY, speechVolume);
      announceValue('Speech volume', speechVolume, speechOutput);
    });
    blindModeInput.addEventListener('change', () => {
      setAccessibleMode(blindModeInput.checked);
      speak(accessibleMode ? 'Accessible mode enabled.' : 'Accessible mode disabled.');
    });
    dialog.querySelector('#lounge-test-speech').addEventListener('click', () => speak(`Speech volume is ${speechVolume} percent.`));
    dialog.querySelector('#lounge-close-settings').addEventListener('click', () => dialog.close());
    button.addEventListener('click', event => { if(Date.now()<Number(window.loungeSuppressSettingsUntil||0)){event.preventDefault();event.stopImmediatePropagation();return}dialog.showModal();requestAnimationFrame(() => sound.focus()); });
    dialog.addEventListener('close', () => button.focus());
    setAccessibleMode(accessibleMode);
  }

  function replaceLobbyLinksWithDesktopControl() {
    if (location.pathname === '/' || location.pathname.endsWith('/lobby.html') || location.pathname.endsWith('/index.html')) return;
    for (const link of document.querySelectorAll('header a[href="/"]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Return to Game List';
      button.addEventListener('click', () => { location.href = '/'; });
      link.replaceWith(button);
    }
  }

  function installGameplayApplicationMode() {
    if (location.pathname === '/' || location.pathname.endsWith('/lobby.html') || location.pathname.endsWith('/index.html')) return;
    const game = document.querySelector('main');
    if (!game) return;
    const gameName = document.querySelector('h1')?.textContent?.trim() || 'Accessible game';
    document.body.setAttribute('role', 'application');
    document.body.setAttribute('aria-label', `${gameName} window`);
    document.body.setAttribute('aria-roledescription', 'game window');
    game.setAttribute('role', 'application');
    if (!game.hasAttribute('tabindex')) game.tabIndex = -1;
    if (!game.hasAttribute('aria-label')) game.setAttribute('aria-label', `${gameName} game`);
    game.setAttribute('aria-roledescription', 'game surface');
    document.body.classList.add('lounge-gameplay-page');
    syncGameplayChromeAccessibility();
  }

  function askToQuit() {
    if (document.querySelector('#lounge-quit-prompt')) return;
    for (const openDialog of document.querySelectorAll('dialog[open]')) openDialog.close();
    const prompt = document.createElement('div');
    prompt.id = 'lounge-quit-prompt';
    prompt.className = 'lounge-key-prompt';
    prompt.tabIndex = -1;
    prompt.setAttribute('role', 'alertdialog');
    prompt.setAttribute('aria-modal', 'true');
    prompt.setAttribute('aria-labelledby', 'lounge-quit-title');
    prompt.setAttribute('aria-describedby', 'lounge-quit-description');
    prompt.innerHTML = `<div><h2 id="lounge-quit-title">Leave this game?</h2><p id="lounge-quit-description">Press Y to leave this game and return to the game list. Press N to keep playing.</p></div>`;
    const previousFocus = document.activeElement;
    const handleKey = event => {
      const key = event.key.toLowerCase();
      if (!['y', 'n'].includes(key)) {
        event.preventDefault();
        speak('Press Y to leave or N to keep playing.');
        return;
      }
      event.preventDefault();
      prompt.removeEventListener('keydown', handleKey);
      prompt.remove();
      if (key === 'y') leaveGameAndReturn();
      else previousFocus?.focus?.();
    };
    prompt.addEventListener('keydown', handleKey);
    document.body.append(prompt);
    prompt.focus();
    speak('Leave this game? Press Y to leave or N to keep playing.');
  }

  function leaveGameAndReturn() {
    const gameId = sessionStorage.getItem('loungeGameId');
    const token = sessionStorage.getItem('loungeSessionToken');
    const returnToLobby = () => {
      sessionStorage.removeItem('loungeGameId');
      location.href = '/';
    };
    if (typeof socket !== 'undefined' && socket?.connected) {
      const fallback = setTimeout(returnToLobby, 1200);
      socket.emit('leave-room', {}, () => { clearTimeout(fallback); returnToLobby(); });
      return;
    }
    if (!gameId || !token || typeof window.io !== 'function') {
      returnToLobby();
      return;
    }
    returnToLobby();
  }

  installAudioMasterVolume();
  window.LoungeAccessibility = {
    speak,
    get soundVolume() { return soundVolume; },
    get speechVolume() { return speechVolume; },
    get blindMode() { return accessibleMode; },
    get accessibleMode() { return accessibleMode; },
    setBlindMode,
    setAccessibleMode,
    toggleBlindMode,
    toggleAccessibleMode,
    askToQuit,
    leaveGameAndReturn,
      createGameStateController
  };

  document.addEventListener('DOMContentLoaded', () => { addStyles(); installDesktopFrame(); replaceLobbyLinksWithDesktopControl(); installGameplayApplicationMode(); addSettings(); applyAccessibleMode(accessibleMode); });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'F2') {
      event.preventDefault();
      document.querySelector('.lounge-settings-button')?.click();
      return;
    }
    if (event.key === 'F4') {
      event.preventDefault();
      toggleAccessibleMode();
      const input = document.querySelector('#lounge-blind-mode');
      if (input) input.checked = accessibleMode;
      return;
    }
    if (event.key.toLowerCase() !== 'q' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (location.pathname === '/' || location.pathname.endsWith('/lobby.html') || location.pathname.endsWith('/index.html')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    speak('Leaving the game and returning to the main game list.');
    leaveGameAndReturn();
  }, true);
})();
