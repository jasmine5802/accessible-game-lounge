'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const assert = require('assert');

const lounge = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
const accessibility = fs.readFileSync(path.join(__dirname, 'lounge-accessibility.js'), 'utf8');
const gameHelp = fs.readFileSync(path.join(__dirname, 'game-help.js'), 'utf8');

assert(lounge.includes('Would you like to use accessible mode for'), 'Accessible-mode selection prompt is missing from the lobby flow.');
assert(accessibility.includes('Accessible Mode: On (F4)') && accessibility.includes('Accessible Mode: Off (F4)'), 'Accessible-mode toggle labels are missing.');
assert(accessibility.includes('toggleAccessibleMode') && accessibility.includes('setAccessibleMode'), 'Accessible-mode toggle API is missing.');
assert(gameHelp.includes('lounge-accessible-command-surface') && gameHelp.includes('Accessible Play') && gameHelp.includes('Keyboard commands:') && gameHelp.includes('Players:'), 'Accessible mode must expose a compact text-first game surface with status, players, and keyboard commands.');
assert(gameHelp.includes("['announcement','turn','turn-status','status','players']") && gameHelp.includes('new MutationObserver(syncAccessibleSurface)'), 'The accessible game surface must update live as turns, announcements, and players change.');

process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-accessible-mode-'));

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
  let guest;
  try {
    await startServer(0, '127.0.0.1');
    const url = `http://127.0.0.1:${server.address().port}`;
    host = io(url, { transports: ['websocket'] });
    guest = io(url, { transports: ['websocket'] });
    await Promise.all([wait(host, 'connect'), wait(guest, 'connect')]);

    const hostLogin = await call(host, 'register', { username: `AccessibleHost${Date.now()}`.slice(0, 24), password: 'AccessibleTest9!' });
    const guestLogin = await call(guest, 'register', { username: `AccessibleGuest${Date.now()}`.slice(0, 24), password: 'AccessibleTest9!' });
    if (!hostLogin.ok) throw new Error(hostLogin.error);
    if (!guestLogin.ok) throw new Error(guestLogin.error);

    const created = await call(host, 'create-game', { category: 'ducks-race' });
    if (!created.ok) throw new Error(created.error);
    const joined = await call(guest, 'join-game', { gameId: created.room.code });
    if (!joined.ok) throw new Error(joined.error);

    const hostStatePromise = wait(host, 'ducks-race-state', payload => payload.game?.players?.length === 2);
    const guestStatePromise = wait(guest, 'ducks-race-state', payload => payload.game?.players?.length === 2);

    const started = await call(host, 'start-game');
    if (!started.ok) throw new Error(started.error);
    const begun = await call(host, 'start-ducks-race');
    if (!begun.ok) throw new Error(begun.error);

    const [hostState, guestState] = await Promise.all([
      hostStatePromise,
      guestStatePromise
    ]);

    const hostView = hostState.game.players.find(player => player.name === hostLogin.username);
    const guestView = hostState.game.players.find(player => player.name === guestLogin.username);
    const guestSelfView = guestState.game.players.find(player => player.name === guestLogin.username);
    const guestHostView = guestState.game.players.find(player => player.name === hostLogin.username);

    assert(hostView && hostView.hand.length > 0, 'Host should see their own Duck Race hand.');
    assert(guestView && guestView.hand.length === 0, 'Host should not see the guest Duck Race hand.');
    assert(guestSelfView && guestSelfView.hand.length > 0, 'Guest should see their own Duck Race hand.');
    assert(guestHostView && guestHostView.hand.length === 0, 'Guest should not see the host Duck Race hand.');

    console.log('Accessible mode prompt coverage and Duck Race card privacy checks passed.');

    // Leave explicitly so the server does not retain its normal 30-second
    // reconnect grace timers after this successful integration test.
    await Promise.all([
      call(host, 'leave-room'),
      call(guest, 'leave-room')
    ]);
  } finally {
    host?.disconnect();
    guest?.disconnect();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
