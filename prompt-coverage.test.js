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

  const promptIndex = source.lastIndexOf('game-help.js');
  const bodyCloseIndex = source.lastIndexOf('</body>');
  assert(promptIndex !== -1 && bodyCloseIndex !== -1 && promptIndex < bodyCloseIndex, `${page} does not load game-help.js in the final script region.`);
}

const helpSource = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');
assert(helpSource.includes("startContent.textContent=stage==='how'?'Instructions?':stage==='keys'?'Keyboard commands?':stage==='computer'?'Add one computer opponent?':'Game options?'"), 'RS-style setup question text is missing.');
assert(helpSource.includes("remindYesNo(){if(startStage==='how')startContent.textContent='Instructions?';else if(startStage==='keys')startContent.textContent='Keyboard commands?';else if(startStage==='options')startContent.textContent='Game options?';else if(startStage==='computer')startContent.textContent='Add one computer opponent?';startContent.focus()}"), 'RS-style reminder question text is missing.');
assert(helpSource.includes("yesButton.textContent='Yes'") && helpSource.includes("noButton.textContent='No'"), 'RS-style Yes/No setup labels are missing.');
assert(helpSource.includes('function handlePromptKeys(event,isKeyup=false)'), 'Shared Y/N prompt handler is missing.');

console.log('Prompt coverage checks passed for all game pages.');
