'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const Module = require('node:module');
const { io } = require('socket.io-client');
const Boards = require('./monopoly-boards');
const Cards = require('./monopoly-cards');
const Jackpot = require('./monopoly-jackpot');
const { chooseMonopolyBuilding } = require('./computer-player');

console.log('--- Testing Monopoly Boards & Editions ---');

// 1. Test all editions in MonopolyBoards.editions
assert(Array.isArray(Boards.editions) && Boards.editions.length >= 50, 'Must have at least 50 editions');
for (const edition of Boards.editions) {
  const b = Boards.createBoard(edition);
  assert.equal(b.length, 40, `Edition ${edition} board must have 40 spaces`);
  const properties = b.filter(s => s.type === 'Property');
  assert.equal(properties.length, 22, `Edition ${edition} must have 22 properties`);
  const transits = b.filter(s => s.type === 'Transit');
  assert.equal(transits.length, 4, `Edition ${edition} must have 4 transit spaces`);
  const utilities = b.filter(s => s.type === 'Utility');
  assert.equal(utilities.length, 2, `Edition ${edition} must have 2 utilities`);
  assert.equal(b.filter(s => s.type === 'Go').length, 1, `Edition ${edition} must have 1 Go space`);
  assert.equal(b.filter(s => s.type === 'Jail').length, 1, `Edition ${edition} must have 1 Jail space`);
  assert.equal(b.filter(s => s.type === 'Free Parking').length, 1, `Edition ${edition} must have 1 Free Parking space`);
  assert.equal(b.filter(s => s.type === 'Go to Jail').length, 1, `Edition ${edition} must have 1 Go to Jail space`);
  assert.equal(b.filter(s => s.type === 'Tax').length, 2, `Edition ${edition} must have 2 Tax spaces`);
  assert.equal(b.filter(s => s.type === 'Chance').length, 3, `Edition ${edition} must have 3 Chance spaces`);
  assert.equal(b.filter(s => s.type === 'Community Chest').length, 3, `Edition ${edition} must have 3 Community Chest spaces`);

  // Tokens
  const tokens = Boards.tokens[edition];
  assert(Array.isArray(tokens) && tokens.length === 6, `Edition ${edition} must have exactly 6 tokens`);
  const tokenIds = new Set(tokens.map(t => t.id));
  assert.equal(tokenIds.size, 6, `Edition ${edition} tokens must have unique ids`);

  // Formatting currency
  const formatted = Boards.formatMoney(edition, 500);
  assert(typeof formatted === 'string' && formatted.length > 0, `Edition ${edition} formatMoney must return string`);

  // Card decks
  const chanceDeck = Cards.getDeck(edition, 'Chance', b);
  assert(chanceDeck.length >= 16, `Edition ${edition} Chance deck must have at least 16 cards`);
  const chestDeck = Cards.getDeck(edition, 'Community Chest', b);
  assert(chestDeck.length >= 16, `Edition ${edition} Community Chest deck must have at least 16 cards`);
}
console.log(`Verified all ${Boards.editions.length} Monopoly editions and custom boards.`);

// 2. Test Rent calculations
console.log('--- Testing Rent Calculations ---');
const classicBoard = Boards.createBoard('Classic');
const boardwalk = classicBoard.find(s => s.index === 39);
const parkPlace = classicBoard.find(s => s.index === 37);

// Single property owned (not full group)
let currentOwners = { [boardwalk.index]: 'p1' };
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', {}), boardwalk.rent);

// Monopoly owned (both dark blue)
currentOwners[parkPlace.index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', {}), boardwalk.rent * 2);

// Houses on Boardwalk
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', { [boardwalk.index]: 1 }), boardwalk.rent * 5);
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', { [boardwalk.index]: 2 }), boardwalk.rent * 15);
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', { [boardwalk.index]: 3 }), boardwalk.rent * 45);
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', { [boardwalk.index]: 4 }), boardwalk.rent * 80);
assert.equal(Boards.rentFor(classicBoard, currentOwners, boardwalk, 'p1', { [boardwalk.index]: 5 }), boardwalk.rent * 120);

// Transit rents
const transits = classicBoard.filter(s => s.type === 'Transit');
const transitOwners = {};
transitOwners[transits[0].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, transitOwners, transits[0], 'p1', {}), 25);
transitOwners[transits[1].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, transitOwners, transits[0], 'p1', {}), 50);
transitOwners[transits[2].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, transitOwners, transits[0], 'p1', {}), 100);
transitOwners[transits[3].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, transitOwners, transits[0], 'p1', {}), 200);

// Utility rents
const utilities = classicBoard.filter(s => s.type === 'Utility');
const utilityOwners = {};
utilityOwners[utilities[0].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, utilityOwners, utilities[0], 'p1', {}), 20);
utilityOwners[utilities[1].index] = 'p1';
assert.equal(Boards.rentFor(classicBoard, utilityOwners, utilities[0], 'p1', {}), 40);

console.log('Rent calculations verified.');

// 3. Test Jackpot logic
console.log('--- Testing Jackpot Module ---');
const testGame = { freeParkingJackpot: true, freeParkingPot: 0 };
const testPlayer = { balance: 1000 };

assert.equal(Jackpot.collect(testGame, 100), 100);
assert.equal(testGame.freeParkingPot, 100);
assert.equal(Jackpot.collect(testGame, 50), 150);
assert.equal(Jackpot.award(testGame, testPlayer), 150);
assert.equal(testPlayer.balance, 1150);
assert.equal(testGame.freeParkingPot, 0);

// With jackpot disabled
testGame.freeParkingJackpot = false;
assert.equal(Jackpot.collect(testGame, 100), 0);
assert.equal(Jackpot.award(testGame, testPlayer), 0);

console.log('Jackpot logic verified.');

// 4. Test Live Multi-Player Game Session with all rules
console.log('--- Testing Live Server End-to-End Simulation ---');
process.env.NODE_ENV = 'test';
process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'monopoly-full-test-'));
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
const ok = async (socket, event, data) => {
  const result = await call(socket, event, data);
  assert.equal(result.ok, true, `Expected ok:true for ${event}, got error: ${result.error}`);
  return result;
};
const no = async (socket, event, data) => {
  const result = await call(socket, event, data);
  assert.equal(result.ok, false, `Expected ok:false for ${event}`);
  return result;
};

const originalRandom = Math.random;

(async () => {
  await startServer(0, '127.0.0.1');
  for (let i = 0; i < 3; i++) {
    const socket = io(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'] });
    sockets.push(socket);
    await new Promise(resolve => socket.once('connect', resolve));
    await ok(socket, 'register', { username: `P${i}_${Date.now()}`, password: 'Password123!' });
  }

  const [p1, p2, p3] = sockets;

  // Create game with Electronic Banking edition
  const created = await ok(p1, 'create-game', { category: 'monopoly', edition: 'Electronic Banking', freeParkingJackpot: true });
  const roomCode = created.room.code;
  await ok(p2, 'join-game', { gameId: roomCode });
  await ok(p3, 'join-game', { gameId: roomCode });

  // Token selection
  const tokens = Boards.tokens['Electronic Banking'];
  await ok(p1, 'monopoly-select-token', { tokenId: tokens[0].id });
  await ok(p2, 'monopoly-select-token', { tokenId: tokens[1].id });
  await ok(p3, 'monopoly-select-token', { tokenId: tokens[2].id });

  // Only host can start
  await no(p2, 'start-monopoly');
  await ok(p1, 'start-monopoly');

  const game = testRooms.get(roomCode).monopoly;
  assert.equal(game.status, 'playing');
  assert.equal(game.edition, 'Electronic Banking');

  const [idA, idB, idC] = game.turnOrder;
  const socketMap = { [created.room.hostId]: p1, [game.turnOrder[1]]: p2, [game.turnOrder[2]]: p3 };
  const getSocket = (id) => {
    if (id === created.room.hostId) return p1;
    if (id === idB) return p2;
    return p3;
  };

  const plA = game.players.get(idA);
  const plB = game.players.get(idB);
  const plC = game.players.get(idC);

  // Helper to force roll dice
  const forceRoll = async (playerId, dice = [1, 2], startPos = null) => {
    const s = getSocket(playerId);
    const p = game.players.get(playerId);
    if (startPos !== null) p.position = startPos;
    let idx = 0;
    Math.random = () => (dice[idx++ % 2] - 0.5) / 6;
    try {
      return await ok(s, 'monopoly-roll');
    } finally {
      Math.random = originalRandom;
    }
  };

  // Reset balances and positions for clean tests
  const resetGame = () => {
    game.turnIndex = 0;
    game.doublesCount = 0;
    game.pendingPurchase = null;
    game.pendingTrade = null;
    game.owners = {};
    game.houses = {};
    game.freeParkingJackpot = true;
    game.freeParkingPot = 0;
    for (const p of game.players.values()) {
      p.balance = 10000;
      p.position = 0;
      p.inJail = false;
      p.jailTurns = 0;
      p.jailFreeCards = [];
    }
  };

  // Test 1: Rolling, movement, unowned property, buying
  resetGame();
  await forceRoll(idA, [1, 2], 0); // moves to 3
  assert.equal(game.pendingPurchase.spaceIndex, 3);
  await ok(getSocket(idA), 'monopoly-purchase-response', { accept: true });
  assert.equal(game.owners[3], idA);
  assert.equal(plA.balance, 10000 - game.board[3].price);

  // Test 2: Passing GO
  resetGame();
  await forceRoll(idA, [1, 2], 38); // from 38 to 1 (passes GO, collects 200)
  assert.equal(plA.balance, 10200); // collected $200
  if (game.pendingPurchase) await ok(getSocket(idA), 'monopoly-purchase-response', { accept: false });

  // Test 3: Tax spaces and Jackpot collection
  resetGame();
  await forceRoll(idA, [2, 2], 0); // space 4 (Tax space)
  assert.equal(plA.balance, 10000 - game.board[4].amount);
  assert.equal(game.freeParkingPot, game.board[4].amount);

  // Land on Free Parking (space 20)
  plB.position = 16;
  game.turnIndex = 1;
  await forceRoll(idB, [2, 2], 16); // lands on 20
  assert.equal(plB.balance, 10000 + game.board[4].amount);
  assert.equal(game.freeParkingPot, 0);

  // Test 4: Jail Mechanics - Go to Jail space (space 30)
  resetGame();
  await forceRoll(idA, [2, 1], 27); // lands on 30
  assert.equal(plA.position, 10);
  assert.equal(plA.inJail, true);
  assert.equal(plA.jailTurns, 0);

  // Jail attempt 1 (fails, no doubles)
  game.turnIndex = 0;
  await forceRoll(idA, [1, 2]);
  assert.equal(plA.inJail, true);
  assert.equal(plA.jailTurns, 1);

  // Jail attempt 2 (fails, no doubles)
  game.turnIndex = 0;
  await forceRoll(idA, [2, 3]);
  assert.equal(plA.inJail, true);
  assert.equal(plA.jailTurns, 2);

  // Jail attempt 3 (fails, auto-pays $50 bail fee and moves)
  game.turnIndex = 0;
  await forceRoll(idA, [1, 2]);
  assert.equal(plA.inJail, false);
  assert.equal(plA.jailTurns, 0);
  assert.equal(plA.balance, 9950); // paid $50
  assert.equal(plA.position, 13); // 10 + 3

  // Jail escape via doubles
  resetGame();
  plA.inJail = true;
  await forceRoll(idA, [3, 3], 10);
  assert.equal(plA.inJail, false);
  assert.equal(plA.position, 16); // 10 + 6

  // Jail escape via Get Out of Jail Free card
  resetGame();
  plA.inJail = true;
  plA.jailFreeCards = ['Chance'];
  await forceRoll(idA, [1, 2], 10);
  assert.equal(plA.inJail, false);
  assert.equal(plA.jailFreeCards.length, 0);

  // Test 5: 3 Consecutive Doubles sends player to Jail
  resetGame();
  await forceRoll(idA, [2, 2], 0); // doubles 1
  assert.equal(plA.inJail, false);
  assert.equal(game.doublesCount, 1);
  if (game.pendingPurchase) await ok(getSocket(idA), 'monopoly-purchase-response', { accept: false });

  await forceRoll(idA, [3, 3]); // doubles 2
  assert.equal(plA.inJail, false);
  assert.equal(game.doublesCount, 2);
  if (game.pendingPurchase) await ok(getSocket(idA), 'monopoly-purchase-response', { accept: false });

  await forceRoll(idA, [4, 4]); // doubles 3 -> Jail!
  assert.equal(plA.inJail, true);
  assert.equal(plA.position, 10);
  assert.equal(game.doublesCount, 0);

  // Test 6: Building houses evenly, hotels, and refunds
  resetGame();
  const brownGroup = game.board.filter(s => s.group === 'brown');
  game.owners[brownGroup[0].index] = idA;
  game.owners[brownGroup[1].index] = idA;

  // Buy house 1 on first property
  await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'buy' });
  assert.equal(game.houses[brownGroup[0].index], 1);
  assert.equal(game.houses[brownGroup[1].index] || 0, 0);

  // Cannot buy 2nd house on first property before 2nd property has 1 house (even building)
  await no(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'buy' });

  // Buy house 1 on 2nd property
  await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[1].index, action: 'buy' });
  assert.equal(game.houses[brownGroup[1].index], 1);

  // Upgrade up to hotel (5 buildings)
  for (let level = 2; level <= 5; level++) {
    await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'buy' });
    await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[1].index, action: 'buy' });
  }
  assert.equal(game.houses[brownGroup[0].index], 5);
  assert.equal(game.houses[brownGroup[1].index], 5);

  // Cannot buy beyond hotel
  await no(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'buy' });

  // Sell hotel down to 4 houses
  await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'sell' });
  assert.equal(game.houses[brownGroup[0].index], 4);

  // Even selling rule: cannot sell from brownGroup[0] (which has 4) while brownGroup[1] has 5
  await no(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[0].index, action: 'sell' });
  await ok(getSocket(idA), 'monopoly-house', { spaceIndex: brownGroup[1].index, action: 'sell' });
  assert.equal(game.houses[brownGroup[1].index], 4);

  // Test 7: Trading
  resetGame();
  game.owners[brownGroup[0].index] = idA;
  // Propose trade to player B
  await ok(getSocket(idA), 'monopoly-trade-offer', { toId: idB, propertyIndex: brownGroup[0].index, amount: 500 });
  assert(game.pendingTrade !== null);

  // Player B accepts
  await ok(getSocket(idB), 'monopoly-trade-response', { accept: true });
  assert.equal(game.owners[brownGroup[0].index], idB);
  assert.equal(plA.balance, 10500);
  assert.equal(plB.balance, 9500);

  // Test 8: Chance & Community Chest cards
  resetGame();
  // Card: Nearest Railroad (transit)
  game.chanceDeck = [{ text: 'Advance to nearest transit', action: 'nearest-transit', rentMultiplier: 2 }];
  game.owners[15] = idB; // Pennsylvania RR
  await forceRoll(idA, [3, 4], 0); // space 7 (Chance)
  assert.equal(plA.position, 15);
  assert.equal(plA.balance, 10000 - 50); // 25 * 2 = 50

  // Card: Street repairs
  resetGame();
  game.owners[brownGroup[0].index] = idA;
  game.owners[brownGroup[1].index] = idA;
  game.houses[brownGroup[0].index] = 3;
  game.houses[brownGroup[1].index] = 5; // 1 hotel
  game.communityChestDeck = [{ text: 'Assessed for street repairs', action: 'repairs', house: 40, hotel: 115 }];
  await forceRoll(idA, [1, 1], 0); // space 2 (Community Chest)
  // Repair total: 3 houses * 40 ($120) + 1 hotel * 115 ($115) = $235
  assert.equal(plA.balance, 10000 - 235);
  assert.equal(game.freeParkingPot, 235);

  // Test 9: Bankruptcy & Win condition
  resetGame();
  plA.balance = 50;
  game.owners[boardwalk.index] = idB;
  game.houses[boardwalk.index] = 5; // Hotel rent $6000
  await forceRoll(idA, [4, 5], 30); // lands on 39 (Boardwalk)
  assert.equal(game.players.has(idA), false, 'Bankrupt player must be removed');
  assert.equal(game.players.size, 2, '2 players remain');

  // Second bankruptcy ends the game
  game.owners[boardwalk.index] = idC;
  plB.balance = 10;
  game.turnIndex = 0;
  await forceRoll(idB, [4, 5], 30); // lands on 39 (Boardwalk owned by idC)
  assert.equal(game.status, 'finished', 'Game must end when only 1 player remains');
  assert.equal(game.winnerId, idC, 'Remaining player is the winner');

  console.log('--- ALL Exhaustive Monopoly Tests Passed Successfully! ---');
})().catch(err => {
  console.error(err);
  process.exitCode = 1;
}).finally(async () => {
  Math.random = originalRandom;
  sockets.forEach(s => s.disconnect());
  if (server && server.listening) await new Promise(res => server.close(res));
});
