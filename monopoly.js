'use strict';

const socket = io();
const gameId = new URLSearchParams(location.search).get('game') || sessionStorage.getItem('loungeGameId');
const token = sessionStorage.getItem('loungeSessionToken');
const username = sessionStorage.getItem('loungeUsername');
const elements = Object.fromEntries(['connection','announcement','start','token-picker','token-dialog','token-options','token-save','token-cancel','roll','balance','properties','room-state','trade','trade-form','trade-player','trade-property','trade-amount','offer-panel','offer-title','offer-details','buy','decline','free-parking-status','turn-status','players','owned-summary','owned-properties','edition','board','game-announcer','polite-announcer'].map(id => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), document.getElementById(id)]));
let room = null; let game = null; let playerId = null; let boardIndex = 0; let lastSequence = 0; let themedEdition = null; let lastOfferKey = null; let gameplayStarted = false;
const accessibility = window.LoungeAccessibility?.createGameStateController({
  mode: 'GAME',
  statusEl: elements.politeAnnouncer,
  items: [
    { label: 'Roll Dice', type: 'game' },
    { label: 'Check Balance', type: 'game' },
    { label: 'Hear Properties', type: 'game' },
    { label: 'Hear Room State', type: 'game' },
    { label: 'Help / Instructions', type: 'help' }
  ],
  hotkeys: { scores: ['s'], players: [], help: ['?'] },
  helpText: 'Keyboard shortcuts: Arrow keys explore the board. Enter rolls. F reports your balance. P reports owned properties and color-set progress. H reports room state. Y and N answer offers. Press S for all player balances.'
});

function announcePolite(message) { elements.politeAnnouncer.textContent = ''; requestAnimationFrame(() => { elements.politeAnnouncer.textContent = message; }); }
function announceGameplay(message) { elements.gameAnnouncer.textContent = ''; requestAnimationFrame(() => { elements.gameAnnouncer.textContent = message; }); }
function me() { return game?.players.find(player => player.id === playerId); }
function playerToken(player) { return player?.token || player?.monopolyToken || null; }
function money(amount) { return MonopolyBoards.formatMoney(game?.edition || 'Classic', amount); }
function ownerName(index) { const id = game?.owners[index]; return id ? game.players.find(player => player.id === id)?.name || 'Unknown player' : 'Unowned'; }
function spaceDetails(space) {
  const ownerId = game?.owners[space.index];
  const rent = ownerId ? MonopolyBoards.rentFor(game.board, game.owners, space, ownerId) : (space.rent || 0);
  const cost = space.price ? money(space.price) : 'Not purchasable';
  const group = space.group ? space.group.replace('-', ' ') : 'No color group';
  const occupants = game?.players.filter(player => player.position === space.index).map(player => `${player.name}, ${playerToken(player)?.name || 'token not selected'}`) || [];
  const jackpot = space.type === 'Free Parking' && game?.freeParkingJackpot ? ` Current jackpot: ${money(game.freeParkingPot || 0)}.` : '';
  return `Type: ${space.type}. ${space.description}${jackpot} Purchase cost: ${cost}. Color group: ${group}. Current owner: ${ownerName(space.index)}. Current rent: ${money(rent)}.${occupants.length ? ` Players here: ${occupants.join(', ')}.` : ''}`;
}
function spaceLabel(space) { return `${space.name}. ${spaceDetails(space)}`; }
function groupLabel(group) { return group.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function myOwnershipProgress() { return game ? MonopolyBoards.ownershipProgress(game.board, game.owners, playerId) : []; }
function ownershipReport() {
  const progress = myOwnershipProgress();
  if (!progress.length) return 'You do not own any properties.';
  return `You own ${progress.flatMap(group => group.properties).length} properties. ${progress.map(group => `${groupLabel(group.group)}: ${group.properties.join(', ')}. ${group.owned} of ${group.total}; ${group.complete ? 'color set complete' : `need ${group.needed} more to complete this set`}.`).join(' ')}`;
}
function syncAccessibilityState() {
  if (!accessibility || !game) return;
  accessibility.setPlayers((game.players || []).map(player => player.name));
  accessibility.setScores(Object.fromEntries((game.players || []).map(player => [player.name, money(player.balance)])));
}

function applyEditionTheme(edition) {
  if (!edition || themedEdition === edition) return;
  themedEdition = edition;
  const palettes = [
    { bg:'#020b14',panel:'#10253b',accent:'#ffd84d',focus:'#62e6ff',property:'#f7fbff',special:'#fff0ad',ink:'#04101c',border:'#c6e7ff',owned:'#1769ff',line:'#62e6ff20' },
    { bg:'#10051a',panel:'#321348',accent:'#ffdf52',focus:'#7fffd4',property:'#fff8ff',special:'#ffe8a3',ink:'#16051d',border:'#f2d4ff',owned:'#b218d1',line:'#ff8cf020' },
    { bg:'#061307',panel:'#17371a',accent:'#ffe566',focus:'#73e8ff',property:'#f7fff4',special:'#fff0b5',ink:'#061307',border:'#d5f8d0',owned:'#007cba',line:'#a8ff9a20' },
    { bg:'#170600',panel:'#3c190c',accent:'#fff06a',focus:'#75e9ff',property:'#fffaf1',special:'#ffe2a3',ink:'#190700',border:'#ffe0c2',owned:'#d1287a',line:'#ffb36b22' },
    { bg:'#070707',panel:'#232323',accent:'#ffe600',focus:'#55ddff',property:'#fff',special:'#fff2a8',ink:'#050505',border:'#fff',owned:'#005fcc',line:'#ffffff18' }
  ];
  let hash = 0; for (const character of edition) hash = ((hash * 31) + character.codePointAt(0)) >>> 0;
  const palette = palettes[hash % palettes.length];
  const root = document.documentElement;
  Object.entries({ '--bg':palette.bg,'--panel':palette.panel,'--gold':palette.accent,'--focus':palette.focus,'--property':palette.property,'--special':palette.special,'--ink':palette.ink,'--border':palette.border,'--owned':palette.owned,'--grid-line':palette.line,'--grid-size':`${1.6 + (hash % 5) * .2}rem` }).forEach(([name,value]) => root.style.setProperty(name,value));
  const profile = MonopolyBoards.audioProfiles[edition] || 'standard';
  const monoProfiles = ['electronic','pacman','atari','nineties','eighties','cinematic-blockbusters'];
  const serifProfiles = ['classic-tv','vintage-tv','country','north-carolina','godfather','horse'];
  root.style.setProperty('--theme-font', monoProfiles.includes(profile) ? 'Consolas, monospace' : serifProfiles.includes(profile) ? 'Georgia, serif' : 'system-ui, sans-serif');
  document.body.dataset.edition = edition.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  document.body.dataset.audioTheme = profile;
}
function renderBoard() {
  if (!game) return;
  elements.board.replaceChildren(...game.board.map(space => {
    const item = document.createElement('li'); item.className = `space ${space.price ? '' : 'special'} ${game.owners[space.index] ? 'owned' : ''}`;
    const descriptionId = `space-description-${space.index}`;
    item.tabIndex = space.index === boardIndex ? 0 : -1; item.dataset.index = space.index; item.setAttribute('role', 'gridcell'); item.setAttribute('aria-rowindex', String(Math.floor(space.index / 10) + 1)); item.setAttribute('aria-colindex', String((space.index % 10) + 1)); item.setAttribute('aria-label', space.name); item.setAttribute('aria-describedby', descriptionId);
    const people = game.players.filter(player => player.position === space.index).map(player => `${playerToken(player)?.icon || ''} ${player.name}`.trim());
    item.innerHTML = `<span class="number">${space.index + 1}</span><span>${space.name}</span>${space.price ? `<span>${money(space.price)}</span>` : ''}`;
    const description = document.createElement('span'); description.id = descriptionId; description.className = 'sr-only'; description.textContent = spaceDetails(space); item.append(description);
    if (people.length) { const occupants = document.createElement('span'); occupants.className = 'occupants'; occupants.textContent = `Here: ${people.join(', ')}`; item.append(occupants); }
    item.addEventListener('focus', () => { boardIndex = space.index; announcePolite(spaceLabel(space)); }); return item;
  }));
}
function render() {
  if (!game) return;
  applyEditionTheme(game.edition);
  elements.edition.textContent = `${game.edition} edition`;
  elements.announcement.textContent = game.announcement;
  const mine = me(); const myTurn = game.turnPlayerId === playerId; const purchase = game.pendingPurchase?.playerId === playerId ? game.pendingPurchase : null; const incomingTrade = game.pendingTrade?.toId === playerId ? game.pendingTrade : null; const pending = Boolean(purchase || incomingTrade);
  elements.roll.disabled = game.status !== 'playing' || !myTurn || pending;
  elements.offerPanel.hidden = !pending;
  elements.buy.textContent = incomingTrade ? 'Accept Trade (Y)' : 'Buy Property (Y)';
  elements.decline.textContent = incomingTrade ? 'Decline Trade (N)' : 'Decline Property (N)';
  if (purchase) {
    const space=game.board[purchase.spaceIndex],group=groupLabel(space.group);
    elements.offerTitle.textContent='Property purchase decision';
    elements.offerDetails.textContent=`${space.name}. ${group} group. Price ${money(space.price)}. Your balance is ${money(mine?.balance||0)}.`;
  } else if (incomingTrade) {
    const space=game.board[incomingTrade.propertyIndex],seller=game.players.find(player=>player.id===incomingTrade.fromId);
    elements.offerTitle.textContent='Property trade decision';
    elements.offerDetails.textContent=`${seller?.name||'Another player'} offers ${space?.name||'a property'} for ${money(incomingTrade.amount)}.`;
  }
  const offerKey=purchase?`purchase-${purchase.spaceIndex}-${game.sequence}`:incomingTrade?`trade-${incomingTrade.fromId}-${incomingTrade.propertyIndex}-${game.sequence}`:null;
  if(offerKey&&offerKey!==lastOfferKey){lastOfferKey=offerKey;requestAnimationFrame(()=>elements.buy.focus());}
  if(!offerKey)lastOfferKey=null;
  elements.start.hidden = game.status !== 'waiting' || room?.hostId !== playerId;
  elements.freeParkingStatus.textContent = game.freeParkingJackpot ? `Free Parking jackpot: ${money(game.freeParkingPot || 0)}. Taxes and negative Chance or Community Chest payments go into the pot.` : 'Free Parking jackpot is off.';
  elements.tokenPicker.hidden = game.status !== 'waiting';
  const winner = game.players.find(player => player.id === game.winnerId);
  elements.turnStatus.textContent = game.status === 'finished' ? (winner ? `${winner.name} won Monopoly.` : 'Monopoly has ended.') : game.status === 'waiting' ? 'Waiting for the room creator to start.' : myTurn ? (purchase ? 'Property purchase decision required. Press Y to buy or N to decline.' : incomingTrade ? 'Trade decision required. Press Y to accept or N to decline.' : 'It is your turn. Press Enter to roll.') : `Waiting for ${game.players.find(player => player.id === game.turnPlayerId)?.name}.`;
  elements.players.replaceChildren(...game.players.map(player => { const li=document.createElement('li'),token=playerToken(player);const icon=document.createElement('span');icon.className='token-icon';icon.setAttribute('aria-hidden','true');icon.textContent=token?.icon||'○';const details=document.createElement('span');details.textContent=`${player.name}, ${token?.name||'token not selected'}: ${money(player.balance)}, space ${player.position + 1}${player.id===game.turnPlayerId?' (current turn)':''}`;li.setAttribute('aria-label',details.textContent);li.append(icon,details);return li; }));
  elements.tradePlayer.replaceChildren(...game.players.filter(player=>player.id!==playerId).map(player=>new Option(player.name,player.id)));
  elements.tradeProperty.replaceChildren(...game.board.filter(space=>game.owners[space.index]===playerId).map(space=>new Option(space.name,String(space.index))));
  elements.trade.disabled = game.status !== 'playing' || elements.tradeProperty.options.length === 0 || Boolean(game.pendingTrade);
  const ownership = myOwnershipProgress();
  elements.ownedSummary.textContent = ownership.length ? `You own ${ownership.flatMap(group => group.properties).length} properties in ${ownership.length} color groups.` : 'You do not own any properties yet.';
  elements.ownedProperties.replaceChildren(...ownership.map(group => {
    const item=document.createElement('li'),heading=document.createElement('strong'),properties=document.createElement('span'),progress=document.createElement('span');
    heading.textContent=`${groupLabel(group.group)} group`;
    properties.textContent=`Properties: ${group.properties.join(', ')}. `;
    progress.textContent=`${group.owned} of ${group.total}. ${group.complete ? 'Set complete.' : `Need ${group.needed} more to complete this set.`}`;
    item.append(heading,properties,progress); return item;
  }));
  renderBoard(); if (mine && game.sequence !== lastSequence) lastSequence = game.sequence;
  syncAccessibilityState();
}
function renderTokenChoices(openWhenMissing=false) {
  if (!room || !playerId) return;
  const choices=MonopolyBoards.tokens[room.monopolyEdition]||[];const current=room.players.find(player=>player.id===playerId)?.monopolyToken||playerToken(me());const taken=new Map(room.players.filter(player=>player.id!==playerId&&player.monopolyToken).map(player=>[player.monopolyToken.id,player.name]));
  elements.tokenOptions.replaceChildren(...choices.map(token=>{const option=new Option(`${token.name}${taken.has(token.id)?` (selected by ${taken.get(token.id)})`:''}`,token.id);option.disabled=taken.has(token.id);return option}));
  const selectedAvailable=choices.find(token=>token.id===current?.id&&!taken.has(token.id))||choices.find(token=>!taken.has(token.id));if(selectedAvailable)elements.tokenOptions.value=selectedAvailable.id;
  elements.tokenSave.disabled=!selectedAvailable;
  if(openWhenMissing&&!current&&!elements.tokenDialog.open){elements.tokenDialog.showModal();requestAnimationFrame(()=>elements.tokenOptions.focus())}
}
function syncWaitingRoom(updated) {
  room = updated;
  if (!game || game.status === 'waiting') {
    game = game?.status === 'waiting'
      ? { ...game, players: room.players.map(player => ({ ...player, token: player.monopolyToken, balance: 1500, position: 0 })) }
      : { edition: room.monopolyEdition, board: MonopolyBoards.boards[room.monopolyEdition], freeParkingJackpot: room.freeParkingJackpot !== false, freeParkingPot: 0, status: 'waiting', players: room.players.map(player => ({ ...player, token: player.monopolyToken, balance: 1500, position: 0 })), owners: {}, announcement: `Waiting to start ${room.monopolyEdition} Monopoly.`, sequence: 0 };
    render();
    renderTokenChoices();
  }
}
function receiveState(payload) {
  const isNewGameplayUpdate = payload.game.sequence !== lastSequence;
  game = payload.game;
  if(game.status==='playing'&&!gameplayStarted){gameplayStarted=true;window.dispatchEvent(new CustomEvent('lounge-gameplay-started'));}
  if (payload.cue?.type === 'dice') window.playDiceRoll?.();
  const cue = payload.cue?.secondary || payload.cue;
  if (cue?.type === 'transaction') window.playMonopolyEditionCue?.(payload.cue?.edition || game.edition, 'transaction');
  if (cue?.type === 'jail') window.playJailSlam?.();
  if (cue?.type === 'purchase') window.playMonopolyEditionCue?.(payload.cue?.edition || game.edition, cue.completeGroup ? 'group' : 'purchase');
  render();
  if (isNewGameplayUpdate && game.announcement) announceGameplay(game.announcement);
}
function connectToGame() {
  if (!token || !gameId) { elements.connection.textContent = 'Missing login or room. Return to the lobby.'; return; }
  socket.emit('authenticate-token', { token }, auth => {
    if (!auth.ok) { elements.connection.textContent = auth.error; return; }
    socket.emit('join-game', { gameId }, result => {
      if (!result.ok) { elements.connection.textContent = result.error; return; }
      room = result.room; playerId = room.players.find(player => player.name === username)?.id || room.players.find(player => player.name === auth.username)?.id;
      game = room.monopoly || { edition: room.monopolyEdition, board: MonopolyBoards.boards[room.monopolyEdition], freeParkingJackpot: room.freeParkingJackpot !== false, freeParkingPot: 0, status:'waiting', players:room.players.map(player => ({...player,balance:1500,position:0})), owners:{}, announcement:`Waiting to start ${room.monopolyEdition} Monopoly.`, sequence:0 };
      elements.connection.textContent = `Connected to room ${room.code}.`; render(); renderTokenChoices();
    });
  });
}
elements.start.addEventListener('click', () => socket.emit('start-monopoly', {}, result => { if (!result.ok) announcePolite(result.error); }));
elements.roll.addEventListener('click', () => socket.emit('monopoly-roll', {}, result => { if (!result.ok) announcePolite(result.error); }));
function answerOffer(accept) { const event=game?.pendingTrade?.toId===playerId?'monopoly-trade-response':'monopoly-purchase-response';elements.buy.disabled=true;elements.decline.disabled=true;announcePolite(accept?'Accepting offer.':'Declining offer.');socket.emit(event, { accept }, result => {elements.buy.disabled=false;elements.decline.disabled=false;if (!result.ok) announcePolite(result.error);}); }
elements.buy.addEventListener('click', () => answerOffer(true)); elements.decline.addEventListener('click', () => answerOffer(false));
elements.trade.addEventListener('click',()=>{elements.tradeForm.hidden=!elements.tradeForm.hidden;if(!elements.tradeForm.hidden)elements.tradePlayer.focus();});
elements.tradeForm.addEventListener('submit',event=>{event.preventDefault();socket.emit('monopoly-trade-offer',{toId:elements.tradePlayer.value,propertyIndex:Number(elements.tradeProperty.value),amount:Number(elements.tradeAmount.value)},result=>{if(result.ok)elements.tradeForm.hidden=true;else announcePolite(result.error);});});
elements.balance.addEventListener('click', () => announcePolite(`Your ${game?.edition === 'Electronic Banking' ? 'banking balance' : 'balance'} is ${money(me()?.balance ?? 0)}.`));
elements.properties.addEventListener('click', () => announcePolite(ownershipReport()));
elements.roomState.addEventListener('click',()=>announcePolite(`Current room state. ${game?.freeParkingJackpot ? `Free Parking jackpot is ${money(game.freeParkingPot || 0)}. ` : 'Free Parking jackpot is off. '}${game?.players.map(player=>`${player.name} is using ${playerToken(player)?.name||'no token'}, has ${money(player.balance)}, and is on space ${player.position+1}${player.id===game.turnPlayerId?', with the current turn':''}`).join('. ')}.`));
elements.tokenPicker.addEventListener('click',()=>{renderTokenChoices();elements.tokenDialog.showModal();requestAnimationFrame(()=>elements.tokenOptions.focus())});
elements.tokenSave.addEventListener('click',()=>{const tokenId=elements.tokenOptions.value;if(!tokenId)return announcePolite('No token is available.');socket.emit('monopoly-select-token',{tokenId},result=>{if(!result.ok)return announcePolite(result.error);announcePolite(`${result.message} Saved for this game.`);elements.tokenDialog.close();elements.tokenPicker.focus()})});
elements.tokenCancel.addEventListener('click',()=>{elements.tokenDialog.close();elements.tokenPicker.focus()});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (accessibility?.handleKey(event)) return;
  const key=event.key.toLowerCase(); const onBoard=elements.board.contains(document.activeElement);
  if (event.key === 'Enter' && game?.status === 'waiting' && room?.hostId === playerId && !['BUTTON','A','INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName || '')) { event.preventDefault(); elements.start.click(); return; }
  if (onBoard && ['arrowleft','arrowup','arrowright','arrowdown'].includes(key)) { event.preventDefault(); const delta={arrowleft:-1,arrowright:1,arrowup:-10,arrowdown:10}[key]; boardIndex=(boardIndex+delta+40)%40; elements.board.querySelectorAll('.space').forEach((space,index)=>space.tabIndex=index===boardIndex?0:-1); elements.board.children[boardIndex].focus(); return; }
  if (event.key === 'Enter' && !elements.roll.disabled && !['BUTTON','A'].includes(document.activeElement.tagName)) { event.preventDefault(); elements.roll.click(); }
  if (key==='f') { event.preventDefault(); elements.balance.click(); } if (key==='p') { event.preventDefault(); elements.properties.click(); }
  if (key==='h') { event.preventDefault(); elements.roomState.click(); }
  if (key==='y' && !elements.offerPanel.hidden) { event.preventDefault(); answerOffer(true); } if (key==='n' && !elements.offerPanel.hidden) { event.preventDefault(); answerOffer(false); }
});
socket.on('connect', connectToGame); socket.on('lobby-updated', syncWaitingRoom); socket.on('table-player-joined', data => {
  if (!data?.message) return;
  if (!game || game.status === 'waiting') {
    game = { edition: room?.monopolyEdition, board: MonopolyBoards.boards[room?.monopolyEdition], freeParkingJackpot: room?.freeParkingJackpot !== false, freeParkingPot: 0, status: 'waiting', players: room?.players?.map(player => ({ ...player, token: player.monopolyToken, balance: 1500, position: 0 })) || [], owners: {}, announcement: `Waiting to start ${room?.monopolyEdition} Monopoly.`, sequence: 0 };
    render();
    renderTokenChoices();
  }
  announcePolite(data.message);
  elements.announcement.textContent = data.message;
  window.LoungeAccessibility?.speak?.(data.message);
}); socket.on('monopoly-state', receiveState); socket.on('disconnect',()=>{elements.connection.textContent='Connection lost. Trying to reconnect…';});
