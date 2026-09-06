'use strict';

const socket = io();
const gameId = new URLSearchParams(location.search).get('game') || sessionStorage.getItem('loungeGameId');
const token = sessionStorage.getItem('loungeSessionToken');
const username = sessionStorage.getItem('loungeUsername');
const elements = Object.fromEntries(['connection','announcement','start','token-picker','token-dialog','token-options','token-save','token-cancel','roll','balance','properties','room-state','trade','trade-form','trade-player','trade-property','trade-amount','house-property','buy-house','sell-house','house-status','offer-panel','offer-title','offer-details','buy','decline','free-parking-status','turn-status','players','owned-summary','owned-properties','edition','board','game-announcer','polite-announcer'].map(id => [id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), document.getElementById(id)]));
let room = null; let game = null; let playerId = null; let boardIndex = 0; let lastSequence = 0; let themedEdition = null; let lastOfferKey = null; let gameplayStarted = false;
const accessibility = window.LoungeAccessibility?.createGameStateController({
  mode: 'GAME',
  statusEl: elements.politeAnnouncer,
  items: [
    { label: 'Roll Dice', type: 'game' },
    { label: 'Check Balance', type: 'game' },
    { label: 'Hear Properties and Monopolies', type: 'game' },
    { label: 'Hear Room State and Other Players', type: 'game' },
    { label: 'Help / Instructions', type: 'help' }
  ],
  hotkeys: { scores: ['s'], players: [], help: ['?'] },
  helpText: 'Keyboard shortcuts: Arrow keys explore the board. Enter rolls. F reports your balance. P reports owned properties, completed monopolies, and building progress. B buys a house or hotel and X sells a house or hotel on the selected property. H reports room state and all players\' monopolies. Y and N answer offers. Press S for all player balances.'
});

function announcePolite(message) { elements.politeAnnouncer.textContent = ''; requestAnimationFrame(() => { elements.politeAnnouncer.textContent = message; }); }
function announceGameplay(message) { elements.gameAnnouncer.textContent = ''; requestAnimationFrame(() => { elements.gameAnnouncer.textContent = message; }); }
function me() { return game?.players.find(player => player.id === playerId); }
function playerToken(player) { return player?.token || player?.monopolyToken || null; }
function money(amount) { return MonopolyBoards.formatMoney(game?.edition || 'Classic', amount); }
function ownerName(index) { const id = game?.owners[index]; return id ? game.players.find(player => player.id === id)?.name || 'Unknown player' : 'Unowned'; }
function formatBuilding(count) {
  if (count === 5) return '1 Hotel';
  if (count > 0) return `${count} house${count === 1 ? '' : 's'}`;
  return 'no houses';
}
function spaceDetails(space) {
  const ownerId = game?.owners[space.index];
  const rent = ownerId ? MonopolyBoards.rentFor(game.board, game.owners, space, ownerId, game.houses) : (space.rent || 0);
  const cost = space.price ? money(space.price) : 'Not purchasable';
  const group = space.group ? space.group.replace('-', ' ') : 'No color group';
  const occupants = game?.players.filter(player => player.position === space.index).map(player => `${player.name}, ${playerToken(player)?.name || 'token not selected'}`) || [];
  const jackpot = space.type === 'Free Parking' && game?.freeParkingJackpot ? ` Current jackpot: ${money(game.freeParkingPot || 0)}.` : '';
  const houses = game?.houses?.[space.index] || 0;
  const buildingStatus = houses === 5 ? '1 Hotel' : houses > 0 ? `${houses} house${houses === 1 ? '' : 's'}` : 'No houses';
  return `Type: ${space.type}. ${space.description}${jackpot} Purchase cost: ${cost}. Color group: ${group}. Current owner: ${ownerName(space.index)}. Buildings: ${buildingStatus}. Current rent: ${money(rent)}.${occupants.length ? ` Players here: ${occupants.join(', ')}.` : ''}`;
}
function spaceLabel(space) { return `${space.name}. ${spaceDetails(space)}`; }
function groupLabel(group) { return group.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()); }
function myOwnershipProgress() { return game ? MonopolyBoards.ownershipProgress(game.board, game.owners, playerId) : []; }
function ownershipReport() {
  const progress = myOwnershipProgress();
  if (!progress.length) return 'You do not own any properties.';
  const completedMonopolies = progress.filter(group => group.complete);
  const totalProperties = progress.flatMap(group => group.properties).length;
  let summary = `You own ${totalProperties} property${totalProperties === 1 ? '' : 's'} across ${progress.length} color group${progress.length === 1 ? '' : 's'}.`;
  if (completedMonopolies.length) {
    summary += ` Completed monopolies: ${completedMonopolies.map(group => groupLabel(group.group)).join(', ')}.`;
  }
  const groupDetails = progress.map(group => {
    const isSpecialGroup = ['transit', 'utility'].includes(group.group);
    const memberSpaces = game.board.filter(space => space.group === group.group && game.owners[space.index] === playerId);
    const propDetails = memberSpaces.map(space => {
      const bCount = game.houses?.[space.index] || 0;
      const rent = MonopolyBoards.rentFor(game.board, game.owners, space, playerId, game.houses);
      const bInfo = !isSpecialGroup && group.complete ? `, ${formatBuilding(bCount)}` : '';
      return `${space.name}${bInfo} (rent ${money(rent)})`;
    }).join('; ');
    if (group.complete) {
      const cost = !isSpecialGroup ? MonopolyBoards.buildingCost(game.board, memberSpaces[0]) : 0;
      const buildInfo = !isSpecialGroup ? ` Monopoly complete! Building cost: ${money(cost)} per house/hotel. Press B to buy houses or hotels.` : ' Full set complete!';
      return `${groupLabel(group.group)}: ${propDetails}.${buildInfo}`;
    }
    return `${groupLabel(group.group)}: ${propDetails}. ${group.owned} of ${group.total}; need ${group.needed} more to complete monopoly.`;
  }).join(' ');
  return `${summary} ${groupDetails}`;
}
function roomStateReport() {
  if (!game) return 'Room state unavailable.';
  const jackpotText = game.freeParkingJackpot ? `Free Parking jackpot is ${money(game.freeParkingPot || 0)}. ` : 'Free Parking jackpot is off. ';
  const playersText = game.players.map(player => {
    const pProgress = MonopolyBoards.ownershipProgress(game.board, game.owners, player.id);
    const pMonopolies = pProgress.filter(g => g.complete).map(g => groupLabel(g.group));
    const pPropCount = pProgress.flatMap(g => g.properties).length;
    const monopolySummary = pMonopolies.length ? ` (holds ${pMonopolies.join(', ')} monopol${pMonopolies.length === 1 ? 'y' : 'ies'})` : '';
    return `${player.name} is using ${playerToken(player)?.name || 'no token'}, has ${money(player.balance)}, on space ${player.position + 1}, owns ${pPropCount} propert${pPropCount === 1 ? 'y' : 'ies'}${monopolySummary}${player.id === game.turnPlayerId ? ', with the current turn' : ''}`;
  }).join('. ');
  return `Current room state. ${jackpotText}${playersText}.`;
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
  elements.players.replaceChildren(...game.players.map(player => { const li=document.createElement('li'),token=playerToken(player);const icon=document.createElement('span');icon.className='token-icon';icon.setAttribute('aria-hidden','true');icon.textContent=token?.icon||'○';const details=document.createElement('span');details.textContent=`${player.name}, ${token?.name||'token not selected'}: ${money(player.balance)}, space ${player.position + 1}${player.inJail?`, in Jail${player.jailTurns?`, ${player.jailTurns} failed attempt${player.jailTurns===1?'':'s'}`:''}`:''}${player.id===game.turnPlayerId?' (current turn)':''}`;li.setAttribute('aria-label',details.textContent);li.append(icon,details);return li; }));
  elements.tradePlayer.replaceChildren(...game.players.filter(player=>player.id!==playerId).map(player=>new Option(player.name,player.id)));
  elements.tradeProperty.replaceChildren(...game.board.filter(space=>game.owners[space.index]===playerId).map(space=>new Option(space.name,String(space.index))));
  elements.trade.disabled = game.status !== 'playing' || elements.tradeProperty.options.length === 0 || Boolean(game.pendingTrade);
  const ownership = myOwnershipProgress();
  const buildable = ownership.filter(group => group.complete && !['transit','utility'].includes(group.group)).flatMap(group => game.board.filter(space => space.type === 'Property' && space.group === group.group));
  const selectedHouseProperty = elements.houseProperty.value;
  elements.houseProperty.replaceChildren(...buildable.map(space => {
    const c = game.houses?.[space.index] || 0;
    const rent = MonopolyBoards.rentFor(game.board, game.owners, space, playerId, game.houses);
    return new Option(`${space.name} — ${formatBuilding(c)} (rent ${money(rent)})`, String(space.index));
  }));
  if (buildable.some(space => String(space.index) === selectedHouseProperty)) elements.houseProperty.value = selectedHouseProperty;
  const houseSpace = game.board[Number(elements.houseProperty.value)], houseCount = houseSpace ? (game.houses?.[houseSpace.index] || 0) : 0;
  const houseCost = houseSpace ? MonopolyBoards.buildingCost(game.board, houseSpace) : 0;
  elements.buyHouse.disabled = game.status !== 'playing' || !buildable.length || houseCount >= 5 || pending;
  elements.sellHouse.disabled = game.status !== 'playing' || !buildable.length || houseCount < 1 || pending;
  elements.buyHouse.textContent = houseCount === 4 ? 'Buy Hotel (B)' : 'Buy House (B)';
  elements.sellHouse.textContent = houseCount === 5 ? 'Sell Hotel (X)' : 'Sell House (X)';
  if (houseSpace) {
    if (houseCount === 5) {
      elements.houseStatus.textContent = `${houseSpace.name} has a Hotel (rent ${money(MonopolyBoards.rentFor(game.board, game.owners, houseSpace, playerId, game.houses))}). Selling returns ${money(Math.floor(houseCost / 2))} and reverts to 4 houses.`;
    } else if (houseCount === 4) {
      elements.houseStatus.textContent = `${houseSpace.name} has 4 houses. Upgrading to a Hotel costs ${money(houseCost)}. Selling returns ${money(Math.floor(houseCost / 2))}.`;
    } else {
      elements.houseStatus.textContent = `${houseSpace.name} has ${houseCount} house${houseCount === 1 ? '' : 's'}. Each house costs ${money(houseCost)}; selling returns ${money(Math.floor(houseCost / 2))}.`;
    }
  } else {
    elements.houseStatus.textContent = buildable.length ? 'Select a property in your completed monopoly to build.' : 'Complete a color group (monopoly) to buy houses and hotels.';
  }
  const completedCount = ownership.filter(g => g.complete).length;
  elements.ownedSummary.textContent = ownership.length
    ? `You own ${ownership.flatMap(group => group.properties).length} properties in ${ownership.length} color groups.${completedCount ? ` ${completedCount} complete monopoly${completedCount === 1 ? '' : 'ies'} ready to build!` : ''}`
    : 'You do not own any properties yet.';
  elements.ownedProperties.replaceChildren(...ownership.map(group => {
    const item=document.createElement('li'),heading=document.createElement('strong'),properties=document.createElement('span'),progress=document.createElement('span');
    const isSpecial = ['transit','utility'].includes(group.group);
    const memberSpaces = game.board.filter(space => space.group === group.group && game.owners[space.index] === playerId);
    heading.textContent=`${groupLabel(group.group)} group${group.complete ? ' — MONOPOLY COMPLETE' : ''}`;
    const propDetails = memberSpaces.map(space => {
      const c = game.houses?.[space.index] || 0;
      const rent = MonopolyBoards.rentFor(game.board, game.owners, space, playerId, game.houses);
      const bInfo = !isSpecial && group.complete ? ` [${formatBuilding(c)}, rent ${money(rent)}]` : ` [rent ${money(rent)}]`;
      return `${space.name}${bInfo}`;
    }).join(', ');
    properties.textContent=`Properties: ${propDetails}. `;
    const cost = (!isSpecial && group.complete) ? MonopolyBoards.buildingCost(game.board, memberSpaces[0]) : 0;
    progress.textContent=`${group.owned} of ${group.total}. ${group.complete ? (isSpecial ? 'Complete set.' : `Monopoly complete! Building cost: ${money(cost)} per house/hotel.`) : `Need ${group.needed} more to complete monopoly.`}`;
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
function changeHouse(action) { const spaceIndex=Number(elements.houseProperty.value); socket.emit('monopoly-house',{spaceIndex,action},result=>{if(!result.ok)announcePolite(result.error);}); }
elements.buyHouse.addEventListener('click',()=>changeHouse('buy')); elements.sellHouse.addEventListener('click',()=>changeHouse('sell'));
elements.houseProperty.addEventListener('change',render);
elements.balance.addEventListener('click', () => announcePolite(`Your ${game?.edition === 'Electronic Banking' ? 'banking balance' : 'balance'} is ${money(me()?.balance ?? 0)}.`));
elements.properties.addEventListener('click', () => announcePolite(ownershipReport()));
elements.roomState.addEventListener('click', () => announcePolite(roomStateReport()));
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
  if (key==='b' && !elements.buyHouse.disabled && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); elements.buyHouse.click(); }
  if (key==='x' && !elements.sellHouse.disabled && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); elements.sellHouse.click(); }
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
