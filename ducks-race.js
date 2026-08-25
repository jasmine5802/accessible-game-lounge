'use strict';

const socket = io();
const params = new URLSearchParams(location.search);
const gameId = (params.get('game') || sessionStorage.getItem('loungeGameId') || '').toUpperCase();
const sessionToken = sessionStorage.getItem('loungeSessionToken') || '';
const playerName = sessionStorage.getItem('loungeUsername') || '';
let playerId = null;

const elements = {
  connection: document.querySelector('#connection'), announcement: document.querySelector('#announcement'),
  start: document.querySelector('#start'), roll: document.querySelector('#roll'), turn: document.querySelector('#turn-status'),
  showCards: document.querySelector('#show-cards'), feathers: document.querySelector('#feathers'),
  cardsPanel: document.querySelector('#cards-panel'), cardsTitle: document.querySelector('#cards-title'), cards: document.querySelector('#cards'),
  targetMenu: document.querySelector('#target-menu'), targets: document.querySelector('#targets'), cancelTarget: document.querySelector('#cancel-target'),
  miniGame: document.querySelector('#mini-game'), miniTitle: document.querySelector('#mini-title'), miniPrompt: document.querySelector('#mini-prompt'), miniOptions: document.querySelector('#mini-options'),
  players: document.querySelector('#players'), board: document.querySelector('#board'), polite: document.querySelector('#polite-announcer')
};

let room = null;
let game = null;
let boardIndex = 0;
function resolvePlayerId(nextRoom = room, fallbackName = playerName, fallbackUsername = '') {
  const candidates = [];
  const storedPlayerId = sessionStorage.getItem('loungePlayerId') || '';
  if (storedPlayerId) candidates.push(storedPlayerId);
  if (fallbackName) candidates.push(fallbackName);
  if (fallbackUsername) candidates.push(fallbackUsername);
  const allPlayers = [
    ...(nextRoom?.players || []),
    ...(game?.players || [])
  ];
  const byId = allPlayers.find(player => player.id && candidates.includes(player.id));
  if (byId?.id) return byId.id;
  const byName = allPlayers.find(player => player.name && candidates.some(candidate => String(candidate).toLowerCase() === String(player.name).toLowerCase()));
  if (byName?.id) return byName.id;
  return playerId || null;
}
const gameplayLayoutStyle = document.createElement('style');
gameplayLayoutStyle.textContent = 'body.rs-clean-gameplay .lounge-client-shell{display:none!important}';
document.head.appendChild(gameplayLayoutStyle);
let selectedCardIndex = -1;
let targetingCard = null;
let targetingSquareCard = null;
let selectedTargetIndex = 0;
let lastSequence = -1;
let actionIndex = 0;
const actionButtons = [];
const accessibility = window.LoungeAccessibility?.createGameStateController({
  mode: 'GAME',
  statusEl: elements.polite,
  items: [
    { label: 'Start Duck Race', type: 'game' },
    { label: 'Roll Dice', type: 'game' },
    { label: 'View Cards', type: 'game' },
    { label: 'Check Feathers', type: 'game' },
    { label: 'Help / Instructions', type: 'help' }
  ],
  helpText: 'Keyboard shortcuts: Up or Down arrows choose cards or targets. Enter confirms or rolls. Press S for current feathers leaderboard. Press P for connected players. Press H for help.'
});

function syncAccessibilityState() {
  if (!accessibility || !game) return;
  accessibility.setPlayers((game.players || []).map(player => player.name));
  accessibility.setScores(Object.fromEntries((game.players || []).map(player => [player.name, `${player.feathers} feathers`])));
}

function announcePolite(text) {
  elements.polite.textContent = '';
  requestAnimationFrame(() => { elements.polite.textContent = text; });
}

function squareDescription(square) {
  const racers = game?.players.filter(player => player.square === square).map(player => player.name) || [];
  const space = game?.boardSpaces?.[square - 1] || { name: 'Board Space', description: 'No effect information is available.' };
  const placed = game?.placedHazards?.find(hazard => hazard.square === square);
  return `Space ${square}: ${space.name}. ${space.description}${placed ? ` A ${placed.card || 'Mud Puddle'} card is placed here.` : ''} ${racers.length ? `Occupied by ${racers.join(' and ')}.` : 'Empty.'}`;
}

function renderBoard() {
  const size = game?.boardSize || 40;
  elements.board.replaceChildren(...Array.from({ length: size }, (_, index) => {
    const square = index + 1;
    const item = document.createElement('li');
    const space = game?.boardSpaces?.[index] || { name: 'Board Space', effect: 'safe' };
    const placed = game?.placedHazards?.some(hazard => hazard.square === square);
    item.className = `square ${space.effect}${space.effect === 'mud' || placed ? ' trap' : ''}`;
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

function waitingAnnouncementText() {
  const names = (room?.players || []).map(player => player.name).filter(Boolean);
  if (names.length > 1) {
    return `Waiting for the host to start Duck Race. Players at this table: ${names.join(', ')}.`;
  }
  return 'Waiting for the host to start Duck Race.';
}

function waitingGame() {
  return {
    boardSize: 40,
    boardSpaces: room?.boardSpaces || [],
    trapSquares: [],
    status: 'waiting',
    turnPlayerId: null,
    winnerId: null,
    announcement: waitingAnnouncementText(),
    sequence: 0,
    players: (room?.players || []).map(player => ({
      ...player,
      square: 1,
      feathers: 5,
      hand: [],
      shielded: false,
      duckType: 'Mallard',
      color: 'Green and brown'
    }))
  };
}

function cardDescription(card) {
  if (card === 'Wind Gust') return 'Push another player back 3 spaces.';
  if (card === 'Shield') return 'Protect yourself from the next hazard.';
  if (card === 'Mud Puddle') return 'Drop a one-use trap on your current square. An opponent who lands there loses 1 feather.';
  if (card === 'Tailwind Tile') return 'Drop a one-use tailwind on your current square. The next duck to land there moves forward 3 spaces.';
  if (card === 'Feather Cache') return 'Drop a one-use feather cache on your current square. The next duck to land there gains 2 feathers.';
  if (card === 'Pond Shortcut') return 'Spend 2 feathers to move yourself forward 4 spaces before rolling.';
  if (card === 'Feather Find') return 'Gain 2 feathers at no cost.';
  if (card === 'Trade Places') return 'Spend 2 feathers to swap board positions with another duck.';
  if (card === 'Quick Paddle') return 'Spend 1 feather to move forward 2 spaces before rolling.';
  if (card === 'Feather Bonanza') return 'Spend 1 feather to gain 3 feathers.';
  if (card === 'Big Splash') return 'Spend 2 feathers to push another duck back 5 spaces.';
  if (card === 'Lucky Lily Pad') return 'Drop a one-use lucky lily pad on your current square. The next duck to land there gains 3 feathers.';
  return 'Steal 1 feather from another player.';
}

function cardCost(card) {
  return game?.cardCosts?.[card] ?? { 'Wind Gust': 1, Shield: 2, Pluck: 1, 'Mud Puddle': 1, 'Tailwind Tile': 1, 'Feather Cache': 1, 'Pond Shortcut': 2, 'Feather Find': 0, 'Trade Places': 2, 'Quick Paddle': 1, 'Feather Bonanza': 1, 'Big Splash': 2, 'Lucky Lily Pad': 1 }[card] ?? 0;
}

function cardStatus(card, player) {
  const cost = cardCost(card);
  const ready = player.feathers >= cost;
  return `${card}. Costs ${cost} feathers. You have ${player.feathers} feathers. ${ready ? 'Ready to play.' : 'Insufficient feathers.'} ${cardDescription(card)}`;
}

function playCard(card, targetId, targetSquare) {
  closeTargetMenu();
  socket.emit('ducks-race-play-card', { card, targetId, targetSquare }, result => {
    if (!result.ok) { window.playErrorBuzzer?.(); announcePolite(result.error); }
  });
}

function renderCards() {
  const me = game?.players.find(player => player.id === playerId);
  const hand = me?.hand || [];
  if (selectedCardIndex >= hand.length) selectedCardIndex = hand.length - 1;
  const rollItem = document.createElement('li');
  rollItem.className = `card${selectedCardIndex === -1 ? ' selected-card' : ''}`;
  rollItem.setAttribute('role', 'option');
  rollItem.tabIndex = selectedCardIndex === -1 ? 0 : -1;
  rollItem.dataset.handAction = 'roll';
  rollItem.setAttribute('aria-selected', String(selectedCardIndex === -1));
  rollItem.setAttribute('aria-label', 'Roll the Dice. Press Enter to roll.');
  const rollHeading = document.createElement('h3'); rollHeading.textContent = 'Roll the Dice';
  const rollText = document.createElement('p'); rollText.textContent = 'Roll and move your duck instead of playing a card.';
  const rollButton = document.createElement('button'); rollButton.type = 'button'; rollButton.textContent = 'Roll the Dice';
  rollButton.disabled = game?.turnPlayerId !== playerId || game?.status !== 'playing';
  rollButton.addEventListener('click', () => { selectedCardIndex = -1; activateSelectedCard(); });
  rollItem.append(rollHeading, rollText, rollButton);
  const cardItems = hand.map((card, index) => {
    const item = document.createElement('li');
    item.className = `card${index === selectedCardIndex ? ' selected-card' : ''}`;
    item.setAttribute('role', 'option');
    item.tabIndex = index === selectedCardIndex ? 0 : -1;
    item.dataset.cardIndex = index;
    item.setAttribute('aria-label', cardStatus(card, me));
    item.setAttribute('aria-selected', String(index === selectedCardIndex));
    const heading = document.createElement('h3'); heading.textContent = `${card} — card ${index + 1}`;
    const text = document.createElement('p'); text.textContent = cardStatus(card, me);
    item.append(heading, text);
    const button = document.createElement('button'); button.type = 'button'; button.textContent = `Play ${card}`;
    button.disabled = game.turnPlayerId !== playerId || game.status !== 'playing';
    button.addEventListener('click', () => { selectedCardIndex = index; activateSelectedCard(); });
    item.append(button); return item;
  });
  elements.cards.replaceChildren(rollItem, ...cardItems);
}

function renderMiniGame() {
  const mini=game?.pendingMiniGame;
  elements.miniGame.hidden=!mini;
  if(!mini)return elements.miniOptions.replaceChildren();
  elements.miniTitle.textContent=mini.name;
  elements.miniPrompt.textContent=mini.isMine?`${mini.prompt} Choose an answer.`:`${mini.name} is waiting for the active player.`;
  elements.miniOptions.replaceChildren(...(mini.isMine?mini.options.map((option,index)=>{const button=document.createElement('button');button.type='button';button.textContent=option;button.addEventListener('click',()=>socket.emit('ducks-race-mini-answer',{choice:index},result=>{if(!result.ok)announcePolite(result.error)}));button.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const buttons=[...elements.miniOptions.querySelectorAll('button')],direction=['ArrowDown','ArrowRight'].includes(event.key)?1:-1;buttons[(index+direction+buttons.length)%buttons.length]?.focus()});return button}):[]));
  if(mini.isMine)requestAnimationFrame(()=>elements.miniOptions.firstElementChild?.focus());
}

function cycleCard(direction) {
  const me = game?.players.find(player => player.id === playerId);
  const handCount = me?.hand.length || 0;
  const count = handCount + 1;
  const currentOption = selectedCardIndex + 1;
  selectedCardIndex = (currentOption + direction + count) % count - 1;
  if (elements.cardsPanel.hidden) {
    elements.cardsPanel.hidden = false;
    elements.showCards.setAttribute('aria-expanded', 'true');
  }
  renderCards();
  const option = selectedCardIndex === -1
    ? elements.cards.querySelector('[data-hand-action="roll"]')
    : elements.cards.querySelector(`[data-card-index="${selectedCardIndex}"]`);
  option?.focus();
  announcePolite(selectedCardIndex === -1 ? 'Roll the Dice. Press Enter to roll.' : cardStatus(me.hand[selectedCardIndex], me));
}

function activateSelectedCard() {
  if (selectedCardIndex === -1) {
    if (elements.roll.disabled) return announcePolite('You cannot roll right now.');
    elements.roll.click();
    return;
  }
  const me = game?.players.find(player => player.id === playerId);
  const card = me?.hand[selectedCardIndex];
  if (!card || game.turnPlayerId !== playerId || game.status !== 'playing') return announcePolite('That card cannot be played right now.');
  if (me.feathers < cardCost(card)) {
    window.playErrorBuzzer?.();
    return announcePolite('Cannot play. You need more feathers.');
  }
  if (['Shield', 'Pond Shortcut', 'Feather Find', 'Quick Paddle', 'Feather Bonanza'].includes(card)) {
    announcePolite(`You played ${card}.`);
    playCard(card);
  } else if (['Mud Puddle', 'Tailwind Tile', 'Feather Cache', 'Lucky Lily Pad'].includes(card)) {
    announcePolite(`Placing ${card} on your current square, square ${me.square}.`);
    playCard(card, null, me.square);
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
    item.setAttribute('role', 'option');
    item.tabIndex = index === selectedTargetIndex ? 0 : -1;
    item.dataset.targetIndex = index;
    item.setAttribute('aria-label', `${player.name}. Space ${player.square}. ${player.feathers} feathers. Press Enter to target this duck.`);
    item.setAttribute('aria-selected', String(index === selectedTargetIndex));
    item.textContent = `${player.name}: Space ${player.square}, ${player.feathers} feathers`;
    item.addEventListener('click', () => { selectedTargetIndex = index; activateSelectedTarget(); });
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

function moveActionSelection(direction) {
  const actions = actionButtons.filter(Boolean);
  if (!actions.length) return;
  actionIndex = (actionIndex + direction + actions.length) % actions.length;
  actions[actionIndex]?.focus();
  actions.forEach((button, index) => button.classList.toggle('action-selected', index === actionIndex));
}

function render() {
  if (!game) return;
  const me = game.players.find(player => player.id === playerId);
  const myTurn = game.status === 'playing' && game.turnPlayerId === playerId;
  const hostView = room?.hostId === playerId;
  actionButtons.splice(0, actionButtons.length, ...Array.from(document.querySelectorAll('.action-option')));
  actionButtons.forEach((button, index) => {
    button.classList.toggle('action-selected', index === actionIndex);
    button.disabled = button.id === 'roll' ? !myTurn : false;
    if (button.id === 'start') button.hidden = room?.hostId !== playerId || game.status !== 'waiting';
  });
  elements.start.hidden = !hostView || game.status !== 'waiting';
  elements.roll.disabled = !myTurn;
  elements.turn.textContent = game.status === 'finished'
    ? `${game.players.find(player => player.id === game.winnerId)?.name || 'A player'} won the race.`
    : myTurn ? 'It is your turn. Use Up or Down Arrow to choose a card, or press Enter outside the card list to roll.'
      : `Waiting for ${game.players.find(player => player.id === game.turnPlayerId)?.name || 'the host'}.`;
  elements.feathers.disabled = !me;
  if (game.status === 'playing' && me?.hand?.length && elements.cardsPanel.hidden) {
    elements.cardsPanel.hidden = false;
    elements.showCards.setAttribute('aria-expanded', 'true');
  }
  renderPlayers(); renderCards(); renderBoard(); renderMiniGame();
  syncAccessibilityState();
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
  const wasMyTurn = game?.status === 'playing' && game?.turnPlayerId === playerId;
  game = payload.game;
  playerId = resolvePlayerId(room, playerName, sessionStorage.getItem('loungeUsername') || '');
  const isNowMyTurn = game.status === 'playing' && game.turnPlayerId === playerId;
  if (game.status === 'playing') {
    window.dispatchEvent(new CustomEvent('lounge-gameplay-started'));
  }
  render();
  if (isNowMyTurn && !wasMyTurn) {
    selectedCardIndex = -1;
    renderCards();
    requestAnimationFrame(() => {
      if (document.querySelector('dialog[open], [role="alertdialog"]')) return;
      const rollOption = elements.cards.querySelector('[data-hand-action="roll"]');
      rollOption?.focus();
      announcePolite('It is your turn. Roll the Dice selected. Press Enter to roll, or use Up and Down Arrow to choose a card.');
    });
  }
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
      playerId = result.playerId || resolvePlayerId(room, playerName, authResult.username);
      sessionStorage.setItem('loungeGameId', room.id);
      sessionStorage.setItem('loungePlayerId', playerId || '');
      elements.connection.textContent = `Connected to ${room.game} as ${authResult.username}.`;
      if (room.game !== 'Duck Race') {
        elements.connection.textContent = `This game is ${room.game}, not Duck Race.`; return;
      }
      if (room.ducksRace) receiveState({ game: room.ducksRace, cue: null });
      else {
        game = waitingGame();
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
  elements.cards.querySelector(selectedCardIndex === -1 ? '[data-hand-action="roll"]' : `[data-card-index="${selectedCardIndex}"]`)?.focus();
});
elements.feathers.addEventListener('click', () => {
  const me = game?.players.find(player => player.id === playerId);
  announcePolite(me ? `You have ${me.feathers} feathers${me.shielded ? ' and an active shield' : ''}.` : 'Your feather count is unavailable.');
});
elements.cards.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  const option = event.target.closest('[data-card-index], [data-hand-action="roll"]');
  if (!option) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  selectedCardIndex = option.dataset.handAction === 'roll' ? -1 : Number(option.dataset.cardIndex);
  activateSelectedCard();
}, true);
elements.board.addEventListener('keydown', event => {
  const moves = { ArrowRight: 1, ArrowLeft: -1 };
  if (event.key === 'Enter' && targetingSquareCard) {
    event.preventDefault();
    event.stopPropagation();
    const square = boardIndex + 1;
    const card = targetingSquareCard;
    targetingSquareCard = null;
    announcePolite(`Placing ${card} on square ${square}.`);
    playCard(card, null, square);
    return;
  }
  if (!(event.key in moves)) return;
  event.preventDefault();
  boardIndex = (boardIndex + moves[event.key] + 40) % 40;
  elements.board.children[boardIndex]?.focus();
});
document.addEventListener('keydown', event => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) return;
  if (accessibility?.handleKey(event)) return;
  if (event.key === 'Enter' && game?.status === 'waiting' && room?.hostId === playerId && !['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName || '')) {
    event.preventDefault();
    elements.start.click();
    announcePolite('Starting Duck Race.');
    return;
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    if (document.activeElement?.classList?.contains('action-option')) {
      event.preventDefault();
      moveActionSelection(event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    event.preventDefault();
    const direction = event.key === 'ArrowUp' ? -1 : 1;
    if (targetingCard) cycleTarget(direction); else cycleCard(direction);
    return;
  }
  if (event.key === 'Enter') {
    if (elements.cards.contains(document.activeElement)) {
      event.preventDefault();
      const cardItem = document.activeElement.closest('[data-card-index]');
      selectedCardIndex = cardItem ? Number(cardItem.dataset.cardIndex) : -1;
      activateSelectedCard();
    } else if (targetingCard && elements.targets.contains(document.activeElement)) {
      event.preventDefault();
      activateSelectedTarget();
    } else if (selectedCardIndex >= 0 && !elements.cardsPanel.hidden) {
      event.preventDefault();
      activateSelectedCard();
    } else if (document.activeElement?.classList?.contains('action-option')) {
      event.preventDefault();
      document.activeElement.click();
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
  if (event.key === 'Escape' && targetingSquareCard) {
    event.preventDefault();
    targetingSquareCard = null;
    announcePolite('Board square selection cancelled.');
    return;
  }
  if (event.key.toLowerCase() === 'c') elements.showCards.click();
  if (event.key.toLowerCase() === 'f') elements.feathers.click();
});

socket.on('connect', connectToGame);
socket.on('lobby-updated', updated => {
  room = updated;
  playerId = playerId || resolvePlayerId(room, playerName, sessionStorage.getItem('loungeUsername') || '');
  if (!game || game.status === 'waiting') {
    game = waitingGame();
    render();
    syncAccessibilityState();
  }
});
socket.on('table-player-joined', data => {
  if (!data?.message) return;
  if (game?.status === 'waiting') {
    game = waitingGame();
    render();
    syncAccessibilityState();
  }
  announcePolite(data.message);
  window.LoungeAccessibility?.speak?.(data.message);
  elements.announcement.textContent = data.message;
});
socket.on('ducks-race-state', receiveState);
socket.on('disconnect', () => { elements.connection.textContent = 'Connection lost. Trying to reconnect…'; });
