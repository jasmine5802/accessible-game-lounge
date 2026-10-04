'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'race-options-'));
const { io } = require('socket.io-client');
const { startServer, server } = require('./server');
const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));
let sockets = [];
(async () => {
  try {
    await startServer(0, '127.0.0.1');
    sockets = [0, 1].map(() => io(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'] }));
    await Promise.all(sockets.map(socket => new Promise(resolve => socket.on('connect', resolve))));
    for (const [index, socket] of sockets.entries()) assert((await call(socket, 'register', { username: `RaceOpt${Date.now()}${index}`, password: 'TestRace99!' })).ok);
    for (const duck of [true, false]) for (const challenges of ['all', 'trivia', 'puzzles', 'off']) {
      const created = await call(sockets[0], 'create-game', { category: duck ? 'ducks-race' : 'horse-race' });
      assert.equal(created.room.raceSettings.totalLaps, duck ? 3 : 6);
      assert((await call(sockets[1], 'join-game', { gameId: created.room.code })).ok);
      for (const totalLaps of [0, -1, 1.5, duck ? 11 : 7]) assert.equal((await call(sockets[0], 'set-game-options', { totalLaps })).ok, false);
      assert.equal((await call(sockets[0], 'set-game-options', { challenges: 'invalid' })).ok, false);
      assert((await call(sockets[0], 'set-game-options', { totalLaps: 2, challenges, startingCards: 5 })).ok);
      // Joining players can choose their racer but cannot override shared options.
      assert((await call(sockets[1], 'set-game-options', { totalLaps: 1, challenges: 'off', startingCards: 2 })).ok);
      const start = await call(sockets[0], duck ? 'start-ducks-race' : 'start-derby');
      assert(start.ok); assert.equal(start.game.totalLaps, 2);
      assert.equal(duck ? start.game.players.find(p => p.id === start.game.turnPlayerId).hand.length : start.game.myHand.length, 5);
      assert.equal((await call(sockets[0], 'set-game-options', { totalLaps: 1 })).ok, false);
      const stateEvent = duck ? 'ducks-race-state' : 'derby-state';
      const states = new Map(sockets.map(socket => [socket, start.game]));
      for (const socket of sockets) socket.on(stateEvent, payload => states.set(socket, payload.game));
      // Two human sockets exercise mixed-player challenges and turn resumption.
      let finished = false, seen = 0;
      for (let step = 0; step < 500; step++) {
        const game = states.get(sockets[0]);
        if (game.status === 'finished') { finished = true; break; }
        if (game.pendingMiniGame) {
          seen++;
          assert.notEqual(challenges, 'off');
          if (challenges === 'trivia') assert.match(game.pendingMiniGame.name, /^Trivia/);
          if (challenges === 'puzzles') assert.doesNotMatch(game.pendingMiniGame.name, /^Trivia/);
          for (const socket of sockets) if (states.get(socket).pendingMiniGame?.canAnswer) assert((await call(socket, duck ? 'ducks-race-mini-answer' : 'derby-mini-answer', { choice: 0 })).ok);
        } else {
          const index = game.players.findIndex(p => p.id === game.turnPlayerId);
          assert((await call(sockets[index], duck ? 'ducks-race-roll' : 'derby-roll')).ok);
        }
      }
      assert(finished, 'Both players must reach a completed race');
      if (challenges === 'off') assert.equal(seen, 0);
      for (const socket of sockets) socket.removeAllListeners(stateEvent);
    }
    console.log('Race options: defaults, lap bounds, host authority, challenge filters, full two-player races, and turn resumption passed.');
  } finally {
    sockets.forEach(socket => socket.disconnect());
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
