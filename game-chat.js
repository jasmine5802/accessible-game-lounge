'use strict';

(function initializeGameChat() {
  if (typeof socket === 'undefined') return;
  const main = document.querySelector('main');
  if (!main || document.querySelector('#game-chat')) return;

  const style = document.createElement('style');
  style.textContent = '.playroom-tools{display:flex;flex-wrap:wrap;gap:.65rem;margin:1rem 0}.game-chat{margin:1rem 0;padding:1rem;border:3px solid #63efff;border-radius:12px;background:#102c43;color:#fff}.game-chat-log{max-height:13rem;overflow-y:auto;padding:.7rem;border:2px solid #fff;border-radius:8px;background:#071827}.game-chat-log p{margin:.35rem 0}.game-chat-private{color:#ffe59a}.game-chat-form{display:grid;grid-template-columns:auto minmax(9rem,14rem) auto minmax(14rem,1fr) auto;gap:.6rem;align-items:end;margin-top:.8rem}.game-chat-form label{font-weight:800}.game-chat-form input,.game-chat-form select{min-height:3rem;padding:.55rem;border:3px solid #fff;border-radius:7px;font:inherit}.game-chat-form button{min-height:3rem}.game-chat-hint{margin:.4rem 0}.players-dialog{width:min(34rem,92vw);border:4px solid #63efff;background:#102c43;color:#fff;padding:1rem}.players-dialog::backdrop{background:#000b}.players-dialog li{margin:.45rem 0}@media(max-width:48rem){.game-chat-form{grid-template-columns:1fr}.game-chat-form label{margin-top:.25rem}}';
  document.head.append(style);

  const tools = document.createElement('nav');
  tools.className = 'playroom-tools';
  tools.setAttribute('aria-label', 'Players and game chat');
  const playersButton = document.createElement('button');
  playersButton.type = 'button';
  playersButton.textContent = 'Players (F2)';
  const chatButton = document.createElement('button');
  chatButton.type = 'button';
  chatButton.textContent = 'Game Chat (F3)';
  tools.append(playersButton, chatButton);
  main.insertBefore(tools, main.firstChild);

  const section = document.createElement('section');
  section.id = 'game-chat';
  section.className = 'game-chat';
  section.setAttribute('aria-labelledby', 'game-chat-title');
  section.hidden = true;
  const title = document.createElement('h2');
  title.id = 'game-chat-title';
  title.textContent = 'Game Chat';
  const hint = document.createElement('p');
  hint.id = 'game-chat-recipient-help';
  hint.className = 'game-chat-hint';
  hint.textContent = 'Choose Everyone for public game chat or choose one player for a private message. Press F3 to open chat, Alt+R for recipients, Alt+M for the message box, or Escape to close chat.';
  const log = document.createElement('div');
  log.className = 'game-chat-log';
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  log.setAttribute('aria-relevant', 'additions');
  log.setAttribute('aria-label', 'Game chat messages');
  const form = document.createElement('form');
  form.className = 'game-chat-form';
  const recipientLabel = document.createElement('label');
  recipientLabel.htmlFor = 'game-chat-recipient';
  recipientLabel.textContent = 'Send to';
  const recipient = document.createElement('select');
  recipient.id = 'game-chat-recipient';
  recipient.setAttribute('aria-describedby', 'game-chat-recipient-help');
  recipient.append(new Option('Everyone in game', 'everyone'));
  const label = document.createElement('label');
  label.htmlFor = 'game-chat-message';
  label.textContent = 'Message';
  const input = document.createElement('input');
  input.id = 'game-chat-message';
  input.maxLength = 500;
  input.required = true;
  input.autocomplete = 'off';
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Send Message';
  const status = document.createElement('div');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.append(recipientLabel, recipient, label, input, button);
  section.append(title, hint, log, form, status);
  main.append(section);

  const playersDialog = document.createElement('dialog');
  playersDialog.className = 'players-dialog';
  playersDialog.setAttribute('aria-labelledby', 'game-players-title');
  const playersTitle = document.createElement('h2');
  playersTitle.id = 'game-players-title';
  playersTitle.textContent = 'Players in Game';
  const playersList = document.createElement('ul');
  const closePlayers = document.createElement('button');
  closePlayers.type = 'button';
  closePlayers.textContent = 'Close Players List';
  playersDialog.append(playersTitle, playersList, closePlayers);
  document.body.append(playersDialog);

  const originalPlayers = document.querySelector('#players');
  const originalPlayersSection = originalPlayers?.closest('section');
  if (originalPlayersSection) originalPlayersSection.hidden = true;

  function showChat() { section.hidden = false; input.focus(); }
  function closeChat() { section.hidden = true; chatButton.focus(); }
  function showPlayers() { if (!playersDialog.open) playersDialog.showModal(); closePlayers.focus(); }
  function updateParticipants(room) {
    if (!room?.players) return;
    const previous = recipient.value;
    const options = [new Option('Everyone in game', 'everyone')];
    room.players.forEach(player => options.push(new Option(`${player.name}${player.connected === false ? ' (reconnecting)' : ''}`, player.id)));
    recipient.replaceChildren(...options);
    if ([...recipient.options].some(option => option.value === previous)) recipient.value = previous;
    playersTitle.textContent = `Players in Game: ${room.players.length} of ${room.maxPlayers}`;
    playersList.replaceChildren(...room.players.map(player => Object.assign(document.createElement('li'), { textContent: `${player.name}${player.id === room.hostId ? ' (host)' : ''}${player.connected === false ? ' (reconnecting)' : ''}` })));
  }

  input.addEventListener('keydown', event => event.stopPropagation());
  form.addEventListener('submit', event => {
    event.preventDefault();
    socket.emit('chat-message', { text: input.value, recipientId: recipient.value }, result => {
      if (result.ok) {
        input.value = '';
        status.textContent = result.private ? `Private message sent to ${result.recipient}.` : 'Message sent to everyone in the game.';
      } else status.textContent = result.error;
    });
  });
  socket.on('chat-message', message => {
    const paragraph = document.createElement('p');
    const sender = document.createElement('strong');
    sender.textContent = message.private ? `Private — ${message.sender} to ${message.recipient}: ` : `${message.sender}: `;
    if (message.private) paragraph.className = 'game-chat-private';
    paragraph.append(sender, document.createTextNode(message.text));
    log.append(paragraph);
    while (log.children.length > 100) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  });
  socket.on('lobby-updated', updateParticipants);
  playersButton.addEventListener('click', showPlayers);
  chatButton.addEventListener('click', showChat);
  closePlayers.addEventListener('click', () => playersDialog.close());
  playersDialog.addEventListener('close', () => playersButton.focus());
  document.addEventListener('keydown', event => {
    if (event.key === 'F2') { event.preventDefault(); showPlayers(); }
    else if (event.key === 'F3') { event.preventDefault(); showChat(); }
    else if (event.key === 'Escape' && !section.hidden && !playersDialog.open) { event.preventDefault(); closeChat(); }
    else if (event.altKey && event.key.toLowerCase() === 'm') { event.preventDefault(); showChat(); }
    else if (event.altKey && event.key.toLowerCase() === 'r') { event.preventDefault(); section.hidden = false; recipient.focus(); }
  });
}());
