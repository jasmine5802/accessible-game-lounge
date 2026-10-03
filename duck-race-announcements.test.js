'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'ducks-race.js'), 'utf8');
const receive = source.slice(source.indexOf('function receiveState(payload)'), source.indexOf('function connectToGame()'));
const frames = [], timers = [], messages = [];
let focused = 0, cues = 0;
const announcement = {set textContent(value) {messages.push(value)}, get textContent() {return messages.at(-1)}};
const context = vm.createContext({
  game: null, playerId: 'human', room: {}, playerName: 'Human', lastSequence: -1,
  selectedCardIndex: -1, resolvePlayerId: () => 'human', render() {}, renderCards() {},
  requestAnimationFrame: fn => frames.push(fn), setTimeout: fn => timers.push(fn),
  sessionStorage: {getItem: () => ''}, CustomEvent: class {},
  window: {dispatchEvent() {}}, document: {querySelector: () => null},
  elements: {announcement, polite: {textContent: ''}, cards: {querySelector: () => ({focus: () => focused++})}},
  playCue: () => cues++
});
vm.runInContext(receive, context);
const state = (sequence, turnPlayerId, story, actorId, localAnnouncement) => ({
  game: {sequence, status: 'playing', turnPlayerId, announcement: story},
  cue: {type: 'dice', actorId, localAnnouncement}
});
context.receiveState(state(1, 'human', 'Race started.'));
frames.splice(0).forEach(fn => fn());
focused = 0; messages.length = 0;
const humanRoll = state(2, 'computer', "Human rolled 3. It is now Computer's turn.", 'human', "You rolled a 3. It is now Computer's turn.");
context.receiveState(humanRoll);
assert.equal(messages.length, 1);
assert.match(messages[0], /^You rolled a 3/);
assert.doesNotMatch(messages[0], /It is your turn/);
context.receiveState(humanRoll);
assert.equal(messages.length, 1, 'Duplicate state must not repeat the roll result');
context.receiveState(state(3, 'human', "Computer rolled 4. It is now Human's turn.", 'computer'));
assert.match(messages.at(-1), /^Computer rolled 4/);
assert.match(messages.at(-1), /It is your turn/);
assert.equal(timers.length, 0, 'Old dice stories must not be delayed past the next turn');
context.receiveState(state(4, 'computer', "Human rolled 2. It is now Computer's turn.", 'human', "You rolled a 2. It is now Computer's turn."));
frames.splice(0).forEach(fn => fn());
assert.equal(focused, 0, 'A queued human-turn callback must not focus dice during the computer turn');
assert.doesNotMatch(messages.at(-1), /It is your turn/);
assert.equal(cues, 4, 'Duplicate snapshots must not replay dice sounds');
console.log('Duck Race roll deduplication, chronological announcements, and stale turn-focus checks passed.');
