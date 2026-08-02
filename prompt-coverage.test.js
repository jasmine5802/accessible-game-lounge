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
  assert(source.includes('game-help.js'), `${page} is missing shared game-help.js prompt module.`);
  assert(source.includes('lounge-accessibility.js'), `${page} is missing shared screen-reader application mode.`);

  const promptIndex = source.lastIndexOf('game-help.js');
  const bodyCloseIndex = source.lastIndexOf('</body>');
  assert(promptIndex !== -1 && bodyCloseIndex !== -1 && promptIndex < bodyCloseIndex, `${page} does not load game-help.js in the final script region.`);
}

const helpSource = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');
const accessibilitySource = fs.readFileSync(path.join(__dirname, 'lounge-accessibility.js'), 'utf8');
const monopolySource = fs.readFileSync(path.join(__dirname, 'monopoly.html'), 'utf8');
assert(helpSource.includes("Would you like to hear the instructions for Duck Race?")
  && helpSource.includes("Would you like to hear the keyboard commands for Duck Race?")
  && helpSource.includes("Would you like to configure Duck Race game options?")
  && helpSource.includes("'Instructions?'")
  && helpSource.includes("'Keyboard commands?'"), 'Duck-specific or generic setup question text is missing.');
assert(helpSource.includes('function remindYesNo(){') && helpSource.includes("if(startStage==='how')startContent.textContent='Instructions?'") && helpSource.includes("else if(startStage==='keys')startContent.textContent='Keyboard commands?'") && helpSource.includes("else if(startStage==='options')startContent.textContent='Game options?'") && helpSource.includes("else if(startStage==='computer')startContent.textContent='Add one computer opponent?'") && helpSource.includes('announcePrompt(startContent.textContent)'), 'RS-style reminder question text is missing.');
assert(helpSource.includes("yesButton.textContent='Yes'") && helpSource.includes("noButton.textContent='No'"), 'RS-style Yes/No setup labels are missing.');
assert(helpSource.includes('function handlePromptKeys(event,isKeyup=false)'), 'Shared Y/N prompt handler is missing.');
assert(helpSource.includes('/^[a-z]$/.test(key)') && helpSource.includes('&&applyOptionShortcut(key)'), 'Keyboard shortcut option selection support is missing.');
assert(helpSource.includes('function moveOptionSelection(control,event)') && helpSource.includes('if(!isKeyup&&moveOptionSelection(target,event))'), 'Arrow-key option selection support is missing.');
assert(helpSource.includes("function afterKeys(){ask('options')}"), 'Monopoly must use the same options Y/N question as every other game.');
assert(helpSource.includes("startStage='ready'") && helpSource.includes("if(startStage==='ready')"), 'Every host must stay in the RS-style setup flow until Enter starts the game.');
assert(helpSource.includes("const startButton=document.getElementById('start')") && helpSource.includes("if(startButton&&!startButton.hidden&&!startButton.disabled)"), 'Enter-to-start must wait for the visible host start button before triggering the game start.');
assert(monopolySource.includes('<main id="game" tabindex="-1" role="application" aria-label="Monopoly game">'), 'Monopoly gameplay must remain in screen-reader application mode after setup.');
assert(accessibilitySource.includes('function installGameplayApplicationMode()') && accessibilitySource.includes("document.body.setAttribute('role', 'application')") && accessibilitySource.includes("game.setAttribute('role', 'application')"), 'Every complete game window must enter screen-reader application mode during gameplay.');

console.log('Prompt coverage checks passed for all game pages.');
