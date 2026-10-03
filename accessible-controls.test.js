'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('./ducks-race.js'), 'utf8');
const handlers = [];
const choices = [];
let focused = 0;
let dialogOpen = false;
const buttons = ['Calf', 'Foal', 'Cub'].map((textContent, index) => ({
  textContent, focus() { focused = index; }, click() { choices.push(index); }
}));
const context = {
  game: { pendingMiniGame: { canAnswer: true } }, miniAnswerIndex: 0,
  elements: { miniOptions: { querySelectorAll: () => buttons } },
  announcePolite() {},
  document: {
    addEventListener(type, handler, capture) { handlers.push({type, handler, capture}); },
    querySelector() { return dialogOpen ? {} : null; }
  }
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function handleMiniGameKey(event)'), source.indexOf('function cycleCard(direction)')), context);
assert.equal(handlers.length, 1);
assert.equal(handlers[0].capture, true, 'Answer routing must precede button arrow handlers.');
function press(key) {
  let stopped = false;
  handlers[0].handler({key, target: {matches: () => false}, preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {stopped = true;}});
  return stopped;
}
assert.equal(press('ArrowDown'), true);
assert.equal(focused, 1);
assert.equal(context.miniAnswerIndex, 1);
assert.equal(press('Enter'), true);
assert.deepEqual(choices, [1], 'Enter must submit the answer selected with ArrowDown.');
press('ArrowUp'); press('ArrowUp');
assert.equal(focused, 2, 'Answer navigation must wrap.');
dialogOpen = true;
assert.equal(press('Enter'), false, 'Mini-games must not intercept modal dialog keys.');
assert.deepEqual(choices, [1]);
context.game.pendingMiniGame.canAnswer = false;
dialogOpen = false;
assert.equal(press('Enter'), false, 'Locked answers must not be submitted twice.');

const accessibility = fs.readFileSync(require.resolve('./lounge-accessibility.js'), 'utf8');
const hiddenBlocks = [...accessibility.matchAll(/([^{}]+)\{\s*display:none!important;\s*\}/g)].map(match => match[1]);
for (const selector of ['button:not', '.qcp-side', '#cards-panel', '.action-menu', 'body.rs-clean-gameplay input', 'body.rs-clean-gameplay select']) {
  assert(!hiddenBlocks.some(block => block.includes(selector)), `${selector} must remain available to keyboard and screen-reader users.`);
}
console.log('Accessible controls and mini-game answer routing regressions passed.');
