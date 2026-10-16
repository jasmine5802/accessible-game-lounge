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
let moveAnnouncements = 0;
const targetDialog = { open: false, showModal() { this.open = true; }, close() { this.open = false; } };
const context = {
  SkipBoEngine: require('./skipbo-engine'), playerId: 'me', accessibility: null,
  lastSequence: null, me: () => ({stockCount:20}),
  game: { sequence:1, players:[{id:'me',name:'Alex'}], status: 'playing', turnPlayerId: 'me', myHand: [{ id: 'h', value: 1 }], myStockTop: { id: 's', value: 1 }, myDiscards: [[{ id: 'd', value: 1 }], [], [], []], buildingPiles: [[], [], [], []] },
  selection: { source: 'hand', index: 0 }, handIndex: 0, targetMode: false, pendingTarget: null, submitting: false,
  el: { targetDialog, targetOptions: { children: [] }, hand: { children: [{ focus() {} }] } },
  render() {}, say: message => messages.push(message), cue() {},
  label: card => String(card?.value), announceGameAction: message => messages.push(message), handleServerMoveResponse() { moveAnnouncements++; },
  document: { addEventListener(type, handler) { keyHandler = handler; }, activeElement: {}, querySelector: () => ({ focus() {} }) },
  socket: { timeout() { return this; }, emit(event, move) { moves.push(move); }, on(event, handler) { stateHandler = handler; } },
  window: { dispatchEvent() {} }, CustomEvent: function () {}
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function selectedCard()'), source.indexOf('\nfunction render()')), context);
vm.runInContext(source.slice(source.indexOf('function select('), source.indexOf('\nfunction readBuildings()')), context);
vm.runInContext(source.slice(source.indexOf('function readBuildings()'), source.indexOf('function startSkipBoGame()')), context);
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
stateHandler({ game: context.game });
assert.strictEqual(moveAnnouncements, 1, 'Duplicate snapshots must not announce the move twice');
key('c'); assert(messages.at(-1).includes('needs 2'));
key('r'); assert(messages.at(-1).includes('Discard 1'));
key('h'); assert(messages.at(-1).includes('Your hand'));
key('i'); assert(messages.at(-1).includes('Your stock has 20 cards'));
key('t'); assert.strictEqual(messages.at(-1), 'Your turn.');
// Exercise the actual renderer and destination keyboard handler together.
function node() {
  return {children:[],dataset:{},classList:{contains(){return false;}},
    append(...items){this.children.push(...items);}, replaceChildren(...items){this.children=items;},
    setAttribute(){}, addEventListener(){}, contains(){return false;},
    focus(){context.document.activeElement=this;}};
}
context.gameId='TEST';context.room={hostId:'me'};context.connectionReady=true;
context.cardNode=node;
context.document.createElement=node;
context.document.createTextNode=text=>({textContent:text});
for(const id of ['connection','turn','start','play','buildings','selection','targetTitle','players','privatePiles','hand','targetOptions'])context.el[id]=node();
context.syncAccessibilityState=()=>{};
vm.runInContext(source.slice(source.indexOf('function render()'),source.indexOf('function select(')),context);
context.selection={source:'hand',index:0};context.handIndex=0;context.targetMode=true;
context.pendingTarget='building';context.render();
assert.strictEqual(context.el.targetOptions.children.length,4);
assert(context.el.targetOptions.children.every(item=>item.dataset.destination.startsWith('building-')));
context.pendingTarget='discard';context.render();
assert.strictEqual(context.el.targetOptions.children.length,4);
assert(context.el.targetOptions.children.every(item=>item.dataset.destination.startsWith('discard-')));
context.document.activeElement=node(); // Cancel has focus rather than a destination.
key('ArrowDown');
assert.strictEqual(context.document.activeElement.dataset.destination,'discard-0');
assert.strictEqual(context.selection.index,0,'Destination arrows must not change the selected hand card');
key('ArrowUp');assert.strictEqual(context.document.activeElement.dataset.destination,'discard-3');
context.pendingTarget=null;context.render();assert.strictEqual(context.el.targetOptions.children.length,8);
console.log('Skip-Bo card commands, reports, duplicate updates, destination filtering and Cancel navigation passed.');
