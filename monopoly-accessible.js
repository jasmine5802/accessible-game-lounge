'use strict';
window.getMonopolyKeyboardHelp = () => GAME_PAGE_HELP['/monopoly.html'].keys;
// Text menus supplement the existing Monopoly controls only in accessible mode.
(() => {
  const enabled = () => Boolean(window.LoungeAccessibility?.accessibleMode);
  const selection = document.createElement('p');
  selection.id = 'monopoly-menu-selection';
  commandFocus.append(selection);
  let turnIndex = 0, offerIndex = 0, historyIndex = -1;
  const menu = document.createElement('dialog');
  menu.id = 'monopoly-accessible-menu';
  menu.setAttribute('role', 'application');
  menu.tabIndex = 0;
  const prompt = document.createElement('p');
  const amountLabel = document.createElement('label');
  amountLabel.htmlFor = 'monopoly-menu-cash';
  amountLabel.textContent = 'Cash requested from the other player';
  const amount = document.createElement('input');
  amount.id = 'monopoly-menu-cash'; amount.type = 'number'; amount.min = '0'; amount.step = '1';
  menu.append(prompt, amountLabel, amount);
  document.body.append(menu);
  let choices = [], choiceIndex = 0, choose = null, back = null, inputConfirm = null;
  const trade = {};
  function announceMenu(message) {
    elements.politeAnnouncer.textContent = '';
    requestAnimationFrame(() => { elements.politeAnnouncer.textContent = message; });
  }
  function announceChoice() {
    prompt.textContent = choices[choiceIndex]?.label || 'No choices available.';
    announceMenu(prompt.textContent);
  }
  function showMenu(title, items, action, previous = null) {
    choices = items; choiceIndex = 0; choose = action; back = previous; inputConfirm = null;
    amount.hidden = amountLabel.hidden = true;
    menu.setAttribute('aria-label', title);
    if (!menu.open) menu.showModal();
    menu.focus(); announceChoice();
  }
  function closeMenu() { if (menu.open) menu.close(); }
  menu.addEventListener('close', () => focusGameplayControls());
  menu.addEventListener('cancel', event => {
    event.preventDefault(); if (back) back(); else closeMenu();
  });
  menu.addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const key = event.key.toLowerCase();
    if (key === 'escape') { event.preventDefault(); if (back) back(); else closeMenu(); return; }
    if (inputConfirm) {
      if (key === 'enter') { event.preventDefault(); inputConfirm(); }
      return;
    }
    if (['arrowup', 'arrowdown', 'home', 'end', 'enter'].includes(key)) event.preventDefault();
    if (key === 'enter') { if (choices[choiceIndex]) choose?.(choices[choiceIndex]); return; }
    if (!choices.length) return;
    if (['arrowup', 'arrowdown', 'home', 'end'].includes(key)) {
      choiceIndex = key === 'home' ? 0 : key === 'end' ? choices.length - 1 :
        (choiceIndex + (key === 'arrowup' ? -1 : 1) + choices.length) % choices.length;
      announceChoice();
    }
  });
  function propertyText(space, id) {
    const houses = game.houses?.[space.index] || 0;
    const rent = MonopolyBoards.rentFor(game.board, game.owners, space, id, game.houses);
    return `${space.name}. ${space.group ? groupLabel(space.group) + ' group.' : ''} ${formatBuilding(houses)}. Rent ${money(rent)}.`;
  }
  function opponents() {
    const players = game?.players.filter(player => player.id !== playerId) || [];
    showMenu('Other players assets', players.map(player => ({ id: player.id, label: `${player.name}. Balance ${money(player.balance)}.` })), item => {
      const owner = game.players.find(player => player.id === item.id);
      if (!owner) return announceMenu('That player has left.');
      const properties = game.board.filter(space => game.owners[space.index] === item.id);
      const items = properties.map(space => ({ label: propertyText(space, item.id) }));
      if (!items.length) items.push({ label: `${owner.name} owns no properties.` });
      showMenu(`${owner.name}'s properties`, items, entry => announceMenu(entry.label), opponents);
    });
  }
  function tradePlayers() {
    if (!game || game.status !== 'playing' || elements.trade.disabled) return announceMenu('You need an owned property and no pending trade to offer a trade.');
    const players = game.players.filter(player => player.id !== playerId);
    showMenu('Choose trading partner', players.map(player => ({ id: player.id, label: player.name })), item => { trade.toId = item.id; tradeProperties(); });
  }
  function tradeProperties() {
    const properties = game.board.filter(space => game.owners[space.index] === playerId);
    showMenu('Choose property to offer', properties.map(space => ({ id: space.index, label: propertyText(space, playerId) })), item => { trade.propertyIndex = item.id; tradeAmount(); }, tradePlayers);
  }
  function tradeAmount() {
    amount.hidden = amountLabel.hidden = false; choices = [];
    menu.setAttribute('aria-label', 'Trade cash');
    prompt.textContent = 'Enter cash requested for your property, or zero for a gift. Enter continues. Escape goes back.';
    amount.value = String(trade.amount || 0); back = tradeProperties;
    inputConfirm = () => {
      const value = Number(amount.value);
      if (!Number.isSafeInteger(value) || value < 0 || !amount.validity.valid) return announceMenu('Enter a whole cash amount of zero or more.');
      trade.amount = value; tradeReview();
    };
    amount.focus(); announceMenu(prompt.textContent);
  }
  function tradeReview() {
    const player = game.players.find(player => player.id === trade.toId);
    const property = game.board.find(space => space.index === trade.propertyIndex);
    if (!player || game.owners[trade.propertyIndex] !== playerId) { closeMenu(); return announceMenu('The player or property changed. Start the trade again.'); }
    showMenu('Review trade', [
      { id: 'send', label: `Send offer: ${property.name} to ${player.name} for ${money(trade.amount)}.` },
      { id: 'cancel', label: 'Cancel trade.' }
    ], item => {
      if (item.id === 'cancel') return closeMenu();
      if (trade.sending) return;
      trade.sending = true;
      socket.emit('monopoly-trade-offer', { toId: trade.toId, propertyIndex: trade.propertyIndex, amount: trade.amount }, result => {
        trade.sending = false;
        if (!result.ok) return announceMenu(result.error);
        closeMenu(); announceMenu('Trade offer sent. Waiting for the other player.');
      });
    }, tradeAmount);
  }
  function turnChoices() {
    const items = [];
    if (!elements.roll.disabled) items.push({ label: 'Roll Dice', action: () => elements.roll.click() });
    items.push({ label: 'Manage Assets', action: openProperties },
      { label: 'View Assets of Other Players', action: opponents });
    if (!elements.trade.disabled) items.push({ label: 'Trade', action: () => { trade.amount = 0; tradePlayers(); } });
    items.push({ label: 'Leave Game', action: () => window.LoungeAccessibility?.leaveGameAndReturn?.() });
    return items;
  }
  function refreshTurnMenu() {
    const items = turnChoices();
    if (turnIndex >= items.length) turnIndex = 0;
    selection.textContent = elements.offerPanel.hidden ? `Selected: ${items[turnIndex]?.label}.` :
      `Selected: ${offerIndex === 0 ? 'Accept offer' : 'Decline offer'}.`;
  }
  function reviewHistory(key) {
    const messages = [...messageHistory.children];
    if (!messages.length) return announceMenu('No game messages yet.');
    if (historyIndex < 0 || historyIndex >= messages.length) historyIndex = messages.length;
    historyIndex = key === 'home' ? 0 : key === 'end' ? messages.length - 1 :
      Math.max(0, Math.min(messages.length - 1, historyIndex + (key === 'pageup' ? -1 : 1)));
    announceMenu(messages[historyIndex].textContent);
  }
  document.addEventListener('keydown', event => {
    if (!enabled() || game?.status !== 'playing' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (document.querySelector('dialog[open]') || elements.board.contains(event.target) ||
        event.target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'A'].includes(event.target.tagName)) return;
    const key = event.key.toLowerCase();
    if (['pageup', 'pagedown', 'home', 'end'].includes(key)) { event.preventDefault(); reviewHistory(key); return; }
    if (key === 't') { event.preventDefault(); announceMenu(game.turnPlayerId === playerId ? 'Your turn.' : `${game.players.find(player => player.id === game.turnPlayerId)?.name || 'Another player'}'s turn.`); return; }
    if (key === 'o') { event.preventDefault(); opponents(); return; }
    if (key === 'e') { event.preventDefault(); trade.amount = 0; tradePlayers(); return; }
    if (key === 'c') { event.preventDefault(); elements.balance.click(); return; }
    if (!['arrowup', 'arrowdown', 'enter'].includes(key)) return;
    event.preventDefault();
    if (!elements.offerPanel.hidden) {
      if (key === 'enter') { if (!elements.buy.disabled && !elements.decline.disabled) answerOffer(offerIndex === 0); }
      else { offerIndex = 1 - offerIndex; refreshTurnMenu(); announceMenu(offerIndex === 0 ? 'Accept offer.' : 'Decline offer.'); }
      return;
    }
    const items = turnChoices();
    if (key === 'enter') { items[turnIndex]?.action(); return; }
    turnIndex = (turnIndex + (key === 'arrowup' ? -1 : 1) + items.length) % items.length;
    refreshTurnMenu(); announceMenu(items[turnIndex].label);
  }, true);
  socket.on('monopoly-state', () => {
    turnIndex = offerIndex = 0;
    if (game?.status !== 'playing') { closeMenu(); if (propertyDialog.open) propertyDialog.close(); }
    refreshTurnMenu();
  });
  new MutationObserver(refreshTurnMenu).observe(elements.roll, { attributes: true, attributeFilter: ['disabled'] });
  const modeObserver = new MutationObserver(() => { selection.hidden = !enabled(); refreshTurnMenu(); });
  modeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  selection.hidden = !enabled();
  commandHint.textContent = 'Up/Down: turn menu | Enter: choose | B/P: assets | O: opponents | E: trade | T: turn | C/F: cash | Page Up/Down: messages | Home/End: first/latest | Y/N: offers | Q: quit';
})();
