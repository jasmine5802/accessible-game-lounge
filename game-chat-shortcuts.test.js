'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('./game-chat.js'), 'utf8');
let inputHandler;
let chatClosed = 0;
const context = {
  input: { addEventListener(type, handler) { inputHandler = handler; } },
  closeChat() { chatClosed++; }
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf("  input.addEventListener('keydown'"), source.indexOf("  form.addEventListener('submit'")), context);
function press(key) {
  const result = { prevented:false, stopped:false };
  inputHandler({key, preventDefault() { result.prevented=true; }, stopPropagation() { result.stopped=true; }});
  return result;
}
assert.deepEqual(press('q'), {prevented:false, stopped:true}, 'Typing a game command must not activate gameplay shortcuts.');
assert.equal(chatClosed, 0);
assert.deepEqual(press('Enter'), {prevented:false, stopped:true}, 'Enter must retain normal form submission behavior.');
assert.equal(chatClosed, 0);
assert.deepEqual(press('Escape'), {prevented:true, stopped:true}, 'Escape must close chat even while the message field has focus.');
assert.equal(chatClosed, 1);
console.log('Game chat message-field Escape and typing isolation passed.');
