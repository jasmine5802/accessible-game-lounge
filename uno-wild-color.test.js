'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const UnoRules = require('./uno-rules');
const source = fs.readFileSync(require.resolve('./uno.js'), 'utf8');

function client(accessibleMode) {
  const nodes = new Map(), listeners = new Map(), frames = [], emitted = [], all = [];
  let document;
  function node(tagName = 'div') {
    const events = {}, attributes = new Map();
    const item = {
      tagName: tagName.toUpperCase(), textContent: '', value: '0', children: [], dataset: {}, checked: false,
      classList: {add() {}}, open: false,
      setAttribute(key, value) {attributes.set(key, String(value));},
      getAttribute(key) {return attributes.get(key);},
      append(...children) {this.children.push(...children);},
      replaceChildren(...children) {this.children = children;},
      addEventListener(type, handler) {(events[type] ||= []).push(handler);},
      fire(type, event = {}) {(events[type] || []).forEach(handler => handler(event));},
      focus() {document.activeElement = this; this.fire('focus');},
      showModal() {this.opener = document.activeElement; this.open = true;},
      close() {this.open = false; document.activeElement = this.opener; this.fire('close');},
      querySelector() {return null;}
    };
    all.push(item); return item;
  }
  document = {
    body: node('body'), activeElement: node(), createElement: node,
    getElementById(id) {if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id);},
    querySelector(selector) {
      const dialog = all.find(item => item.tagName === 'DIALOG' && item.open);
      if (selector === 'dialog[open]') return dialog || null;
      if (selector === 'dialog[open] [data-uno-announcer]') return dialog?.children.find(item => item.getAttribute('data-uno-announcer') !== undefined) || null;
      return null;
    },
    addEventListener(type, handler) {if (type === 'keydown') this.keydown = handler;}
  };
  const socket = {on(type, handler) {listeners.set(type, handler);}, emit(type, data, callback) {emitted.push({type, data, callback});}};
  const context = {document, UnoRules, io: () => socket, window: {LoungeAccessibility: {accessibleMode, createGameStateController() {return null;}}, dispatchEvent() {}},
    location: {search: ''}, URLSearchParams, sessionStorage: {getItem() {return null;}}, Option: function() {}, CustomEvent: function() {}, requestAnimationFrame(callback) {frames.push(callback);}};
  vm.createContext(context); vm.runInContext(source, context);
  const flush = () => frames.splice(0).forEach(callback => callback());
  const press = (key, repeat = false) => {
    const event = {key, repeat, target: document.activeElement, preventDefault() {}, stopPropagation() {}};
    const dialog = document.querySelector('dialog[open]');
    if (dialog) dialog.fire('keydown', event); else document.keydown(event);
    flush();
  };
  return {context, document, nodes, emitted, press, flush, load(game) {
    vm.runInContext("playerId='a';selected=0;", context); listeners.get('uno-state')({game}); flush();
  }};
}

const cases = [
  ['Classic Uno', 'light', 'Wild'], ['Classic Uno', 'light', 'Wild Draw 4'],
  ['Uno Flip!', 'light', 'Wild'], ['Uno Flip!', 'light', 'Wild Draw 2'],
  ['Uno Flip!', 'dark', 'Wild'], ['Uno Flip!', 'dark', 'Wild Draw Color'],
  ["Show 'Em No Mercy", 'light', 'Wild'], ["Show 'Em No Mercy", 'light', 'Wild Draw 4'],
  ['Uno Attack', 'light', 'Wild'], ['Uno Attack', 'light', 'Wild Draw 4']
];
for (const accessibleMode of [true, false]) for (const [variant, side, value] of cases) {
  const ui = client(accessibleMode), colors = side === 'dark' ? UnoRules.DARK_COLORS : UnoRules.LIGHT_COLORS;
  const game = {variant, side, status: 'playing', sequence: 1, turnPlayerId: 'a', pendingDraw: 0,
    players: [{id:'a', name:'Alex', cardCount:2}, {id:'b', name:'Blair', cardCount:7}],
    myHand: [{color:'Wild', value}, {color:colors[0], value:2}], discard: {color:colors[0], value:4}, announcement:'Your turn.'};
  ui.load(game); ui.press('Enter');
  let dialog = ui.document.querySelector('dialog[open]');
  assert(dialog, `${variant}/${side}: Wild must open a menu in every display mode`);
  const menu = dialog.children.find(item => item.getAttribute('role') === 'menu');
  dialog.fire('close'); // A delayed close event from the previous opening must not clear this choice.
  assert.deepEqual(menu.children.map(item => item.textContent), colors);
  assert.equal(ui.document.activeElement.textContent, colors[0]);
  assert.equal(ui.emitted.length, 0, 'Do not send a play before color confirmation');
  ui.press('ArrowUp'); assert.equal(ui.document.activeElement.textContent, colors[3], 'Wrap backwards');
  ui.press('ArrowDown'); ui.press('ArrowDown');
  assert.equal(ui.document.activeElement.textContent, colors[1]);
  assert.equal(ui.document.activeElement.getAttribute('aria-checked'), 'true');
  ui.press('Enter', true); assert.equal(ui.emitted.length, 0, 'Held Enter must not confirm');
  ui.press('Enter'); ui.press('Enter');
  assert.equal(ui.emitted.length, 1, 'Submit exactly once while waiting for acknowledgement');
  assert.equal(ui.emitted[0].type, 'uno-play'); assert.equal(ui.emitted[0].data.color, colors[1]);
  ui.emitted[0].callback({ok:false, error:'Try again.'}); ui.flush();
  assert(dialog.open, 'Keep the menu open after a rejected play');
  const live = dialog.children.find(item => item.getAttribute('data-uno-announcer') !== undefined);
  assert.equal(live.textContent, 'Try again.', 'Errors must be announced inside the modal');
  ui.press('End'); ui.press('Enter'); assert.equal(ui.emitted[1].data.color, colors[3]);
  ui.emitted[1].callback({ok:true}); assert(!dialog.open);
  ui.press('Enter'); dialog = ui.document.querySelector('dialog[open]');
  ui.press('Escape'); assert(!dialog.open); assert.equal(ui.emitted.length, 2, 'Escape must not play');
  ui.press('Enter'); dialog = ui.document.querySelector('dialog[open]');
  const blue = dialog.children.find(item => item.getAttribute('role') === 'menu').children[2];
  blue.fire('click'); assert.equal(ui.emitted[2].data.color, colors[2], 'Mouse and touch must select the clicked color');
  ui.emitted[2].callback({ok:true});
  ui.press('Enter'); game.sequence++; ui.press('Enter');
  assert.equal(ui.emitted.length, 3, 'Stale turns must not submit a Wild');
  ui.press('Enter'); ui.press('Enter'); game.sequence++; ui.load(game);
  assert(!ui.document.querySelector('dialog[open]'), 'Authoritative game updates must close the menu before announcing the next turn');
  assert.equal(ui.nodes.get('live').textContent, ui.nodes.get('announcement').textContent);
  ui.press('Enter'); const reopened = ui.document.querySelector('dialog[open]');
  ui.emitted[3].callback({ok:true});
  assert(reopened.open, 'An old acknowledgement must not close a newer color menu');
  ui.press('Enter'); assert.equal(ui.emitted.length, 5); ui.emitted[4].callback({ok:true});
}
console.log('Wild and draw-Wild menus passed in accessible and visual modes, including Flip dark colors, keyboard, click, cancel, errors, duplicate submission, and stale turns.');
