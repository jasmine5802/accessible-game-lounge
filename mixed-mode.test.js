'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { io } = require('socket.io-client');

const script = fs.readFileSync(path.join(__dirname, 'lounge-accessibility.js'), 'utf8');

function createClassList() {
  const classes = new Set();
  return {
    add(...names) { names.forEach(name => classes.add(name)); },
    remove(...names) { names.forEach(name => classes.delete(name)); },
    toggle(name, force) {
      if (force === true) { classes.add(name); return true; }
      if (force === false) { classes.delete(name); return false; }
      if (classes.has(name)) { classes.delete(name); return false; }
      classes.add(name);
      return true;
    },
    contains(name) { return classes.has(name); }
  };
}

function createElement(tagName) {
  const element = {
    tagName: String(tagName || 'div').toUpperCase(),
    className: '',
    textContent: '',
    hidden: false,
    open: false,
    tabIndex: -1,
    style: {},
    attributes: new Map(),
    classList: createClassList(),
    children: [],
    _queryMap: new Map(),
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); return node; },
    prepend(...nodes) { this.children.unshift(...nodes); },
    replaceChildren(...nodes) { this.children = [...nodes]; },
    insertBefore(node) { this.children.unshift(node); return node; },
    setAttribute(name, value) { this.attributes.set(name, String(value)); },
    getAttribute(name) { return this.attributes.get(name) || null; },
    hasAttribute(name) { return this.attributes.has(name); },
    removeAttribute(name) { this.attributes.delete(name); },
    addEventListener() {},
    removeEventListener() {},
    focus() {},
    remove() { this.removed = true; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    set innerHTML(value) {
      this._innerHTML = String(value);
      if (this.tagName === 'DIALOG' && this.id === 'lounge-audio-settings') {
        const controlIds = [
          'lounge-sound-volume',
          'lounge-speech-volume',
          'lounge-sound-output',
          'lounge-speech-output',
          'lounge-blind-mode',
          'lounge-test-speech',
          'lounge-close-settings'
        ];
        for (const controlId of controlIds) this._queryMap.set(`#${controlId}`, createElement(controlId.includes('volume') && !controlId.includes('output') ? 'input' : 'button'));
        this._queryMap.get('#lounge-sound-volume').value = '0';
        this._queryMap.get('#lounge-speech-volume').value = '0';
        this._queryMap.get('#lounge-sound-output').textContent = '';
        this._queryMap.get('#lounge-speech-output').textContent = '';
        this._queryMap.get('#lounge-blind-mode').checked = false;
      }
    },
    get innerHTML() { return this._innerHTML || ''; },
    querySelector(selector) { return this._queryMap.get(selector) || null; },
    querySelectorAll() { return []; },
    dispatchEvent() { return true; }
  };
  return element;
}

function createClientContext(pathname) {
  const listeners = new Map();
  const main = createElement('main');
  main.setAttribute('aria-label', 'Game');
  const h1 = createElement('h1');
  h1.textContent = 'Duck Race';
  const body = createElement('body');
  const html = createElement('html');
  const head = createElement('head');
  const document = {
    body,
    head,
    documentElement: html,
    title: 'Duck Race',
    createElement,
    querySelector(selector) {
      if (selector === 'main') return main;
      if (selector === 'h1') return h1;
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      for (const handler of listeners.get(event.type) || []) handler(event);
    }
  };
  const localStore = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: callback => callback(),
    performance: { now: () => Date.now() },
    window: null,
    document,
    location: { pathname, href: pathname },
    localStorage: {
      getItem(key) { return localStore.has(key) ? localStore.get(key) : null; },
      setItem(key, value) { localStore.set(key, String(value)); },
      removeItem(key) { localStore.delete(key); }
    },
    sessionStorage: {
      getItem() { return null; },
      setItem() {},
      removeItem() {}
    },
    speechSynthesis: { cancel() {}, speak() {} },
    SpeechSynthesisUtterance: function SpeechSynthesisUtterance(text) { this.text = text; this.volume = 1; },
    CustomEvent: function CustomEvent(type, init = {}) { this.type = type; this.detail = init.detail; },
    AudioContext: function AudioContext() {},
    webkitAudioContext: undefined,
    AudioNode: function AudioNode() {},
    io: undefined,
    socket: undefined,
    room: undefined,
    playerId: undefined
  };
  context.window = context;
  context.window.document = document;
  context.window.location = context.location;
  context.window.localStorage = context.localStorage;
  context.window.sessionStorage = context.sessionStorage;
  context.window.requestAnimationFrame = context.requestAnimationFrame;
  context.window.speechSynthesis = context.speechSynthesis;
  context.window.SpeechSynthesisUtterance = context.SpeechSynthesisUtterance;
  context.window.CustomEvent = context.CustomEvent;
  context.window.AudioContext = context.AudioContext;
  context.window.AudioNode = context.AudioNode;
  context.window.addEventListener = () => {};
  context.window.removeEventListener = () => {};
  context.window.dispatchEvent = () => {};
  context.window.navigator = { userAgent: 'node' };
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'lounge-accessibility.js' });
  document.dispatchEvent({ type: 'DOMContentLoaded' });
  return { context, document, localStore };
}

const accessibleClient = createClientContext('/ducks-race.html');
const visualClient = createClientContext('/ducks-race.html');

assert(accessibleClient.context.window.LoungeAccessibility, 'Accessible client did not initialize the shared accessibility layer.');
assert(visualClient.context.window.LoungeAccessibility, 'Visual client did not initialize the shared accessibility layer.');

accessibleClient.context.window.LoungeAccessibility.setAccessibleMode(true);
visualClient.context.window.LoungeAccessibility.setAccessibleMode(false);

assert.strictEqual(accessibleClient.context.window.LoungeAccessibility.accessibleMode, true, 'Accessible client did not stay in accessible mode.');
assert.strictEqual(visualClient.context.window.LoungeAccessibility.accessibleMode, false, 'Visual client did not stay in visual mode.');
assert(accessibleClient.document.documentElement.classList.contains('lounge-accessible-mode'), 'Accessible client did not get the accessible-mode class.');
assert(!visualClient.document.documentElement.classList.contains('lounge-accessible-mode'), 'Visual client incorrectly inherited the accessible-mode class.');
assert.strictEqual(accessibleClient.localStore.get('loungeAccessibleMode'), '1', 'Accessible client did not persist accessible mode locally.');
assert.strictEqual(visualClient.localStore.get('loungeAccessibleMode'), '0', 'Visual client did not persist visual mode locally.');

process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-mixed-mode-'));
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

    const hostLogin = await call(host, 'register', { username: `MixedHost${Date.now()}`.slice(0, 24), password: 'MixedTest9!' });
    const guestLogin = await call(guest, 'register', { username: `MixedGuest${Date.now()}`.slice(0, 24), password: 'MixedTest9!' });
    if (!hostLogin.ok) throw new Error(hostLogin.error);
    if (!guestLogin.ok) throw new Error(guestLogin.error);

    const created = await call(host, 'create-game', { category: 'ducks-race' });
    if (!created.ok) throw new Error(created.error);

    const joinedEvent = wait(host, 'table-player-joined');
    const joined = await call(guest, 'join-game', { gameId: created.room.code });
    const joinMessage = await joinedEvent;

    assert(joined.ok, joined.error);
    assert(joinMessage.message.includes('Players at this table:'), 'Join announcement did not include the roster.');
    assert(joinMessage.message.includes(hostLogin.username), 'Join announcement did not include the host name.');
    assert(joinMessage.message.includes(guestLogin.username), 'Join announcement did not include the guest name.');
    assert.strictEqual(joined.room.players.length, 2, 'Joined room did not reflect both players for visual roster display.');
  } finally {
    host?.disconnect();
    guest?.disconnect();
    if (server.listening) await new Promise(resolve => server.close(resolve));
  }

  process.env.LOUNGE_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-mixed-mode-'));
  execFileSync(process.execPath, [path.join(__dirname, 'multiplayer-counts.test.js')], { stdio: 'inherit' });

  console.log('Mixed accessible and visual mode checks passed across all game flows.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});