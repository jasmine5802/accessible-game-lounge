'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');
const { io } = require('socket.io-client');

const accessibility = fs.readFileSync(path.join(__dirname, 'lounge-accessibility.js'), 'utf8');
const gameHelp = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');
assert(accessibility.includes("speak('Leaving the game and returning to the main game list.')") && accessibility.includes('leaveGameAndReturn();'), 'Q must leave immediately without a confirmation prompt.');
assert(accessibility.includes("socket.emit('leave-room', {}, () =>") && accessibility.includes("location.href = '/'"), 'Quit must wait for the active room to be left before returning to the list.');
assert(gameHelp.includes('window.LoungeAccessibility?.leaveGameAndReturn'), 'Every game must use the shared return-to-list path.');

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-quit-test-'));
process.env.LOUNGE_DATA_DIR = dataDirectory;
const { startServer, server } = require('./server');
const call = (socket, event, data = {}) => new Promise(resolve => socket.emit(event, data, resolve));
const connected = socket => new Promise(resolve => socket.on('connect', resolve));
let client;

(async () => {
  await startServer(0, '127.0.0.1');
  const url = `http://127.0.0.1:${server.address().port}`;
  client = io(url, { transports: ['websocket'] });
  await connected(client);
  const suffix = Date.now().toString(36).slice(-6);
  const registered = await call(client, 'register', { username: `Quit${suffix}`, password: 'QuitFlow9!' });
  assert(registered.ok, registered.error);
  const created = await call(client, 'create-game', { category: 'ducks-race' });
  assert(created.ok, created.error);
  const left = await call(client, 'leave-room', {});
  assert(left.ok, 'Server did not acknowledge the completed room leave.');
  const tables = await call(client, 'get-game-tables', { category: 'ducks-race' });
  assert(tables.ok && !tables.tables.some(table => table.id === created.room.code), 'Left game remained in the public games list.');
  client.close();
  await new Promise(resolve => server.close(resolve));
  fs.rmSync(dataDirectory, { recursive: true, force: true });
  console.log('Q return-to-game-list flow and acknowledged room cleanup passed.');
})().catch(error => {
  client?.close();
  if (server.listening) server.close();
  fs.rmSync(dataDirectory, { recursive: true, force: true });
  console.error(error.stack || error);
  process.exitCode = 1;
});
