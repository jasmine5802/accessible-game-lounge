'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require.resolve('./skipbo.js'), 'utf8');
const pending = [], errors = [];
let disconnect;
const context = {
  connectionReady: false, token: 'test-token', gameId: 'TEST', room: null, game: null,
  render() {}, fail: message => errors.push(message),
  el: { connection: {} },
  socket: { connected: true, emit(event, data, callback) { pending.push({ event, data, callback }); }, on(event, callback) { disconnect = callback; } }
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function startSkipBoGame()'), source.indexOf("el.start.addEventListener('click'")), context);
vm.runInContext(source.slice(source.indexOf('function connect()'), source.indexOf("socket.on('skipbo-state'")), context);
vm.runInContext(source.slice(source.indexOf("socket.on('disconnect'"), source.indexOf("window.addEventListener('pointerdown'")), context);
context.startSkipBoGame();
assert.strictEqual(pending.length, 0, 'Never buffer an unauthenticated start');
context.connect();
assert.strictEqual(pending[0].event, 'authenticate-token');
context.startSkipBoGame();
assert.strictEqual(pending.length, 1);
pending[0].callback({ ok: true });
assert.strictEqual(pending[1].event, 'join-game');
context.startSkipBoGame();
assert.strictEqual(pending.length, 2, 'Wait for room join before starting');
pending[1].callback({ ok: true, room: { skipbo: null } });
context.startSkipBoGame();
assert.strictEqual(pending[2].event, 'start-skipbo');
disconnect();
context.startSkipBoGame();
assert.strictEqual(pending.length, 3, 'Disconnect must clear authenticated readiness');
context.connect();
pending[3].callback({ ok: false, error: 'Session expired. Log in again.' });
context.startSkipBoGame();
assert.strictEqual(pending.length, 4, 'Expired sessions cannot start a game');
assert(errors.includes('Session expired. Log in again.'));
console.log('Skip-Bo startup authentication, join ordering, reconnect, and expired-session checks passed.');
