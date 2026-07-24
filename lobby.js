'use strict';

const socket = io();
const GAME_TITLES = ['Duck Race', 'Monopoly', 'Uno Flip', 'Horse Race', 'Dominoes', 'Skip-Bo', 'Mall Madness', 'The Game of Life'];
const GAME_CATEGORIES = { 'Duck Race':'duck-race', Monopoly:'monopoly', 'Uno Flip':'uno-flip', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness', 'The Game of Life':'life' };
const GAME_HELP = {
  'Duck Race': {
    instructions: 'Race around the pond, collect feathers, use cards, and avoid traps. The first duck to complete the loop wins.',
    commands: 'Enter rolls or plays the selected card. Up and Down choose cards. C reads your cards. F reads feathers. Left and Right explore the board. Q opens the leave-game confirmation.'
  },
  Monopoly: {
    instructions: 'Move around the selected forty-space board, buy unowned properties, collect rent, trade, and remain solvent. The last player who has not gone bankrupt wins.',
    commands: 'Arrow Keys explore the board. Enter rolls. F reads your balance. P lists your properties. H reads the room state. Y accepts and N declines an offer. Q opens the leave-game confirmation.'
  },
  'Uno Flip': {
    instructions: 'Match a card by color, number, or symbol. Flip cards change the active side of every card. Empty your hand before the other players.',
    commands: 'Up and Down choose a card. Enter plays or draws. C reads the center. H reads your hand. S reads scores. U calls UNO. D calls DOS. Q opens the leave-game confirmation.'
  },
  'Horse Race': {
    instructions: 'Play movement cards to advance your horse through six laps while responding to terrain and hazards. The first horse to finish wins.',
    commands: 'Up and Down choose a card. Enter plays it. D or Space draws. C describes your position. S reads standings. Q opens the leave-game confirmation.'
  },
  Dominoes: {
    instructions: 'Place a tile whose end matches one of the open ends. Draw or pass when no tile can be played. The selected scoring mode determines the winner.',
    commands: 'Left and Right choose a tile. Up and Down flip it. L or 1 plays left. R or 2 plays right. D or Space draws or passes. C reads ends. B reads the board. H reads your hand. Q opens the leave-game confirmation.'
  },
  'Skip-Bo': {
    instructions: 'Build shared piles upward from one to twelve and use Skip-Bo cards as wild cards. The first player to empty their stock pile wins.',
    commands: 'Arrow Keys navigate your available cards and piles. Enter performs the selected action. The visible command guide identifies context-specific keys. Q opens the leave-game confirmation.'
  },
  'Mall Madness': {
    instructions: 'Move through the mall, visit the stores on your shopping list, manage your money, and return to the correct exit after completing your purchases.',
    commands: 'Arrow Keys navigate available destinations and choices. Enter confirms the selected action. Status and shopping-list controls are available on screen. Q opens the leave-game confirmation.'
  },
  'The Game of Life': {
    instructions: 'Travel through a branching life path, make career and family choices, manage money, and finish with the strongest final result.',
    commands: 'Use the visible choice controls and keyboard focus order to make decisions and advance. Status and player summaries remain visible. Q opens the leave-game confirmation.'
  }
};

const ids = [
  'auth-screen','auth-form','auth-status','username','password','lobby','game-menu','table-picker','tables-title','table-menu',
  'waiting-table','table-summary','waiting-players','host-instruction','leave-table','status','logout','setup-prompt',
  'setup-prompt-title','setup-prompt-description','options-screen','options-form','options-fields','help-screen','help-title','help-content'
];
const elements = Object.fromEntries(ids.map(id => [id.replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()), document.getElementById(id)]));
let screen = 'auth';
let gameIndex = 0;
let tableIndex = 0;
let selectedGame = null;
let tables = [];
let currentRoom = null;
let myUsername = sessionStorage.getItem('loungeUsername') || '';
let audioContext;
let setupStep = null;
let gameOptions = {};

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
function hideMainScreens() {
  [elements.lobby,elements.tablePicker,elements.waitingTable,elements.setupPrompt,elements.optionsScreen,elements.helpScreen].forEach(node => { node.hidden = true; });
}
function renderGames(){
  elements.gameMenu.replaceChildren(...GAME_TITLES.map((title,index)=>{const option=document.createElement('li');option.id=`game-option-${index}`;option.setAttribute('role','option');option.textContent=title;option.addEventListener('click',()=>{gameIndex=index;setSelection(elements.gameMenu,gameIndex,false);chooseGame(title);});return option;}));
  setSelection(elements.gameMenu,gameIndex,false);
}
function renderTables(){
  const options=[{create:true,label:'Create Game'},...tables.map(table=>({table,label:`Join ${table.host}'s game. ${table.playerCount} of ${table.maxPlayers} players.`}))];
  elements.tableMenu.replaceChildren(...options.map((entry,index)=>{const option=document.createElement('li');option.id=`table-option-${index}`;option.setAttribute('role','option');option.textContent=entry.label;option.addEventListener('click',()=>{tableIndex=index;setSelection(elements.tableMenu,tableIndex,false);entry.create?beginSetup():joinTable(entry.table.id);});return option;}));
  tableIndex=Math.min(tableIndex,options.length-1); setSelection(elements.tableMenu,tableIndex,false);
}
function chooseGame(title){
  selectedGame=title; swipeSound();
  socket.emit('get-game-tables',{category:GAME_CATEGORIES[title]},result=>{
    if(!result.ok)return announce(result.error);
    tables=result.tables;tableIndex=0;hideMainScreens();elements.tablePicker.hidden=false;elements.tablesTitle.textContent=`${title}: Create or Join a Game`;screen='tables';renderTables();
    announce(`${title}. ${tables.length} open game${tables.length===1?'':'s'}. Create Game selected. Use Up and Down Arrow, then Enter.`);
  });
}

function showSetupPrompt(step) {
  setupStep = step;
  hideMainScreens();
  elements.setupPrompt.hidden = false;
  screen = 'setup-prompt';
  const descriptions = {
    options: `Do you want to change the default ${selectedGame} options for this new game? Press Y for yes to open Game Options. Press N for no to use the defaults and continue.`,
    instructions: `Do you want to hear or read the ${selectedGame} instructions? Press Y for yes to open the instructions. Press N for no to continue.`,
    commands: `Do you want to hear or read the ${selectedGame} keyboard commands? Press Y for yes to open the command list. Press N for no to create the game.`
  };
  elements.setupPromptTitle.textContent = step === 'options' ? 'Change Game Options?' : step === 'instructions' ? 'Read Instructions?' : 'Read Keyboard Commands?';
  elements.setupPromptDescription.textContent = descriptions[step];
  elements.setupPrompt.focus({preventScroll:false});
  announce(descriptions[step]);
}
function beginSetup() {
  gameOptions = {};
  showSetupPrompt('options');
}
function addSelect(labelText, name, values, selectedValue) {
  const label=document.createElement('label'), select=document.createElement('select');
  const id=`option-${name}`; label.htmlFor=id; label.textContent=labelText;select.id=id;select.name=name;
  select.replaceChildren(...values.map(value=>new Option(value,value,false,value===selectedValue)));
  elements.optionsFields.append(label,select);
}
function openOptions() {
  hideMainScreens(); elements.optionsScreen.hidden=false; screen='options'; elements.optionsFields.replaceChildren();
  if (selectedGame === 'Monopoly') addSelect('Board edition','edition',window.MonopolyBoards?.editions || ['Classic'],gameOptions.edition || 'Classic');
  else if (selectedGame === 'Uno Flip') addSelect('UNO rules','unoVariant',window.UnoRules?.VARIANTS || ['Uno Flip!'],gameOptions.unoVariant || 'Uno Flip!');
  else if (selectedGame === 'The Game of Life') addSelect('Life theme','lifeTheme',window.LifeThemes?.themes || ['Classic 1960'],gameOptions.lifeTheme || 'Classic 1960');
  else if (selectedGame === 'Dominoes') {
    addSelect('Domino set','dominoSet',['Double-Six','Double-Nine'],gameOptions.dominoSet || 'Double-Six');
    addSelect('Game mode','dominoMode',['Draw Game','Block Game','All Fives'],gameOptions.dominoMode || 'Draw Game');
  } else {
    const paragraph=document.createElement('p');paragraph.textContent=`${selectedGame} has no configurable pre-game options yet. Its standard rules will be used.`;elements.optionsFields.append(paragraph);
  }
  requestAnimationFrame(()=>elements.optionsFields.querySelector('select')?.focus() || elements.optionsForm.querySelector('button').focus());
}
function showHelp(kind) {
  hideMainScreens(); elements.helpScreen.hidden=false;screen='help';
  elements.helpTitle.textContent = kind === 'instructions' ? `${selectedGame} Instructions` : `${selectedGame} Keyboard Commands`;
  elements.helpContent.textContent = GAME_HELP[selectedGame][kind];
  elements.helpScreen.dataset.kind=kind;elements.helpScreen.focus();
  announce(`${elements.helpTitle.textContent}. ${elements.helpContent.textContent} Press Escape to continue.`);
}
function continueAfterHelp() {
  const kind=elements.helpScreen.dataset.kind;
  if(kind==='instructions')showSetupPrompt('commands');else createTable();
}
function handleSetupChoice(key) {
  if(!['y','n'].includes(key)) {
    const message=`Invalid key. ${elements.setupPromptDescription.textContent}`;
    announce(message); window.LoungeAccessibility?.speak(message); return;
  }
  if(setupStep==='options') key==='y'?openOptions():showSetupPrompt('instructions');
  else if(setupStep==='instructions') key==='y'?showHelp('instructions'):showSetupPrompt('commands');
  else if(setupStep==='commands') key==='y'?showHelp('commands'):createTable();
}
function createTable(){
  swipeSound();
  const payload={category:GAME_CATEGORIES[selectedGame],...gameOptions};
  socket.emit('create-game',payload,result=>result.ok?showWaiting(result.room):announce(result.error));
}
function joinTable(id){ swipeSound(); socket.emit('join-game',{gameId:id},result=>result.ok?showWaiting(result.room):announce(result.error)); }
function showWaiting(room){ currentRoom=room;sessionStorage.setItem('loungeGameId',room.id);hideMainScreens();elements.waitingTable.hidden=false;screen='waiting';updateWaiting(room);elements.waitingTable.focus({preventScroll:false}); }
function updateWaiting(room){
  currentRoom=room;
  const optionSummary = room.monopolyEdition ? ` Board: ${room.monopolyEdition}.` : room.unoVariant ? ` Rules: ${room.unoVariant}.` : room.dominoMode ? ` ${room.dominoSet}, ${room.dominoMode}.` : '';
  elements.tableSummary.textContent=`${room.displayGame||selectedGame} table hosted by ${room.players.find(player=>player.id===room.hostId)?.name||'Host'}.${optionSummary} ${room.players.length} of ${room.maxPlayers} players.`;
  elements.waitingPlayers.replaceChildren(...room.players.map(player=>{const li=document.createElement('li');li.textContent=`${player.name}${player.id===room.hostId?' (host)':''}${player.connected?'':' (reconnecting)'}`;return li;}));
  const amHost=room.players.find(player=>player.id===room.hostId)?.name===myUsername;
  elements.hostInstruction.textContent=amHost?'When at least two players are here, press Enter to start.':'Waiting for the host to press Enter and start.';
  announce(`${elements.tableSummary.textContent} ${elements.hostInstruction.textContent}`);
}
function startTable(){ if(!currentRoom)return;const amHost=currentRoom.players.find(player=>player.id===currentRoom.hostId)?.name===myUsername;if(!amHost)return announce('Waiting for the host to start.');swipeSound();socket.emit('start-game',{},result=>{if(!result.ok){announce(result.error);tone(150,audio().currentTime,.25,.12,'sawtooth');}}); }
function enterLobby(result){ myUsername=result.username;sessionStorage.setItem('loungeUsername',myUsername);if(result.token)sessionStorage.setItem('loungeSessionToken',result.token);elements.password.value='';elements.authScreen.hidden=true;hideMainScreens();elements.lobby.hidden=false;screen='games';renderGames();announce(`Welcome, ${myUsername}. Duck Race selected. Use Up and Down Arrow to choose a game, then press Enter.`); }

elements.optionsForm.addEventListener('submit',event=>{
  event.preventDefault(); gameOptions={...Object.fromEntries(new FormData(event.currentTarget))};
  announce(`${selectedGame} options saved for this new game.`);showSetupPrompt('instructions');
});
elements.authForm.addEventListener('submit',event=>{event.preventDefault();const action=event.submitter?.dataset.action||'login';elements.authStatus.textContent=action==='register'?'Registering.':'Logging in.';socket.emit(action,{username:elements.username.value,password:elements.password.value},result=>{if(result.ok)enterLobby(result);else elements.authStatus.textContent=result.error;});});
elements.leaveTable.addEventListener('click',()=>{socket.emit('leave-game',{},()=>{currentRoom=null;hideMainScreens();elements.lobby.hidden=false;screen='games';setSelection(elements.gameMenu,gameIndex);});});
elements.logout.addEventListener('click',()=>{sessionStorage.clear();socket.emit('logout',{},()=>location.reload());});
document.addEventListener('keydown',event=>{
  if(screen==='setup-prompt'){event.preventDefault();handleSetupChoice(event.key.toLowerCase());return;}
  if(screen==='help'&&event.key==='Escape'){event.preventDefault();continueAfterHelp();return;}
  if(['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    if(!['games','tables'].includes(screen))return;event.preventDefault();clickSound();const menu=screen==='games'?elements.gameMenu:elements.tableMenu,count=menuOptions(menu).length,delta=event.key==='ArrowDown'?1:-1;if(screen==='games'){gameIndex=Math.max(0,Math.min(count-1,gameIndex+delta));setSelection(menu,gameIndex);}else{tableIndex=Math.max(0,Math.min(count-1,tableIndex+delta));setSelection(menu,tableIndex);}return;
  }
  if(event.key==='Enter'){
    if(screen==='games'){event.preventDefault();chooseGame(GAME_TITLES[gameIndex]);}
    else if(screen==='tables'){event.preventDefault();selectedOption(elements.tableMenu,tableIndex)?.click();}
    else if(screen==='waiting'&&event.target!==elements.leaveTable){event.preventDefault();startTable();}
  }
  if(event.key==='Escape'&&screen==='tables'){event.preventDefault();hideMainScreens();elements.lobby.hidden=false;screen='games';setSelection(elements.gameMenu,gameIndex);}
});
socket.on('lobby-updated',room=>{if(screen==='waiting')updateWaiting(room);});
socket.on('table-player-joined',data=>{if(screen==='waiting'){bellSound();announce(data.message);}});
socket.on('update-room-list',()=>{if(screen==='tables'&&selectedGame)socket.emit('get-game-tables',{category:GAME_CATEGORIES[selectedGame]},result=>{if(result.ok){tables=result.tables;renderTables();}});});
socket.on('game-started',data=>{startSound(data.cue);announce(data.message);setTimeout(()=>{location.href=data.destination;},650);});
socket.on('connect',()=>{socket.emit('get-active-rooms');const token=sessionStorage.getItem('loungeSessionToken');if(!token){elements.username.focus();return;}socket.emit('authenticate-token',{token},result=>result.ok?enterLobby(result):(sessionStorage.clear(),elements.username.focus()));});
socket.on('disconnect',()=>announce('Connection lost. Trying to reconnect.'));
