'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-computer-test-'));

const { io } = require('socket.io-client');
const { startServer, server } = require('./server');

const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));
const wait = (socket, event, predicate = () => true, timeout = 6000) =>
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

(async () => {
  let host;
  try {
    await startServer(0, '127.0.0.1');
    const url = `http://127.0.0.1:${server.address().port}`;
    host = io(url, { transports: ['websocket'] });
    await wait(host, 'connect');

    const username = `BotHost${Date.now()}`.slice(0, 24);
    const registered = await call(host, 'register', { username, password: 'ComputerTest9!' });
    if (!registered.ok) throw new Error(registered.error);

    const games = [
      ['ducks-race', 'start-ducks-race'],
      ['monopoly', 'start-monopoly'],
      ['uno-classic', 'start-uno'],
      ['uno-flip', 'start-uno'],
      ['uno-dos', 'start-uno'],
      ['uno-no-mercy', 'start-uno'],
      ['uno-attack', 'start-uno'],
      ['horse-race', 'start-derby'],
      ['dominoes', 'start-dominoes'],
      ['skip-bo', 'start-skipbo'],
      ['mall-madness', 'start-mall'],
      ['life', 'start-life']
    ];

    for (const [category, startEvent] of games) {
      const created = await call(host, 'create-game', { category });
      if (!created.ok) throw new Error(`${category}: create failed`);

      if (category === 'monopoly') {
        const options = await call(host, 'set-game-options', { type: 'Classic', secondary: 'Top Hat' });
        if (!options.ok) throw new Error(options.error);
      }

      const added = await call(host, 'add-computer-player');
      if (!added.ok) throw new Error(`${category}: ${added.error}`);

      const roomUpdate = await call(host, 'join-game', { gameId: created.room.code });
      if (roomUpdate.room.players.filter(player => player.name === 'Computer Player').length !== 1) {
        throw new Error(`${category}: computer did not join exactly once`);
      }

      const entered = await call(host, 'start-game');
      if (!entered.ok) throw new Error(`${category}: unified start failed`);

      const started = await call(host, startEvent);
      if (!started.ok) throw new Error(`${category}: ${started.error}`);

      console.log(`${category}: computer joined and game started`);

      if (category === 'ducks-race') {
        const returned = wait(
          host,
          'ducks-race-state',
          payload => payload.game.sequence >= 3 && payload.game.turnPlayerId === created.room.hostId
        );
        await call(host, 'ducks-race-roll');
        await returned;
        console.log('ducks-race: computer completed an automatic turn');
      }

      host.emit('leave-room');
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('Computer opponent checks passed for every game.');
  } finally {
    host?.disconnect();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
