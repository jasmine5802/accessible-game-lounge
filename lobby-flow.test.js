'use strict';

const { io } = require('socket.io-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const suffix = `${process.pid}${Date.now()}`.slice(-10);
const testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-test-'));
process.env.LOUNGE_DATA_DIR = testDataDirectory;
const { startServer, server } = require('./server');
let host;
let guest;
const connected = socket => new Promise(resolve => socket.on('connect', resolve));
const call = (socket, event, data) => new Promise(resolve => socket.emit(event, data, resolve));
const once = (socket, event) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 3000);
  socket.once(event, data => { clearTimeout(timer); resolve(data); });
});

(async () => {
  await startServer(0, '127.0.0.1');
  const testServer = `http://127.0.0.1:${server.address().port}`;
  const rootHtml = await (await fetch(`${testServer}/`)).text();
  if (!rootHtml.includes('id="game-menu"') || rootHtml.includes('id="create-game"')) {
    throw new Error('The application root did not serve the keyboard-first desktop lobby.');
  }
  host = io(testServer, { transports: ['websocket'], timeout: 3000 });
  guest = io(testServer, { transports: ['websocket'], timeout: 3000 });
  await Promise.all([connected(host), connected(guest)]);
  const credentials = { password: 'LobbyTest9!' };
  const registered = await Promise.all([
    call(host, 'register', { ...credentials, username: `Host${suffix}` }),
    call(guest, 'register', { ...credentials, username: `Guest${suffix}` })
  ]);
  if (registered.some(result => !result.ok)) throw new Error(`Registration failed: ${JSON.stringify(registered)}`);
  const games = [
    ['Duck Race', '/ducks-race.html'], ['Monopoly', '/monopoly.html'], ['Uno Flip', '/uno.html'], ['Horse Race', '/horserace.html'],
    ['Dominoes', '/dominoes.html'], ['Skip-Bo', '/skipbo.html'], ['Mall Madness', '/mallmadness.html'], ['The Game of Life', '/life.html']
  ];
  const optionPayloads = {
    Monopoly: { edition: 'Pac-Man Arcade' },
    'Uno Flip': { unoVariant: 'Uno Flip!' },
    Dominoes: { dominoSet: 'Double-Nine', dominoMode: 'All Fives' },
    'The Game of Life': { lifeTheme: 'Space Colonization' }
  };
  const stateEvents = {
    'Duck Race':'ducks-race-state', Monopoly:'monopoly-state', 'Uno Flip':'uno-state', 'Horse Race':'derby-state',
    Dominoes:'domino-state', 'Skip-Bo':'skipbo-state', 'Mall Madness':'mall-state', 'The Game of Life':'life-state'
  };
  async function representativeAction(game, state) {
    if (game === 'Duck Race') return call(host, 'ducks-race-roll', {});
    if (game === 'Monopoly') return call(host, 'monopoly-roll', {});
    if (game === 'Uno Flip') return call(host, 'uno-draw', {});
    if (game === 'Horse Race') return call(host, 'derby-draw', {});
    if (game === 'Dominoes') return call(host, 'domino-play', { tileId: state.game.myHand[0].id, end:'left', flipped:false });
    if (game === 'Skip-Bo') return call(host, 'skipbo-play', { source:'hand', sourceIndex:0, targetType:'discard', targetIndex:0 });
    if (game === 'Mall Madness') return call(host, 'mall-director', {});
    if (game === 'The Game of Life') return call(host, 'life-spin', {});
    throw new Error(`No representative action is configured for ${game}.`);
  }
  let lastRoomId;
  for (const [game, page] of games) {
    const categories = { 'Duck Race':'duck-race', Monopoly:'monopoly', 'Uno Flip':'uno-flip', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness', 'The Game of Life':'life' };
    const filtered = await call(guest, 'get-game-tables', { category: categories[game] });
    if (!filtered.ok || filtered.tables.some(table => table.displayGame !== game)) throw new Error(`${game} table filtering failed.`);
    const created = await call(host, 'create-game', { category: categories[game], ...(optionPayloads[game] || {}) });
    lastRoomId = created.room.id;
    if (!created.ok || created.room.displayGame !== game) throw new Error(`${game} creation metadata failed.`);
    if (game === 'Monopoly' && created.room.monopolyEdition !== 'Pac-Man Arcade') throw new Error('Monopoly board selection was not applied.');
    if (game === 'Uno Flip' && created.room.unoVariant !== 'Uno Flip!') throw new Error('UNO rules selection was not applied.');
    if (game === 'Dominoes' && (created.room.dominoSet !== 'Double-Nine' || created.room.dominoMode !== 'All Fives')) throw new Error('Dominoes options were not applied.');
    if (game === 'The Game of Life' && created.room.lifeTheme !== 'Space Colonization') throw new Error('Life theme selection was not applied.');
    const joinedEvent = once(host, 'table-player-joined');
    const joined = await call(guest, 'join-game', { gameId: created.room.id });
    const joinedNotice = await joinedEvent;
    if (!joined.ok || !joinedNotice.message.includes(`2 of ${created.room.maxPlayers} players`)) throw new Error(`${game} join announcement failed.`);
    if (game === 'Monopoly' && joined.room.monopolyEdition !== 'Pac-Man Arcade') throw new Error('Rejoining Monopoly did not retain the current room board.');
    if (game === 'The Game of Life' && joined.room.lifeTheme !== 'Space Colonization') throw new Error('Rejoining Life did not retain the current room theme.');
    const startEvent = once(guest, 'game-started');
    const initialStateEvent = once(host, stateEvents[game]);
    const started = await call(host, 'start-game', {});
    const [launch, initialState] = await Promise.all([startEvent, initialStateEvent]);
    if (!started.ok || !launch.destination.startsWith(`${page}?game=`)) throw new Error(`${game} unified host start failed.`);
    if (initialState.game.status !== 'playing' || initialState.game.players.length !== 2) throw new Error(`${game} did not begin with two active players.`);
    const actionStateEvent = once(host, stateEvents[game]);
    const actionResult = await representativeAction(game, initialState);
    const actionState = await actionStateEvent;
    if (!actionResult.ok || actionState.game.sequence <= initialState.game.sequence) throw new Error(`${game} representative multiplayer action failed: ${JSON.stringify(actionResult)}`);
    console.log(`${game}: ${joinedNotice.message} action sequence ${initialState.game.sequence} -> ${actionState.game.sequence}. ${launch.destination}`);
  }
  const exitSocket = io(testServer, { transports: ['websocket'], timeout: 3000 });
  await connected(exitSocket);
  const exitAuth = await call(exitSocket, 'authenticate-token', { token: registered[1].token });
  const exited = await call(exitSocket, 'leave-game', { gameId: lastRoomId });
  exitSocket.close();
  const rejoinAfterExit = await call(guest, 'join-game', { gameId: lastRoomId });
  if (!exitAuth.ok || !exited.ok || rejoinAfterExit.ok) throw new Error(`Q-style leave-game cleanup failed: ${JSON.stringify({ exitAuth, exited, rejoinAfterExit })}`);
  const resetOptionsRoom = await call(host, 'create-game', { category: 'monopoly' });
  if (!resetOptionsRoom.ok || resetOptionsRoom.room.monopolyEdition !== 'Classic') throw new Error('A newly created game reused options from an earlier game.');
  await Promise.all([call(host, 'logout', {}), call(guest, 'logout', {})]);
  host.close(); guest.close();
  await new Promise(resolve => server.close(resolve));
  console.log('All unified lobby flows passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  host?.close(); guest?.close(); if (server.listening) server.close(); fs.rmSync(testDataDirectory, { recursive: true, force: true });
});
