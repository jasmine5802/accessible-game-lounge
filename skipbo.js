'use strict';

const socket = io();
const params = new URLSearchParams(location.search);
const gameId = params.get('game');
const token = sessionStorage.getItem('loungeSessionToken');
const playerId = (sessionStorage.getItem('loungeUsername') || '').trim().toLowerCase();

const el = {
  connection: document.querySelector('#connection'),
  turn: document.querySelector('#turn'),
  buildings: document.querySelector('#buildings'),
  start: document.querySelector('#start'),
  play: document.querySelector('#play'),
  selection: document.querySelector('#selection'),
  hand: document.querySelector('#hand'),
  privatePiles: document.querySelector('#private-piles'),
  players: document.querySelector('#players'),
  announcer: document.querySelector('#announcer'),
  urgent: document.querySelector('#urgent')
};

let room = null;
let game = null;
let handIndex = 0;
let selection = { source: 'hand', index: 0 };
let targetMode = false;
let pendingTarget = null;
let audio = null;

const accessibility = window.LoungeAccessibility?.createGameStateController({
  mode: 'GAME',
  statusEl: el.announcer,
  items: [
    { label: 'Play Selected Card', type: 'game' },
    { label: 'Read Buildings', type: 'game' },
    { label: 'Read Discards', type: 'game' },
    { label: 'Read Opponents', type: 'game' },
    { label: 'Help / Instructions', type: 'help' }
  ],
  hotkeys: { scores: [], players: ['p'], help: ['h', '?'] },
  helpText: 'Keyboard shortcuts: Up and Down choose a hand card. S selects stock. 1 through 4 select discard piles. Enter or Space confirms play. B reads buildings. D reads discards. O reads opponents. P reads connected players.'
});

function syncAccessibilityState() {
  if (!accessibility || !game) return;
  accessibility.setPlayers((game.players || []).map(player => player.name));
  accessibility.setScores(Object.fromEntries((game.players || []).map(player => [player.name, `${player.stockCount} stock cards`])));
}

function context() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return null;
  audio ||= new C();
  if (audio.state === 'suspended') audio.resume().catch(() => {});
  return audio;
}

function tone(notes, wave = 'sine', spacing = 0.08, volume = 0.1) {
  const c = context();
  if (!c) return;
  const now = c.currentTime;
  notes.forEach((frequency, index) => {
    const oscillator = c.createOscillator();
    const gain = c.createGain();
    const start = now + index * spacing;
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25);
    oscillator.connect(gain).connect(c.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.26);
  });
}

function cue(type) {
  if (type === 'draw') tone([180, 300, 520], 'sine', 0.055, 0.09);
  if (type === 'place') tone([330, 145], 'triangle', 0.025, 0.13);
  if (type === 'sweep') tone([880, 740, 620, 520], 'sine', 0.1, 0.13);
  if (type === 'victory') tone([392, 523, 659, 784, 1047], 'triangle', 0.11, 0.14);
  if (type === 'error') tone([120, 90], 'square', 0.12, 0.12);
}

function say(message, urgent = false) {
  const node = urgent ? el.urgent : el.announcer;
  node.textContent = '';
  requestAnimationFrame(() => {
    node.textContent = message;
  });
}

function label(card) { return SkipBoEngine.cardLabel(card); }
function me() { return game?.players.find(player => player.id === playerId); }

function cardNode(card, name, selected = false) {
  const item = document.createElement('div');
  item.className = 'card' + (card?.value === SkipBoEngine.WILD ? ' wild' : '') + (selected ? ' selected' : '');
  item.textContent = card?.value === SkipBoEngine.WILD ? 'WILD' : card?.value ?? '—';
  item.setAttribute('aria-label', name);
  return item;
}

function selectedCard() {
  if (!game) return null;
  if (selection.source === 'hand') return game.myHand?.[selection.index];
  if (selection.source === 'stock') return game.myStockTop;
  if (selection.source === 'discard') return game.myDiscards?.[selection.index]?.at(-1);
  return null;
}

function render() {
  const mine = me();
  const playing = game?.status === 'playing';
  const myTurn = game?.turnPlayerId === playerId;

  el.connection.textContent = gameId ? `Room ${gameId}. ${game?.status || 'waiting'}.` : 'Missing game. Return to the lounge.';
  el.turn.textContent = game?.announcement || 'Waiting for a game.';
  el.start.hidden = room?.hostId !== playerId || playing;
  el.play.disabled = !playing || !myTurn || !selectedCard();

  el.buildings.replaceChildren(
    ...Array.from({ length: 4 }, (_, index) => {
      const pile = game?.buildingPiles?.[index] || [];
      const top = pile[pile.length - 1];
      const slot = document.createElement('div');
      slot.className = 'slot';
      slot.append(
        cardNode(top, `Building pile ${index + 1}, top ${top?.playedAs || 'empty'}`),
        document.createTextNode(`Building ${index + 1}: ${top?.playedAs || 'empty'}; needs ${top ? top.playedAs + 1 : 1}`)
      );
      return slot;
    })
  );

  const hand = game?.myHand || [];
  if (handIndex >= hand.length) handIndex = Math.max(0, hand.length - 1);
  el.hand.replaceChildren(
    ...(hand.length
      ? hand.map((card, index) => {
          const li = document.createElement('li');
          li.role = 'option';
          li.setAttribute('aria-selected', selection.source === 'hand' && selection.index === index ? 'true' : 'false');
          li.append(cardNode(card, `Hand card ${index + 1}, ${label(card)}`, selection.source === 'hand' && selection.index === index));
          return li;
        })
      : [Object.assign(document.createElement('li'), { textContent: 'No cards.' })])
  );

  const privatePiles = [];
  privatePiles.push((() => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.append(
      cardNode(game?.myStockTop, `Stock top ${label(game?.myStockTop)}`, selection.source === 'stock'),
      document.createTextNode(`Stock: ${mine?.stockCount ?? 0} cards`)
    );
    return slot;
  })());

  (game?.myDiscards || [[], [], [], []]).forEach((pile, index) => {
    const top = pile[pile.length - 1];
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.append(
      cardNode(top, `Discard ${index + 1}, top ${label(top)}`, selection.source === 'discard' && selection.index === index),
      document.createTextNode(`Discard ${index + 1}: ${label(top)}`)
    );
    privatePiles.push(slot);
  });
  el.privatePiles.replaceChildren(...privatePiles);

  el.players.replaceChildren(
    ...(game?.players || []).map(player =>
      Object.assign(document.createElement('li'), {
        textContent: `${player.name}: ${player.stockCount} stock cards, top ${label(player.stockTop)}, ${player.handCount} cards in hand${player.id === game.turnPlayerId ? ', current turn' : ''}.`
      })
    )
  );

  const chosen = selectedCard();
  el.selection.textContent = chosen
    ? `${selection.source} ${selection.index + 1}: ${label(chosen)} selected.${targetMode ? ' Choose B1 through B4 or D1 through D4.' : ' Press Enter or Space to choose a target.'}`
    : 'No playable card selected.';

  syncAccessibilityState();
}

function select(source, index = 0) {
  selection = { source, index };
  if (source === 'hand') handIndex = index;
  targetMode = false;
  pendingTarget = null;
  render();
  say(`${source}${source === 'discard' ? ` ${index + 1}` : ''} selected: ${label(selectedCard())}.`);
}

function confirm() {
  if (!selectedCard()) return fail('Select an available card first.');
  if (game?.turnPlayerId !== playerId) return fail('It is not your turn.');
  targetMode = true;
  pendingTarget = null;
  render();
  say('Target mode. Press B then 1 through 4 for a building pile, or D then 1 through 4 for a personal discard pile.');
}

function play(targetType, targetIndex) {
  if (!targetMode) return fail('Select a card and press Enter or Space first.');
  socket.emit('skipbo-play', {
    source: selection.source,
    sourceIndex: selection.index,
    targetType,
    targetIndex
  }, result => {
    if (!result.ok) fail(result.error);
    else {
      targetMode = false;
      pendingTarget = null;
    }
  });
}

function fail(message) {
  cue('error');
  say(message, true);
}

function readBuildings() {
  say((game?.buildingPiles || []).map((pile, index) => `Building ${index + 1}: ${pile.length ? pile.at(-1).playedAs : 'empty'}`).join('. '));
}

function readDiscards() {
  say((game?.myDiscards || []).map((pile, index) => `Discard ${index + 1}: ${label(pile.at(-1))}`).join('. '));
}

function readOpponents() {
  say((game?.players || [])
    .filter(player => player.id !== playerId)
    .map(player => `${player.name}: ${player.stockCount} stock cards, top ${label(player.stockTop)}`)
    .join('. ') || 'No opponents are present.');
}

el.start.addEventListener('click', () => socket.emit('start-skipbo', {}, result => { if (!result.ok) fail(result.error); }));
el.play.addEventListener('click', confirm);
document.querySelector('#read-buildings').addEventListener('click', readBuildings);
document.querySelector('#read-discards').addEventListener('click', readDiscards);
document.querySelector('#read-opponents').addEventListener('click', readOpponents);

document.addEventListener('keydown', event => {
  if (event.target.matches('input,select,textarea')) return;
  if (accessibility?.handleKey(event)) return;

  const key = event.key.toLowerCase();
  if (['arrowup', 'arrowdown'].includes(key)) {
    event.preventDefault();
    const hand = game?.myHand || [];
    if (!hand.length) return;
    handIndex = (handIndex + (key === 'arrowdown' ? 1 : -1) + hand.length) % hand.length;
    select('hand', handIndex);
    return;
  }

  if (key === 's') {
    event.preventDefault();
    select('stock', 0);
    return;
  }

  if (/^[1-4]$/.test(key) && !targetMode) {
    event.preventDefault();
    select('discard', Number(key) - 1);
    return;
  }

  if (key === 'enter' || key === ' ') {
    event.preventDefault();
    confirm();
    return;
  }

  if (key === 'b') {
    event.preventDefault();
    if (targetMode) pendingTarget = 'building';
    else readBuildings();
    return;
  }

  if (key === 'd') {
    event.preventDefault();
    if (targetMode) pendingTarget = 'discard';
    else readDiscards();
    return;
  }

  if (key === 'o') {
    event.preventDefault();
    readOpponents();
    return;
  }

  if (/^[1-4]$/.test(key) && targetMode && pendingTarget) {
    event.preventDefault();
    play(pendingTarget, Number(key) - 1);
    pendingTarget = null;
  }
});

function connect() {
  if (!token || !gameId) return fail('Missing login or game. Return to the lounge.');
  socket.emit('authenticate-token', { token }, auth => {
    if (!auth.ok) return fail(auth.error);
    socket.emit('join-game', { gameId }, joined => {
      if (!joined.ok) return fail(joined.error);
      room = joined.room;
      game = room.skipbo || null;
      render();
    });
  });
}

socket.on('skipbo-state', payload => {
  game = payload.game;
  cue(payload.cue?.type);
  render();
  say(game.announcement);
});

socket.on('lobby-updated', updated => {
  room = updated;
  if (!game) render();
});

socket.on('connect', connect);
socket.on('disconnect', () => {
  el.connection.textContent = 'Connection lost. Reconnecting…';
});

window.addEventListener('pointerdown', context, { once: true });
window.addEventListener('keydown', context, { once: true });
render();
