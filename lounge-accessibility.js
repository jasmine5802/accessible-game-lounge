'use strict';

(() => {
  const SOUND_KEY = 'loungeSoundVolume';
  const SPEECH_KEY = 'loungeSpeechVolume';
  const clamp = (value, maximum=100) => Math.max(0, Math.min(maximum, Number(value) || 0));
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
  const audioMasters = new Set();

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

  function addStyles() {
    document.documentElement.classList.add('lounge-desktop-client');
    const style = document.createElement('style');
    style.textContent = `
      html.lounge-desktop-client { color-scheme:dark; background:#07101b; }
      html.lounge-desktop-client body {
        margin:0!important;
        min-height:100vh;
        background:#07101b!important;
        background-image:none!important;
        color:#fff;
        font:1rem/1.45 "Segoe UI",system-ui,sans-serif!important;
      }
      html.lounge-desktop-client body > header {
        box-sizing:border-box;
        width:100%!important;
        max-width:none!important;
        margin:0!important;
        padding:.65rem 1rem!important;
        background:#101c2a!important;
        border-bottom:1px solid #8298b9;
        box-shadow:none!important;
      }
      html.lounge-desktop-client body > header h1 {
        margin:0!important;
        color:#ffe45c!important;
        font:700 1.4rem/1.25 "Segoe UI",system-ui,sans-serif!important;
        letter-spacing:0!important;
        text-shadow:none!important;
      }
      html.lounge-desktop-client body > header p { margin:.25rem 0 0!important; color:#d6dfec; }
      html.lounge-desktop-client body > main {
        box-sizing:border-box;
        width:min(96rem,calc(100% - 2rem))!important;
        max-width:96rem!important;
        margin:0 auto!important;
        padding:.75rem 0 1.5rem!important;
      }
      html.lounge-desktop-client body > footer {
        width:min(96rem,calc(100% - 2rem))!important;
        margin:0 auto!important;
        padding:.5rem 0 1rem!important;
        color:#c8d4e7;
        border-top:1px solid #445b74;
      }
      html.lounge-desktop-client h2 { font-size:1.15rem!important; margin:.15rem 0 .65rem!important; }
      html.lounge-desktop-client h3 { font-size:1rem!important; }
      html.lounge-desktop-client .panel,
      html.lounge-desktop-client section.panel {
        margin:.75rem 0!important;
        padding:.85rem!important;
        background:#111f33!important;
        background-image:none!important;
        border:1px solid #8298b9!important;
        border-radius:2px!important;
        box-shadow:none!important;
      }
      html.lounge-desktop-client .toolbar,
      html.lounge-desktop-client .controls,
      html.lounge-desktop-client .actions {
        gap:.4rem!important;
        padding:.45rem!important;
        background:#0b1726;
        border:1px solid #445b74;
        border-radius:0!important;
      }
      html.lounge-desktop-client button,
      html.lounge-desktop-client select,
      html.lounge-desktop-client input {
        min-height:2.55rem!important;
        border:2px solid #dbe8f7!important;
        border-radius:2px!important;
        box-shadow:none!important;
        font:600 1rem/1.25 "Segoe UI",system-ui,sans-serif!important;
        text-shadow:none!important;
      }
      html.lounge-desktop-client button { padding:.45rem .75rem!important; }
      html.lounge-desktop-client a[href="/"] {
        display:inline-block;
        padding:.35rem .65rem;
        color:#fff!important;
        background:#294462;
        border:1px solid #dbe8f7;
        border-radius:2px;
        text-decoration:none;
        font-weight:700;
      }
      html.lounge-desktop-client :focus-visible {
        outline:4px solid #56dcff!important;
        outline-offset:2px!important;
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
      .lounge-dialog { color:#fff; background:#10233a; border:2px solid #ffe45c; border-radius:2px; width:min(34rem,92vw); }
      .lounge-dialog::backdrop { background:#000b; }
      .lounge-dialog label { display:block; margin-top:1rem; font-weight:800; }
      .lounge-dialog input[type="range"] { width:100%; min-height:2.8rem; }
      .lounge-dialog-output { font-weight:900; }
      .lounge-key-prompt { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:1rem; background:#000c; }
      .lounge-key-prompt > div { width:min(38rem,96vw); padding:1.25rem; color:#fff; background:#10233a; border:2px solid #ffe45c; border-radius:2px; }
      .lounge-key-prompt:focus-visible, .lounge-key-prompt > div:focus-visible { outline:6px solid #56dcff; outline-offset:-10px; }
    `;
    document.head.append(style);
  }

  function announceValue(name, value, output) {
    const message = `${name} ${value} percent.`;
    output.textContent = message;
    output.setAttribute('aria-label', message);
    speak(message);
  }

  function addSettings() {
    if (!document.body || document.querySelector('#lounge-audio-settings')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lounge-settings-button';
    button.textContent = 'Audio Settings';
    button.setAttribute('aria-keyshortcuts', 'F2');

    const dialog = document.createElement('dialog');
    dialog.id = 'lounge-audio-settings';
    dialog.className = 'lounge-dialog';
    dialog.setAttribute('aria-labelledby', 'lounge-settings-title');
    dialog.innerHTML = `
      <h2 id="lounge-settings-title">Audio Settings</h2>
      <p>Sound effects and synthesized speech are controlled separately. Sound can be boosted up to 200 percent. Changes are saved automatically.</p>
      <label for="lounge-sound-volume">Sound volume</label>
      <input id="lounge-sound-volume" type="range" min="0" max="200" step="5">
      <output id="lounge-sound-output" class="lounge-dialog-output" for="lounge-sound-volume"></output>
      <label for="lounge-speech-volume">Speech volume</label>
      <input id="lounge-speech-volume" type="range" min="0" max="100" step="5">
      <output id="lounge-speech-output" class="lounge-dialog-output" for="lounge-speech-volume"></output>
      <p><button id="lounge-test-speech" type="button">Test Speech</button> <button id="lounge-close-settings" type="button">Close</button></p>
    `;
    document.body.append(button, dialog);
    const sound = dialog.querySelector('#lounge-sound-volume');
    const speech = dialog.querySelector('#lounge-speech-volume');
    const soundOutput = dialog.querySelector('#lounge-sound-output');
    const speechOutput = dialog.querySelector('#lounge-speech-output');
    sound.value = String(soundVolume);
    speech.value = String(speechVolume);
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
    dialog.querySelector('#lounge-test-speech').addEventListener('click', () => speak(`Speech volume is ${speechVolume} percent.`));
    dialog.querySelector('#lounge-close-settings').addEventListener('click', () => dialog.close());
    button.addEventListener('click', () => { dialog.showModal(); requestAnimationFrame(() => sound.focus()); });
    dialog.addEventListener('close', () => button.focus());
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
    if (!gameId || !token || typeof window.io !== 'function') {
      location.href = '/';
      return;
    }
    const exitSocket = window.io();
    let finished = false;
    const returnToLobby = () => {
      if (finished) return;
      finished = true;
      exitSocket.close();
      sessionStorage.removeItem('loungeGameId');
      location.href = '/';
    };
    const fallback = setTimeout(returnToLobby, 1200);
    exitSocket.on('connect', () => exitSocket.emit('authenticate-token', { token }, result => {
      if (!result.ok) { clearTimeout(fallback); returnToLobby(); return; }
      exitSocket.emit('leave-game', { gameId }, () => { clearTimeout(fallback); returnToLobby(); });
    }));
  }

  installAudioMasterVolume();
  window.LoungeAccessibility = {
    speak,
    get soundVolume() { return soundVolume; },
    get speechVolume() { return speechVolume; },
    askToQuit
  };

  document.addEventListener('DOMContentLoaded', () => { addStyles(); replaceLobbyLinksWithDesktopControl(); addSettings(); });
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'F2') {
      event.preventDefault();
      document.querySelector('.lounge-settings-button')?.click();
      return;
    }
    if (event.key.toLowerCase() !== 'q' || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (location.pathname === '/' || location.pathname.endsWith('/lobby.html') || location.pathname.endsWith('/index.html')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    askToQuit();
  }, true);
})();
