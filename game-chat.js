'use strict';

(function initializeGameChat() {
  if (typeof socket === 'undefined') return;
  const main = document.querySelector('main');
  if (!main || document.querySelector('#game-chat')) return;

  const style = document.createElement('style');
  style.textContent = '.game-chat{margin:1rem 0;padding:1rem;border:3px solid #63efff;border-radius:12px;background:#102c43;color:#fff}.game-chat-log{max-height:13rem;overflow-y:auto;padding:.7rem;border:2px solid #fff;border-radius:8px;background:#071827}.game-chat-log p{margin:.35rem 0}.game-chat-form{display:flex;flex-wrap:wrap;gap:.6rem;align-items:end;margin-top:.8rem}.game-chat-form label{font-weight:800}.game-chat-form input{flex:1 1 18rem;min-height:3rem;padding:.55rem;border:3px solid #fff;border-radius:7px;font:inherit}.game-chat-form button{min-height:3rem}.game-chat-hint{margin:.4rem 0}';
  document.head.append(style);

  const section = document.createElement('section');
  section.id = 'game-chat'; section.className = 'game-chat'; section.setAttribute('aria-labelledby', 'game-chat-title');
  const title = document.createElement('h2'); title.id = 'game-chat-title'; title.textContent = 'Game Chat';
  const hint = document.createElement('p'); hint.className = 'game-chat-hint'; hint.textContent = 'Messages are shared only with players in this game room. Press Alt+M to focus the message box.';
  const log = document.createElement('div'); log.className = 'game-chat-log'; log.setAttribute('role', 'log'); log.setAttribute('aria-live', 'polite'); log.setAttribute('aria-relevant', 'additions'); log.setAttribute('aria-label', 'Game chat messages');
  const form = document.createElement('form'); form.className = 'game-chat-form';
  const label = document.createElement('label'); label.htmlFor = 'game-chat-message'; label.textContent = 'Message';
  const input = document.createElement('input'); input.id = 'game-chat-message'; input.maxLength = 500; input.required = true; input.autocomplete = 'off';
  const button = document.createElement('button'); button.type = 'submit'; button.textContent = 'Send Message';
  const status = document.createElement('div'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  form.append(label, input, button); section.append(title, hint, log, form, status); main.append(section);

  input.addEventListener('keydown', event => event.stopPropagation());
  form.addEventListener('submit', event => {
    event.preventDefault();
    socket.emit('chat-message', input.value, result => {
      if (result.ok) { input.value = ''; status.textContent = 'Message sent.'; }
      else status.textContent = result.error;
    });
  });
  socket.on('chat-message', message => {
    const paragraph = document.createElement('p');
    const sender = document.createElement('strong'); sender.textContent = `${message.sender}: `;
    paragraph.append(sender, document.createTextNode(message.text)); log.append(paragraph);
    while (log.children.length > 100) log.firstElementChild.remove();
    log.scrollTop = log.scrollHeight;
  });
  document.addEventListener('keydown', event => { if (event.altKey && event.key.toLowerCase() === 'm') { event.preventDefault(); input.focus(); } });
}());
