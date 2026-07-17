'use strict';

const socket = io();
const params = new URLSearchParams(location.search);
const gameId = (params.get('game') || sessionStorage.getItem('loungeGameId') || '').toUpperCase();
const sessionToken = sessionStorage.getItem('loungeSessionToken') || '';
const playerName = sessionStorage.getItem('loungeUsername') || '';
const playerId = playerName.toLowerCase();

const elements = {
  connection: document.querySelector('#connection'), announcement: document.querySelector('#announcement'),
  start: document.querySelector('#start'), roll: document.querySelector('#roll'), turn: document.querySelector('#turn-status'),
  showCards: document.querySelector('#show-cards'), feathers: document.querySelector('#feathers'),
  cardsPanel: document.querySelector('#cards-panel'), cardsTitle: document.querySelector('#cards-title'), cards: document.querySelector('#cards'),
  targetMenu: document.querySelector('#target-menu'), targets: document.querySelector('#targets'), cancelTarget: document.querySelector('#cancel-target'),
  players: document.querySelector('#players'), board: document.querySelector('#board'), polite: document.querySelector('#polite-announcer')
};

let room = null;
let game = null;
let boardIndex = 0;
let selectedCardIndex = -1;
let targetingCard = null;
let selectedTargetIndex = 0;
let lastSequence = -1;

function announcePolite(text) {
  elements.polite.textContent = '';
  requestAnimationFrame(() => { elements.polite.textContent = text; });
}

function squareDescription(square) {
  const racers = game?.players.filter(player => player.square === square).map(player => player.name) || [];
  const space = game?.boardSpaces?.[square - 1] || { name: 'Board Space', description: 'No effect information is available.' };
  return `Space ${square}: ${space.name}. ${space.description} ${racers.length ? `Occupied by ${racers.join(' and ')}.` : 'Empty.'}`;
}

function renderBoard() {
  const size = game?.boardSize || 40;
  elements.board.replaceChildren(...Array.from({ length: size }, (_, index) => {
    const square = index + 1;
    const item = document.createElement('li');
    const space = game?.boardSpaces?.[index] || { name: 'Board Space', effect: 'safe' };
    item.className = `square ${space.effect}${space.effect === 'mud' ? ' trap' : ''}`;
    item.tabIndex = index === boardIndex ? 0 : -1;
    item.dataset.square = square;
    item.setAttribute('aria-label', squareDescription(square));
    const number = document.createElement('span');
    number.className = 'square-number';
    number.textContent = `Space ${square}: ${space.name}`;
    item.append(number);
    for (const player of game?.players.filter(candidate => candidate.square === square) || []) {
      const duck = document.createElement('span');
      duck.className = 'duck';
      duck.textContent = `${player.name}, ${player.color} ${player.duckType}`;
      item.append(duck);
    }
    item.addEventListener('focus', () => { boardIndex = index; announcePolite(squareDescription(square)); });
    return item;
  }));
}

function renderPlayers() {
  elements.players.replaceChildren(...(game?.players || []).map(player => {
    const item = document.createElement('li');
    const turn = player.id === game.turnPlayerId ? ', current turn' : '';
    item.textContent = `${player.name}: ${player.color} ${player.duckType}, square ${player.square}, ${player.feathers} feathers${player.shielded ? ', shield active' : ''}${turn}${player.connected ? '' : ', reconnecting'}`;
    return item;
  }));
}

function cardDescription(card) {
  if (card === 'Wind Gust') return 'Push another player back 3 spaces.';
  if (card === 'Shield') return 'Protect yourself from the next hazard.';
  return 'Steal 1 feather from another player.';
}

function cardCost(card) {
  return game?.cardCosts?.[card] ?? { 'Wind Gust': 1, Shield: 2, Pluck: 1 }[card] ?? 0;
}

function cardStatus(card, player) {
  const cost = cardCost(card);
  const ready = player.feathers >= cost;
  return `${card}. Costs ${cost} feathers. You have ${player.feathers} feathers. ${ready ? 'Ready to play.' : 'Insufficient feathers.'} ${cardDescription(card)}`;
}

function playCard(card, targetId) {
  closeTargetMenu();
  socket.emit('ducks-race-play-card', { card, targetId }, result => {
    if (!result.ok) { window.playErrorBuzzer?.(); announcePolite(result.error); }
  });
}

function renderCards() {
  const me = game?.players.find(player => player.id === playerId);
  if (!me?.hand.length) {
    selectedCardIndex = -1;
    const item = document.createElement('li'); item.textContent = 'Your hand is empty.'; elements.cards.replaceChildren(item); return;
  }
  if (selectedCardIndex >= me.hand.length) selectedCardIndex = me.hand.length - 1;
  elements.cards.replaceChildren(...me.hand.map((card, index) => {
    const item = document.createElement('li');
    item.className = `card${index === selectedCardIndex ? ' selected-card' : ''}`;
    item.tabIndex = -1;
    item.dataset.cardIndex = index;
    item.setAttribute('aria-label', cardStatus(card, me));
    if (index === selectedCardIndex) item.setAttribute('aria-current', 'true');
    const heading = document.createElement('h3'); heading.textContent = `${card} — card ${index + 1}`;
    const text = document.createElement('p'); text.textContent = cardStatus(card, me);
    item.append(heading, text);
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `Play ${card}`;
    button.disabled = game.turnPlayerId !== playerId || game.status !== 'playing';
    button.addEventListener('click', () => { selectedCardIndex = index; activateSelectedCard(); });
    item.append(button); return item;
  }));
}

function cycleCard(direction) {
  const me = game?.players.find(player => player.id === playerId);
  const count = me?.hand.length || 0;
  if (!count) return announcePolite('You have no cards to select.');
  selectedCardIndex = selectedCardIndex < 0
    ? (direction > 0 ? 0 : count - 1)
    : (selectedCardIndex + direction + count) % count;
  if (elements.cardsPanel.hidden) {
    elements.cardsPanel.hidden = false;
    elements.showCards.setAttribute('aria-expanded', 'true');
  }
  renderCards();
  const card = elements.cards.querySelector(`[data-card-index="${selectedCardIndex}"]`);
  card?.focus();
  const selected = me.hand[selectedCardIndex];
  announcePolite(cardStatus(selected, me));
}

function activateSelectedCard() {
  if (selectedCardIndex < 0) return announcePolite('Use Up or Down Arrow to select a card first.');
  const me = game?.players.find(player => player.id === playerId);
  const card = me?.hand[selectedCardIndex];
  if (!card || game.turnPlayerId !== playerId || game.status !== 'playing') return announcePolite('That card cannot be played right now.');
  if (me.feathers < cardCost(card)) {
    window.playErrorBuzzer?.();
    return announcePolite('Cannot play. You need more feathers.');
  }
  if (card === 'Shield') {
    announcePolite('You played Shield! You are protected from the next hazard.');
    playCard(card);
  } else {
    openTargetMenu(card);
  }
}

function openTargetMenu(card) {
  const opponents = game.players.filter(player => player.id !== playerId);
  if (!opponents.length) return announcePolite('Cannot play. There are no other ducks to target.');
  targetingCard = card;
  selectedTargetIndex = 0;
  elements.targetMenu.hidden = false;
  renderTargets();
  announcePolite('Select target. Arrow up or down to choose a duck.');
  elements.targets.firstElementChild?.focus();
}

function closeTargetMenu() {
  targetingCard = null;
  selectedTargetIndex = 0;
  elements.targetMenu.hidden = true;
  elements.targets.replaceChildren();
}

function renderTargets() {
  const opponents = game.players.filter(player => player.id !== playerId);
  if (selectedTargetIndex >= opponents.length) selectedTargetIndex = 0;
  elements.targets.replaceChildren(...opponents.map((player, index) => {
    const item = document.createElement('li');
    item.className = `card${index === selectedTargetIndex ? ' selected-card' : ''}`;
    item.tabIndex = -1;
    item.dataset.targetIndex = index;
    item.setAttribute('aria-label', `${player.name}. Space ${player.square}. ${player.feathers} feathers. Press Enter to target this duck.`);
    if (index === selectedTargetIndex) item.setAttribute('aria-current', 'true');
    item.textContent = `${player.name}: Space ${player.square}, ${player.feathers} feathers`;
    return item;
  }));
}

function cycleTarget(direction) {
  const opponents = game.players.filter(player => player.id !== playerId);
  if (!opponents.length) return closeTargetMenu();
  selectedTargetIndex = (selectedTargetIndex + direction + opponents.length) % opponents.length;
  renderTargets();
  elements.targets.children[selectedTargetIndex]?.focus();
}

function activateSelectedTarget() {
  const opponents = game.players.filter(player => player.id !== playerId);
  const target = opponents[selectedTargetIndex];
  if (!target || !targetingCard) return announcePolite('No target is selected.');
  const card = targetingCard;
  announcePolite(`You played ${card} on ${target.name}.`);
  playCard(card, target.id);
}

function render() {
  if (!game) return;
  const me = game.players.find(player => player.id === playerId);
  const myTurn = game.status === 'playing' && game.turnPlayerId === playerId;
  elements.start.hidden = room?.hostId !== playerId || game.status !== 'waiting';
  elements.roll.disabled = !myTurn;
  elements.turn.textContent = game.status === 'finished'
    ? `${game.players.find(player => player.id === game.winnerId)?.name || 'A player'} won the race.`
    : myTurn ? 'It is your turn. Use Up or Down Arrow to choose a card, or press Enter outside the card list to roll.'
      : `Waiting for ${game.players.find(player => player.id === game.turnPlayerId)?.name || 'the host'}.`;
  elements.feathers.disabled = !me;
  renderPlayers(); renderCards(); renderBoard();
}

function panForSquare(square) {
  return Math.max(-1, Math.min(1, ((Number(square) - 1) / 39) * 2 - 1));
}

function playCue(cue) {
  if (!cue) return;
  const pan = panForSquare(cue.square);
  if (cue.type === 'dice') window.playDiceRoll?.();
  else if (cue.type === 'quack') window.playDuckQuack?.(pan);
  else if (cue.type === 'card' || cue.type === 'magic') window.playCardSlide?.(pan);
  if (cue.secondary) setTimeout(() => playCue(cue.secondary), 260);
}

function receiveState(payload) {
  game = payload.game;
  render();
  if (game.sequence !== lastSequence) {
    lastSequence = game.sequence;
    playCue(payload.cue);
    const story = payload.cue?.actorId === playerId && payload.cue.localAnnouncement
      ? payload.cue.localAnnouncement
      : game.announcement;
    const delay = payload.cue?.type === 'dice' ? 720 : 0;
    setTimeout(() => { elements.announcement.textContent = story; }, delay);
  }
}

function connectToGame() {
  if (!sessionToken) {
    elements.connection.textContent = 'You are not logged in. Return to the lounge and log in first.';
    return;
  }
  if (!gameId) {
    elements.connection.textContent = 'No game was selected. Return to the lounge and create or join a game.';
    return;
  }
  socket.emit('authenticate-token', { token: sessionToken }, authResult => {
    if (!authResult.ok) { elements.connection.textContent = authResult.error; return; }
    socket.emit('join-game', { gameId }, result => {
      if (!result.ok) { elements.connection.textContent = result.error; return; }
      room = result.room;
      sessionStorage.setItem('loungeGameId', room.id);
      elements.connection.textContent = `Connected to ${room.game} as ${authResult.username}.`;
      if (room.game !== "Duck's Race") {
        elements.connection.textContent = `This game is ${room.game}, not Duck's Race.`; return;
      }
      if (room.ducksRace) receiveState({ game: room.ducksRace, cue: null });
      else {
        game = { boardSize: 40, boardSpaces: room.boardSpaces, trapSquares: [], status: 'waiting', turnPlayerId: null, winnerId: null, announcement: 'Waiting for the host to start Duck\'s Race.', sequence: 0,
          players: room.players.map(player => ({ ...player, square: 1, feathers: 5, hand: [], shielded: false })) };
        render(); elements.announcement.textContent = game.announcement;
      }
    });
  });
}

elements.start.addEventListener('click', () => socket.emit('start-ducks-race', {}, result => { if (!result.ok) announcePolite(result.error); }));
elements.roll.addEventListener('click', () => socket.emit('ducks-race-roll', {}, result => { if (!result.ok) announcePolite(result.error); }));
elements.showCards.addEventListener('click', () => {
  elements.cardsPanel.hidden = !elements.cardsPanel.hidden;
  elements.showCards.setAttribute('aria-expanded', String(!elements.cardsPanel.hidden));
  if (!elements.cardsPanel.hidden) elements.cardsTitle.focus();
});
elements.cancelTarget.addEventListener('click', () => {
  closeTargetMenu();
  announcePolite('Target selection cancelled.');
  elements.cards.querySelector(`[data-card-index="${selectedCardIndex}"]`)?.focus();
});
elements.feathers.addEventListener('click', () => {
  const me = game?.players.find(player => player.id === playerId);
  announcePolite(me ? `You have ${me.feathers} feathers${me.shielded ? ' and an active shield' : ''}.` : 'Your feather count is unavailable.');
});
elements.board.addEventListener('keydown', event => {
  const moves = { ArrowRight: 1, ArrowLeft: -1 };
  if (!(event.key in moves)) return;
  event.preventDefault();
  boardIndex = (boardIndex + moves[event.key] + 40) % 40;
  elements.board.children[boardIndex]?.focus();
});
document.addEventListener('keydown', event => {
  if (event.target.matches('input, textarea')) return;
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    const direction = event.key === 'ArrowUp' ? -1 : 1;
    if (targetingCard) cycleTarget(direction); else cycleCard(direction);
    return;
  }
  if (event.key === 'Enter') {
    if (targetingCard && elements.targets.contains(document.activeElement)) {
      event.preventDefault();
      activateSelectedTarget();
    } else if (elements.cards.contains(document.activeElement)) {
      event.preventDefault();
      activateSelectedCard();
    } else if (!elements.roll.disabled) {
      event.preventDefault();
      elements.roll.click();
    }
    return;
  }
  if (event.key === 'Escape' && targetingCard) {
    event.preventDefault();
    elements.cancelTarget.click();
    return;
  }
  if (event.key.toLowerCase() === 'c') elements.showCards.click();
  if (event.key.toLowerCase() === 'f') elements.feathers.click();
});

socket.on('connect', connectToGame);
socket.on('lobby-updated', updated => { room = updated; });
socket.on('ducks-race-state', receiveState);
socket.on('disconnect', () => { elements.connection.textContent = 'Connection lost. Trying to reconnect…'; });
