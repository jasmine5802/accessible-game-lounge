'use strict';

const socket = io("https://accessible-game-lounge.onrender.com");
const GAME_TITLES = ['Monopoly', 'Uno Flip', 'Horse Race', 'Dominoes', 'Skip-Bo', 'Mall Madness'];
const GAME_CATEGORIES = { Monopoly:'monopoly', 'Uno Flip':'uno-flip', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness' };
const elements = Object.fromEntries(['auth-screen','auth-form','auth-status','username','password','lobby','game-menu','table-picker','tables-title','table-menu','waiting-table','table-summary','waiting-players','host-instruction','leave-table','status','logout'].map(id => [id.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()), document.getElementById(id)]));
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
  elements.tableMenu.replaceChildren(...options.map((entry,index)=>{const option=document.createElement('li');option.id=`table-option-${index}`;option.setAttribute('role','option');option.textContent=entry.label;option.addEventListener('click',()=>{tableIndex=index;setSelection(elements.tableMenu,tableIndex,false);entry.create?createTable():joinTable(entry.table.id);});return option;}));
  tableIndex=Math.min(tableIndex,options.length-1); setSelection(elements.tableMenu,tableIndex,false);
}
function chooseGame(title){ selectedGame=title; swipeSound(); socket.emit('get-game-tables',{category:GAME_CATEGORIES[title]},result=>{if(!result.ok)return announce(result.error);tables=result.tables;tableIndex=0;elements.lobby.hidden=true;elements.tablePicker.hidden=false;elements.tablesTitle.textContent=`${title}: Create or Join a Game`;screen='tables';renderTables();announce(`${title}. ${tables.length} open game${tables.length===1?'':'s'}. Create Game selected. Use Up and Down Arrow, then Enter.`);}); }
function createTable(){ swipeSound(); socket.emit('create-game',{category:GAME_CATEGORIES[selectedGame]},result=>result.ok?showWaiting(result.room):announce(result.error)); }
function joinTable(id){ swipeSound(); socket.emit('join-game',{gameId:id},result=>result.ok?showWaiting(result.room):announce(result.error)); }
function showWaiting(room){ currentRoom=room;sessionStorage.setItem('loungeGameId',room.id);elements.lobby.hidden=true;elements.tablePicker.hidden=true;elements.waitingTable.hidden=false;screen='waiting';updateWaiting(room);elements.waitingTable.focus({preventScroll:false}); }
function updateWaiting(room){
  currentRoom=room;
  elements.tableSummary.textContent=`${room.displayGame||selectedGame} table hosted by ${room.players.find(player=>player.id===room.hostId)?.name||'Host'}. ${room.players.length} of ${room.maxPlayers} players.`;
  elements.waitingPlayers.replaceChildren(...room.players.map(player=>{const li=document.createElement('li');li.textContent=`${player.name}${player.id===room.hostId?' (host)':''}${player.connected?'':' (reconnecting)'}`;return li;}));
  const amHost=room.players.find(player=>player.id===room.hostId)?.name===myUsername;
  elements.hostInstruction.textContent=amHost?'When at least two players are here, press Enter to start.':'Waiting for the host to press Enter and start.';
  announce(`${room.players.length} of ${room.maxPlayers} players at the table. ${elements.hostInstruction.textContent}`);
}
function startTable(){ if(!currentRoom)return;const amHost=currentRoom.players.find(player=>player.id===currentRoom.hostId)?.name===myUsername;if(!amHost)return announce('Waiting for the host to start.');swipeSound();socket.emit('start-game',{},result=>{if(!result.ok){announce(result.error);tone(150,audio().currentTime,.25,.12,'sawtooth');}}); }
function enterLobby(result){ myUsername=result.username;sessionStorage.setItem('loungeUsername',myUsername);if(result.token)sessionStorage.setItem('loungeSessionToken',result.token);elements.password.value='';elements.authScreen.hidden=true;elements.lobby.hidden=false;screen='games';renderGames();announce(`Welcome, ${myUsername}. Monopoly selected. Use Up and Down Arrow to choose a game, then press Enter.`); }

elements.authForm.addEventListener('submit',event=>{event.preventDefault();const action=event.submitter?.dataset.action||'login';elements.authStatus.textContent=action==='register'?'Registering.':'Logging in.';socket.emit(action,{username:elements.username.value,password:elements.password.value},result=>{if(result.ok)enterLobby(result);else elements.authStatus.textContent=result.error;});});
elements.leaveTable.addEventListener('click',()=>location.reload());
elements.logout.addEventListener('click',()=>{sessionStorage.clear();socket.emit('logout',{},()=>location.reload());});
document.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA'].includes(event.target.tagName))return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    if(!['games','tables'].includes(screen))return;event.preventDefault();clickSound();const menu=screen==='games'?elements.gameMenu:elements.tableMenu,count=menuOptions(menu).length,delta=event.key==='ArrowDown'?1:-1;if(screen==='games'){gameIndex=(gameIndex+delta+count)%count;setSelection(menu,gameIndex);}else{tableIndex=(tableIndex+delta+count)%count;setSelection(menu,tableIndex);}return;
  }
  if(event.key==='Enter'){
    if(screen==='games'){event.preventDefault();chooseGame(GAME_TITLES[gameIndex]);}
    else if(screen==='tables'){event.preventDefault();selectedOption(elements.tableMenu,tableIndex)?.click();}
    else if(screen==='waiting'&&event.target!==elements.leaveTable){event.preventDefault();startTable();}
  }
  if(event.key==='Escape'&&screen==='tables'){event.preventDefault();elements.tablePicker.hidden=true;elements.lobby.hidden=false;screen='games';setSelection(elements.gameMenu,gameIndex);}
});
socket.on('lobby-updated',room=>{if(screen==='waiting')updateWaiting(room);});
socket.on('table-player-joined',data=>{if(screen==='waiting'){bellSound();announce(data.message);}});
socket.on('update-room-list',()=>{if(screen==='tables'&&selectedGame)socket.emit('get-game-tables',{category:GAME_CATEGORIES[selectedGame]},result=>{if(result.ok){tables=result.tables;renderTables();}});});
socket.on('game-started',data=>{startSound(data.cue);announce(data.message);setTimeout(()=>{location.href=data.destination;},650);});
socket.on('connect',()=>{socket.emit('get-active-rooms');const token=sessionStorage.getItem('loungeSessionToken');if(!token){elements.username.focus();return;}socket.emit('authenticate-token',{token},result=>result.ok?enterLobby(result):(sessionStorage.clear(),elements.username.focus()));});
socket.on('disconnect',()=>announce('Connection lost. Trying to reconnect.'));
