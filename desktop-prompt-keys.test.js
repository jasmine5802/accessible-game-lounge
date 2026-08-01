'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const read = file => fs.readFileSync(path.join(__dirname, file), 'utf8');
const main = read('main.js');
const preload = read('preload.js');
const lounge = read('index.js');
const games = read('game-help.js');
const html = read('index.html');

assert(!main.includes('globalShortcut'), 'Prompt keys must never be registered as system-wide shortcuts.');
assert(main.includes("webContents.on('before-input-event'") && main.includes('promptModeActive'), 'Electron must capture prompt keys only in the focused lounge window.');
assert(main.includes("input.type !== 'keyDown'") && main.includes("key !== 'y' && key !== 'n'"), 'Electron prompt capture must accept only Y/N key-down input.');
assert(main.includes("webContents.send('lounge-prompt-key', key)"), 'Electron must forward a captured prompt key through the preload bridge.');
assert(preload.includes("contextBridge.exposeInMainWorld('loungeDesktopPromptKeys'") && preload.includes("ipcRenderer.send('lounge-set-prompt-mode'"), 'Secure prompt-key preload bridge is missing.');
assert(lounge.includes('window.loungeDesktopPromptKeys?.setActive(true)') && lounge.includes('window.loungeDesktopPromptKeys?.setActive(false)') && lounge.includes('window.loungeDesktopPromptKeys?.onKey'), 'Lounge prompts are not connected to the desktop bridge.');
assert(games.includes('function syncDesktopPromptMode()') && games.includes('window.loungeDesktopPromptKeys?.onKey'), 'Shared game prompts are not connected to the desktop bridge.');
assert(html.includes('id="prompt-box" class="hidden" role="application"') && html.includes('aria-label="Game setup question" tabindex="-1"'), 'The lounge prompt must force screen readers into application mode.');
assert(lounge.includes('promptBox?.focus()'), 'The lounge must move DOM focus onto the application-mode prompt.');
assert(games.includes("startDialog.setAttribute('role','application')") && games.includes('if(active)startDialog.focus()'), 'Each game must focus its application-mode prompt so Y/N reaches the page.');

console.log('Focused-window Electron Y/N prompt bridge checks passed without system-wide shortcuts.');
