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
assert(main.includes("['keyDown', 'rawKeyDown'].includes(input.type)") && main.includes("code === 'keyy'") && main.includes('keyCode === 89'), 'Electron prompt capture must recognize modern, raw, physical-code, and legacy Y/N key input.');
assert(main.includes("code === 'numpadenter'") && main.includes('keyCode === 13') && main.includes("['y', 'n', 'enter'].includes(key)"), 'Electron prompt capture must forward regular and numeric keypad Enter to the focused renderer.');
assert(main.includes("webContents.send('lounge-prompt-key', key)"), 'Electron must forward a captured prompt key through the preload bridge.');
assert(main.includes('if (promptModeActive) event.preventDefault()'), 'Electron must forward Y/N even if prompt-mode IPC is delayed, while suppressing DOM input only in confirmed prompt mode.');
assert(preload.includes("contextBridge.exposeInMainWorld('loungeDesktopPromptKeys'") && preload.includes("ipcRenderer.send('lounge-set-prompt-mode'"), 'Secure prompt-key preload bridge is missing.');
assert(lounge.includes('window.loungeDesktopPromptKeys?.setActive(true)') && lounge.includes('window.loungeDesktopPromptKeys?.setActive(false)') && lounge.includes('window.loungeDesktopPromptKeys?.onKey'), 'Lounge prompts are not connected to the desktop bridge.');
assert(games.includes('function syncDesktopPromptMode()') && games.includes('window.loungeDesktopPromptKeys?.onKey'), 'Shared game prompts are not connected to the desktop bridge.');
assert(games.includes("window.loungeDesktopPromptKeys?.setActive(active)") && games.includes("startStage==='ready'&&key==='enter'"), 'The final game-ready prompt must keep desktop prompt capture active and use Enter to start the game.');
assert(html.includes('id="prompt-box" class="hidden" role="application"') && html.includes('aria-label="Game setup question" tabindex="-1"'), 'The lounge prompt must force screen readers into application mode.');
assert(lounge.includes('promptBox?.focus()'), 'The lounge must move DOM focus onto the application-mode prompt.');
assert(games.includes("startDialog.setAttribute('role','application')") && games.includes('if(active)startDialog.focus()'), 'Each game must focus its application-mode prompt so Y/N reaches the page.');

console.log('Focused-window Electron Y/N prompt bridge checks passed without system-wide shortcuts.');
