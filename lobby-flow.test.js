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
    ['Monopoly', '/monopoly.html'], ['Uno Flip', '/uno.html'], ['Horse Race', '/horserace.html'],
    ['Dominoes', '/dominoes.html'], ['Skip-Bo', '/skipbo.html'], ['Mall Madness', '/mallmadness.html']
  ];
  for (const [game, page] of games) {
    const categories = { Monopoly:'monopoly', 'Uno Flip':'uno-flip', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness' };
    const filtered = await call(guest, 'get-game-tables', { category: categories[game] });
    if (!filtered.ok || filtered.tables.some(table => table.displayGame !== game)) throw new Error(`${game} table filtering failed.`);
    const created = await call(host, 'create-game', { category: categories[game] });
    if (!created.ok || created.room.displayGame !== game) throw new Error(`${game} creation metadata failed.`);
    const joinedEvent = once(host, 'table-player-joined');
    const joined = await call(guest, 'join-game', { gameId: created.room.id });
    const joinedNotice = await joinedEvent;
    if (!joined.ok || !joinedNotice.message.includes(`2 of ${created.room.maxPlayers} players`)) throw new Error(`${game} join announcement failed.`);
    const startEvent = once(guest, 'game-started');
    const started = await call(host, 'start-game', {});
    const launch = await startEvent;
    if (!started.ok || !launch.destination.startsWith(`${page}?game=`)) throw new Error(`${game} unified host start failed.`);
    console.log(`${game}: ${joinedNotice.message} ${launch.destination}`);
  }
  await Promise.all([call(host, 'logout', {}), call(guest, 'logout', {})]);
  host.close(); guest.close();
  await new Promise(resolve => server.close(resolve));
  console.log('All unified lobby flows passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  host?.close(); guest?.close(); if (server.listening) server.close(); fs.rmSync(testDataDirectory, { recursive: true, force: true });
});
