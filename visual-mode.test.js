'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const gamePages = [
  'ducks-race.html',
  'monopoly.html',
  'uno.html',
  'life.html',
  'horserace.html',
  'dominoes.html',
  'skipbo.html',
  'mallmadness.html'
];

for (const page of gamePages) {
  const source = fs.readFileSync(path.join(__dirname, page), 'utf8');
  assert(source.includes('game-help.js'), `${page} is missing the shared setup/help flow for visual players.`);
  assert(source.includes('lounge-accessibility.js'), `${page} is missing the shared gameplay accessibility layer used by sighted players too.`);
}

const loungeSource = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const accessibilitySource = fs.readFileSync(path.join(__dirname, 'lounge-accessibility.js'), 'utf8');
assert(loungeSource.includes('Visual mode enabled.'), 'The lobby flow is missing the Visual mode confirmation path for sighted players.');
assert(loungeSource.includes('Would you like to use accessible mode for'), 'The lobby flow is missing the accessible-mode choice before visual gameplay continues.');
assert(loungeSource.includes("#lounge-quit-prompt:not([hidden])"), 'A hidden quit prompt must not disable Enter on the game cards.');
assert(accessibilitySource.includes("node.addEventListener('keydown', event =>") && accessibilitySource.includes("event.key !== 'Enter' || event.defaultPrevented") && accessibilitySource.includes('selectMenuItem();'), 'Focused game cards must activate directly with Enter.');
assert(accessibilitySource.includes('node.tabIndex = index === state.menuIndex ? 0 : -1') && accessibilitySource.includes('node.focus();'), 'Sighted and screen-reader players must be able to place keyboard focus on the selected game card.');
assert(accessibilitySource.includes('function installGameplayApplicationMode()') && accessibilitySource.includes("document.body.setAttribute('role', 'application')") && accessibilitySource.includes("game.setAttribute('role', 'application')"), 'Visual-mode gameplay still needs the shared application-style game layout.');

console.log('Visual mode coverage checks passed for all game pages.');
