'use strict';

const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const MonopolyBoards = require('./monopoly-boards');
const DominoesEngine = require('./dominoes-engine');

const testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-multiplayer-'));
process.env.LOUNGE_DATA_DIR = testDataDirectory;
const { startServer, server } = require('./server');
let sockets = [];

const connected = socket => new Promise(resolve => socket.on('connect', resolve));
const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));
const definitions = [
  { name:'Duck Race', category:'ducks-race', start:'start-ducks-race', action:'ducks-race-roll' },
  { name:'Monopoly', category:'monopoly', create:{ edition:'Classic' }, start:'start-monopoly', action:'monopoly-roll' },
  { name:'Classic UNO', category:'uno-classic', start:'start-uno', action:'uno-draw' },
  { name:'UNO Flip', category:'uno-flip', start:'start-uno', action:'uno-draw' },
  { name:'DOS', category:'uno-dos', start:'start-uno', action:'uno-draw' },
  { name:"UNO Show 'Em No Mercy", category:'uno-no-mercy', start:'start-uno', action:'uno-draw' },
  { name:'UNO Attack', category:'uno-attack', start:'start-uno', action:'uno-draw' },
  { name:'Horse Race', category:'horse-race', start:'start-derby', action:'derby-draw' },
  { name:'Dominoes', category:'dominoes', start:'start-dominoes', action:'domino' },
  { name:'Skip-Bo', category:'skip-bo', start:'start-skipbo', action:'skipbo' },
  { name:'Mall Madness', category:'mall-madness', start:'start-mall', action:'mall-director' },
  { name:'The Game of Life', category:'life', start:'start-life', action:'life-spin' }
];

function playerCount(game) {
  if (Array.isArray(game.players)) return game.players.length;
  throw new Error('Started game did not expose its players.');
}

async function takeFirstAction(host, definition, game) {
  if (definition.action === 'domino') {
    const playable = game.myHand.find(tile => DominoesEngine.canPlay(tile, game.board));
    if (!playable) return call(host, 'domino-draw');
    for (const end of ['left', 'right']) for (const flipped of [false, true]) {
      try {
        DominoesEngine.placeTile(game.board, playable, end, flipped);
        return call(host, 'domino-play', { tileId:playable.id, end, flipped });
      } catch {}
    }
  }
  if (definition.action === 'skipbo') return call(host, 'skipbo-play', { source:'hand', sourceIndex:0, targetType:'discard', targetIndex:0 });
  return call(host, definition.action);
}

(async () => {
  await startServer(0, '127.0.0.1');
  const url = `http://127.0.0.1:${server.address().port}`;
  sockets = Array.from({ length:4 }, () => io(url, { transports:['websocket'], timeout:3000 }));
  await Promise.all(sockets.map(connected));
  const stamp = `${process.pid}${Date.now()}`.slice(-9);
  const registrations = await Promise.all(sockets.map((socket, index) =>
    call(socket, 'register', { username:`Player${index + 1}${stamp}`, password:'Multiplayer9!' })
  ));
  if (registrations.some(result => !result.ok)) throw new Error(`Registration failed: ${JSON.stringify(registrations)}`);

  for (const count of [2, 4]) {
    for (const definition of definitions) {
      const active = sockets.slice(0, count);
      const created = await call(active[0], 'create-game', { category:definition.category, ...(definition.create || {}) });
      if (!created.ok) throw new Error(`${definition.name}, ${count} players: creation failed: ${created.error}`);
      const joins = await Promise.all(active.slice(1).map(socket => call(socket, 'join-game', { gameId:created.room.code })));
      if (joins.some(result => !result.ok)) throw new Error(`${definition.name}, ${count} players: join failed.`);
      if (definition.name === 'Monopoly') {
        const tokens = MonopolyBoards.tokens.Classic;
        const choices = await Promise.all(active.map((socket, index) => call(socket, 'monopoly-select-token', { tokenId:tokens[index].id })));
        if (choices.some(result => !result.ok)) throw new Error(`Monopoly, ${count} players: token selection failed.`);
      }
      const launch = await call(active[0], 'start-game');
      if (!launch.ok) throw new Error(`${definition.name}, ${count} players: unified start failed: ${launch.error}`);
      const started = await call(active[0], definition.start);
      if (!started.ok) throw new Error(`${definition.name}, ${count} players: game start failed: ${started.error}`);
      if (playerCount(started.game) !== count) throw new Error(`${definition.name}, ${count} players: game state contains ${playerCount(started.game)} players.`);
      if (definition.name === 'Skip-Bo') {
        const stockCounts = started.game.players.map(player => player.stockCount);
        const totalStockCards = stockCounts.reduce((sum, amount) => sum + amount, 0);
        if (stockCounts.some(amount => amount !== 20) || totalStockCards !== 20 * count) throw new Error(`Skip-Bo, ${count} players: stock piles did not scale to ${20 * count} total cards.`);
      }
      const action = await takeFirstAction(active[0], definition, started.game);
      if (!action?.ok) throw new Error(`${definition.name}, ${count} players: first action failed: ${action?.error}`);
      console.log(`${definition.name}: ${count} human players started and completed a gameplay action.`);
    }
  }

  sockets.forEach(socket => socket.close());
  await new Promise(resolve => server.close(resolve));
  console.log('All 2-player and 4-player gameplay checks passed.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  sockets.forEach(socket => socket.close());
  if (server.listening) server.close();
  fs.rmSync(testDataDirectory, { recursive:true, force:true });
});
