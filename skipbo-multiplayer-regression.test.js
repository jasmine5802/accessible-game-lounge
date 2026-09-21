'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { io } = require('socket.io-client');
const Engine = require('./skipbo-engine');
process.env.NODE_ENV = 'test';
process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'skipbo-regression-'));
let seed = 1729;
Math.random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const { server, startServer } = require('./server');
const sockets = [];
const call = (socket, event, data = {}) => new Promise((resolve, reject) => socket.timeout(5000).emit(event, data, (error, result) => error ? reject(error) : resolve(result)));
const coverage = new Set();
async function synchronize(clients) {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const sequences = clients.map(client => client.state?.sequence);
    if (sequences.every(sequence => sequence !== undefined && sequence === sequences[0])) return;
    await new Promise(resolve => setTimeout(resolve, 2));
  }
  throw new Error('Clients did not receive matching game updates');
}
async function run(count, pace) {
  const clients = [];
  for (let i = 0; i < count; i++) {
    const socket = io(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'], forceNew: true });
    sockets.push(socket);
    await new Promise(resolve => socket.once('connect', resolve));
    const name = `SB${pace[0]}${count}Player${i}`;
    const auth = await call(socket, 'register', { username: name, password: 'LocalTest9!' });
    assert(auth.ok, auth.error);
    const client = { socket, id: name.toLowerCase(), state: null };
    socket.on('skipbo-state', payload => { client.state = payload.game; });
    clients.push(client);
  }
  const host = clients[0];
  const created = await call(host.socket, 'create-game', { category: 'skip-bo' });
  assert(created.ok, created.error);
  for (const client of clients.slice(1)) assert((await call(client.socket, 'join-game', { gameId: created.room.code })).ok);
  assert((await call(host.socket, 'set-game-options', { type: pace, secondary: 'Standard rules' })).ok);
  assert((await call(host.socket, 'start-game')).ok);
  assert((await call(host.socket, 'start-skipbo')).ok);
  await synchronize(clients);
  const size = pace === 'Quick game' ? 10 : count === 2 ? 30 : 20;
  assert(host.state.players.every(player => player.stockCount === size));
  // Reauthenticate on a fresh transport, as a browser does after reconnecting.
  const reconnecting = clients.at(-1);
  const login = await call(reconnecting.socket, 'login', { username: reconnecting.id, password: 'LocalTest9!' });
  reconnecting.socket.disconnect();
  reconnecting.socket.connect();
  await new Promise(resolve => reconnecting.socket.once('connect', resolve));
  assert((await call(reconnecting.socket, 'authenticate-token', { token: login.token })).ok);
  assert((await call(reconnecting.socket, 'join-game', { gameId: created.room.code })).ok);
  let moves = 0;
  while (host.state.status === 'playing' && moves++ < 3000) {
    const current = clients.find(client => client.id === host.state.turnPlayerId);
    const game = current.state;
    const other = clients.find(client => client !== current);
    assert(!(await call(other.socket, 'skipbo-play', { source: 'hand', sourceIndex: 0, targetType: 'discard', targetIndex: 0 })).ok, 'Reject out-of-turn moves');
    assert(!(await call(current.socket, 'skipbo-play', { source: 'stock', targetType: 'discard', targetIndex: 0 })).ok, 'Stock cannot be discarded');
    assert(!(await call(current.socket, 'skipbo-play', { source: 'hand', sourceIndex: -1, targetType: 'building', targetIndex: 0 })).ok);
    assert(game.players.every(player => !('hand' in player) && !('stock' in player)), 'Private piles must not be exposed');
    const sources = [{ source: 'stock', sourceIndex: 0, card: game.myStockTop },
      ...game.myHand.map((card, sourceIndex) => ({ source: 'hand', sourceIndex, card })),
      ...game.myDiscards.map((pile, sourceIndex) => ({ source: 'discard', sourceIndex, card: pile.at(-1) }))];
    let chosen;
    for (const item of sources) {
      const targetIndex = game.buildingPiles.findIndex(pile => Engine.canBuild(item.card, pile));
      if (targetIndex >= 0) { chosen = { ...item, targetIndex }; break; }
    }
    if (!chosen) {
      assert(game.myHand.length, 'Player must have a card to end the turn');
      const result = await call(current.socket, 'skipbo-play', { source: 'hand', sourceIndex: 0, targetType: 'discard', targetIndex: moves % 4 });
      assert(result.ok, result.error);
      assert.strictEqual(result.event, 'TURN_ENDED');
      assert.notStrictEqual(current.state.turnPlayerId, current.id);
      await synchronize(clients);
      coverage.add('end turn');
      continue;
    }
    const needed = Engine.expectedValue(game.buildingPiles[chosen.targetIndex]);
    const beforeStock = game.players.find(player => player.id === current.id).stockCount;
    const result = await call(current.socket, 'skipbo-play', { source: chosen.source, sourceIndex: chosen.sourceIndex, targetType: 'building', targetIndex: chosen.targetIndex });
    assert(result.ok, result.error);
    coverage.add(chosen.source);
    if (Engine.isWildCard(chosen.card)) coverage.add('wild');
    const after = current.state;
    if (needed === 12) {
      assert(result.pileCleared);
      assert.strictEqual(after.buildingPiles[chosen.targetIndex].length, 0);
      coverage.add('clear');
    } else assert.strictEqual(after.buildingPiles[chosen.targetIndex].at(-1).effectiveValue, needed);
    if (result.refilled) { assert.strictEqual(after.myHand.length, result.drawn); coverage.add('refill'); }
    if (chosen.source === 'stock') {
      assert.strictEqual(after.players.find(player => player.id === current.id).stockCount, beforeStock - 1);
      if (beforeStock > 1) { assert(after.myStockTop); assert.notStrictEqual(after.myStockTop.id, chosen.card.id); }
      else { assert.strictEqual(result.event, 'GAME_OVER'); assert.strictEqual(after.winnerId, current.id); coverage.add('win'); }
    }
    assert.strictEqual(after.turnPlayerId, current.id, 'Building must not end a turn');
    await synchronize(clients);
  }
  assert.strictEqual(host.state.status, 'finished', `${count} players, ${pace} must finish`);
  assert(!(await call(host.socket, 'skipbo-play', { source: 'hand', sourceIndex: 0, targetType: 'discard', targetIndex: 0 })).ok);
  for (const client of clients) { await call(client.socket, 'leave-room'); client.socket.disconnect(); }
  console.log(`${count}-player ${pace}: ${moves} moves, reconnect and winner verified.`);
}
(async () => {
  await startServer(0, '127.0.0.1');
  for (const count of [2, 3, 6]) for (const pace of ['Quick game', 'Standard game']) await run(count, pace);
  for (const rule of ['hand', 'discard', 'stock', 'wild', 'clear', 'refill', 'end turn', 'win']) assert(coverage.has(rule), `Missing coverage: ${rule}`);
  console.log('All Skip-Bo multiplayer regression scenarios passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  sockets.forEach(socket => socket.disconnect());
  server.closeAllConnections?.();
  if (server.listening) await new Promise(resolve => server.close(resolve));
});
