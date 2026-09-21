'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require.resolve('./skipbo.js'), 'utf8');
const html = fs.readFileSync(require.resolve('./skipbo.html'), 'utf8');
for (const id of ['target-dialog', 'target-title', 'target-options', 'cancel-target']) {
  assert(html.includes(`id="${id}"`), `Missing destination control: ${id}`);
}
const moves = [], messages = [];
let keyHandler, stateHandler;
const targetDialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
const context = {
  SkipBoEngine: require('./skipbo-engine'), playerId: 'me', accessibility: null,
  game: { status: 'playing', turnPlayerId: 'me', myHand: [{ id: 'h', value: 1 }], myStockTop: { id: 's', value: 1 }, myDiscards: [[{ id: 'd', value: 1 }], [], [], []], buildingPiles: [[], [], [], []] },
  selection: { source: 'hand', index: 0 }, handIndex: 0, targetMode: false, pendingTarget: null, submitting: false,
  el: { targetDialog, targetOptions: { children: [] }, hand: { children: [{ focus() {} }] } },
  render() {}, say: message => messages.push(message), cue() {},
  label: card => String(card?.value), announceGameAction: message => messages.push(message), handleServerMoveResponse() {},
  document: { addEventListener(type, handler) { keyHandler = handler; }, activeElement: {}, querySelector: () => ({ focus() {} }) },
  socket: { timeout() { return this; }, emit(event, move) { moves.push(move); }, on(event, handler) { stateHandler = handler; } },
  window: { dispatchEvent() {} }, CustomEvent: function () {}
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function selectedCard()'), source.indexOf('\nfunction render()')), context);
vm.runInContext(source.slice(source.indexOf('function select('), source.indexOf('\nfunction readBuildings()')), context);
vm.runInContext(source.slice(source.indexOf("document.addEventListener('keydown'"), source.indexOf('\nfunction connect()')), context);
function key(value) {
  keyHandler({ key: value, preventDefault() {}, target: { matches: () => false, closest: () => null } });
}
key('b'); key('1');
assert.strictEqual(moves[0].source, 'hand');
assert.strictEqual(moves[0].targetType, 'building');
context.submitting = false; context.cancelTarget();
key('1'); key('b'); key('2');
assert.strictEqual(moves[1].source, 'discard');
assert.strictEqual(moves[1].sourceIndex, 0);
assert.strictEqual(moves[1].targetIndex, 1);
context.submitting = false; context.cancelTarget();
key('s'); key('3');
assert.strictEqual(moves[2].source, 'stock');
assert.strictEqual(moves[2].targetIndex, 2);
context.submitting = false; context.cancelTarget();
context.game.buildingPiles[0] = [{ value: 1 }];
key('s'); key('1');
assert.strictEqual(moves.length, 3, 'Invalid placement must not submit');
key('2');
assert.strictEqual(moves.length, 4, 'A valid destination can be retried with its number');
context.submitting = false; context.cancelTarget();
vm.runInContext(source.slice(source.indexOf("socket.on('skipbo-state'"), source.indexOf("socket.on('lobby-updated'")), context);
stateHandler({ game: { ...context.game, myStockTop: { id: 'next', value: 7 } } });
assert.strictEqual(context.selectedCard().value, 7);
assert(messages.some(message => message.includes('Your next stock card is 7')));
console.log('Skip-Bo hand, discard, stock keyboard commands and stock reveal checks passed.');
