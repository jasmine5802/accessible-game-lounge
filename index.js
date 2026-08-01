'use strict';

const socket = io();
const elements = {
  authScreen: document.querySelector('#auth-screen'), authForm: document.querySelector('#auth-form'), authStatus: document.querySelector('#auth-status'),
  username: document.querySelector('#username'), password: document.querySelector('#password'), lounge: document.querySelector('#lounge'), status: document.querySelector('#status'),
  createGame: document.querySelector('#create-game'), createPanel: document.querySelector('#create-panel'), createForm: document.querySelector('#create-form'),
  refreshGames: document.querySelector('#refresh-games'), availableGames: document.querySelector('#available-games'), currentGame: document.querySelector('#current-game'),
  currentSummary: document.querySelector('#current-summary'), players: document.querySelector('#players'), enterGame: document.querySelector('#enter-game'),
  logout: document.querySelector('#logout'), chatForm: document.querySelector('#chat-form'), chatMessage: document.querySelector('#chat-message'), messages: document.querySelector('#messages')
};
elements.gameChoice = document.querySelector('#game-choice');
elements.editionFields = document.querySelector('#edition-fields');
elements.unoFields = document.querySelector('#uno-fields');
elements.lifeFields = document.querySelector('#life-fields');
elements.dominoFields = document.querySelector('#domino-fields');
elements.createSubmit = document.querySelector('#create-submit');

let currentRoom = null;
let username = sessionStorage.getItem('loungeUsername') || '';

const loungeState = {
  mode: 'MAIN_MENU',
  menuIndex: 0,
  menuItems: [
    { label: 'Duck Race', id: 'duck_race', type: 'game', game: 'Duck Race' },
    { label: 'Horse Race', id: 'horse_race', type: 'game', game: 'Horse Race' },
    { label: 'Uno Flip', id: 'uno_flip', type: 'game', game: 'Accessible Uno & Dos Lounge', variant: 'Uno Flip!' },
    { label: 'Skip-Bo', id: 'skip_bo', type: 'game', game: 'Accessible Skip-Bo Lounge' },
    { label: 'Monopoly', id: 'monopoly', type: 'game', game: 'Monopoly Multi-Edition' },
    { label: 'Help / Instructions', id: 'help', type: 'help' }
  ],
  selectedGame: null,
  promptStep: 'INSTRUCTIONS',
  gameCatalog: {
    duck_race: { instructions: 'Race once around the 40-space pond. Collect feathers and use cards to protect yourself or slow opponents.', keyboard: 'Enter rolls. C opens cards. Up and Down choose cards and targets. F reports feathers.', options: 'Choose a duck type, color, starting cards, and starting feathers.' },
    horse_race: { instructions: 'Race through six laps while terrain and lap events change the track.', keyboard: 'Enter, D, or Space rolls. C describes the space and lap. S reads standings.', options: 'Choose a horse type, color, and starting-card count.' },
    uno_flip: { instructions: 'Match color, number, or symbol and use Flip cards to turn over the double-sided deck.', keyboard: 'Up and Down choose a card. Enter plays or draws. C reports the center and S reads scores.', options: 'UNO Flip uses its complete light-side and dark-side rules.' },
    skip_bo: { instructions: 'Empty your stock pile by building shared piles from 1 through 12.', keyboard: 'Up and Down choose a hand card. S selects stock. 1 through 4 select discards. Enter plays.', options: 'Stock piles use 30 cards for two players and 20 for three or more players.' },
    monopoly: { instructions: 'Buy properties, collect rent, trade, and remain solvent.', keyboard: 'Arrow keys explore the board. Enter rolls. F reports balance and P reports owned properties.', options: 'Choose from the available board editions and themed tokens.' }
  },
  players: [],
  scores: {}
};
window.loungeState = loungeState;

function currentPlayers() {
  loungeState.players = currentRoom?.players?.map(player => `${player.name}${player.id === currentRoom.hostId ? ' (host)' : ''}`) || [];
  return loungeState.players;
}

function currentScores() {
  if (!currentRoom) return loungeState.scores = {};
  if (currentRoom.scores && typeof currentRoom.scores === 'object') return loungeState.scores = currentRoom.scores;
  loungeState.scores = Object.fromEntries((currentRoom.players || [])
    .filter(player => Number.isFinite(player.score))
    .map(player => [player.name, player.score]));
  return loungeState.scores;
}

function openQuickGameOptions(item, focusSubmit = false) {
  loungeState.mode = 'OPTIONS_FORM';
  window.loungeDesktopPromptKeys?.setActive(false);
  loungeState.selectedGame = item.id;
  loungeState.promptStep = 'OPTIONS';
  document.querySelector('#prompt-box').classList.add('hidden');
  elements.createPanel.hidden = false;
  elements.gameChoice.value = item.game;
  elements.gameChoice.dispatchEvent(new Event('change'));
  if (item.variant) document.querySelector('#uno-variant').value = item.variant;
  announce(`${item.label} selected. Review the options, then create the game.`);
  requestAnimationFrame(() => (focusSubmit ? elements.createSubmit : elements.gameChoice).focus());
}

function askPrompt(messageText) {
  loungeState.mode = 'SETUP_PROMPTS';
  window.loungeDesktopPromptKeys?.setActive(true);
  const promptBox = document.querySelector('#prompt-box');
  const promptText = document.querySelector('#prompt-text');
  const announcer = document.querySelector('#sr-announcer');
  if (promptBox && promptText) {
    promptBox.classList.remove('hidden');
    promptText.textContent = messageText;
  }
  if (announcer) {
    announcer.textContent = '';
    requestAnimationFrame(() => { announcer.textContent = messageText; });
  }
  document.querySelector('#app-container')?.focus();
  window.LoungeAccessibility.speak(messageText);
}

function handleMenuSelection(selectedItem = null) {
  const item = selectedItem || loungeState.menuItems[loungeState.menuIndex];
  if (!item || item.type !== 'game' || !loungeState.gameCatalog[item.id]) return;
  loungeState.mode = 'SETUP_PROMPTS';
  loungeState.selectedGame = item.id;
  loungeState.promptStep = 'INSTRUCTIONS';
  askPrompt(`Would you like to hear the instructions for ${item.label}? Press Y for yes or N for no.`);
}

function processPromptChoice(isYes) {
  const item = loungeState.menuItems.find(entry => entry.id === loungeState.selectedGame);
  const info = loungeState.gameCatalog[loungeState.selectedGame];
  if (!item || !info) return;
  if (loungeState.promptStep === 'INSTRUCTIONS') {
    loungeState.promptStep = 'KEYBOARD';
    askPrompt(`${isYes ? info.instructions : 'Skipping instructions.'} Would you like to hear the keyboard commands for ${item.label}? Press Y for yes or N for no.`);
    return;
  }
  if (loungeState.promptStep === 'KEYBOARD') {
    loungeState.promptStep = 'OPTIONS';
    askPrompt(`${isYes ? info.keyboard : 'Skipping keyboard commands.'} Would you like to review game options for ${item.label}? Press Y for yes or N for no.`);
    return;
  }
  if (loungeState.promptStep === 'OPTIONS') openQuickGameOptions(item, !isYes);
}

function syncMenuVisuals(item, selectedIndex) {
  loungeState.menuIndex = selectedIndex;
  document.querySelectorAll('.visual-card').forEach((card, index) => {
    card.classList.toggle('selected', index === selectedIndex);
  });
}

const gameMenu = window.LoungeAccessibility.createGameStateController({
  mode: 'GAME',
  items: loungeState.menuItems,
  menuListEl: document.querySelector('#menu-items'),
  statusEl: document.querySelector('#sr-announcer'),
  getPlayers: currentPlayers,
  getScores: currentScores,
  emptyScoresText: 'Join or create a game before checking scores.',
  emptyPlayersText: 'Join or create a game before checking connected players.',
  helpText: 'Game menu help. Press Up or Down Arrow to choose a menu item and Enter to select it. Press S for current scores, P for connected players, and H for help.',
  shouldIgnoreKeyEvent: () => elements.lounge.hidden || loungeState.mode === 'SETUP_PROMPTS' || Boolean(document.querySelector('dialog[open], #lounge-quit-prompt')),
  onCurrentItemChange: syncMenuVisuals,
  onSelect: handleMenuSelection
});

window.addEventListener('keydown', event => {
  if (loungeState.mode === 'SETUP_PROMPTS') {
    const key = String(event.key || '').toLowerCase();
    if (!['y', 'n'].includes(key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    processPromptChoice(key === 'y');
    return;
  }
  gameMenu.handleKey(event);
}, true);

window.loungeDesktopPromptKeys?.onKey(key => {
  if (loungeState.mode !== 'SETUP_PROMPTS' || !['y', 'n'].includes(key)) return;
  processPromptChoice(key === 'y');
});

function announce(message) { elements.status.textContent = message; }

function authMessage(message, isError = false) {
  elements.authStatus.textContent = '';
  elements.authStatus.classList.toggle('error', isError);
  requestAnimationFrame(() => { elements.authStatus.textContent = message; });
}

function completeLogin(result, chime = true) {
  username = result.username;
  sessionStorage.setItem('loungeUsername', username);
  if (result.token) sessionStorage.setItem('loungeSessionToken', result.token);
  elements.password.value = '';
  authMessage(result.message || `Welcome, ${username}.`);
  elements.authScreen.hidden = true;
  elements.lounge.hidden = false;
  announce(`Logged in as ${username}.`);
  if (chime) window.playSuccessChime?.();
  socket.emit('list-games', {}, response => { if (response.ok) renderGames(response.games); });
  gameMenu.setMode('MENU');
  loungeState.mode = 'MAIN_MENU';
  gameMenu.renderMenu();
  requestAnimationFrame(() => {
    document.querySelector('#menu-items').focus();
    gameMenu.announceCurrentItem();
  });
}

function updateCurrentGame(room) {
  currentRoom = room;
  loungeState.mode = 'IN_GAME';
  sessionStorage.setItem('loungeGameId', room.id);
  elements.currentGame.hidden = false;
  elements.currentSummary.textContent = `${room.game}${room.monopolyEdition ? `, ${room.monopolyEdition} edition` : ''}${room.unoVariant ? `, ${room.unoVariant}` : ''}${room.lifeTheme ? `, ${room.lifeTheme}` : ''}${room.dominoMode ? `, ${room.dominoSet}, ${room.dominoMode}` : ''}, hosted by ${room.players.find(player => player.id === room.hostId)?.name || 'a player'}.`;
  elements.players.replaceChildren(...room.players.map(player => {
    const item = document.createElement('li');
    item.textContent = `${player.name}${player.id === room.hostId ? ' (host)' : ''}${player.connected ? '' : ' (reconnecting)'}`;
    return item;
  }));
  document.querySelector('#hud-players').textContent = String(room.players.length);
  document.querySelector('#hud-game').textContent = room.unoVariant || room.game;
  elements.enterGame.hidden = !["Duck Race", 'Horse Race', 'Accessible Dominoes Lounge', 'Accessible Skip-Bo Lounge', 'Accessible Mall Madness Lounge', 'Monopoly Multi-Edition', 'Accessible Uno & Dos Lounge', 'The Game of Life Lounge'].includes(room.game);
  elements.enterGame.textContent = room.game === 'Monopoly Multi-Edition' ? 'Enter Monopoly' : room.game === 'Accessible Uno & Dos Lounge' ? 'Enter UNO & DOS Lounge' : room.game === 'The Game of Life Lounge' ? 'Enter The Game of Life' : room.game === 'Horse Race' ? 'Enter Horse Race' : room.game === 'Accessible Dominoes Lounge' ? 'Enter Dominoes Lounge' : room.game === 'Accessible Skip-Bo Lounge' ? 'Enter Skip-Bo Lounge' : room.game === 'Accessible Mall Madness Lounge' ? 'Enter Mall Madness Lounge' : "Enter Duck Race";
  announce(`Joined ${room.game}. ${room.players.length} player${room.players.length === 1 ? '' : 's'} present.`);
}

function joinGame(gameId) {
  socket.emit('join-game', { gameId }, result => result.ok ? updateCurrentGame(result.room) : announce(result.error));
}

function renderGames(games) {
  if (!games.length) {
    const item = document.createElement('li'); item.textContent = 'No games are currently waiting. Create one to begin.'; elements.availableGames.replaceChildren(item); return;
  }
  elements.availableGames.replaceChildren(...games.map(game => {
    const item = document.createElement('li');
    const summary = document.createElement('span');
    summary.textContent = `${game.game}, hosted by ${game.host}, ${game.playerCount} player${game.playerCount === 1 ? '' : 's'}, ${game.status}.`;
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = `Join ${game.host}'s ${game.game}`; button.disabled = game.status === 'finished';
    button.addEventListener('click', () => joinGame(game.id));
    item.append(summary, button); return item;
  }));
}

elements.authForm.addEventListener('submit', event => {
  event.preventDefault();
  const action = event.submitter?.dataset.action || 'login';
  const data = { username: elements.username.value, password: elements.password.value };
  authMessage(action === 'register' ? 'Registering your account…' : 'Checking your login…');
  socket.emit(action, data, result => {
    if (result.ok) completeLogin(result);
    else { authMessage(result.error, true); window.playErrorBuzzer?.(); }
  });
});

elements.createGame.addEventListener('click', () => {
  elements.createPanel.hidden = false;
  document.querySelector('#game-choice').focus();
});
elements.gameChoice.addEventListener('change', () => {
  const monopoly = elements.gameChoice.value === 'Monopoly Multi-Edition';
  const uno = elements.gameChoice.value === 'Accessible Uno & Dos Lounge';
  const life = elements.gameChoice.value === 'The Game of Life Lounge';
  const dominoes = elements.gameChoice.value === 'Accessible Dominoes Lounge';
  elements.editionFields.hidden = !monopoly;
  elements.unoFields.hidden = !uno;
  elements.lifeFields.hidden = !life;
  elements.dominoFields.hidden = !dominoes;
  elements.createSubmit.textContent = monopoly ? 'Create Monopoly Game' : uno ? 'Create UNO / DOS Game' : life ? 'Create Game of Life' : dominoes ? 'Create Dominoes Game' : elements.gameChoice.value === 'Accessible Skip-Bo Lounge' ? 'Create Skip-Bo Game' : elements.gameChoice.value === 'Accessible Mall Madness Lounge' ? 'Create Mall Madness Game' : "Create Duck Race";
});
elements.createForm.addEventListener('submit', event => {
  event.preventDefault();
  socket.emit('create-game', Object.fromEntries(new FormData(event.currentTarget)), result => {
    if (!result.ok) return announce(result.error);
    elements.createPanel.hidden = true;
    updateCurrentGame(result.room);
    elements.enterGame.focus();
  });
});
elements.refreshGames.addEventListener('click', () => socket.emit('list-games', {}, result => {
  if (result.ok) { renderGames(result.games); announce('Available games refreshed.'); } else announce(result.error);
}));
elements.enterGame.addEventListener('click', () => {
  if (!currentRoom) return announce('Join or create a game first.');
  const page=currentRoom.game === 'Monopoly Multi-Edition' ? '/monopoly.html' : currentRoom.game === 'Accessible Uno & Dos Lounge' ? '/uno.html' : currentRoom.game === 'The Game of Life Lounge' ? '/life.html' : currentRoom.game === 'Horse Race' ? '/horserace.html' : currentRoom.game === 'Accessible Dominoes Lounge' ? '/dominoes.html' : currentRoom.game === 'Accessible Skip-Bo Lounge' ? '/skipbo.html' : currentRoom.game === 'Accessible Mall Madness Lounge' ? '/mallmadness.html' : '/ducks-race.html';
  location.href = `${page}?game=${encodeURIComponent(currentRoom.id)}`;
});
elements.chatForm.addEventListener('submit', event => {
  event.preventDefault();
  socket.emit('chat-message', elements.chatMessage.value, result => {
    if (result.ok) elements.chatMessage.value = ''; else announce(result.error);
  });
});
elements.logout.addEventListener('click', () => {
  sessionStorage.removeItem('loungeSessionToken');
  sessionStorage.removeItem('loungeUsername');
  sessionStorage.removeItem('loungeGameId');
  socket.emit('logout', {}, () => location.reload());
});

socket.on('available-games', renderGames);
socket.on('update-room-list', games => {
  renderGames(games);
  if (!elements.lounge.hidden) announce(games.length ? `${games.length} active game${games.length === 1 ? '' : 's'} available to join.` : 'No active games available.');
});
socket.on('lobby-updated', updateCurrentGame);
socket.on('chat-message', message => {
  const paragraph = document.createElement('p');
  const sender = document.createElement('strong'); sender.textContent = `${message.sender}: `;
  paragraph.append(sender, document.createTextNode(message.text)); elements.messages.append(paragraph);
  elements.messages.scrollTop = elements.messages.scrollHeight;
});
socket.on('connect', () => {
  socket.emit('get-active-rooms');
  const token = sessionStorage.getItem('loungeSessionToken');
  if (!token) { elements.username.focus(); return; }
  socket.emit('authenticate-token', { token }, result => {
    if (result.ok) completeLogin(result, false);
    else { sessionStorage.removeItem('loungeSessionToken'); authMessage(result.error, true); elements.username.focus(); }
  });
});
socket.on('disconnect', () => { if (!elements.lounge.hidden) announce('Connection lost. Trying to reconnect.'); });
