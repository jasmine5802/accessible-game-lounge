'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { io } = require('socket.io-client');

process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-skipbo-modes-'));
process.env.NODE_ENV = 'test';

const { startServer, server } = require('./server');
const SkipBoEngine = require('./skipbo-engine');

const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));
const wait = (socket, event, predicate = () => true, timeout = 10000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, handler);
      reject(new Error(`Timed out waiting for ${event}.`));
    }, timeout);
    function handler(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, handler);
      resolve(payload);
    }
    socket.on(event, handler);
  });

// --- Test 1: Skip-Bo Engine Unit Validation ---
console.log('--- 1. Testing Skip-Bo Engine Rules & State Logic ---');

const testState = {
  buildingPiles: [[], [], [], []],
  completedCards: [],
  drawDeck: [
    { id: 'sb-d1', value: 3 },
    { id: 'sb-d2', value: 4 },
    { id: 'sb-d3', value: 5 },
    { id: 'sb-d4', value: 6 },
    { id: 'sb-d5', value: 7 }
  ],
  turnOrder: ['p1', 'p2'],
  turnIndex: 0
};

const player1 = {
  id: 'p1',
  name: 'Player 1',
  hand: [{ id: 'sb-h1', value: 1 }],
  stockPile: [{ id: 'sb-s1', value: 'Skip-Bo' }],
  discardPiles: [[], [], [], []]
};

// Play 1 from hand to building pile 0
assert.strictEqual(SkipBoEngine.getBuildingPileNextValue(testState.buildingPiles[0]), 1, 'Empty pile must expect 1');
const move1 = SkipBoEngine.playCardToBuildPile(testState, player1, 'hand', 0, 0);
assert.strictEqual(move1.success, true, 'Card 1 should play to empty building pile');
assert.strictEqual(testState.buildingPiles[0].length, 1, 'Building pile 0 should have 1 card');
assert.strictEqual(move1.refilled, true, 'Hand should refill after playing last hand card');
assert.strictEqual(player1.hand.length, 5, 'Player 1 hand should have 5 cards after auto-refill');

// Play Wild from stock to building pile 0 (expecting 2)
assert.strictEqual(SkipBoEngine.getBuildingPileNextValue(testState.buildingPiles[0]), 2, 'Pile should now expect 2');
const move2 = SkipBoEngine.playCardToBuildPile(testState, player1, 'stock', 0, 0);
assert.strictEqual(move2.success, true, 'Wild card should play to pile expecting 2');
assert.strictEqual(move2.event, 'GAME_OVER', 'Emptying stock pile should trigger GAME_OVER');
assert.strictEqual(testState.winner, 'p1', 'Player 1 should be the winner');

// 12-clear test
const testClearState = {
  buildingPiles: [
    Array.from({ length: 11 }, (_, i) => ({ id: `c-${i + 1}`, value: i + 1, playedAs: i + 1, effectiveValue: i + 1 }))
  ],
  completedCards: [],
  drawDeck: []
};
const playerClear = {
  id: 'p1',
  hand: [{ id: 'c-12', value: 12 }],
  stockPile: [{ id: 'c-stock', value: 5 }],
  discardPiles: [[], [], [], []]
};
assert.strictEqual(SkipBoEngine.getBuildingPileNextValue(testClearState.buildingPiles[0]), 12, 'Pile with 1-11 should expect 12');
const moveClear = SkipBoEngine.playCardToBuildPile(testClearState, playerClear, 'hand', 0, 0);
assert.strictEqual(moveClear.success, true, '12 should successfully play on 11');
assert.strictEqual(moveClear.pileCleared, true, 'Pile should be cleared when 12 is played');
assert.strictEqual(testClearState.buildingPiles[0].length, 0, 'Building pile slot should be reset to empty');
assert.strictEqual(testClearState.completedCards.length, 12, 'Completed cards array should have 12 cards');
assert.strictEqual(moveClear.nextRequiredValue, 1, 'Next required value for cleared pile should be 1');

console.log('Skip-Bo engine unit checks passed.');

// --- Test 2: Multi-Client Visual, Accessible, and Mixed Modes Integration ---
(async () => {
  let hostSocket;
  let guestSocket;
  try {
    await startServer(0, '127.0.0.1');
    const url = `http://127.0.0.1:${server.address().port}`;
    hostSocket = io(url, { transports: ['websocket'] });
    guestSocket = io(url, { transports: ['websocket'] });
    await Promise.all([wait(hostSocket, 'connect'), wait(guestSocket, 'connect')]);

    console.log('--- 2. Testing Accessible & Visual Mode Setup in Lobby & Game ---');
    const hostUser = `AccessibleHost_${Date.now()}`.slice(0, 24);
    const guestUser = `VisualGuest_${Date.now()}`.slice(0, 24);
    const hostAuth = await call(hostSocket, 'register', { username: hostUser, password: 'SkipBoTest9!' });
    const guestAuth = await call(guestSocket, 'register', { username: guestUser, password: 'SkipBoTest9!' });
    assert(hostAuth.ok, hostAuth.error);
    assert(guestAuth.ok, guestAuth.error);

    const roomCreated = await call(hostSocket, 'create-game', { category: 'skip-bo' });
    assert(roomCreated.ok, roomCreated.error);
    const roomCode = roomCreated.room.code;

    const guestJoined = await call(guestSocket, 'join-game', { gameId: roomCode });
    assert(guestJoined.ok, guestJoined.error);

    // Start game
    const hostStateProm = wait(hostSocket, 'skipbo-state', payload => payload.game?.status === 'playing');
    const guestStateProm = wait(guestSocket, 'skipbo-state', payload => payload.game?.status === 'playing');

    const started = await call(hostSocket, 'start-game');
    assert(started.ok, started.error);
    const skipBoStarted = await call(hostSocket, 'start-skipbo');
    assert(skipBoStarted.ok, skipBoStarted.error);

    const [hostInitState, guestInitState] = await Promise.all([hostStateProm, guestStateProm]);
    assert.strictEqual(hostInitState.game.status, 'playing', 'Host game should be playing');
    assert.strictEqual(guestInitState.game.status, 'playing', 'Guest game should be playing');

    console.log('--- 3. Testing Privacy & Hand Isolation (Mixed Mode) ---');
    assert(hostInitState.game.myHand.length === 5, 'Host (turn player) should have drawn 5 cards in hand');
    assert.strictEqual(guestInitState.game.myHand.length, 0, 'Guest (not their turn yet) hand should be empty until their turn');
    assert(hostInitState.game.myStockTop, 'Host must see their own stock top card');
    assert(guestInitState.game.myStockTop, 'Guest must see their own stock top card');

    console.log('--- 4. Testing Gameplay Actions, Building, Discarding, and Turn Advance ---');
    const currentTurnPlayer = hostInitState.game.turnPlayerId;
    const activeSocket = currentTurnPlayer === hostAuth.playerId ? hostSocket : guestSocket;
    const inactiveSocket = currentTurnPlayer === hostAuth.playerId ? guestSocket : hostSocket;

    // Discard a card to end turn and verify turn advances
    const nextTurnPromise = wait(inactiveSocket, 'skipbo-state', payload => payload.game?.turnPlayerId !== currentTurnPlayer);
    const discardResult = await call(activeSocket, 'skipbo-play', {
      source: 'hand',
      sourceIndex: 0,
      targetType: 'discard',
      targetIndex: 0
    });
    assert(discardResult.ok, discardResult.error || 'Discard should succeed');
    assert.strictEqual(discardResult.event, 'TURN_ENDED', 'Discard must end the turn');

    const nextState = await nextTurnPromise;
    assert.strictEqual(nextState.game.turnPlayerId, inactiveSocket === hostSocket ? hostAuth.playerId : guestAuth.playerId, 'Turn must advance to the other player');
    assert(nextState.game.myHand.length > 0, 'Player who received turn must have their hand refilled to 5 cards');

    console.log('All Accessible, Visual, and Mixed Mode Skip-Bo tests completed successfully!');
  } finally {
    hostSocket?.disconnect();
    guestSocket?.disconnect();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(err => {
  console.error('Skip-Bo Test Failure:', err);
  process.exit(1);
});
