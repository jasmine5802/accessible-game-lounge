'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const gameFiles = [
  'ducks-race.js',
  'monopoly.js',
  'uno.js',
  'life.js',
  'horserace.js',
  'dominoes.js',
  'skipbo.js',
  'mallmadness.js'
];

const sharedPromptSource = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');
assert(sharedPromptSource.includes("if(!isKeyup&&event.key==='Enter'&&startStage===null"), 'Enter must be routed to the shared start flow after setup completes.');
assert(sharedPromptSource.includes("start.click()"), 'The ready prompt must activate the visible Start button for the host.');
assert(sharedPromptSource.includes("'/ducks-race.html':'start-ducks-race'") && sharedPromptSource.includes("'/mallmadness.html':'start-mall'") && sharedPromptSource.includes('socket.emit(startEvent'), 'The ready prompt must send each game start request directly to the server instead of depending only on a hidden page button.');
assert(sharedPromptSource.includes("else{if(startDialog.open)startDialog.close();start.click()}"), 'The modal must remain open during direct server starts so Enter cannot fall through to the Settings button.');
assert(!sharedPromptSource.includes("start.click();window.dispatchEvent(new CustomEvent('lounge-gameplay-started'))"), 'The shared start flow must wait for the server game-state event instead of faking a successful start.');
assert(sharedPromptSource.includes('Please wait for server confirmation.') && sharedPromptSource.includes('The server did not confirm the game start.'), 'The host must receive server-confirmation and retry feedback.');
assert(sharedPromptSource.includes('function ensurePromptVisible()'), 'The shared prompt flow must keep the ready prompt visible for the first player after setup.');
assert(!sharedPromptSource.includes('main .toolbar button'), 'The shared startup styling must not force every game into the same toolbar-hidden layout.');

const duckRaceSource = fs.readFileSync(path.join(__dirname, 'ducks-race.js'), 'utf8');
assert(duckRaceSource.includes("function resolvePlayerId"), 'Duck Race must resolve the player ID from the joined room and stored identity so turn checks match the server.');
assert(duckRaceSource.includes("body.rs-clean-gameplay .lounge-client-shell"), 'Gameplay mode must hide the desktop shell so the game page appears in the intended layout.');
assert(duckRaceSource.includes("function moveActionSelection"), 'Duck Race must support Playroom-style action-menu navigation.');

const horseRaceSource = fs.readFileSync(path.join(__dirname, 'horserace.js'), 'utf8');
assert(horseRaceSource.includes("function moveActionSelection"), 'Horse Race must support Playroom-style action-menu navigation.');

const turnStateChecks = [
  ['ducks-race.js', "const myTurn = game.status === 'playing' && game.turnPlayerId === playerId;"],
  ['monopoly.js', "const myTurn = game.turnPlayerId === playerId;"],
  ['uno.js', "const myTurn=game.turnPlayerId===playerId;"],
  ['life.js', "myTurn=game.turnPlayerId===playerId"],
  ['horserace.js', "const mine=me(),myTurn=game.turnPlayerId===playerId;"],
  ['dominoes.js', "const myTurn=game.turnPlayerId===playerId,ends=DominoesEngine.openEnds(game.board);"],
  ['skipbo.js', "const myTurn = game?.turnPlayerId === playerId;"],
  ['mallmadness.js', "myTurn=game?.turnPlayerId===playerId"],
];

for (const [file, check] of turnStateChecks) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  assert(source.includes(check), `${file} must reflect the current player turn in its gameplay state.`);
  assert(source.includes("window.dispatchEvent(new CustomEvent('lounge-gameplay-started'))") || source.includes("lounge-gameplay-started"), `${file} must participate in the shared gameplay-start transition.`);
}

for (const file of gameFiles) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  assert(source.includes("window.dispatchEvent(new CustomEvent('lounge-gameplay-started'))"), `${file} must dispatch the shared gameplay-started event when gameplay begins.`);
}

console.log('Gameplay start layout, Enter-to-start, and first-turn state checks passed.');
