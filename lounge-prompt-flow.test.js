'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const lounge = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const multiplayerLobby = fs.readFileSync(path.join(__dirname, 'lobby.js'), 'utf8');
const multiplayerLobbyHtml = fs.readFileSync(path.join(__dirname, 'lobby.html'), 'utf8');
const gameHelp = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');

assert(lounge.includes('function askPrompt(messageText)'), 'Central lounge prompt launcher is missing.');
assert(lounge.includes('function handleMenuSelection(selectedItem = null)') && lounge.includes("loungeState.mode = 'SETUP_PROMPTS'") && lounge.includes("loungeState.promptStep = 'INSTRUCTIONS'"), 'Menu selection must explicitly start at the instructions prompt.');
assert(lounge.includes("loungeState.promptStep === 'INSTRUCTIONS'") && lounge.includes("isYes ? info.instructions : 'Skipping instructions.'"), 'Lounge Y/N instructions branch is missing.');
assert(lounge.includes("loungeState.promptStep === 'KEYBOARD'") && lounge.includes("isYes ? info.keyboard : 'Skipping keyboard commands.'"), 'Lounge Y/N keyboard branch is missing.');
assert(lounge.includes('function answerLoungeSetupPrompt(key)') && lounge.includes('answerLoungeSetupPrompt(key)') && lounge.includes('}, true);'), 'Capture-phase Y/N handling is missing.');
assert(lounge.includes("#prompt-yes") && lounge.includes("answerLoungeSetupPrompt('y')") && lounge.includes("#prompt-no") && lounge.includes("answerLoungeSetupPrompt('n')"), 'Accessible Yes and No button fallbacks are missing.');
assert(multiplayerLobby.includes('function beginSetupPrompts(room)') && multiplayerLobby.includes('Would you like to use accessible mode for') && multiplayerLobby.includes("screen='setup-prompts'"), 'Multiplayer lobby setup prompt launcher is missing.');
assert(multiplayerLobby.includes('function handleSetupChoice(isYes)') && multiplayerLobby.includes("Accessible mode enabled.") && multiplayerLobby.includes("Visual mode enabled."), 'Multiplayer lobby accessible/visual mode branch is missing.');
assert(!multiplayerLobby.includes("setupState.step='INSTRUCTIONS'") && !multiplayerLobby.includes("setupState.step='KEYBOARD'"), 'The multiplayer lobby must not repeat instruction and keyboard questions that the game page asks.');
assert(multiplayerLobby.includes("if(screen==='setup-prompts')") && multiplayerLobby.includes("if(key==='y'||key==='n')") && multiplayerLobby.includes('window.loungeDesktopPromptKeys?.onKey'), 'Multiplayer lobby Y/N key handling is missing.');
assert(multiplayerLobby.includes('window.answerLoungeSetupPrompt=answerLoungeSetupPrompt') && multiplayerLobbyHtml.includes('id="setup-yes"') && multiplayerLobbyHtml.includes('id="setup-no"'), 'Multiplayer lobby must expose direct Y/N handling and accessible button fallbacks.');
assert(multiplayerLobbyHtml.includes('id="setup-prompt" class="panel" hidden tabindex="-1" role="application"') && multiplayerLobby.includes('elements.setupYes.focus'), 'Multiplayer lobby prompts must enter application mode and focus the Yes button so screen readers pass through answer keys.');
assert(multiplayerLobby.includes("now-lastSetupAnswerTime<200") && multiplayerLobby.includes('lastSetupAnswerKey'), 'Multiplayer lobby must de-duplicate the raw, desktop-bridge, and DOM copies of one Y/N keystroke.');
assert(multiplayerLobby.includes('useAccessibleMode:null') && multiplayerLobby.includes('if(setupState.useAccessibleMode===false)window.LoungeAccessibility?.speak?.(message)'), 'Accessible lobby prompts must use only the screen-reader live region, while visual mode may use built-in speech.');
assert(gameHelp.includes("if(startStage==='how'){if(answerYes)speak") && gameHelp.includes("else ask('keys')"), 'Per-game Y-read/N-skip instructions flow is missing.');
assert(gameHelp.includes("optionsForm.addEventListener('keydown'") && gameHelp.includes("event.key!=='Enter'") && gameHelp.includes('submitOptionSelection(true,control)'), 'Enter-to-save-and-advance option handling is missing.');

console.log('Lounge and per-game Y/N prompts read on Yes, skip on No, and save selected options with Enter.');
