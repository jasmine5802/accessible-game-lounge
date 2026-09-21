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
  targetOptions: document.querySelector('#target-options'),
  targetDialog: document.querySelector('#target-dialog'),
  targetTitle: document.querySelector('#target-title'),
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
let submitting = false;
let audio = null;
let connectionReady = false;

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
  helpText: 'Up and Down choose a hand card. Enter or Space opens destinations; use arrows and Enter to choose. B then 1 through 4 builds the selected card. D then 1 through 4 discards a hand card and ends your turn. Escape cancels. S then 1 through 4 plays the stock card onto a building pile and reveals the next stock card. 1 through 4 selects the top card of a discard pile; B then 1 through 4 plays it onto a building pile. O reads opponents. P reads players.'
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
  if (type === 'draw' || type === 'hand_refill') tone([180, 300, 520], 'sine', 0.055, 0.09);
  if (type === 'place') tone([330, 145], 'triangle', 0.025, 0.13);
  if (type === 'sweep' || type === 'pile_cleared') tone([880, 740, 620, 520], 'sine', 0.1, 0.13);
  if (type === 'victory' || type === 'win_fanfare') tone([392, 523, 659, 784, 1047], 'triangle', 0.11, 0.14);
  if (type === 'error') tone([120, 90], 'square', 0.12, 0.12);
}

function playAudioCue(type) {
  cue(type);
}

// Function to announce moves cleanly to screen readers without UI focus loss
let announcementTimer = null;
let pendingAnnouncements = [];
function announceGameAction(message) {
  if (!message) return;
  const liveRegion = document.getElementById('sr-announcements') || el.announcer;
  if (liveRegion) {
    pendingAnnouncements.push(message);
    clearTimeout(announcementTimer);
    liveRegion.textContent = ''; // Clear to force screen reader re-read
    announcementTimer = setTimeout(() => {
      liveRegion.textContent = pendingAnnouncements.join(' ');
      pendingAnnouncements = [];
      announcementTimer = null;
    }, 50);
  }
}

// State broadcasts deliver each move to every player, including its author.
function handleServerMoveResponse(data) {
  if (!data) return;
  const messages = [];
  const won = data.event === 'GAME_OVER' || data.event === 'VICTORY' || data.type === 'victory';
  if (data.pileCleared || data.type === 'sweep') {
    playAudioCue('pile_cleared'); // Whoosh / clear sound
    messages.push("Building pile reached 12 and was cleared. Slot is open for a 1.");
  }

  if (data.refilled && !won) {
    playAudioCue('hand_refill');
    const recipient = game?.players?.find(player => player.id === game.turnPlayerId)?.name || 'The active player';
    const count = Number.isInteger(data.drawn) && data.drawn >= 0 ? data.drawn : null;
    messages.push(count === null
      ? `${recipient} played all hand cards and drew new cards.`
      : `${recipient} played all hand cards and drew ${count} new card${count === 1 ? '' : 's'}.`);
  }

  if (won) {
    playAudioCue('win_fanfare');
    const winner = data.winnerName || game?.players?.find(player => player.id === (data.winner || game?.winnerId))?.name || data.winner || 'The winner';
    messages.push(`Game over! ${winner} emptied their stock pile and won!`);
  }
  if (!messages.length) cue(data.type);
  announceGameAction([data.announcement, ...messages].filter(Boolean).join(' '));
}

function say(message, urgent = false) {
  const node = el.targetDialog.open ? document.getElementById('target-announcement') : urgent ? el.urgent : el.announcer;
  node.textContent = '';
  requestAnimationFrame(() => {
    node.textContent = message;
  });
}

function label(card) { return SkipBoEngine.cardLabel(card); }
function me() { return game?.players.find(player => player.id === playerId); }

function cardNode(card, name, selected = false, onActivate = null) {
  const item = document.createElement('div');
  item.className = 'card' + (card?.value === SkipBoEngine.WILD ? ' wild' : '') + (selected ? ' selected' : '');
  item.textContent = card?.value === SkipBoEngine.WILD ? 'WILD' : card?.value ?? '—';
  item.setAttribute('aria-label', name);
  if (card && onActivate) {
    item.setAttribute('role', 'button');
    item.tabIndex = 0;
    item.addEventListener('click', onActivate);
    item.addEventListener('keydown', event => {
      if (!['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      event.stopPropagation();
      onActivate();
    });
  }
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
  if (selection.source === 'hand') selection.index = handIndex = Math.min(handIndex, Math.max(0, (game?.myHand?.length || 0) - 1));
  const focusedTarget = document.activeElement?.dataset?.destination;
  const handHadFocus = el.hand.contains(document.activeElement);

  el.connection.textContent = gameId ? `Room ${gameId}. ${game?.status || 'waiting'}.` : 'Missing game. Return to the lounge.';
  el.turn.textContent = game?.announcement || 'Waiting for a game.';
  el.start.hidden = room?.hostId !== playerId || playing;
  el.start.disabled = !connectionReady;
  el.play.disabled = !playing || !myTurn || !selectedCard() || submitting;

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
          li.tabIndex = selection.source === 'hand' && selection.index === index ? 0 : -1;
          li.setAttribute('aria-label', `Hand card ${index + 1} of ${hand.length}, ${label(card)}`);
          li.setAttribute('aria-selected', selection.source === 'hand' && selection.index === index ? 'true' : 'false');
          li.addEventListener('click', () => select('hand', index));
          li.textContent = `Card ${index + 1}: ${label(card)}`;
          return li;
        })
      : [Object.assign(document.createElement('li'), { textContent: 'No cards.' })])
  );

  const privatePiles = [];
  privatePiles.push((() => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.append(
      cardNode(game?.myStockTop, `Stock top ${label(game?.myStockTop)}`, selection.source === 'stock', () => select('stock', 0)),
      document.createTextNode(`Stock: ${mine?.stockCount ?? 0} cards`)
    );
    return slot;
  })());

  (game?.myDiscards || [[], [], [], []]).forEach((pile, index) => {
    const top = pile[pile.length - 1];
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.append(
      cardNode(top, `Discard ${index + 1}, top ${label(top)}`, selection.source === 'discard' && selection.index === index, () => select('discard', index)),
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
    ? `${selection.source} ${selection.index + 1}: ${label(chosen)} selected. Enter chooses where to play. B then 1–4 builds; D then 1–4 discards and ends your turn.`
    : 'No playable card selected.';

  el.targetOptions.hidden = !targetMode;
  const targets = targetMode ? [
    ...Array.from({ length: 4 }, (_, index) => ({ type: 'building', index, label: `B${index + 1}: Building pile ${index + 1}, needs ${SkipBoEngine.expectedValue(game.buildingPiles[index])}${SkipBoEngine.canBuild(chosen, game.buildingPiles[index]) ? '' : ' — card does not fit'}` })),
    ...(selection.source === 'hand' ? Array.from({ length: 4 }, (_, index) => ({ type: 'discard', index, label: `D${index + 1}: Discard pile ${index + 1}, top ${label(game.myDiscards[index].at(-1))} — ends your turn` })) : [])
  ] : [];
  el.targetOptions.replaceChildren(...targets.map(target => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'target-option';
    button.dataset.destination = `${target.type}-${target.index}`;
    button.disabled = submitting;
    button.textContent = target.label;
    button.addEventListener('click', () => play(target.type, target.index));
    return button;
  }));
  if (targetMode) el.targetTitle.textContent = `Where should ${label(chosen)} go?`;
  if (focusedTarget && targetMode) [...el.targetOptions.children].find(button => button.dataset.destination === focusedTarget)?.focus();
  else if (handHadFocus && !targetMode) el.hand.children[handIndex]?.focus();

  syncAccessibilityState();
}

function select(source, index = 0) {
  if (submitting) return;
  selection = { source, index };
  if (source === 'hand') handIndex = index;
  targetMode = false;
  pendingTarget = null;
  render();
  if (source === 'hand') el.hand.children[index]?.focus();
  say(`${source}${source === 'discard' ? ` ${index + 1}` : ''} selected: ${label(selectedCard())}.`);
}

function confirm(target = null) {
  if (submitting) return;
  if (!selectedCard()) return fail('Select an available card first.');
  if (game?.status !== 'playing' || game?.turnPlayerId !== playerId) return fail('It is not your turn.');
  if (target === 'discard' && selection.source !== 'hand') return fail('Only a hand card can be discarded. Press Up or Down to select your hand.');
  targetMode = true;
  pendingTarget = target;
  render();
  if (!el.targetDialog.open) el.targetDialog.showModal();
  [...el.targetOptions.children].find(button => button.dataset.destination === `${target || 'building'}-0`)?.focus();
  say(target ? `Choose ${target} pile. Press 1 through 4, or use arrows and Enter. Escape cancels.` : 'Choose a destination with arrows and Enter. B then 1 through 4 builds. D then 1 through 4 discards and ends your turn. Escape cancels.');
}

function playSelectedCardToBuildPile() {
  confirm('building');
}

function playStockCardToBuildPile() {
  if (submitting || targetMode) return;
  select('stock', 0);
  playSelectedCardToBuildPile();
}

function cancelTarget(restoreFocus = true) {
  targetMode = false;
  pendingTarget = null;
  if (el.targetDialog.open) el.targetDialog.close();
  render();
  if (restoreFocus) (el.hand.children[handIndex] || document.querySelector('main')).focus();
}

function play(targetType, targetIndex) {
  if (submitting) return;
  if (!targetMode) return fail('Select a card and press Enter or Space first.');
  if (targetType === 'discard' && selection.source !== 'hand') return fail('Only a hand card can be discarded.');
  if (targetType === 'building' && !SkipBoEngine.canBuild(selectedCard(), game.buildingPiles[targetIndex])) return fail(`Building pile ${targetIndex + 1} needs ${SkipBoEngine.expectedValue(game.buildingPiles[targetIndex])}. Choose another pile or press Escape.`);
  submitting = true;
  render();
  socket.timeout(5000).emit('skipbo-play', {
    source: selection.source,
    sourceIndex: selection.index,
    targetType,
    targetIndex
  }, (error, result) => {
    submitting = false;
    if (error) { cancelTarget(); fail('The move was not confirmed. Check the updated hand before trying again.'); }
    else if (!result.ok) { render(); fail(result.error); }
    else {
      cancelTarget();
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

function startSkipBoGame() {
  if (!connectionReady || !socket.connected) {
    fail('Reconnecting to your game. Please wait, then press Enter to start.');
    return;
  }
  socket.emit('start-skipbo', {}, result => { if (!result.ok) fail(result.error); });
}

el.start.addEventListener('click', startSkipBoGame);
el.play.addEventListener('click', () => confirm());
document.querySelector('#cancel-target').addEventListener('click', () => cancelTarget());
el.targetDialog.addEventListener('cancel', event => { event.preventDefault(); if (!submitting) cancelTarget(); });
document.querySelector('#read-buildings').addEventListener('click', readBuildings);
document.querySelector('#read-discards').addEventListener('click', readDiscards);
document.querySelector('#read-opponents').addEventListener('click', readOpponents);

el.hand.addEventListener('keydown', event => {
  if (!['Enter', ' '].includes(event.key) || event.defaultPrevented) return;
  const option = event.target.closest('[role="option"]');
  if (!option || !el.hand.contains(option)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const index = [...el.hand.children].indexOf(option);
  if (index < 0) return;
  selection = { source: 'hand', index };
  handIndex = index;
  confirm();
}, true);

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.target.isContentEditable || event.target.matches('input,select,textarea')) return;
  const dialog = event.target.closest?.('dialog[open]');
  if (dialog && dialog !== el.targetDialog) return;
  if (submitting) return;
  if (accessibility?.handleKey(event)) return;

  const key = event.key.toLowerCase();
  if (targetMode && key === 'escape') { event.preventDefault(); cancelTarget(); return; }
  if (targetMode && key === 's') { event.preventDefault(); return; }
  if (event.key === 'Enter' && game?.status === 'waiting' && room?.hostId === playerId && !['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName || '')) {
    event.preventDefault();
    el.start.click();
    return;
  }
  if (['arrowup', 'arrowdown'].includes(key)) {
    event.preventDefault();
    if (targetMode && document.activeElement?.classList?.contains('target-option')) {
      const options = [...el.targetOptions.children];
      const current = Math.max(0, options.indexOf(document.activeElement));
      options[(current + (key === 'arrowdown' ? 1 : -1) + options.length) % options.length]?.focus();
      return;
    }
    const hand = game?.myHand || [];
    if (!hand.length) return;
    handIndex = (handIndex + (key === 'arrowdown' ? 1 : -1) + hand.length) % hand.length;
    select('hand', handIndex);
    return;
  }

  if (key === 's') {
    event.preventDefault();
    playStockCardToBuildPile();
    return;
  }

  if (/^[1-4]$/.test(key) && !targetMode) {
    event.preventDefault();
    select('discard', Number(key) - 1);
    return;
  }

  if (key === 'enter' || key === ' ') {
    if (event.target.closest?.('button,a')) return;
    event.preventDefault();
    if (targetMode && document.activeElement?.classList?.contains('target-option')) {
      document.activeElement.click();
      return;
    }
    confirm();
    return;
  }

  if (key === 'b') {
    event.preventDefault();
    playSelectedCardToBuildPile();
    return;
  }

  if (key === 'd') {
    event.preventDefault();
    confirm('discard');
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
  }
});

function connect() {
  connectionReady = false;
  render();
  if (!token || !gameId) return fail('Missing login or game. Return to the lounge.');
  socket.emit('authenticate-token', { token }, auth => {
    if (!auth.ok) return fail(auth.error);
    socket.emit('join-game', { gameId }, joined => {
      if (!joined.ok) return fail(joined.error);
      room = joined.room;
      game = room.skipbo || null;
      connectionReady = true;
      render();
    });
  });
}

socket.on('skipbo-state', payload => {
  const previousCardId = selectedCard()?.id;
  const previousStockId = game?.myStockTop?.id;
  game = payload.game;
  if (targetMode && (game.status !== 'playing' || game.turnPlayerId !== playerId || selectedCard()?.id !== previousCardId)) cancelTarget();
  if (game.status === 'playing') {
    window.dispatchEvent(new CustomEvent('lounge-gameplay-started'));
  }
  render();
  handleServerMoveResponse({ ...payload.cue, announcement: game.announcement });
  if (previousStockId && game.myStockTop && game.myStockTop.id !== previousStockId) {
    announceGameAction(`Your next stock card is ${label(game.myStockTop)}. Press S then 1 through 4 to play it on a building pile.`);
  }
});

socket.on('lobby-updated', updated => {
  room = updated;
  if (!game || game.status === 'waiting') {
    game = room.skipbo || null;
    render();
  }
});
socket.on('table-player-joined', data => {
  if (!data?.message) return;
  if (game?.status === 'waiting') {
    game = room.skipbo || null;
    render();
  }
  say(data.message);
  window.LoungeAccessibility?.speak?.(data.message);
});

socket.on('connect', connect);
socket.on('disconnect', () => {
  connectionReady = false;
  render();
  el.connection.textContent = 'Connection lost. Reconnecting…';
});

window.addEventListener('pointerdown', context, { once: true });
window.addEventListener('keydown', context, { once: true });
render();
