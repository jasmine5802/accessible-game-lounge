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
  requestAnimationFrame(() => elements.createGame.focus());
}

function updateCurrentGame(room) {
  currentRoom = room;
  sessionStorage.setItem('loungeGameId', room.id);
  elements.currentGame.hidden = false;
  elements.currentSummary.textContent = `${room.game}${room.monopolyEdition ? `, ${room.monopolyEdition} edition` : ''}${room.unoVariant ? `, ${room.unoVariant}` : ''}${room.lifeTheme ? `, ${room.lifeTheme}` : ''}${room.dominoMode ? `, ${room.dominoSet}, ${room.dominoMode}` : ''}, hosted by ${room.players.find(player => player.id === room.hostId)?.name || 'a player'}.`;
  elements.players.replaceChildren(...room.players.map(player => {
    const item = document.createElement('li');
    item.textContent = `${player.name}${player.id === room.hostId ? ' (host)' : ''}${player.connected ? '' : ' (reconnecting)'}`;
    return item;
  }));
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
