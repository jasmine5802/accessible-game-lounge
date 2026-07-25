'use strict';

const { io } = require('socket.io-client');
const MonopolyBoards = require('./monopoly-boards');
const fs = require('fs');
const os = require('os');
const path = require('path');
const suffix = `${process.pid}${Date.now()}`.slice(-10);
const testDataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lounge-test-'));
process.env.LOUNGE_DATA_DIR = testDataDirectory;
const { startServer, server } = require('./server');
let host;
let guest;
const connected = socket => new Promise(resolve => socket.on('connect', resolve));
const call = (socket, event, data) => new Promise(resolve => socket.emit(event, data, resolve));
const once = (socket, event) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${event}.`)), 3000);
  socket.once(event, data => { clearTimeout(timer); resolve(data); });
});

(async () => {
  await startServer(0, '127.0.0.1');
  const testServer = `http://127.0.0.1:${server.address().port}`;
  host = io(testServer, { transports: ['websocket'], timeout: 3000 });
  guest = io(testServer, { transports: ['websocket'], timeout: 3000 });
  await Promise.all([connected(host), connected(guest)]);
  const credentials = { password: 'LobbyTest9!' };
  const registered = await Promise.all([
    call(host, 'register', { ...credentials, username: `Host${suffix}` }),
    call(guest, 'register', { ...credentials, username: `Guest${suffix}` })
  ]);
  if (registered.some(result => !result.ok)) throw new Error(`Registration failed: ${JSON.stringify(registered)}`);
  const games = [
    ['Duck Race', '/ducks-race.html'],
    ['Monopoly', '/monopoly.html'], ['Classic UNO', '/uno.html'], ['UNO Flip', '/uno.html'], ['DOS', '/uno.html'], ["UNO Show 'Em No Mercy", '/uno.html'], ['UNO Attack', '/uno.html'], ['Horse Race', '/horserace.html'],
    ['Dominoes', '/dominoes.html'], ['Skip-Bo', '/skipbo.html'], ['Mall Madness', '/mallmadness.html'],
    ['The Game of Life', '/life.html']
  ];
  const optionPayloads = {
    Monopoly: { edition: 'Pac-Man Arcade' },
    'Uno Flip': { unoVariant: 'Uno Flip!' },
    Dominoes: { dominoSet: 'Double-Nine', dominoMode: 'All Fives' },
    'The Game of Life': { lifeTheme: 'Space Colonization' }
  };
  const stateEvents = {
    'Duck Race':'ducks-race-state', Monopoly:'monopoly-state', 'Uno Flip':'uno-state', 'Horse Race':'derby-state',
    Dominoes:'domino-state', 'Skip-Bo':'skipbo-state', 'Mall Madness':'mall-state', 'The Game of Life':'life-state'
  };
  async function representativeAction(game, state) {
    if (game === 'Duck Race') return call(host, 'ducks-race-roll', {});
    if (game === 'Monopoly') return call(host, 'monopoly-roll', {});
    if (game === 'Uno Flip') return call(host, 'uno-draw', {});
    if (game === 'Horse Race') return call(host, 'derby-draw', {});
    if (game === 'Dominoes') return call(host, 'domino-play', { tileId: state.game.myHand[0].id, end:'left', flipped:false });
    if (game === 'Skip-Bo') return call(host, 'skipbo-play', { source:'hand', sourceIndex:0, targetType:'discard', targetIndex:0 });
    if (game === 'Mall Madness') return call(host, 'mall-director', {});
    if (game === 'The Game of Life') return call(host, 'life-spin', {});
    throw new Error(`No representative action is configured for ${game}.`);
  }
  let lastRoomId;
  for (const [game, page] of games) {
    const categories = { 'Duck Race':'ducks-race', Monopoly:'monopoly', 'Classic UNO':'uno-classic', 'UNO Flip':'uno-flip', DOS:'uno-dos', "UNO Show 'Em No Mercy":'uno-no-mercy', 'UNO Attack':'uno-attack', 'Horse Race':'horse-race', Dominoes:'dominoes', 'Skip-Bo':'skip-bo', 'Mall Madness':'mall-madness', 'The Game of Life':'life' };
    const filtered = await call(guest, 'get-game-tables', { category: categories[game] });
    if (!filtered.ok || filtered.tables.some(table => table.displayGame !== game)) throw new Error(`${game} table filtering failed.`);
    const unoVariants = { 'Classic UNO':'Classic Uno', 'UNO Flip':'Uno Flip!', DOS:'Uno Dos', "UNO Show 'Em No Mercy":"Show 'Em No Mercy", 'UNO Attack':'Uno Attack' };
    const settings = game === 'Monopoly' ? { edition:'Classic' } : unoVariants[game] ? { unoVariant:unoVariants[game] } : game === 'Dominoes' ? { dominoSet:'Double-Nine',dominoMode:'All Fives' } : game === 'The Game of Life' ? { lifeTheme:'Space Colonization' } : {};
    const created = await call(host, 'create-game', { category: categories[game], ...settings });
    if (!created.ok || created.room.displayGame !== game) throw new Error(`${game} creation metadata failed.`);
    if(game==='Monopoly'){
      const token=MonopolyBoards.tokens.Classic[0];
      const selected=await call(host,'monopoly-select-token',{tokenId:token.id});
      if(!selected.ok||selected.token.id!==token.id)throw new Error('Monopoly token selection failed.');
    }
    const discovered = await call(guest, 'get-game-tables', { category: categories[game] });
    const openTable = discovered.tables.find(table => table.host === `Host${suffix}`);
    if (!discovered.ok || !openTable || openTable.playerCount !== 1) throw new Error(`${game} could not be discovered in the public table list without a room code.`);
    const joinedEvent = once(host, 'table-player-joined');
    const joined = await call(guest, 'join-game', { gameId: openTable.id });
    const joinedNotice = await joinedEvent;
    if (!joined.ok || !joinedNotice.message.includes(`2 of ${created.room.maxPlayers} players`)) throw new Error(`${game} join announcement failed.`);
    const chatEvent=once(guest,'chat-message');
    const chatted=await call(host,'chat-message',`Testing ${game} game chat.`);
    const chatMessage=await chatEvent;
    if(!chatted.ok||chatMessage.text!==`Testing ${game} game chat.`)throw new Error(`${game} in-game chat failed.`);
    const guestPlayer=joined.room.players.find(player=>player.name===`Guest${suffix}`);
    const privateAtGuest=once(guest,'chat-message'),privateAtHost=once(host,'chat-message');
    const privatelyChatted=await call(host,'chat-message',{text:`Private ${game} message.`,recipientId:guestPlayer.id});
    const [guestPrivate,hostPrivate]=await Promise.all([privateAtGuest,privateAtHost]);
    if(!privatelyChatted.ok||!privatelyChatted.private||!guestPrivate.private||!hostPrivate.private||guestPrivate.text!==`Private ${game} message.`)throw new Error(`${game} private chat failed.`);
    if(game==='Duck Race'){
      const hostOptions=await call(host,'set-game-options',{type:'Mandarin Duck',secondary:'Purple',startingCards:5,startingFeathers:8});
      const guestOptions=await call(guest,'set-game-options',{type:'Rubber Duck',secondary:'Yellow'});
      if(!hostOptions.ok||!guestOptions.ok)throw new Error('Duck race options failed.');
    }
    if(game==='Horse Race'){
      const hostOptions=await call(host,'set-game-options',{type:'Miniature Horse',secondary:'Pinto',startingCards:5});
      const guestOptions=await call(guest,'set-game-options',{type:'Full-size Clydesdale',secondary:'Black'});
      if(!hostOptions.ok||!guestOptions.ok)throw new Error('Horse race options failed.');
    }
    if(game==='Monopoly'){
      const [hostToken,guestToken]=MonopolyBoards.tokens.Classic;
      const hostOptions=await call(host,'set-game-options',{type:'Classic',secondary:hostToken.id}),guestOptions=await call(guest,'set-game-options',{type:'Classic',secondary:guestToken.id});
      if(!hostOptions.ok||!guestOptions.ok)throw new Error('Monopoly board and token options failed to save by token ID.');
      const duplicate=await call(guest,'set-game-options',{type:'Classic',secondary:hostToken.id});
      if(duplicate.ok)throw new Error('Monopoly allowed two players to save the same token.');
    }
    if(['Classic UNO','UNO Flip','DOS',"UNO Show 'Em No Mercy",'UNO Attack'].includes(game)){
      const option=await call(host,'set-game-options',{type:unoVariants[game],secondary:'Standard deck'});if(!option.ok)throw new Error(`${game} in-game options failed.`);
    }
    if(game==='Dominoes'){const option=await call(host,'set-game-options',{type:'Double-Nine',secondary:'All Fives'});if(!option.ok)throw new Error('Dominoes in-game options failed.');}
    if(game==='The Game of Life'){const option=await call(host,'set-game-options',{type:'Space Colonization',secondary:'Standard rules'});if(!option.ok)throw new Error('Life in-game options failed.');}
    const startEvent = once(guest, 'game-started');
    const started = await call(host, 'start-game', {});
    const launch = await startEvent;
    if (!started.ok || !launch.destination.startsWith(`${page}?game=`)) throw new Error(`${game} unified host start failed.`);
    if(game==='Duck Race'){
      const race=await call(host,'start-ducks-race',{}),mine=race.game.players.find(player=>player.name===`Host${suffix}`),other=race.game.players.find(player=>player.name===`Guest${suffix}`);
      if(!race.ok||mine.duckType!=='Mandarin Duck'||mine.color!=='Purple'||mine.hand.length!==5||mine.feathers!==8||other.duckType!=='Rubber Duck')throw new Error('Duck appearance or race settings were not applied.');
    }
    if(game==='Horse Race'){
      const race=await call(host,'start-derby',{}),mine=race.game.players.find(player=>player.name===`Host${suffix}`),other=race.game.players.find(player=>player.name===`Guest${suffix}`);
      if(!race.ok||mine.horseType!=='Miniature Horse'||mine.color!=='Pinto'||race.game.myHand.length!==5||other.horseType!=='Full-size Clydesdale')throw new Error('Horse appearance or race settings were not applied.');
    }
    console.log(`${game}: ${joinedNotice.message} ${launch.destination}`);
  }
  await Promise.all([call(host, 'logout', {}), call(guest, 'logout', {})]);
  host.close(); guest.close();
  await new Promise(resolve => server.close(resolve));
  console.log('All unified lobby flows passed.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  host?.close(); guest?.close(); if (server.listening) server.close(); fs.rmSync(testDataDirectory, { recursive: true, force: true });
});
