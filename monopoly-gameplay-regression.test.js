'use strict';
// Test-only access to live room state allows deterministic rule scenarios while
// every action still passes through the real Socket.IO handlers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { io } = require('socket.io-client');
const Boards = require('./monopoly-boards');
process.env.NODE_ENV = 'test';
process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'monopoly-regression-'));
const filename = path.join(__dirname, 'server.js');
const isolated = new Module(filename, module);
isolated.filename = filename;
isolated.paths = module.paths;
isolated._compile(fs.readFileSync(filename, 'utf8') + '\nmodule.exports.testRooms = rooms;', filename);
const { startServer, server, testRooms } = isolated.exports;
const sockets = [];
const call = (socket, event, data = {}) => new Promise((resolve, reject) => {
  socket.timeout(5000).emit(event, data, (error, result) => error ? reject(error) : resolve(result));
});
const ok = async (socket, event, data) => { const result = await call(socket, event, data); assert.equal(result.ok, true, result.error); return result; };
const no = async (socket, event, data) => assert.equal((await call(socket, event, data)).ok, false, event);
const originalRandom = Math.random;
(async () => {
  await startServer(0, '127.0.0.1');
  for (let i = 0; i < 2; i++) {
    const socket = io(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'] });
    sockets.push(socket);
    await new Promise(resolve => socket.once('connect', resolve));
    await ok(socket, 'register', { username: `Rules${Date.now()}${i}`, password: 'RulesTest9!' });
  }
  const [host, guest] = sockets;
  const created = await ok(host, 'create-game', { category: 'monopoly' });
  await ok(guest, 'join-game', { gameId: created.room.code });
  await ok(host, 'monopoly-select-token', { tokenId: Boards.tokens.Classic[0].id });
  await no(guest, 'monopoly-select-token', { tokenId: Boards.tokens.Classic[0].id });
  await ok(guest, 'monopoly-select-token', { tokenId: Boards.tokens.Classic[1].id });
  await no(guest, 'start-monopoly');
  await ok(host, 'start-monopoly');
  const game = testRooms.get(created.room.code).monopoly;
  const [a, b] = game.turnOrder;
  const actor = id => id === created.room.hostId ? host : guest;
  const player = game.players.get(a), other = game.players.get(b);
  const reset = () => {
    game.turnIndex = 0; game.doublesCount = 0; game.pendingPurchase = null; game.pendingTrade = null;
    game.owners = {}; game.houses = {}; game.freeParkingJackpot = true; game.freeParkingPot = 0;
    for (const p of game.players.values()) Object.assign(p, { balance: 10000, position: 0, inJail: false, jailTurns: 0, jailFreeCards: [] });
  };
  const roll = async (position, dice = [1, 2]) => {
    game.turnIndex = 0; player.position = position;
    let index = 0; Math.random = () => (dice[index++ % 2] - 0.5) / 6;
    try { await ok(actor(a), 'monopoly-roll'); } finally { Math.random = originalRandom; }
  };
  reset(); await no(actor(b), 'monopoly-roll');
  await roll(0); assert.equal(game.pendingPurchase.spaceIndex, 3);
  await no(actor(b), 'monopoly-purchase-response', { accept: true });
  await no(actor(a), 'monopoly-roll');
  await ok(actor(a), 'monopoly-purchase-response', { accept: true });
  assert.equal(game.owners[3], a); assert.equal(player.balance, 10000 - game.board[3].price);
  reset(); await roll(1); assert.equal(player.balance, 9800); assert.equal(game.freeParkingPot, 200);
  await roll(17); assert.equal(player.balance, 10000); assert.equal(game.freeParkingPot, 0);
  reset(); await roll(38); assert.equal(player.balance, 10200);
  await ok(actor(a), 'monopoly-purchase-response', { accept: false }); assert.equal(game.owners[1], undefined);
  reset(); game.owners[3] = b; await roll(0);
  assert.equal(player.balance, 10000 - Boards.rentFor(game.board, game.owners, game.board[3], b, game.houses));
  assert.equal(player.balance + other.balance, 20000);
  reset(); game.owners[1] = a;
  await no(actor(a), 'monopoly-house', { spaceIndex: 1, action: 'buy' });
  game.owners[3] = a;
  for (let level = 1; level <= 5; level++) {
    await ok(actor(a), 'monopoly-house', { spaceIndex: 1, action: 'buy' });
    await no(actor(a), 'monopoly-house', { spaceIndex: 1, action: 'buy' });
    await ok(actor(a), 'monopoly-house', { spaceIndex: 3, action: 'buy' });
    assert.equal(game.houses[1], level);
  }
  await no(actor(a), 'monopoly-trade-offer', { toId: b, propertyIndex: 1, amount: 100 });
  for (let level = 5; level > 0; level--) {
    await ok(actor(a), 'monopoly-house', { spaceIndex: 1, action: 'sell' });
    await no(actor(a), 'monopoly-house', { spaceIndex: 1, action: 'sell' });
    await ok(actor(a), 'monopoly-house', { spaceIndex: 3, action: 'sell' });
  }
  assert.equal(player.balance, 10000 - 5 * Boards.buildingCost(game.board, game.board[1]));
  await ok(actor(a), 'monopoly-trade-offer', { toId: b, propertyIndex: 1, amount: 100 });
  await no(actor(a), 'monopoly-trade-response', { accept: true });
  await ok(actor(b), 'monopoly-trade-response', { accept: false }); assert.equal(game.owners[1], a);
  await ok(actor(a), 'monopoly-trade-offer', { toId: b, propertyIndex: 1, amount: 100 });
  await ok(actor(b), 'monopoly-trade-response', { accept: true }); assert.equal(game.owners[1], b);
  reset(); player.inJail = true;
  await roll(10); assert.equal(player.jailTurns, 1); assert.equal(player.position, 10);
  await roll(10); assert.equal(player.jailTurns, 2);
  await roll(10); assert.equal(player.inJail, false); assert.equal(player.balance, 9950);
  reset(); player.inJail = true; await roll(10, [2, 2]); assert.equal(player.inJail, false); assert.equal(game.pendingPurchase.extraRoll, false);
  await ok(actor(a), 'monopoly-purchase-response', { accept: false }); assert.equal(game.turnIndex, 1);
  reset(); game.doublesCount = 2; await roll(0, [2, 2]); assert.equal(player.inJail, true); assert.equal(player.position, 10);
  reset(); await roll(27); assert.equal(player.inJail, true);
  reset(); game.chanceDeck = [{ action: 'money', amount: 50, text: 'Test award' }]; await roll(4); assert.equal(player.balance, 10050);
  reset(); game.communityChestDeck = [{ action: 'money', amount: -50, text: 'Test fee' }]; await roll(14); assert.equal(player.balance, 9950); assert.equal(game.freeParkingPot, 50);
  reset(); player.balance = 1; await roll(1); assert.equal(game.status, 'finished'); assert.equal(game.players.has(a), false);
  console.log('Live Monopoly rules passed: token uniqueness, host/turn authorization, purchases/declines, rent, GO, tax/jackpot, even houses/hotels and refunds, trades, jail/doubles, both card decks, bankruptcy and game completion.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  Math.random = originalRandom;
  sockets.forEach(socket => socket.disconnect());
  if (server.listening) await new Promise(resolve => server.close(resolve));
});
