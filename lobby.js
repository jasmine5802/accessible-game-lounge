'use strict';

const socket = io();
const UNO_GAMES = Object.freeze({ 'Classic UNO':'Classic Uno', 'UNO Flip':'Uno Flip!', DOS:'Uno Dos', "UNO Show 'Em No Mercy":"Show 'Em No Mercy", 'UNO Attack':'Uno Attack' });
const GAME_TITLES = ['Duck Race', 'Monopoly', ...Object.keys(UNO_GAMES), 'Horse Race', 'Dominoes', 'Skip-Bo', 'Mall Madness', 'The Game of Life'];
const GAME_CATEGORIES = { 'Duck Race':'ducks-race', Monopoly:'monopoly', 'Classic UNO':'uno-classic', 'UNO Flip':'uno-flip', DOS:'uno-dos', "UNO Show 'Em No Mercy":'uno-no-mercy', 'UNO Attack':'uno-attack', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness', 'The Game of Life':'life' };
const GAME_PAGES = { 'Duck Race':'ducks-race.html', Monopoly:'monopoly.html', 'Classic UNO':'uno.html', 'UNO Flip':'uno.html', DOS:'uno.html', "UNO Show 'Em No Mercy":'uno.html', 'UNO Attack':'uno.html', 'Horse Race':'horserace.html', Dominoes:'dominoes.html', 'Skip-Bo':'skipbo.html', 'Mall Madness':'mallmadness.html', 'The Game of Life':'life.html' };
const GAME_HELP = {
  'Duck Race': { how:'Race once around the 40-space pond. Roll on your turn, collect feathers, and use cards to protect yourself or slow opponents. The first duck to complete the loop wins.', keys:'Up and Down choose cards or targets. Enter rolls or confirms. C opens cards. F reports feathers. Escape returns to the previous menu.' },
  Monopoly: { how:'Move around the selected 40-space board, buy properties, collect rent, trade, and remain solvent. Choose a unique themed token before play. The last player who has not gone bankrupt wins.', keys:'Arrow Keys explore the board. Enter rolls. F reports balance. P lists properties. H reports the room. Y and N answer offers.' },
  ...Object.fromEntries(Object.keys(UNO_GAMES).map(title=>[title,{ how:'Match color, number, or symbol and empty your hand. This selection uses its own deck and special-card rules. UNO and DOS declarations are available where required.', keys:'Up and Down choose a card. Space marks a DOS combination. Enter plays or draws. C reports the center. H reads your hand. S reads scores. U declares UNO. D declares DOS.' }])),
  'Horse Race': { how:'Play movement and sabotage cards across six laps. Track terrain and lap events, and be the first horse to finish all six laps.', keys:'Up and Down choose a card. Enter plays. C describes the space and lap. S reads standings. D or Space draws.' },
  Dominoes: { how:'Play a matching tile on either open end. Draw or pass when no tile can be played. The selected set and mode control the tiles and scoring.', keys:'Left and Right choose a tile. Up and Down flip it. L or 1 plays left. R or 2 plays right. C reads ends. B reads the board. H reads your hand. D or Space draws or passes.' },
  'Skip-Bo': { how:'Play cards in order from 1 through 12 onto shared building piles. Use your hand and discard piles to empty your stock pile first.', keys:'Up and Down choose a hand card. S selects stock. 1 through 4 select discard piles. Enter or Space plays. B reads buildings. D reads discards. O reads opponents.' },
  'Mall Madness': { how:'Move around the mall, visit stores on your private shopping list, manage cash, and complete the list before the other shoppers.', keys:'S presses the electronic director. Arrow Keys move. Enter swipes or uses an ATM. L reads the shopping list. C reports position. O reads opponents.' },
  'The Game of Life': { how:'Spin and follow the branching path through careers, family events, investments, and retirement. The player with the strongest final result wins.', keys:'S or Enter spins. C describes the current tile and card. H reports player statistics. Left and Right choose a path at a fork.' }
};
const elements = Object.fromEntries(['auth-screen','auth-form','auth-status','username','password','lobby','game-menu','table-picker','tables-title','table-menu','waiting-table','waiting-title','table-summary','table-settings','waiting-players','host-instruction','status','logout'].map(id => [id.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()), document.getElementById(id)]));
let screen = 'auth';
let gameIndex = 0;
let tableIndex = 0;
let selectedGame = null;
let tables = [];
let currentRoom = null;
let myUsername = sessionStorage.getItem('loungeUsername') || '';
let audioContext;

function announce(message) {
  elements.status.textContent = '';
  requestAnimationFrame(() => { elements.status.textContent = message; });
}
function audio() { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); return audioContext; }
function tone(frequency, start, duration, gain=.12, type='square') {
  const context=audio(), oscillator=context.createOscillator(), volume=context.createGain();
  oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,start); volume.gain.setValueAtTime(gain,start); volume.gain.exponentialRampToValueAtTime(.001,start+duration);
  oscillator.connect(volume).connect(context.destination); oscillator.start(start); oscillator.stop(start+duration);
}
function clickSound(){ const now=audio().currentTime; tone(900,now,.035,.08); }
function swipeSound(){ const context=audio(),now=context.currentTime,osc=context.createOscillator(),gain=context.createGain(); osc.type='sine'; osc.frequency.setValueAtTime(280,now); osc.frequency.exponentialRampToValueAtTime(900,now+.13); gain.gain.setValueAtTime(.1,now); gain.gain.exponentialRampToValueAtTime(.001,now+.15); osc.connect(gain).connect(context.destination); osc.start(now); osc.stop(now+.15); }
function bellSound(){ const now=audio().currentTime; tone(880,now,.25,.08,'sine'); tone(1320,now+.04,.3,.06,'sine'); }
function startSound(type){ const now=audio().currentTime; if(type==='deal'){[0,.07,.14,.21].forEach((delay,index)=>tone(650-index*70,now+delay,.06,.09,'triangle'));}else{tone(392,now,.2,.12,'sawtooth');tone(523,now+.18,.45,.14,'sawtooth');} }
function menuOptions(menu){ return [...menu.querySelectorAll('[role="option"]')]; }
function selectedOption(menu,index){ return menuOptions(menu)[index]; }
function setSelection(menu,index,voice=true,moveFocus=true){
  const options=menuOptions(menu);
  options.forEach((option,i)=>option.setAttribute('aria-selected',String(i===index)));
  const option=options[index];
  if(option)menu.setAttribute('aria-activedescendant',option.id);
  if(moveFocus)menu.focus({preventScroll:false});
  if(voice&&option)announce(option.textContent);
}

function renderGames(){
  elements.gameMenu.replaceChildren(...GAME_TITLES.map((title,index)=>{const option=document.createElement('li');option.id=`game-option-${index}`;option.setAttribute('role','option');option.textContent=title;option.addEventListener('click',()=>{gameIndex=index;setSelection(elements.gameMenu,gameIndex,false);chooseGame(title);});return option;}));
  setSelection(elements.gameMenu,gameIndex,false);
}
function renderTables(){
  const options=[{create:true,label:'Create Game'},...tables.map(table=>({table,label:`Join ${table.host}'s game. ${table.playerCount} of ${table.maxPlayers} players.`}))];
  elements.tableMenu.replaceChildren(...options.map((entry,index)=>{const option=document.createElement('li');option.id=`table-option-${index}`;option.setAttribute('role','option');option.textContent=entry.label;option.addEventListener('click',()=>{tableIndex=index;setSelection(elements.tableMenu,tableIndex,false);entry.create?openSetup():joinTable(entry.table.id);});return option;}));
  tableIndex=Math.min(tableIndex,options.length-1); setSelection(elements.tableMenu,tableIndex,false);
}
function chooseGame(title){ selectedGame=title; swipeSound(); socket.emit('get-game-tables',{category:GAME_CATEGORIES[title]},result=>{if(!result.ok)return announce(result.error);tables=result.tables;tableIndex=0;elements.lobby.hidden=true;elements.tablePicker.hidden=false;elements.tablesTitle.textContent=`${title}: Create or Join a Game`;screen='tables';renderTables();announce(`${title}. ${tables.length} open game${tables.length===1?'':'s'}. Create Game selected. Use Up and Down Arrow, then Enter.`);}); }
function openSetup(){
  announce(`Creating ${selectedGame}. Game options will be offered after entering the game.`);createTable();
}
function enterGame(room){sessionStorage.setItem('loungeGameId',room.id||room.code);announce(`Entering ${selectedGame}.`);location.href=`/${GAME_PAGES[selectedGame]}?game=${encodeURIComponent(room.code||room.id)}`;}
function createTable(data={}){ swipeSound(); socket.emit('create-game',{category:GAME_CATEGORIES[selectedGame],...data},result=>{if(!result.ok)return announce(result.error);const finish=()=>enterGame(result.room);if(selectedGame==='Monopoly'&&data.tokenId){socket.emit('monopoly-select-token',{tokenId:data.tokenId},tokenResult=>{if(!tokenResult.ok)return announce(tokenResult.error);finish();});}else finish();}); }
function joinTable(id){ swipeSound(); socket.emit('join-game',{gameId:id},result=>result.ok?enterGame(result.room):announce(result.error)); }
function showWaiting(room){ currentRoom=room;sessionStorage.setItem('loungeGameId',room.id);elements.lobby.hidden=true;elements.tablePicker.hidden=true;elements.waitingTable.hidden=false;screen='waiting';updateWaiting(room);elements.waitingTable.focus({preventScroll:false}); }
function updateWaiting(room){
  currentRoom=room;
  const hostName=room.players.find(player=>player.id===room.hostId)?.name||'Host';
  elements.waitingTitle.textContent=`${room.displayGame||selectedGame} Table`;
  elements.tableSummary.textContent=`Hosted by ${hostName}. ${room.players.length} of ${room.maxPlayers} players.`;
  elements.tableSettings.textContent=[room.monopolyEdition&&`Board: ${room.monopolyEdition}`,room.unoVariant&&`Rules: ${room.unoVariant}`,room.lifeTheme&&`Board: ${room.lifeTheme}`,room.dominoSet&&`${room.dominoSet}, ${room.dominoMode}`].filter(Boolean).join('. ');
  elements.waitingPlayers.replaceChildren(...room.players.map(player=>{const li=document.createElement('li');li.textContent=`${player.name}${player.id===room.hostId?' (host)':''}${player.connected?'':' (reconnecting)'}`;return li;}));
  const amHost=room.players.find(player=>player.id===room.hostId)?.name===myUsername;
  elements.hostInstruction.textContent=amHost?'Press Enter to continue to game setup. Press Escape to leave the table.':`Waiting for ${hostName} to continue to game setup. Press Escape to leave the table.`;
}
function startTable(){ if(!currentRoom)return;const amHost=currentRoom.players.find(player=>player.id===currentRoom.hostId)?.name===myUsername;if(!amHost)return announce('Waiting for the host to start.');swipeSound();socket.emit('start-game',{},result=>{if(!result.ok){announce(result.error);tone(150,audio().currentTime,.25,.12,'sawtooth');}}); }
function enterLobby(result){ myUsername=result.username;sessionStorage.setItem('loungeUsername',myUsername);if(result.token)sessionStorage.setItem('loungeSessionToken',result.token);elements.password.value='';elements.authScreen.hidden=true;elements.lobby.hidden=false;screen='games';gameIndex=0;renderGames();announce(`Welcome, ${myUsername}. Duck Race selected. Use Up and Down Arrow to choose a game, then press Enter.`); }

elements.authForm.addEventListener('submit',event=>{event.preventDefault();const action=event.submitter?.dataset.action||'login';elements.authStatus.textContent=action==='register'?'Registering.':'Logging in.';socket.emit(action,{username:elements.username.value,password:elements.password.value},result=>{if(result.ok)enterLobby(result);else elements.authStatus.textContent=result.error;});});
function returnToGameList(){if(currentRoom)socket.emit('leave-room');sessionStorage.removeItem('loungeGameId');currentRoom=null;elements.waitingTable.hidden=true;elements.tablePicker.hidden=true;elements.lobby.hidden=false;screen='games';setSelection(elements.gameMenu,gameIndex,false);announce('Returned to the main game list.');}
elements.logout.addEventListener('click',()=>{sessionStorage.clear();socket.emit('logout',{},()=>location.reload());});
document.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    if(!['games','tables'].includes(screen))return;event.preventDefault();clickSound();const menu=screen==='games'?elements.gameMenu:elements.tableMenu,count=menuOptions(menu).length,delta=event.key==='ArrowDown'?1:-1;if(screen==='games'){gameIndex=Math.max(0,Math.min(count-1,gameIndex+delta));setSelection(menu,gameIndex);}else{tableIndex=Math.max(0,Math.min(count-1,tableIndex+delta));setSelection(menu,tableIndex);}return;
  }
  if(event.key==='Enter'){
    if(screen==='games'){event.preventDefault();chooseGame(GAME_TITLES[gameIndex]);}
    else if(screen==='tables'){event.preventDefault();selectedOption(elements.tableMenu,tableIndex)?.click();}
    else if(screen==='waiting'){event.preventDefault();startTable();}
  }
  if(event.key==='Escape'&&screen==='tables'){event.preventDefault();elements.tablePicker.hidden=true;elements.lobby.hidden=false;screen='games';setSelection(elements.gameMenu,gameIndex);}
  else if(event.key==='Escape'&&screen==='waiting'){event.preventDefault();returnToGameList();}
});
socket.on('lobby-updated',room=>{if(screen==='waiting')updateWaiting(room);});
socket.on('table-player-joined',data=>{if(screen==='waiting'){bellSound();announce(data.message);}});
socket.on('update-room-list',()=>{if(screen==='tables'&&selectedGame)socket.emit('get-game-tables',{category:GAME_CATEGORIES[selectedGame]},result=>{if(result.ok){tables=result.tables;renderTables();}});});
socket.on('game-started',data=>{startSound(data.cue);announce(data.message);setTimeout(()=>{location.href=data.destination;},350);});
socket.on('connect',()=>{socket.emit('get-active-rooms');const token=sessionStorage.getItem('loungeSessionToken');if(!token){elements.username.focus();return;}socket.emit('authenticate-token',{token},result=>result.ok?enterLobby(result):(sessionStorage.clear(),elements.username.focus()));});
socket.on('disconnect',()=>announce('Connection lost. Trying to reconnect.'));
