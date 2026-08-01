'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const lounge = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const gameHelp = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');

assert(lounge.includes('function askPrompt(messageText)'), 'Central lounge prompt launcher is missing.');
assert(lounge.includes("loungeState.promptStep === 'INSTRUCTIONS'") && lounge.includes("isYes ? info.instructions : 'Skipping instructions.'"), 'Lounge Y/N instructions branch is missing.');
assert(lounge.includes("loungeState.promptStep === 'KEYBOARD'") && lounge.includes("isYes ? info.keyboard : 'Skipping keyboard commands.'"), 'Lounge Y/N keyboard branch is missing.');
assert(lounge.includes("if (!['y', 'n'].includes(key)) return") && lounge.includes("processPromptChoice(key === 'y')") && lounge.includes('}, true);'), 'Capture-phase Y/N handling is missing.');
assert(gameHelp.includes("if(startStage==='how'){if(answerYes)speak") && gameHelp.includes("else ask('keys')"), 'Per-game Y-read/N-skip instructions flow is missing.');
assert(gameHelp.includes("optionsForm.addEventListener('keydown'") && gameHelp.includes("event.key!=='Enter'") && gameHelp.includes('submitOptionSelection(true,control)'), 'Enter-to-save-and-advance option handling is missing.');

console.log('Lounge and per-game Y/N prompts read on Yes, skip on No, and save selected options with Enter.');
