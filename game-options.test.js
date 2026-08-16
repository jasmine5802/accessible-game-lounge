'use strict';

const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const MonopolyBoards = require('./monopoly-boards');
const UnoRules = require('./uno-rules');
const LifeThemes = require('./life-themes');
const DominoesEngine = require('./dominoes-engine');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-options-'));
process.env.LOUNGE_DATA_DIR = dataDirectory;
const { startServer, server } = require('./server');
let sockets = [];
const connected = socket => new Promise(resolve => socket.on('connect', resolve));
const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));

async function roomWithTwo(category, create = {}) {
  const created = await call(sockets[0], 'create-game', { category, ...create });
  if (!created.ok) throw new Error(`${category}: could not create room: ${created.error}`);
  const joined = await call(sockets[1], 'join-game', { gameId:created.room.code });
  if (!joined.ok) throw new Error(`${category}: second player could not join: ${joined.error}`);
  return created.room.code;
}

async function set(socket, data, label) {
  const result = await call(socket, 'set-game-options', data);
  if (!result.ok) throw new Error(`${label}: option did not save: ${result.error}`);
}

(async () => {
  await startServer(0, '127.0.0.1');
  const url = `http://127.0.0.1:${server.address().port}`;
  sockets = Array.from({ length:4 }, () => io(url, { transports:['websocket'] }));
  await Promise.all(sockets.map(connected));
  const suffix = `${process.pid}${Date.now()}`.slice(-9);
  const registrations = await Promise.all(sockets.map((socket, index) => call(socket, 'register', {
    username:`OptionPlayer${index + 1}${suffix}`, password:'GameOptions9!'
  })));
  if (registrations.some(result => !result.ok)) throw new Error('Option test registration failed.');

  const duckTypes = ['Mallard','Rubber Duck','Wood Duck','Mandarin Duck','Pekin Duck','Muscovy Duck','Duckling'];
  const duckColors = ['Green and brown','Black','White','Gray','Brown','Blue','Yellow','Red','Purple','Pink','Orange'];
  for (let index = 0; index < Math.max(duckTypes.length, duckColors.length); index += 1) {
    await roomWithTwo('ducks-race');
    const type = duckTypes[index % duckTypes.length], color = duckColors[index % duckColors.length];
    const cards = [2,3,5][index % 3], feathers = [3,5,8][index % 3];
    await set(sockets[0], { type, secondary:color, startingCards:cards, startingFeathers:feathers }, `Duck Race ${type}/${color}`);
    await set(sockets[1], { type:'Rubber Duck', secondary:'Yellow' }, 'Duck Race second player');
    const started = await call(sockets[0], 'start-ducks-race');
    const mine = started.game?.players.find(player => player.name.startsWith('OptionPlayer1'));
    if (!started.ok || mine.duckType !== type || mine.color !== color || mine.hand.length !== cards || mine.feathers !== feathers) throw new Error(`Duck Race did not apply ${type}/${color}.`);
  }
  console.log('Duck Race: every duck type, color, card count, and feather count saved and started with 2 players.');

  const horseTypes = ['Miniature Horse','Shetland Pony','Miniature Appaloosa','Full-size Thoroughbred','Full-size Arabian','Full-size Quarter Horse','Full-size Clydesdale'];
  const horseColors = ['Black','White','Gray','Brown','Chestnut','Bay','Palomino','Pinto'];
  for (let index = 0; index < Math.max(horseTypes.length, horseColors.length); index += 1) {
    await roomWithTwo('horse-race');
    const type = horseTypes[index % horseTypes.length], color = horseColors[index % horseColors.length], cards = [2,3,5][index % 3];
    await set(sockets[0], { type, secondary:color, startingCards:cards }, `Horse Race ${type}/${color}`);
    await set(sockets[1], { type:'Miniature Horse', secondary:'Palomino' }, 'Horse Race second player');
    const started = await call(sockets[0], 'start-derby');
    const mine = started.game?.players.find(player => player.name.startsWith('OptionPlayer1'));
    if (!started.ok || mine.horseType !== type || mine.color !== color || started.game.myHand.length !== cards) throw new Error(`Horse Race did not apply ${type}/${color}.`);
  }
  console.log('Horse Race: every horse type, color, and starting-card count saved and started with 2 players.');

  for (const edition of MonopolyBoards.editions) {
    await roomWithTwo('monopoly', { edition });
    const tokens = MonopolyBoards.tokens[edition];
    await set(sockets[0], { type:edition, secondary:tokens[0].id }, `Monopoly ${edition} host`);
    await set(sockets[1], { type:edition, secondary:tokens[1].id }, `Monopoly ${edition} second player`);
    const started = await call(sockets[0], 'start-monopoly');
    if (!started.ok || started.game.edition !== edition || started.game.board.length !== 40 || started.game.players.length !== 2 || started.game.players.some(player => !player.token) || started.game.freeParkingJackpot !== true || started.game.freeParkingPot !== 0) throw new Error(`Monopoly ${edition} did not save/start correctly.`);
  }
  await roomWithTwo('monopoly', { edition:'Classic', freeParkingJackpot:'off' });
  await set(sockets[0], { type:'Classic', secondary:MonopolyBoards.tokens.Classic[0].id }, 'Monopoly jackpot-off host');
  await set(sockets[1], { type:'Classic', secondary:MonopolyBoards.tokens.Classic[1].id }, 'Monopoly jackpot-off second player');
  const jackpotOff = await call(sockets[0], 'start-monopoly');
  if (!jackpotOff.ok || jackpotOff.game.freeParkingJackpot !== false || jackpotOff.game.freeParkingPot !== 0) throw new Error('Monopoly Free Parking jackpot off option did not save/start correctly.');
  console.log(`Monopoly: all ${MonopolyBoards.editions.length} boards, unique tokens, and both Free Parking jackpot options saved and started with 2 players.`);

  for (const variant of UnoRules.VARIANTS) {
    await roomWithTwo('uno-classic');
    await set(sockets[0], { type:variant, secondary:'Standard deck' }, `UNO ${variant}`);
    const started = await call(sockets[0], 'start-uno');
    if (!started.ok || started.game.variant !== variant || started.game.players.length !== 2) throw new Error(`UNO ${variant} did not save/start correctly.`);
  }
  console.log('UNO/DOS: every rules variant saved and started with 2 players.');

  for (const theme of LifeThemes.themes) {
    await roomWithTwo('life');
    await set(sockets[0], { type:theme, secondary:'Standard rules' }, `Life ${theme}`);
    const started = await call(sockets[0], 'start-life');
    if (!started.ok || started.game.theme !== theme || started.game.players.length !== 2) throw new Error(`Life ${theme} did not save/start correctly.`);
  }
  console.log('The Game of Life: every board theme saved and started with 2 players.');

  for (const setName of Object.keys(DominoesEngine.SETS)) for (const mode of DominoesEngine.MODES) {
    await roomWithTwo('dominoes');
    await set(sockets[0], { type:setName, secondary:mode }, `Dominoes ${setName}/${mode}`);
    const started = await call(sockets[0], 'start-dominoes');
    if (!started.ok || started.game.setName !== setName || started.game.mode !== mode || started.game.players.length !== 2) throw new Error(`Dominoes ${setName}/${mode} did not save/start correctly.`);
  }
  console.log('Dominoes: every set and rules-mode combination saved and started with 2 players.');

  for (const pace of ['Standard game','Quick game']) {
    await roomWithTwo('skip-bo');
    await set(sockets[0], { type:pace, secondary:'Standard rules' }, `Skip-Bo ${pace}`);
    const started = await call(sockets[0], 'start-skipbo');
    const expected = pace === 'Quick game' ? 10 : 30;
    const total = started.game?.players.reduce((sum, player) => sum + player.stockCount, 0);
    if (!started.ok || started.game.players.length !== 2 || started.game.players.some(player => player.stockCount !== expected) || total !== expected * 2) throw new Error(`Skip-Bo ${pace} did not save/start correctly.`);
  }
  const fourPlayerSkipBo = await call(sockets[0], 'create-game', { category:'skip-bo' });
  const fourPlayerJoins = await Promise.all(sockets.slice(1).map(socket => call(socket, 'join-game', { gameId:fourPlayerSkipBo.room.code })));
  if (!fourPlayerSkipBo.ok || fourPlayerJoins.some(result => !result.ok)) throw new Error('Skip-Bo 4-player option room failed.');
  await set(sockets[0], { type:'Quick game', secondary:'Standard rules' }, 'Skip-Bo Quick game with 4 players');
  const quickFour = await call(sockets[0], 'start-skipbo');
  const quickFourTotal = quickFour.game?.players.reduce((sum, player) => sum + player.stockCount, 0);
  if (!quickFour.ok || quickFour.game.players.length !== 4 || quickFour.game.players.some(player => player.stockCount !== 10) || quickFourTotal !== 40) throw new Error('Quick Skip-Bo stock piles did not use 10 cards per player for 4 players.');
  console.log('Skip-Bo: Standard stock piles scale by player count and Quick games use 10 cards per player.');

  for (const challenge of ['Standard shopping list','Quick shopping list']) {
    await roomWithTwo('mall-madness');
    await set(sockets[0], { type:challenge, secondary:'Standard rules' }, `Mall Madness ${challenge}`);
    const started = await call(sockets[0], 'start-mall');
    const expected = challenge === 'Quick shopping list' ? 3 : 6;
    if (!started.ok || started.game.players.length !== 2 || started.game.players.some(player => player.remainingItems !== expected)) throw new Error(`Mall Madness ${challenge} did not save/start correctly.`);
  }
  console.log('Mall Madness: standard and quick shopping-list options saved and started with 2 players.');

  console.log('Every game option selection passed with multiple players.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  sockets.forEach(socket => socket.close());
  if (server.listening) server.close();
  fs.rmSync(dataDirectory, { recursive:true, force:true });
});
