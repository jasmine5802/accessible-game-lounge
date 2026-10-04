'use strict';

// Both race clients keep their existing visual controls and server actions.
// Accessible navigation stays on the command surface instead of focusing buttons.
(() => {
  const duckRace = location.pathname === '/ducks-race.html';
  const style = document.createElement('style');
  style.textContent = `html.lounge-accessible-mode body.rs-clean-gameplay ${duckRace ? '#cards' : '#hand'} {display:none!important}`;
  document.head.append(style);
  const speak = text => duckRace ? announcePolite(text) : say(text);
  const hand = () => duckRace ? game.players.find(p => p.id === playerId)?.hand || [] : game.myHand;
  const selection = () => duckRace ? selectedCardIndex : selected;
  const select = index => { if (duckRace) selectedCardIndex = index; else selected = index; };
  const report = player => `${player.name}. Lap ${player.lap} of ${game.totalLaps}, space ${duckRace ? player.square : player.position + 1}. ${duckRace ? `${player.feathers} feathers, ${player.handCount ?? player.hand.length} cards` : `${player.cardCount} cards`}.${game.turnPlayerId === player.id ? ' Has the turn.' : ''}`;
  const describeSelection = () => {
    const card = hand()[selection()];
    if (!card) return 'Roll the Dice. Press Enter to roll.';
    return duckRace ? cardStatus(card, game.players.find(p => p.id === playerId)) : `${cardText(card)}${game.cardPlayedThisTurn ? ' You already played one card; roll now.' : ' You may play one card before rolling.'}`;
  };
  let reports = null, reportIndex = 0;
  const returnToGame = () => window.focusLoungeGameplay?.();
  function showPlayerReports() {
    reports ||= document.createElement('dialog');
    reports.setAttribute('aria-label', 'Race player reports');
    reports.className = 'game-help-dialog';
    reports.replaceChildren();
    const content = document.createElement('p');
    content.tabIndex = 0;
    content.setAttribute('role', 'application');
    const close = document.createElement('button');
    close.textContent = 'Return to race';
    close.onclick = () => { reports.close(); returnToGame(); };
    reportIndex = 0;
    const read = details => {
      const player = game.players[reportIndex];
      content.textContent = `${details ? report(player) : player.name} Player ${reportIndex + 1} of ${game.players.length}. Up and Down choose a player. Enter reads details. Escape returns.`;
      speak(content.textContent);
    };
    content.onkeydown = event => {
      if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(event.key)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (event.key === 'Escape') { reports.close(); returnToGame(); return; }
      if (event.key !== 'Enter') reportIndex = (reportIndex + (event.key === 'ArrowUp' ? -1 : 1) + game.players.length) % game.players.length;
      read(event.key === 'Enter');
    };
    reports.oncancel = () => requestAnimationFrame(returnToGame);
    reports.append(content, close);
    document.body.append(reports);
    reports.showModal(); content.focus(); read(false);
  }
  document.addEventListener('keydown', event => {
    if (!window.LoungeAccessibility?.accessibleMode || game?.status !== 'playing' || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('dialog, input, textarea, select, [contenteditable="true"]')) return;
    if (game.pendingMiniGame || (duckRace ? targetingCard || targetingSquareCard : pendingCard)) return;
    const key = event.key.toLowerCase();
    if (!['arrowup', 'arrowdown', 'enter', 'd', 'i', 'o', 't', 's'].includes(key)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (key === 'i') return speak(report(game.players.find(p => p.id === playerId)));
    if (key === 'o') return showPlayerReports();
    if (key === 't') return speak(`${game.players.find(p => p.id === game.turnPlayerId)?.name || 'No player'} has the turn.`);
    if (key === 's') {
      const ordered = [...game.players].sort((a, b) => b.completedLaps - a.completedLaps || (duckRace ? b.square - a.square : b.position - a.position));
      return speak(ordered.map((p, index) => `${index + 1}. ${report(p)}`).join(' '));
    }
    if (key === 'd') return speak(describeSelection());
    if (key === 'enter') return duckRace ? activateSelectedCard() : playSelected();
    // Cards precede Roll Dice. Roll stays the initial selection on a new turn.
    const count = hand().length + 1, current = selection() === -1 ? count - 1 : selection();
    const next = (current + (key === 'arrowup' ? -1 : 1) + count) % count;
    select(next === count - 1 ? -1 : next);
    returnToGame();
    speak(selection() === -1 ? describeSelection() : `${hand()[selection()]}. Card ${selection() + 1} of ${hand().length}. Press D for details, Enter to play.`);
  }, true);
})();
