'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync(require.resolve('./skipbo.js'), 'utf8');
const liveRegion = { textContent: '' };
const focusedCard = {};
const timers = new Map();
const sounds = [];
let nextTimer = 0;
const sandbox = {
  document: { getElementById: () => liveRegion, activeElement: focusedCard },
  el: { announcer: liveRegion },
  game: { turnPlayerId: 'p2', winnerId: 'p2', players: [{ id: 'p2', name: 'Alex' }] },
  playAudioCue: type => sounds.push(type),
  cue: type => { if (type) sounds.push(type); },
  setTimeout: callback => { timers.set(++nextTimer, callback); return nextTimer; },
  clearTimeout: id => timers.delete(id)
};
vm.createContext(sandbox);
vm.runInContext(source.slice(source.indexOf('let announcementTimer'), source.indexOf('\nfunction say(')), sandbox);
function flush() {
  const callbacks = [...timers.values()];
  timers.clear();
  callbacks.forEach(callback => callback());
}

sandbox.handleServerMoveResponse({ pileCleared: true, refilled: true, drawn: 2, type: 'sweep' });
flush();
assert.match(liveRegion.textContent, /reached 12/);
assert.match(liveRegion.textContent, /Alex played all hand cards and drew 2 new cards/);
assert.deepStrictEqual(sounds.splice(0), ['pile_cleared', 'hand_refill']);
assert.strictEqual(sandbox.document.activeElement, focusedCard);

sandbox.handleServerMoveResponse({ pileCleared: true, event: 'GAME_OVER', winner: 'p2', refilled: true });
flush();
assert.match(liveRegion.textContent, /reached 12.*Game over! Alex/);
assert.doesNotMatch(liveRegion.textContent, /drew/);
assert.deepStrictEqual(sounds.splice(0), ['pile_cleared', 'win_fanfare']);

sandbox.announceGameAction('First move.');
sandbox.announceGameAction('Second move.');
assert.strictEqual(timers.size, 1);
flush();
assert.strictEqual(liveRegion.textContent, 'First move. Second move.');
sandbox.announceGameAction('First move. Second move.');
assert.strictEqual(liveRegion.textContent, '');
flush();
assert.strictEqual(liveRegion.textContent, 'First move. Second move.');

sandbox.handleServerMoveResponse({ refilled: true, drawn: 1 });
flush();
assert.match(liveRegion.textContent, /1 new card\./);
sandbox.handleServerMoveResponse({ type: 'place', announcement: 'Alex played a 3.' });
flush();
assert.strictEqual(liveRegion.textContent, 'Alex played a 3.');
assert.deepStrictEqual(sounds, ['hand_refill', 'place']);
console.log('Skip-Bo announcement checks passed.');
