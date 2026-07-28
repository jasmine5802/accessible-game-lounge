'use strict';

const path = require('path');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs/promises');
const { promisify } = require('util');
const { version: appVersion, name: packageName } = require('./package.json');
const express = require('express');
const { Server } = require('socket.io');
const MonopolyBoards = require('./monopoly-boards');
const UnoRules = require('./uno-rules');
const LifeThemes = require('./life-themes');
const DerbyEngine = require('./horserace-engine');
const DominoesEngine = require('./dominoes-engine');
const SkipBoEngine = require('./skipbo-engine');
const MallMadnessEngine = require('./mallmadness-engine');
const { startComputerPlayer } = require('./computer-player');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const BOARD_SIZE = 40;
const BOARD_SPACES = [
  { name: 'Safe Pond', effect: 'safe', description: 'A calm, sunny pond. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A cozy nest filled with useful feathers.' },
  { name: 'Safe Pond', effect: 'safe', description: 'Water lilies bob peacefully around your duck. No effect.' },
  { name: 'Water Slide', effect: 'forward', description: 'Splash! A fast water slide sweeps you forward 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'A friendly frog waves from a lily pad. No effect.' },
  { name: 'Mud Trap', effect: 'mud', description: 'Stuck in the mud! Lose 1 feather.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A hidden nest offers 1 or 2 feathers.' },
  { name: 'Whirlpool', effect: 'backward', description: 'Oh no, a whirlpool! You get sucked back 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'Warm reeds shelter you from the wind. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'Shimmering feathers are tucked beneath a branch.' },
  { name: 'Water Slide', effect: 'forward', description: 'A sparkling current carries you forward 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'The pond is glassy and quiet here. No effect.' },
  { name: 'Mud Trap', effect: 'mud', description: 'Sticky mud grabs your webbed feet. Lose 1 feather.' },
  { name: 'Safe Pond', effect: 'safe', description: 'A family of minnows swims alongside you. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A golden nest contains 1 or 2 feathers.' },
  { name: 'Whirlpool', effect: 'backward', description: 'A swirling current pulls you back 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'Sunbeams dance across the water. No effect.' },
  { name: 'Water Slide', effect: 'forward', description: 'A foamy chute launches you forward 3 spaces.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A duckling shares 1 or 2 lucky feathers.' },
  { name: 'Safe Pond', effect: 'safe', description: 'You drift past sweet-smelling pond flowers. No effect.' },
  { name: 'Mud Trap', effect: 'mud', description: 'A muddy bank snatches 1 feather.' },
  { name: 'Safe Pond', effect: 'safe', description: 'A wooden bridge gives you welcome shade. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A silver nest rewards you with 1 or 2 feathers.' },
  { name: 'Whirlpool', effect: 'backward', description: 'Round and round you go, then back 3 spaces.' },
  { name: 'Water Slide', effect: 'forward', description: 'A rushing stream zips you forward 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'A sleepy turtle keeps you company. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'You discover 1 or 2 bright racing feathers.' },
  { name: 'Mud Trap', effect: 'mud', description: 'Squelch! The deep mud costs you 1 feather.' },
  { name: 'Safe Pond', effect: 'safe', description: 'The breeze is gentle and the route is clear. No effect.' },
  { name: 'Water Slide', effect: 'forward', description: 'A curving waterfall sends you forward 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'Colorful dragonflies cheer you onward. No effect.' },
  { name: 'Whirlpool', effect: 'backward', description: 'A sneaky whirlpool spins you back 3 spaces.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'A moonlit nest holds 1 or 2 feathers.' },
  { name: 'Safe Pond', effect: 'safe', description: 'You glide through a quiet patch of blue water. No effect.' },
  { name: 'Mud Trap', effect: 'mud', description: 'A muddy splash knocks away 1 feather.' },
  { name: 'Water Slide', effect: 'forward', description: 'The fastest slide on the pond shoots you forward 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'A chorus of frogs applauds you. No effect.' },
  { name: 'Feather Nest', effect: 'feathers', description: 'The champion’s nest grants 1 or 2 feathers.' },
  { name: 'Whirlpool', effect: 'backward', description: 'One last whirlpool drags you back 3 spaces.' },
  { name: 'Safe Pond', effect: 'safe', description: 'The finish pond sparkles just ahead. No effect.' }
];
const CARD_TYPES = ['Wind Gust', 'Shield', 'Pluck'];
const CARD_COSTS = { 'Wind Gust': 1, Shield: 2, Pluck: 1 };
const rooms = new Map();
const sessions = new Map();
const computerSecrets = new Map();
const computerSockets = new Map();
const USERS_FILE = path.join(process.env.LOUNGE_DATA_DIR || __dirname, 'users.json');
const scrypt = promisify(crypto.scrypt);
let userWriteQueue = Promise.resolve();

app.use((request, response, next) => {
  let requestedPath = request.path;
  try { requestedPath = decodeURIComponent(requestedPath); } catch {}
  if (/^\/users\.json(?:\.tmp)?$/i.test(requestedPath)) return response.sendStatus(404);
  next();
});
app.get('/version.json', (_request, response) => {
  response.set('Cache-Control', 'no-store');
  response.json({
    name: packageName,
    version: appVersion,
    environment: process.env.RENDER ? 'render' : 'local'
  });
});
app.use(express.static(__dirname, { index: false }));
app.get('/', (_request, response) => response.sendFile(path.join(__dirname, 'lobby.html')));

const LOBBY_GAMES = Object.freeze({
  'Duck Race': { serverName: 'Duck Race', category: 'ducks-race', maxPlayers: 6, page: '/ducks-race.html' },
  Monopoly: { serverName: 'Monopoly Multi-Edition', category: 'monopoly', maxPlayers: 6, page: '/monopoly.html' },
  'Classic UNO': { serverName: 'Accessible Uno & Dos Lounge', category: 'uno-classic', maxPlayers: 4, page: '/uno.html', unoVariant: 'Classic Uno' },
  'UNO Flip': { serverName: 'Accessible Uno & Dos Lounge', category: 'uno-flip', maxPlayers: 4, page: '/uno.html', unoVariant: 'Uno Flip!' },
  DOS: { serverName: 'Accessible Uno & Dos Lounge', category: 'uno-dos', maxPlayers: 4, page: '/uno.html', unoVariant: 'Uno Dos' },
  "UNO Show 'Em No Mercy": { serverName: 'Accessible Uno & Dos Lounge', category: 'uno-no-mercy', maxPlayers: 4, page: '/uno.html', unoVariant: "Show 'Em No Mercy" },
  'UNO Attack': { serverName: 'Accessible Uno & Dos Lounge', category: 'uno-attack', maxPlayers: 4, page: '/uno.html', unoVariant: 'Uno Attack' },
  'Horse Race': { serverName: 'Horse Race', category: 'horse-race', maxPlayers: 6, page: '/horserace.html' },
  Dominoes: { serverName: 'Accessible Dominoes Lounge', category: 'dominoes', maxPlayers: 4, page: '/dominoes.html' },
  'Skip-Bo': { serverName: 'Accessible Skip-Bo Lounge', category: 'skip-bo', maxPlayers: 6, page: '/skipbo.html' },
  'Mall Madness': { serverName: 'Accessible Mall Madness Lounge', category: 'mall-madness', maxPlayers: 4, page: '/mallmadness.html' },
  'The Game of Life': { serverName: 'The Game of Life Lounge', category: 'life', maxPlayers: 6, page: '/life.html' }
});

function lobbyGameForServerName(serverName) {
  return Object.entries(LOBBY_GAMES).find(([, definition]) => definition.serverName === serverName);
}

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validateCredentials(username, password) {
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) return 'Username must be 3 to 24 characters using only letters, numbers, or underscores.';
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return 'Password must be between 8 and 128 characters.';
  return null;
}

async function readUsers() {
  try {
    const data = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
    return data && typeof data.users === 'object' ? data : { users: {} };
  } catch (error) {
    if (error.code === 'ENOENT') return { users: {} };
    throw error;
  }
}

async function writeUsers(data) {
  const temporary = `${USERS_FILE}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await fs.rename(temporary, USERS_FILE);
}

function registerUser(username, password) {
  const task = userWriteQueue.then(async () => {
    const users = await readUsers();
    const key = normalizeUsername(username);
    if (users.users[key]) return { ok: false, error: 'Username already taken.' };
    const salt = crypto.randomBytes(16);
    const hash = await scrypt(password, salt, 64);
    users.users[key] = { username, salt: salt.toString('hex'), passwordHash: hash.toString('hex'), createdAt: new Date().toISOString() };
    await writeUsers(users);
    return { ok: true, key, username };
  });
  userWriteQueue = task.catch(() => {});
  return task;
}

async function verifyUser(username, password) {
  const users = await readUsers();
  const key = normalizeUsername(username);
  const user = users.users[key];
  if (!user) {
    await scrypt(password, crypto.randomBytes(16), 64);
    return null;
  }
  const stored = Buffer.from(user.passwordHash, 'hex');
  const supplied = await scrypt(password, Buffer.from(user.salt, 'hex'), stored.length);
  return crypto.timingSafeEqual(stored, supplied) ? { key, username: user.username } : null;
}

function authenticateSocket(socket, account) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { key: account.key, username: account.username, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  socket.data.playerId = account.key;
  socket.data.username = account.username;
  socket.data.sessionToken = token;
  return token;
}

function requireAuthentication(socket, callback) {
  if (socket.data.playerId && socket.data.username) return true;
  acknowledge(callback, { ok: false, error: 'Please log in first.' });
  return false;
}

function makeRoomCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function publicDuckGame(room) {
  if (!room.ducksRace) return null;
  const game = room.ducksRace;
  return {
    boardSize: BOARD_SIZE,
    boardSpaces: BOARD_SPACES,
    cardCosts: CARD_COSTS,
    trapSquares: BOARD_SPACES.map((space, index) => space.effect === 'mud' ? index + 1 : null).filter(Boolean),
    status: game.status,
    turnPlayerId: game.turnOrder[game.turnIndex] || null,
    winnerId: game.winnerId,
    announcement: game.announcement,
    sequence: game.sequence,
    players: game.turnOrder.filter(id => game.ducks.has(id)).map(id => {
      const duck = game.ducks.get(id);
      return {
        id,
        name: room.players.get(id)?.name || duck.name,
        duckType: duck.duckType,
        color: duck.color,
        square: duck.square,
        feathers: duck.feathers,
        hand: [...duck.hand],
        shielded: duck.shielded,
        connected: Boolean(room.players.get(id)?.socketId)
      };
    })
  };
}

function publicRoom(room) {
  const lobbyEntry = room.displayGame && LOBBY_GAMES[room.displayGame] ? [room.displayGame, LOBBY_GAMES[room.displayGame]] : lobbyGameForServerName(room.game);
  return {
    id: room.code,
    code: room.code,
    hostId: room.hostId,
    game: room.game,
    displayGame: lobbyEntry?.[0] || room.game,
    category: lobbyEntry?.[1].category || null,
    maxPlayers: lobbyEntry?.[1].maxPlayers || 6,
    status: room.mall?.status || room.skipbo?.status || room.dominoes?.status || room.derby?.status || room.life?.status || room.uno?.status || room.monopoly?.status || room.ducksRace?.status || 'waiting',
    monopolyEdition: room.monopolyEdition || null,
    boardSpaces: BOARD_SPACES,
    players: [...room.players.entries()].map(([id, player]) => ({ id, name: player.name, connected: Boolean(player.socketId), monopolyToken: room.monopolyTokens?.get(id) || null })),
    gameState: room.gameState,
    ducksRace: publicDuckGame(room),
    monopoly: publicMonopolyGame(room),
    uno: publicUnoGame(room, null),
    unoVariant: room.unoVariant || null
    ,lifeTheme: room.lifeTheme || null,
    life: publicLifeGame(room, null)
    ,derby: publicDerbyGame(room, null)
    ,dominoSet: room.dominoSet || null,
    dominoMode: room.dominoMode || null,
    dominoes: publicDominoGame(room, null),
    skipboPace: room.skipboPace || null,
    skipbo: publicSkipBoGame(room, null),
    mallChallenge: room.mallChallenge || null,
    mall: publicMallGame(room, null)
  };
}

function publicGames() {
  return [...rooms.values()].map(room => {
    const lobbyEntry = room.displayGame && LOBBY_GAMES[room.displayGame] ? [room.displayGame, LOBBY_GAMES[room.displayGame]] : lobbyGameForServerName(room.game);
    return ({
    id: room.code,
    game: room.game,
    displayGame: lobbyEntry?.[0] || room.game,
    category: lobbyEntry?.[1].category || null,
    host: room.players.get(room.hostId)?.name || 'Host',
    playerCount: room.players.size,
    maxPlayers: lobbyEntry?.[1].maxPlayers || 6,
    status: room.mall?.status || room.skipbo?.status || room.dominoes?.status || room.derby?.status || room.life?.status || room.uno?.status || room.monopoly?.status || room.ducksRace?.status || 'waiting',
    edition: room.dominoMode || room.lifeTheme || room.monopolyEdition || room.unoVariant || null
  });
  });
}

function broadcastGames() {
  const games = publicGames();
  io.emit('available-games', games);
  io.emit('update-room-list', games);
}

function acknowledge(callback, payload) {
  if (typeof callback === 'function') callback(payload);
}

function randomCard() {
  return CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
}

function makeDuck(name, appearance = {}, settings = {}) {
  const cardCount = [2,3,5].includes(settings.startingCards) ? settings.startingCards : 3;
  const feathers = [3,5,8].includes(settings.startingFeathers) ? settings.startingFeathers : 5;
  return { name, duckType: appearance.type || 'Mallard', color: appearance.color || 'Green and brown', square: 1, distance: 0, feathers, hand: Array.from({length:cardCount},randomCard), shielded: false };
}

function beginDucksRace(room) {
  const turnOrder = [...room.players.keys()];
  const ducks = new Map(turnOrder.map(id => [id, makeDuck(room.players.get(id).name, room.raceSelections?.get(id), room.raceSettings)]));
  const firstName = room.players.get(turnOrder[0])?.name || 'the first player';
  room.ducksRace = {
    status: 'playing', turnOrder, turnIndex: 0, ducks, winnerId: null, sequence: 1,
    announcement: `Duck Race has started. ${firstName} goes first. Press Enter to roll.`
  };
}

function emitDuckState(room, cue = null) {
  io.to(room.code).emit('ducks-race-state', { game: publicDuckGame(room), cue });
}

function roomForPlayer(socket, callback) {
  if (!requireAuthentication(socket, callback)) return null;
  const room = rooms.get(socket.data.roomCode);
  const membership = room?.players.get(socket.data.playerId);
  if (!room || !socket.data.playerId || !membership || membership.socketId !== socket.id) {
    acknowledge(callback, { ok: false, error: 'Join a game room first.' });
    return null;
  }
  return room;
}

function turnError(game, playerId, activePlayerId, gameName) {
  if (!game || game.status !== 'playing') return `${gameName} has not started.`;
  if (activePlayerId !== playerId) return 'Wait for your turn.';
  return null;
}

function publicMonopolyGame(room) {
  if (!room.monopoly) return null;
  const game = room.monopoly;
  return {
    edition: game.edition, currency: MonopolyBoards.currencies[game.edition], board: game.board, status: game.status,
    turnPlayerId: game.turnOrder[game.turnIndex] || null,
    owners: { ...game.owners }, pendingPurchase: game.pendingPurchase ? { ...game.pendingPurchase } : null,
    pendingTrade: game.pendingTrade ? { ...game.pendingTrade } : null,
    announcement: game.announcement, sequence: game.sequence,
    players: game.turnOrder.filter(id => game.players.has(id)).map(id => {
      const player = game.players.get(id);
      return { id, name: player.name, token: player.token, balance: player.balance, position: player.position, inJail: player.inJail, connected: Boolean(room.players.get(id)?.socketId) };
    })
  };
}

function monopolyMoney(game, amount) { return MonopolyBoards.formatMoney(game.edition, amount); }

function beginMonopoly(room) {
  const turnOrder = [...room.players.keys()];
  const players = new Map(turnOrder.map(id => [id, { name: room.players.get(id).name, token: room.monopolyTokens.get(id), balance: 1500, position: 0, inJail: false }]));
  room.monopoly = { edition: room.monopolyEdition, board: MonopolyBoards.createBoard(room.monopolyEdition), status: 'playing', turnOrder, turnIndex: 0, players, owners: {}, pendingPurchase: null, pendingTrade: null, sequence: 1, announcement: `Monopoly ${room.monopolyEdition} has started. ${players.get(turnOrder[0]).name} goes first.` };
}

function emitMonopolyState(room, cue = null) {
  const themedCue = cue ? { edition: room.monopoly.edition, ...cue } : null;
  io.to(room.code).emit('monopoly-state', { game: publicMonopolyGame(room), cue: themedCue });
}

function advanceMonopolyTurn(game) {
  game.pendingPurchase = null;
  game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
  return game.players.get(game.turnOrder[game.turnIndex]);
}

function publicUnoGame(room, viewerId) {
  if (!room.uno) return null;
  const game=room.uno; const visibleCard=item=>item ? { ...UnoRules.face(game,item) } : null;
  const viewer=game.players.find(player=>player.id===viewerId);
  return { variant:game.variant,status:game.status,side:game.side,turnPlayerId:game.players[game.turnIndex]?.id||null,winnerId:game.winnerId,pendingDraw:game.pendingDraw,announcement:game.announcement,sequence:game.sequence,discard:game.discard.length?visibleCard(game.discard[game.discard.length-1]):null,centerRow:game.centerRow.map(visibleCard),myHand:viewer?viewer.hand.map(visibleCard):[],players:game.players.map(player=>({id:player.id,name:player.name,cardCount:player.hand.length,eliminated:player.eliminated,declaration:player.declaration,connected:Boolean(room.players.get(player.id)?.socketId)})) };
}

function beginUno(room) {
  room.uno=UnoRules.createGame(room.unoVariant,[...room.players.entries()].map(([id,player])=>({id,name:player.name})));
}

function emitUnoState(room,cue=null) {
  for(const [id,player] of room.players){if(player.socketId)io.to(player.socketId).emit('uno-state',{game:publicUnoGame(room,id),cue});}
}

function publicLifeGame(room, viewerId) {
  if (!room.life) return null;
  const game = room.life; const viewer = game.players.get(viewerId);
  return {
    theme: game.theme, board: game.board, status: game.status, turnPlayerId: game.turnOrder[game.turnIndex] || null,
    announcement: game.announcement, sequence: game.sequence,
    pendingChoice: game.pendingChoice ? { playerId: game.pendingChoice.playerId, options: game.pendingChoice.options.map(index => game.board[index]) } : null,
    myPrivateAssets: viewer ? viewer.privateAssets.map(asset => ({ ...asset })) : [],
    players: game.turnOrder.filter(id => game.players.has(id)).map(id => {
      const player = game.players.get(id);
      return { id, name: player.name, position: player.position, career: player.career, salary: player.salary, pegs: player.pegs, cash: player.cash, house: player.house, assetCount: player.properties.length, finished: player.finished, connected: Boolean(room.players.get(id)?.socketId) };
    })
  };
}

function beginLife(room) {
  const turnOrder = [...room.players.keys()]; const definition = LifeThemes.definitions[room.lifeTheme];
  const players = new Map(turnOrder.map(id => [id, { name: room.players.get(id).name, position: 0, career: 'Undecided', careerLevel: -1, salary: 0, pegs: 1, cash: definition.salary, house: null, properties: [], privateAssets: [], finished: false }]));
  room.life = { theme: room.lifeTheme, board: LifeThemes.createBoard(room.lifeTheme), status: 'playing', turnOrder, turnIndex: 0, players, pendingChoice: null, sequence: 1, announcement: `${room.lifeTheme} Life has started. ${players.get(turnOrder[0]).name} goes first. Press S or Enter to spin.` };
}

function emitLifeState(room, cue = null) {
  for (const [id, player] of room.players) if (player.socketId) io.to(player.socketId).emit('life-state', { game: publicLifeGame(room, id), cue });
}

function advanceLifeTurn(game) {
  const active = game.turnOrder.filter(id => game.players.has(id) && !game.players.get(id).finished);
  if (!active.length) { game.status = 'finished'; return null; }
  do game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
  while (!game.players.has(game.turnOrder[game.turnIndex]) || game.players.get(game.turnOrder[game.turnIndex]).finished);
  return game.players.get(game.turnOrder[game.turnIndex]);
}

function applyLifeLanding(game, playerId) {
  const player = game.players.get(playerId); const space = game.board[player.position]; const theme = LifeThemes.definitions[game.theme];
  let detail = space.description; let secondary = space.type;
  if (space.type === 'payday') { player.cash += player.salary; detail = `Collected a salary of ${LifeThemes.formatMoney(game.theme, player.salary)}.`; }
  else if (space.type === 'career') { player.careerLevel = Math.min(player.careerLevel + 1, theme.careers.length - 1); player.career = theme.careers[player.careerLevel]; player.salary = theme.salary + player.careerLevel * Math.round(theme.salary * .2); detail = `Career changed to ${player.career}, with a salary of ${LifeThemes.formatMoney(game.theme, player.salary)}.`; }
  else if (space.type === 'passenger') { player.pegs += 1; detail = `Added a passenger peg. The car now carries ${player.pegs} pegs.`; }
  else if (space.type === 'house') { player.house = space.name; player.properties.push(space.name); detail = `Added ${space.name} to the property portfolio.`; }
  else if (space.type === 'investment') { const name = theme.cards[Math.floor(Math.random() * theme.cards.length)]; const asset = { name, value: Math.round(theme.salary * (.2 + Math.random() * .4)), description: `${name} is a private investment known only to its owner.` }; player.privateAssets.push(asset); detail = 'Received a private financial card. Its identity and value were sent only to the active player.'; }
  else if (space.type === 'event') { const amount = Math.round(theme.salary * (.08 + Math.random() * .12)) * (Math.random() < .35 ? -1 : 1); player.cash = Math.max(0, player.cash + amount); detail = amount >= 0 ? `The event paid ${LifeThemes.formatMoney(game.theme, amount)}.` : `The event cost ${LifeThemes.formatMoney(game.theme, Math.abs(amount))}.`; }
  else if (space.type === 'finish') { player.finished = true; detail = 'Completed the life journey. Private investment values remain visible only to their owner.'; }
  game.announcement = `${player.name} landed on ${space.name}. ${detail}`;
  return secondary;
}

function publicDerbyGame(room, viewerId) {
  if (!room.derby) return null;
  const game=room.derby,viewer=game.players.get(viewerId);
  return { track:DerbyEngine.TRACK,totalLaps:DerbyEngine.TOTAL_LAPS,activeLap:game.activeLap,lapEvent:DerbyEngine.LAP_EVENTS[game.activeLap-1],lapHazards:game.lapHazards,sabotagePlays:viewerId===game.turnOrder[game.turnIndex]?game.sabotagePlays:0,status:game.status,turnPlayerId:game.turnOrder[game.turnIndex]||null,winnerId:game.winnerId,announcement:game.announcement,sequence:game.sequence,myHand:viewer?[...viewer.hand]:[],hazards:Object.fromEntries(game.turnOrder.filter(id=>game.players.has(id)).map(id=>[id,[...game.players.get(id).mudHazards].sort((a,b)=>a-b)])),players:game.turnOrder.filter(id=>game.players.has(id)).map(id=>{const player=game.players.get(id);return{id,name:player.name,horseType:player.horseType,color:player.color,position:player.position,completedLaps:player.completedLaps,lap:Math.min(DerbyEngine.TOTAL_LAPS,player.completedLaps+1),cardCount:player.hand.length,connected:Boolean(room.players.get(id)?.socketId)}})};
}

function dealDerbyCard(game) {
  if (!game.deck.length) game.deck=DerbyEngine.createDeck();
  return game.deck.pop();
}

function beginDerby(room) {
  const turnOrder=[...room.players.keys()],deck=DerbyEngine.createDeck(),players=new Map(turnOrder.map(id=>{const choice=room.raceSelections?.get(id)||{};return[id,{name:room.players.get(id).name,horseType:choice.type||'Full-size Thoroughbred',color:choice.color||'Bay',position:0,completedLaps:0,hand:[],mudHazards:new Set()}]}));
  room.derby={status:'playing',turnOrder,turnIndex:0,players,deck,activeLap:1,lapHazards:DerbyEngine.createLapHazards(1),sabotagePlays:0,winnerId:null,sequence:1,announcement:`Horse Race has started. Lap 1 of 6: The Gates Open. Standard, clean track. ${players.get(turnOrder[0]).name} goes first.`};
  const startingCards=[2,3,5].includes(room.raceSettings?.startingCards)?room.raceSettings.startingCards:3;for(let round=0;round<startingCards;round+=1)for(const id of turnOrder)players.get(id).hand.push(dealDerbyCard(room.derby));
}

function emitDerbyState(room,cue=null){for(const[id,member]of room.players)if(member.socketId)io.to(member.socketId).emit('derby-state',{game:publicDerbyGame(room,id),cue})}
function advanceDerbyTurn(game){game.sabotagePlays=0;game.turnIndex=(game.turnIndex+1)%game.turnOrder.length;return game.players.get(game.turnOrder[game.turnIndex])}
function advanceDerbyLap(game,player){if(!player||player.completedLaps<game.activeLap||game.activeLap>=DerbyEngine.TOTAL_LAPS)return null;game.activeLap+=1;game.lapHazards=DerbyEngine.createLapHazards(game.activeLap);if(game.activeLap===6)for(const racer of game.players.values())racer.mudHazards.clear();return DerbyEngine.LAP_EVENTS[game.activeLap-1]}

function publicDominoGame(room,viewerId){if(!room.dominoes)return null;const game=room.dominoes,viewer=game.players.get(viewerId);return{setName:game.setName,mode:game.mode,status:game.status,turnPlayerId:game.turnOrder[game.turnIndex]||null,winnerId:game.winnerId,announcement:game.announcement,sequence:game.sequence,board:game.board.map(tile=>({...tile})),boneyardCount:game.mode==='Block Game'?0:game.boneyard.length,myHand:viewer?viewer.hand.map(tile=>({...tile})):[],players:game.turnOrder.filter(id=>game.players.has(id)).map(id=>{const player=game.players.get(id);return{id,name:player.name,score:player.score,tileCount:player.hand.length,connected:Boolean(room.players.get(id)?.socketId)}})};}
function beginDominoes(room){const turnOrder=[...room.players.keys()],deck=DominoesEngine.shuffle(DominoesEngine.createDeck(room.dominoSet)),handSize=turnOrder.length===2?7:5,players=new Map(turnOrder.map(id=>[id,{name:room.players.get(id).name,score:0,hand:[]} ]));for(let round=0;round<handSize;round+=1)for(const id of turnOrder)players.get(id).hand.push(deck.pop());room.dominoes={setName:room.dominoSet,mode:room.dominoMode,status:'playing',turnOrder,turnIndex:0,players,board:[],boneyard:room.dominoMode==='Block Game'?[]:deck,passCount:0,winnerId:null,sequence:1,announcement:`${room.dominoSet} ${room.dominoMode} has started. ${players.get(turnOrder[0]).name} goes first.`}}
function emitDominoState(room,cue=null){for(const[id,member]of room.players)if(member.socketId)io.to(member.socketId).emit('domino-state',{game:publicDominoGame(room,id),cue})}
function publicSkipBoGame(room,viewerId){if(!room.skipbo)return null;const game=room.skipbo,viewer=game.players.get(viewerId);return{status:game.status,turnPlayerId:game.turnOrder[game.turnIndex]||null,winnerId:game.winnerId,announcement:game.announcement,sequence:game.sequence,buildingPiles:game.buildingPiles.map(pile=>pile.map(card=>({...card}))),myHand:viewer?viewer.hand.map(card=>({...card})):[],myStockTop:viewer?.stock.at(-1)?{...viewer.stock.at(-1)}:null,myDiscards:viewer?viewer.discards.map(pile=>pile.map(card=>({...card}))):[[],[],[],[]],players:game.turnOrder.filter(id=>game.players.has(id)).map(id=>{const player=game.players.get(id);return{id,name:player.name,stockCount:player.stock.length,stockTop:player.stock.at(-1)?{...player.stock.at(-1)}:null,handCount:player.hand.length,connected:Boolean(room.players.get(id)?.socketId)}})};}
function refillSkipBo(game,player){if(game.drawPile.length<SkipBoEngine.HAND_SIZE-player.hand.length&&game.completed.length){game.drawPile=SkipBoEngine.recycleCompleted(game.completed,game.drawPile);game.completed=[]}const result=SkipBoEngine.drawToFive(player.hand,game.drawPile);player.hand=result.hand;game.drawPile=result.drawPile;return result.drawn}
function beginSkipBo(room){const turnOrder=[...room.players.keys()],deck=SkipBoEngine.shuffle(SkipBoEngine.createDeck()),players=new Map(turnOrder.map(id=>[id,{name:room.players.get(id).name,stock:[],hand:[],discards:[[],[],[],[]]}])),stockSize=turnOrder.length===2?30:20;for(let round=0;round<stockSize;round+=1)for(const id of turnOrder)players.get(id).stock.push(deck.pop());const game={status:'playing',turnOrder,turnIndex:0,players,buildingPiles:[[],[],[],[]],drawPile:deck,completed:[],winnerId:null,sequence:1,announcement:`${room.skipboPace} Skip-Bo has started with ${stockSize}-card stock piles. ${players.get(turnOrder[0]).name} goes first.`};refillSkipBo(game,players.get(turnOrder[0]));room.skipbo=game}
function emitSkipBoState(room,cue=null){for(const[id,member]of room.players)if(member.socketId)io.to(member.socketId).emit('skipbo-state',{game:publicSkipBoGame(room,id),cue})}
function nextSkipBoTurn(game){game.turnIndex=(game.turnIndex+1)%game.turnOrder.length;const next=game.players.get(game.turnOrder[game.turnIndex]);const drawn=refillSkipBo(game,next);return{next,drawn}}
function publicMallGame(room,viewerId){if(!room.mall)return null;const game=room.mall,viewer=game.players.get(viewerId);return{status:game.status,turnPlayerId:game.turnOrder[game.turnIndex]||null,winnerId:game.winnerId,announcement:game.announcement,sequence:game.sequence,phase:game.phase,movesRemaining:game.movesRemaining,sale:game.sale?{...game.sale}:null,myShoppingList:viewer?viewer.shoppingList.map(item=>({...item})):[],players:game.turnOrder.filter(id=>game.players.has(id)).map(id=>{const player=game.players.get(id);return{id,name:player.name,position:player.position,cash:player.cash,remainingItems:player.shoppingList.filter(item=>!item.bought).length,connected:Boolean(room.players.get(id)?.socketId)}})};}
function beginMall(room){const turnOrder=[...room.players.keys()],listSize=room.mallChallenge==='Quick shopping list'?3:6,players=new Map(turnOrder.map((id,index)=>[id,{name:room.players.get(id).name,position:0,cash:150,shoppingList:MallMadnessEngine.makeShoppingList(index).slice(0,listSize),visitedATMs:new Set()}]));room.mall={status:'playing',turnOrder,turnIndex:0,players,phase:'director',movesRemaining:0,sale:null,winnerId:null,sequence:1,announcement:`The mall is open with the ${room.mallChallenge.toLowerCase()}! ${players.get(turnOrder[0]).name}, press the Electronic Mall Director.`}}
function emitMallState(room,cue=null){for(const[id,member]of room.players)if(member.socketId)io.to(member.socketId).emit('mall-state',{game:publicMallGame(room,id),cue})}
function advanceMallTurn(game){game.turnIndex=(game.turnIndex+1)%game.turnOrder.length;game.phase='director';game.movesRemaining=0;return game.players.get(game.turnOrder[game.turnIndex])}
function advanceDominoTurn(game){game.turnIndex=(game.turnIndex+1)%game.turnOrder.length;return game.players.get(game.turnOrder[game.turnIndex])}
function finishBlockedDominoRound(game){const ranked=game.turnOrder.map(id=>({id,player:game.players.get(id),pips:DominoesEngine.pipTotal(game.players.get(id).hand)})).sort((a,b)=>a.pips-b.pips);const winner=ranked[0],award=ranked.slice(1).reduce((sum,item)=>sum+item.pips,0);winner.player.score+=award;game.status='finished';game.winnerId=winner.id;game.announcement=`The board is blocked. ${winner.player.name} has the lowest hand with ${winner.pips} pips and wins ${award} points.`}

function joinSocketToRoom(socket, room, playerId, playerName) {
  const existing = room.players.get(playerId);
  if (existing?.socketId && existing.socketId !== socket.id) {
    const staleSocket = io.sockets.sockets.get(existing.socketId);
    if (staleSocket) {
      staleSocket.leave(room.code);
      if (staleSocket.data.roomCode === room.code) delete staleSocket.data.roomCode;
      staleSocket.emit('room-session-replaced', { message: 'This game was opened in another window. This window is no longer controlling the player.' });
    }
  }
  room.players.set(playerId, { name: String(playerName || existing?.name || socket.data.username).slice(0, 24), socketId: socket.id });
  if (existing?.disconnectTimer) clearTimeout(existing.disconnectTimer);
  socket.join(room.code);
  socket.data.roomCode = room.code;
  socket.data.playerId = playerId;
}

io.on('connection', (socket) => {
  socket.on('authenticate-computer', (data = {}, callback) => {
    const code=String(data.roomCode||'').trim().toUpperCase(),room=rooms.get(code),expected=computerSecrets.get(code);
    if(!room||!expected||data.secret!==expected)return acknowledge(callback,{ok:false,error:'Computer player authorization failed.'});
    const playerId=`computer-${code.toLowerCase()}`;socket.data.playerId=playerId;socket.data.username='Computer Player';socket.data.isComputer=true;joinSocketToRoom(socket,room,playerId,'Computer Player');computerSecrets.delete(code);
    if(room.game==='Monopoly Multi-Edition'){const taken=new Set([...room.monopolyTokens.values()].map(token=>token.id)),token=(MonopolyBoards.tokens[room.monopolyEdition]||[]).find(item=>!taken.has(item.id));if(token)room.monopolyTokens.set(playerId,{...token})}
    if(room.game==='Duck Race')room.raceSelections.set(playerId,{type:'Rubber Duck',color:'Yellow'});
    if(room.game==='Horse Race')room.raceSelections.set(playerId,{type:'Miniature Horse',color:'Palomino'});
    io.to(code).emit('lobby-updated',publicRoom(room));broadcastGames();acknowledge(callback,{ok:true,playerId,room:publicRoom(room)});
  });
  socket.on('add-computer-player', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;
    if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the table host can add the computer player.'});
    if(room.players.has(`computer-${room.code.toLowerCase()}`))return acknowledge(callback,{ok:true,message:'The computer player is already in this game.'});
    if(publicRoom(room).status!=='waiting')return acknowledge(callback,{ok:false,error:'Add the computer player before starting the game.'});
    const secret=crypto.randomBytes(24).toString('hex');computerSecrets.set(room.code,secret);let answered=false;
    const answer=result=>{if(answered)return;answered=true;acknowledge(callback,result)};
    const activePort=server.address()?.port||PORT,bot=startComputerPlayer({url:`http://127.0.0.1:${activePort}`,roomCode:room.code,secret,onReady:result=>answer({ok:true,message:'Computer Player joined the game.',playerId:result.playerId})});computerSockets.set(room.code,bot);
    setTimeout(()=>{if(computerSecrets.get(room.code)===secret){computerSecrets.delete(room.code);answer({ok:false,error:'The computer player could not join. Please try again.'})}},5000);
  });
  socket.on('register', async (data = {}, callback) => {
    const username = String(data.username || '').trim();
    const password = data.password;
    const validationError = validateCredentials(username, password);
    if (validationError) return acknowledge(callback, { ok: false, error: validationError });
    try {
      const result = await registerUser(username, password);
      if (!result.ok) return acknowledge(callback, result);
      const token = authenticateSocket(socket, result);
      acknowledge(callback, { ok: true, username: result.username, token, message: `Registration successful. Welcome, ${result.username}.` });
      socket.emit('available-games', publicGames());
    } catch (error) {
      console.error('Registration failed:', error);
      acknowledge(callback, { ok: false, error: 'Registration could not be completed.' });
    }
  });

  socket.on('login', async (data = {}, callback) => {
    const username = String(data.username || '').trim();
    const password = data.password;
    if (!username || typeof password !== 'string') return acknowledge(callback, { ok: false, error: 'Enter your username and password.' });
    try {
      const account = await verifyUser(username, password);
      if (!account) return acknowledge(callback, { ok: false, error: 'Incorrect username or password.' });
      const token = authenticateSocket(socket, account);
      acknowledge(callback, { ok: true, username: account.username, token, message: `Login successful. Welcome back, ${account.username}.` });
      socket.emit('available-games', publicGames());
    } catch (error) {
      console.error('Login failed:', error);
      acknowledge(callback, { ok: false, error: 'Login could not be completed.' });
    }
  });

  socket.on('authenticate-token', (data = {}, callback) => {
    const token = String(data.token || '');
    const account = sessions.get(token);
    if (!account || account.expiresAt < Date.now()) {
      sessions.delete(token);
      return acknowledge(callback, { ok: false, error: 'Your login session has expired. Return to the lounge and log in again.' });
    }
    socket.data.playerId = account.key;
    socket.data.username = account.username;
    socket.data.sessionToken = token;
    acknowledge(callback, { ok: true, username: account.username });
  });

  socket.on('logout', (_data, callback) => {
    if (socket.data.sessionToken) sessions.delete(socket.data.sessionToken);
    if (socket.data.roomCode) leaveCurrentRoom(socket, true);
    delete socket.data.playerId;
    delete socket.data.username;
    delete socket.data.sessionToken;
    acknowledge(callback, { ok: true });
  });

  socket.on('create-game', (data = {}, callback) => {
    if (!requireAuthentication(socket, callback)) return;
    if (socket.data.roomCode) leaveCurrentRoom(socket, true);
    const code = makeRoomCode();
    const playerId = socket.data.playerId;
    const requestedCategory = String(data.category || '').trim();
    const categoryEntry = Object.entries(LOBBY_GAMES).find(([, definition]) => definition.category === requestedCategory);
    const requestedDisplayGame = categoryEntry?.[0] || String(data.displayGame || '').trim();
    const lobbyDefinition = LOBBY_GAMES[requestedDisplayGame];
    const requestedGame = lobbyDefinition?.serverName || String(data.game || 'Duck Race').slice(0, 40);
    const edition = MonopolyBoards.editions.includes(data.edition) ? data.edition : 'Classic';
    const unoVariant=UnoRules.VARIANTS.includes(data.unoVariant)?data.unoVariant:(lobbyDefinition?.unoVariant || 'Classic Uno');
    const lifeTheme=LifeThemes.themes.includes(data.lifeTheme)?data.lifeTheme:'Classic 1960';
    const dominoSet=Object.hasOwn(DominoesEngine.SETS,data.dominoSet)?data.dominoSet:'Double-Six',dominoMode=DominoesEngine.MODES.includes(data.dominoMode)?data.dominoMode:'Draw Game';
    const room = { code, hostId: playerId, game: requestedGame, displayGame: requestedDisplayGame, raceSelections:new Map(), raceSettings:{startingCards:3,startingFeathers:5}, monopolyEdition: requestedGame === 'Monopoly Multi-Edition' ? edition : null, monopolyTokens: requestedGame === 'Monopoly Multi-Edition' ? new Map() : null, unoVariant: requestedGame === 'Accessible Uno & Dos Lounge' ? unoVariant : null, lifeTheme: requestedGame === 'The Game of Life Lounge' ? lifeTheme : null, dominoSet: requestedGame === 'Accessible Dominoes Lounge' ? dominoSet : null, dominoMode: requestedGame === 'Accessible Dominoes Lounge' ? dominoMode : null, skipboPace: requestedGame === 'Accessible Skip-Bo Lounge' ? 'Standard game' : null, mallChallenge: requestedGame === 'Accessible Mall Madness Lounge' ? 'Standard shopping list' : null, players: new Map(), gameState: {}, ducksRace: null, monopoly: null, uno: null, life: null, derby: null, dominoes: null, skipbo: null, mall: null };
    rooms.set(code, room);
    joinSocketToRoom(socket, room, playerId, socket.data.username);
    acknowledge(callback, { ok: true, room: publicRoom(room) });
    io.to(code).emit('lobby-updated', publicRoom(room));
    broadcastGames();
  });

  socket.on('join-game', (data = {}, callback) => {
    if (!requireAuthentication(socket, callback)) return;
    const code = String(data.gameId || '').trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) return acknowledge(callback, { ok: false, error: 'That game is no longer available.' });
    const playerId = socket.data.playerId;
    const lobbyEntry = room.displayGame && LOBBY_GAMES[room.displayGame] ? [room.displayGame, LOBBY_GAMES[room.displayGame]] : lobbyGameForServerName(room.game);
    const maxPlayers = lobbyEntry?.[1].maxPlayers || 6;
    if (room.players.size >= maxPlayers && !room.players.has(playerId)) return acknowledge(callback, { ok: false, error: `That table is full. It supports ${maxPlayers} players.` });
    if (room.monopoly?.status === 'playing' && !room.monopoly.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Monopoly game has already started.' });
    if (room.uno?.status === 'playing' && !room.uno.players.some(player=>player.id===playerId)) return acknowledge(callback, { ok: false, error: 'This UNO game has already started.' });
    if (room.life?.status === 'playing' && !room.life.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Life game has already started.' });
    if (room.derby?.status === 'playing' && !room.derby.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Horse Race has already started.' });
    if (room.dominoes?.status === 'playing' && !room.dominoes.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Dominoes game has already started.' });
    if (room.skipbo?.status === 'playing' && !room.skipbo.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Skip-Bo game has already started.' });
    if (room.mall?.status === 'playing' && !room.mall.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Mall Madness game has already started.' });
    if (room.game === 'Monopoly Multi-Edition' && room.players.size >= 6 && !room.players.has(playerId)) return acknowledge(callback, { ok: false, error: 'This Monopoly room is full. All six themed tokens are assigned.' });
    if (socket.data.roomCode && socket.data.roomCode !== code) leaveCurrentRoom(socket, true);
    joinSocketToRoom(socket, room, playerId, socket.data.username);
    if (room.ducksRace && !room.ducksRace.ducks.has(playerId)) {
      room.ducksRace.turnOrder.push(playerId);
      room.ducksRace.ducks.set(playerId, makeDuck(room.players.get(playerId).name));
      room.ducksRace.announcement = `${room.players.get(playerId).name} joined the race on square 1.`;
      room.ducksRace.sequence += 1;
    }
    acknowledge(callback, { ok: true, room: publicRoom(room) });
    io.to(code).emit('lobby-updated', publicRoom(room));
    io.to(code).emit('table-player-joined', { message: `${room.players.get(playerId).name} joined. ${room.players.size} of ${maxPlayers} players.`, playerId, playerCount: room.players.size, maxPlayers });
    if (room.ducksRace) emitDuckState(room);
    if (room.monopoly) emitMonopolyState(room);
    if (room.uno) emitUnoState(room);
    if (room.life) emitLifeState(room);
    if (room.derby) emitDerbyState(room);
    if (room.dominoes) emitDominoState(room);
    if (room.skipbo) emitSkipBoState(room);
    if (room.mall) emitMallState(room);
    broadcastGames();
  });

  socket.on('list-games', (_data, callback) => {
    if (!requireAuthentication(socket, callback)) return;
    acknowledge(callback, { ok: true, games: publicGames() });
  });

  socket.on('get-active-rooms', () => {
    socket.emit('update-room-list', publicGames());
  });

  socket.on('get-game-tables', (data = {}, callback) => {
    if (!requireAuthentication(socket, callback)) return;
    const category = String(data.category || '').trim();
    const categoryEntry = Object.entries(LOBBY_GAMES).find(([, definition]) => definition.category === category);
    const displayGame = categoryEntry?.[0] || String(data.game || '').trim();
    if (!LOBBY_GAMES[displayGame]) return acknowledge(callback, { ok: false, error: 'Choose a game from the main menu.' });
    const tables = publicGames().filter(game => game.displayGame === displayGame && game.status === 'waiting' && game.playerCount < game.maxPlayers);
    acknowledge(callback, { ok: true, game: displayGame, tables });
  });

  socket.on('start-game', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    if (room.hostId !== socket.data.playerId) return acknowledge(callback, { ok: false, error: 'Only the table host can start the game.' });
    const lobbyEntry = room.displayGame && LOBBY_GAMES[room.displayGame] ? [room.displayGame, LOBBY_GAMES[room.displayGame]] : lobbyGameForServerName(room.game);
    if (!lobbyEntry) return acknowledge(callback, { ok: false, error: 'This table does not support the unified start command.' });
    const destination = `${lobbyEntry[1].page}?game=${encodeURIComponent(room.code)}`;
    io.to(room.code).emit('game-started', { game: lobbyEntry[0], destination, cue: 'horn', message: `Entering ${lobbyEntry[0]}. Listen to or skip the instructions, then the host can start the game.` });
    acknowledge(callback, { ok: true, destination });
  });

  socket.on('start-ducks-race', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    if (room.game !== 'Duck Race') return acknowledge(callback, { ok: false, error: 'This room is not set to Duck Race.' });
    if (room.hostId !== socket.data.playerId) return acknowledge(callback, { ok: false, error: 'Only the host can start the race.' });
    beginDucksRace(room);
    emitDuckState(room, { type: 'card', square: 1 });
    acknowledge(callback, { ok: true, game: publicDuckGame(room) });
  });

  socket.on('start-monopoly', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    if (room.game !== 'Monopoly Multi-Edition') return acknowledge(callback, { ok: false, error: 'This is not a Monopoly room.' });
    if (room.hostId !== socket.data.playerId) return acknowledge(callback, { ok: false, error: 'Only the room creator can start Monopoly.' });
    if (room.players.size < 2) return acknowledge(callback, { ok: false, error: 'Monopoly needs at least two players.' });
    if (room.monopoly?.status === 'playing') return acknowledge(callback, { ok: false, error: 'Monopoly has already started.' });
    const missingToken = [...room.players.keys()].find(id => !room.monopolyTokens.get(id));
    if (missingToken) return acknowledge(callback, { ok: false, error: `${room.players.get(missingToken).name} must choose a themed token before the game starts.` });
    beginMonopoly(room);
    emitMonopolyState(room);
    broadcastGames();
    acknowledge(callback, { ok: true, game: publicMonopolyGame(room) });
  });

  socket.on('monopoly-select-token', (data = {}, callback) => {
    const room = roomForPlayer(socket, callback); if (!room) return;
    if (room.game !== 'Monopoly Multi-Edition') return acknowledge(callback, { ok: false, error: 'This is not a Monopoly room.' });
    if (room.monopoly?.status === 'playing') return acknowledge(callback, { ok: false, error: 'Tokens cannot be changed after Monopoly starts.' });
    const available = MonopolyBoards.tokens[room.monopolyEdition] || [];
    const selected = available.find(token => token.id === String(data.tokenId || ''));
    if (!selected) return acknowledge(callback, { ok: false, error: 'Choose one of this board’s six themed tokens.' });
    const takenBy = [...room.monopolyTokens.entries()].find(([id, token]) => id !== socket.data.playerId && token.id === selected.id);
    if (takenBy) return acknowledge(callback, { ok: false, error: `${selected.name} is already selected by ${room.players.get(takenBy[0])?.name || 'another player'}.` });
    room.monopolyTokens.set(socket.data.playerId, { ...selected });
    io.to(room.code).emit('lobby-updated', publicRoom(room));
    acknowledge(callback, { ok: true, token: selected, message: `${selected.name} selected.` });
  });

  socket.on('start-uno', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;
    if(room.game!=='Accessible Uno & Dos Lounge')return acknowledge(callback,{ok:false,error:'This is not an UNO room.'});
    if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can start.'});
    if(room.players.size<2)return acknowledge(callback,{ok:false,error:'UNO needs at least two players.'});
    if(room.uno?.status==='playing')return acknowledge(callback,{ok:false,error:'The game already started.'});
    beginUno(room);emitUnoState(room,{type:'card'});broadcastGames();acknowledge(callback,{ok:true,game:publicUnoGame(room,socket.data.playerId)});
  });

  socket.on('start-life', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;
    if(room.game!=='The Game of Life Lounge')return acknowledge(callback,{ok:false,error:'This is not a Life room.'});
    if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can start Life.'});
    if(room.players.size<2)return acknowledge(callback,{ok:false,error:'The Game of Life needs at least two players.'});
    if(room.life?.status==='playing')return acknowledge(callback,{ok:false,error:'Life has already started.'});
    beginLife(room);emitLifeState(room,{type:'career'});broadcastGames();acknowledge(callback,{ok:true,game:publicLifeGame(room,socket.data.playerId)});
  });

  socket.on('start-derby', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;
    if(room.game!=='Horse Race')return acknowledge(callback,{ok:false,error:'This is not a Horse Race room.'});
    if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can start the Derby.'});
    if(room.players.size<2)return acknowledge(callback,{ok:false,error:'Horse Race needs at least two players.'});
    if(room.derby?.status==='playing')return acknowledge(callback,{ok:false,error:'The Derby has already started.'});
    beginDerby(room);emitDerbyState(room,{type:'move',terrain:'Normal Turf'});broadcastGames();acknowledge(callback,{ok:true,game:publicDerbyGame(room,socket.data.playerId)});
  });

  socket.on('start-dominoes',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;if(room.game!=='Accessible Dominoes Lounge')return acknowledge(callback,{ok:false,error:'This is not a Dominoes room.'});if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can start Dominoes.'});if(room.players.size<2)return acknowledge(callback,{ok:false,error:'Dominoes needs at least two players.'});if(room.dominoes?.status==='playing')return acknowledge(callback,{ok:false,error:'Dominoes has already started.'});beginDominoes(room);emitDominoState(room,{type:'shuffle'});broadcastGames();acknowledge(callback,{ok:true,game:publicDominoGame(room,socket.data.playerId)})});
  socket.on('domino-play',(data={},callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.dominoes,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Dominoes');if(validationError)return acknowledge(callback,{ok:false,error:validationError});const player=game.players.get(playerId),index=player.hand.findIndex(tile=>tile.id===String(data.tileId||''));if(index<0)return acknowledge(callback,{ok:false,error:'Choose a tile from your private hand.'});let board;try{board=DominoesEngine.placeTile(game.board,player.hand[index],String(data.end||''),data.flipped===true)}catch(error){return acknowledge(callback,{ok:false,error:error.message})}const played=DominoesEngine.oriented(player.hand[index],data.flipped===true);player.hand.splice(index,1);game.board=board;game.passCount=0;const bonus=game.mode==='All Fives'?DominoesEngine.allFivesScore(game.board):0;if(bonus)player.score+=bonus;let story=`${player.name} played ${played.left}-${played.right} on the ${data.end} end.`;if(bonus)story+=` Open ends total ${bonus}, scoring ${bonus} All Fives points!`;if(!player.hand.length){const award=game.turnOrder.filter(id=>id!==playerId).reduce((sum,id)=>sum+DominoesEngine.pipTotal(game.players.get(id).hand),0);player.score+=award;game.status='finished';game.winnerId=playerId;game.announcement=`${story} ${player.name} emptied the hand and wins ${award} closing points.`;game.sequence+=1;emitDominoState(room,{type:bonus?'score':'place',bonus});broadcastGames();return acknowledge(callback,{ok:true})}const next=advanceDominoTurn(game);game.announcement=`${story} ${next.name} now has the turn.`;game.sequence+=1;emitDominoState(room,{type:bonus?'score':'place',bonus});acknowledge(callback,{ok:true})});
  socket.on('domino-draw',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.dominoes,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Dominoes');if(validationError)return acknowledge(callback,{ok:false,error:validationError});const player=game.players.get(playerId);if(DominoesEngine.hasMove(player.hand,game.board))return acknowledge(callback,{ok:false,error:'You have a playable tile. Play it before drawing or passing.'});if(game.mode!=='Block Game'&&game.boneyard.length){player.hand.push(game.boneyard.pop());game.passCount=0;if(DominoesEngine.hasMove(player.hand,game.board)){game.announcement=`${player.name} drew a playable tile and keeps the turn.`;}else if(game.boneyard.length){game.announcement=`${player.name} drew from the boneyard and may draw again.`;}else{const next=advanceDominoTurn(game);game.passCount=1;game.announcement=`${player.name} drew the final tile but still cannot play. ${next.name} now has the turn.`}game.sequence+=1;emitDominoState(room,{type:'draw'});return acknowledge(callback,{ok:true})}game.passCount+=1;if(game.passCount>=game.turnOrder.length){finishBlockedDominoRound(game);game.sequence+=1;emitDominoState(room,{type:'place'});broadcastGames();return acknowledge(callback,{ok:true})}const next=advanceDominoTurn(game);game.announcement=`${player.name} cannot play and passes. ${next.name} now has the turn.`;game.sequence+=1;emitDominoState(room,{type:'place'});acknowledge(callback,{ok:true})});

  socket.on('start-skipbo',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;if(room.game!=='Accessible Skip-Bo Lounge')return acknowledge(callback,{ok:false,error:'This is not a Skip-Bo room.'});if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can start Skip-Bo.'});if(room.players.size<2)return acknowledge(callback,{ok:false,error:'Skip-Bo needs at least two players.'});if(room.players.size>6)return acknowledge(callback,{ok:false,error:'Skip-Bo supports up to six players.'});if(room.skipbo?.status==='playing')return acknowledge(callback,{ok:false,error:'Skip-Bo has already started.'});beginSkipBo(room);emitSkipBoState(room,{type:'draw'});broadcastGames();acknowledge(callback,{ok:true,game:publicSkipBoGame(room,socket.data.playerId)})});
  socket.on('skipbo-play',(data={},callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.skipbo,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Skip-Bo');if(validationError)return acknowledge(callback,{ok:false,error:validationError});const player=game.players.get(playerId),source=String(data.source||''),sourceIndex=Number(data.sourceIndex),targetType=String(data.targetType||''),targetIndex=Number(data.targetIndex);let sourcePile;if(source==='hand')sourcePile=player.hand;else if(source==='stock')sourcePile=player.stock;else if(source==='discard'&&Number.isInteger(sourceIndex)&&sourceIndex>=0&&sourceIndex<4)sourcePile=player.discards[sourceIndex];else return acknowledge(callback,{ok:false,error:'Choose a card from your hand, stock, or one of your four discard piles.'});if(!sourcePile.length)return acknowledge(callback,{ok:false,error:'That source pile is empty.'});const card=source==='hand'?sourcePile[sourceIndex]:sourcePile.at(-1);if(!card||!sourcePile.some(item=>item.id===card.id))return acknowledge(callback,{ok:false,error:'That private card is no longer available.'});if(targetType==='discard'){if(source!=='hand')return acknowledge(callback,{ok:false,error:'Only a hand card may be placed on a personal discard pile.'});if(!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=4)return acknowledge(callback,{ok:false,error:'Choose discard pile D1 through D4.'});sourcePile.splice(sourceIndex,1);player.discards[targetIndex].push(card);const{next,drawn}=nextSkipBoTurn(game);game.announcement=`${player.name} discarded ${SkipBoEngine.cardLabel(card)} to discard pile ${targetIndex+1}, ending the turn. ${next.name} drew ${drawn} card${drawn===1?'':'s'} and now has the turn.`;game.sequence+=1;emitSkipBoState(room,{type:'place'});return acknowledge(callback,{ok:true})}if(targetType!=='building'||!Number.isInteger(targetIndex)||targetIndex<0||targetIndex>=4)return acknowledge(callback,{ok:false,error:'Choose building pile B1 through B4 or discard pile D1 through D4.'});let result;try{result=SkipBoEngine.playToBuilding(card,game.buildingPiles[targetIndex])}catch(error){return acknowledge(callback,{ok:false,error:error.message})}if(source==='hand')sourcePile.splice(sourceIndex,1);else sourcePile.pop();if(result.completed)game.completed.push(...game.buildingPiles[targetIndex],{...card,playedAs:12});game.buildingPiles[targetIndex]=result.pile;let story=`${player.name} played ${SkipBoEngine.cardLabel(card)} as ${result.playedAs} on building pile ${targetIndex+1}.`;if(result.completed)story+=' The completed pile was swept.';if(source==='stock'&&!player.stock.length){game.status='finished';game.winnerId=playerId;game.announcement=`${story} ${player.name} emptied the stock pile and wins!`;game.sequence+=1;emitSkipBoState(room,{type:'victory'});broadcastGames();return acknowledge(callback,{ok:true})}let drawn=0;if(source==='hand'&&!player.hand.length)drawn=refillSkipBo(game,player);if(drawn)story+=` The empty hand automatically replenished with ${drawn} cards.`;game.announcement=story;game.sequence+=1;emitSkipBoState(room,{type:result.completed?'sweep':'place'});acknowledge(callback,{ok:true})});

  socket.on('start-mall',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;if(room.game!=='Accessible Mall Madness Lounge')return acknowledge(callback,{ok:false,error:'This is not a Mall Madness room.'});if(room.hostId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'Only the room creator can open the mall.'});if(room.players.size<2)return acknowledge(callback,{ok:false,error:'Mall Madness needs at least two shoppers.'});if(room.mall?.status==='playing')return acknowledge(callback,{ok:false,error:'The mall is already open.'});beginMall(room);emitMallState(room,{type:'pa'});broadcastGames();acknowledge(callback,{ok:true,game:publicMallGame(room,socket.data.playerId)})});
  socket.on('mall-director',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.mall,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Mall Madness');if(validationError)return acknowledge(callback,{ok:false,error:validationError});if(game.phase!=='director')return acknowledge(callback,{ok:false,error:'The Electronic Mall Director has already assigned this turn.'});const player=game.players.get(playerId),event=MallMadnessEngine.director();if(event.type==='move'){game.phase='moving';game.movesRemaining=event.count;game.announcement=`${player.name} received ${event.count} movement space${event.count===1?'':'s'}. Use the Arrow Keys to move.`;game.sequence+=1;emitMallState(room,{type:'director'});return acknowledge(callback,{ok:true})}if(event.type==='sale')game.sale={category:event.category,discount:event.discount};const next=advanceMallTurn(game);game.announcement=`Mall announcement: ${event.message} ${next.name}, press the Electronic Mall Director.`;game.sequence+=1;emitMallState(room,{type:'pa'});acknowledge(callback,{ok:true})});
  socket.on('mall-move',(data={},callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.mall,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Mall Madness');if(validationError)return acknowledge(callback,{ok:false,error:validationError});if(game.phase!=='moving'||game.movesRemaining<1)return acknowledge(callback,{ok:false,error:'Press S for the Electronic Mall Director before moving.'});const player=game.players.get(playerId);let destination;try{destination=MallMadnessEngine.move(player.position,String(data.direction||''))}catch(error){return acknowledge(callback,{ok:false,error:error.message})}if(destination===10)destination=32;else if(destination===32)destination=10;player.position=destination;game.movesRemaining-=1;const space=MallMadnessEngine.space(destination);let story=`${player.name} moved to ${space.name}. ${game.movesRemaining} movement space${game.movesRemaining===1?'':'s'} remain.`;if(space.type==='escalator')story+=` The escalator carried ${player.name} across the mall.`;if(game.movesRemaining===0){if(['store','atm'].includes(space.type)){game.phase='action';story+=' Press Enter to swipe your card.'}else{const next=advanceMallTurn(game);story+=` ${next.name}, press the Electronic Mall Director.`}}game.announcement=story;game.sequence+=1;emitMallState(room,{type:space.type==='escalator'?'escalator':'move'});acknowledge(callback,{ok:true})});
  socket.on('mall-action',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.mall,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Mall Madness');if(validationError)return acknowledge(callback,{ok:false,error:validationError});if(!['moving','action'].includes(game.phase))return acknowledge(callback,{ok:false,error:'Press S and move to a store or ATM before swiping.'});const player=game.players.get(playerId),space=MallMadnessEngine.space(player.position);if(space.type==='atm'){let added=0;if(!player.visitedATMs.has(space.id)){player.visitedATMs.add(space.id);player.cash+=50;added=50}const next=advanceMallTurn(game);game.announcement=added?`${player.name} used ${space.name} and counted $50 in cash. Balance: $${player.cash}. ${next.name}, press the Electronic Mall Director.`:`${player.name} already used this ATM. ${next.name}, press the Electronic Mall Director.`;game.sequence+=1;emitMallState(room,{type:'atm'});return acknowledge(callback,{ok:true})}if(space.type!=='store')return acknowledge(callback,{ok:false,error:'There is no store entrance or ATM on this space.'});const item=player.shoppingList.find(entry=>entry.storeId===space.id&&!entry.bought),next=advanceMallTurn(game);if(!item){game.announcement=`${player.name} swiped at ${space.name}, but no needed item was available. ${next.name}, press the Electronic Mall Director.`;game.sequence+=1;emitMallState(room,{type:'swipe'});return acknowledge(callback,{ok:true})}const price=MallMadnessEngine.priceFor(item,game.sale);if(player.cash<price){game.announcement=`${player.name} cannot afford ${item.item} for $${price}. Balance: $${player.cash}. ${next.name}, press the Electronic Mall Director.`;game.sequence+=1;emitMallState(room,{type:'swipe'});return acknowledge(callback,{ok:true})}player.cash-=price;item.bought=true;const remaining=player.shoppingList.filter(entry=>!entry.bought).length;if(!remaining){game.status='finished';game.winnerId=playerId;game.announcement=`${player.name} bought ${item.item} at ${space.name} for $${price}, completed the shopping list, and wins Mall Madness!`;game.sequence+=1;emitMallState(room,{type:'victory'});broadcastGames();return acknowledge(callback,{ok:true})}game.announcement=`${player.name} bought ${item.item} at ${space.name} for $${price}. ${remaining} items remain. ${next.name}, press the Electronic Mall Director.`;game.sequence+=1;emitMallState(room,{type:'register'});acknowledge(callback,{ok:true})});

  socket.on('derby-draw', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;const game=room.derby,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Horse Race');if(validationError)return acknowledge(callback,{ok:false,error:validationError});if(game.sabotagePlays>0)return acknowledge(callback,{ok:false,error:'Play one more Sabotage card or end the Sabotage turn.'});const player=game.players.get(playerId);if(player.hand.length>=DerbyEngine.HAND_LIMIT)return acknowledge(callback,{ok:false,error:'Your hand is full. Play a card before drawing.'});player.hand.push(dealDerbyCard(game));const next=advanceDerbyTurn(game);game.announcement=`${player.name} drew an Action Card. ${next.name} now has the turn.`;game.sequence+=1;emitDerbyState(room,{type:'draw',activeLap:game.activeLap});acknowledge(callback,{ok:true});
  });

  socket.on('derby-roll', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    const game = room.derby;
    const playerId = socket.data.playerId;
    const validationError = turnError(game, playerId, game?.turnOrder[game.turnIndex], 'Horse Race');
    if (validationError) return acknowledge(callback, { ok: false, error: validationError });
    if (game.sabotagePlays > 0) return acknowledge(callback, { ok: false, error: 'Play one more Sabotage card or end the Sabotage turn.' });

    const player = game.players.get(playerId);
    const roll = Math.floor(Math.random() * 6) + 1;
    let position = player.position;
    let crossedFinish = false;
    const effects = [];

    const moveForward = steps => {
      for (let step = 0; step < steps; step += 1) {
        position += 1;
        if (position >= DerbyEngine.TRACK.length) {
          position = 0;
          player.completedLaps += 1;
          crossedFinish = true;
        }
      }
    };

    moveForward(roll);

    const mudHazards = [...player.mudHazards];
    const leaderPosition = Math.max(...game.turnOrder.filter(id => game.players.has(id)).map(id => game.players.get(id).position));
    let terrain = DerbyEngine.terrainAt(position, mudHazards, game.activeLap, game.lapHazards);

    if (terrain === 'Deep Turf') {
      effects.push('Deep Turf knocked the horse back 1 space.');
      const mudSpace = position + 1;
      if (player.mudHazards.has(mudSpace)) player.mudHazards.delete(mudSpace);
      position = Math.max(0, position - 1);
      terrain = DerbyEngine.terrainAt(position, [...player.mudHazards], game.activeLap, game.lapHazards);
    }
    if (terrain === 'Hurdle' && game.activeLap === 3) {
      effects.push('Towering Hurdles knocked the horse back 2 spaces.');
      position = Math.max(0, position - 2);
      terrain = DerbyEngine.terrainAt(position, [...player.mudHazards], game.activeLap, game.lapHazards);
    }
    if (terrain === 'Sugar Boost') {
      effects.push('Sugar Boost pushed the horse forward 2 additional spaces.');
      moveForward(2);
      terrain = DerbyEngine.terrainAt(position, [...player.mudHazards], game.activeLap, game.lapHazards);
    }
    if (terrain === 'Wind Pocket') {
      const drafted = Math.max(position, leaderPosition);
      if (drafted !== position) effects.push(`Wind Pocket drafted the horse to space ${drafted + 1}.`);
      position = drafted;
      terrain = DerbyEngine.terrainAt(position, [...player.mudHazards], game.activeLap, game.lapHazards);
    }

    player.position = position;

    let story = `${player.name} rolled ${roll} and reached space ${player.position + 1}, ${terrain}.`;
    if (effects.length) story += ` ${effects.join(' ')}`;
    if (crossedFinish) story += ` Completed lap ${player.completedLaps} of ${DerbyEngine.TOTAL_LAPS}.`;

    if (player.completedLaps >= DerbyEngine.TOTAL_LAPS) {
      game.status = 'finished';
      game.winnerId = playerId;
      game.announcement = `${story} ${player.name} wins the six-lap Horse Race!`;
      game.sequence += 1;
      emitDerbyState(room, { type: 'finish', terrain, lapComplete: true, activeLap: game.activeLap });
      broadcastGames();
      return acknowledge(callback, { ok: true, roll });
    }

    const newEvent = advanceDerbyLap(game, player);
    if (newEvent) {
      story += ` ${player.name} is first across the line! Lap ${game.activeLap} of 6 begins: ${newEvent.name}. ${newEvent.description}`;
    }

    const next = advanceDerbyTurn(game);
    game.announcement = `${story} ${next.name} now has the turn.`;
    game.sequence += 1;
    emitDerbyState(room, { type: 'dice', terrain, lapComplete: Boolean(newEvent), activeLap: game.activeLap });
    acknowledge(callback, { ok: true, roll });
  });

  socket.on('derby-play', (data={}, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;const game=room.derby,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Horse Race');if(validationError)return acknowledge(callback,{ok:false,error:validationError});const player=game.players.get(playerId),cardIndex=Number(data.cardIndex);if(!Number.isInteger(cardIndex)||cardIndex<0||cardIndex>=player.hand.length)return acknowledge(callback,{ok:false,error:'Choose a card from your private hand.'});const cardName=player.hand[cardIndex],card=DerbyEngine.CARDS[cardName];if(game.sabotagePlays>0&&!card.sabotage)return acknowledge(callback,{ok:false,error:'The optional second play must be another Sabotage card. Otherwise, end the turn.'});let story='',cue={type:'move',terrain:'Normal Turf'};
    try{
      if(card.target){const targetId=String(data.targetId||''),target=game.players.get(targetId);if(!target||targetId===playerId)return acknowledge(callback,{ok:false,error:'Choose another active horse as the target.'});if(cardName==='Lasso'){target.position=Math.max(0,target.position-3);story=`${player.name} played Lasso on ${target.name}, pulling that horse back to space ${target.position+1}.`;cue={type:'move',terrain:'Normal Turf'};}else{const hazard=DerbyEngine.nextMudSpace(target.position,[...target.mudHazards],game.activeLap,game.lapHazards);if(!hazard)return acknowledge(callback,{ok:false,error:'There is no normal turf left for a Mud Sling hazard.'});target.mudHazards.add(hazard);story=`${player.name} played Mud Sling on ${target.name}. Deep Turf now waits on space ${hazard} of that lane.`;cue={type:'move',terrain:'Deep Turf'};}}
      else{const leader=Math.max(...game.turnOrder.map(id=>game.players.get(id).position)),result=DerbyEngine.move(player.position,cardName,leader,[...player.mudHazards],game.activeLap,game.lapHazards);player.position=result.position;if(result.consumedMud)player.mudHazards.delete(result.consumedMud);if(result.crossedFinish)player.completedLaps+=1;story=`${player.name} played ${cardName} and reached space ${player.position+1}, ${result.landing.terrain}. ${result.effects.join(' ')}${result.crossedFinish?` Completed lap ${player.completedLaps} of ${DerbyEngine.TOTAL_LAPS}.`:''}`.trim();cue={type:'move',terrain:result.effects.some(effect=>effect.startsWith('Deep Turf'))?'Deep Turf':result.landing.terrain};}
    }catch(error){return acknowledge(callback,{ok:false,error:error.message})}
    player.hand.splice(cardIndex,1);if(card.discardHand)player.hand=[];if(player.completedLaps>=DerbyEngine.TOTAL_LAPS){game.status='finished';game.winnerId=playerId;game.announcement=`${story} ${player.name} wins the six-lap Horse Race!`;game.sequence+=1;emitDerbyState(room,{...cue,type:'finish',lapComplete:true,activeLap:game.activeLap});broadcastGames();return acknowledge(callback,{ok:true})}const newEvent=advanceDerbyLap(game,player);if(newEvent){story+=` ${player.name} is first across the line! Lap ${game.activeLap} of 6 begins: ${newEvent.name}. ${newEvent.description}`;cue={...cue,lapComplete:true,activeLap:game.activeLap,lapEvent:newEvent.name}}if(game.activeLap===6&&card.sabotage){game.sabotagePlays+=1;const canSabotageAgain=game.sabotagePlays<2&&player.hand.some(name=>DerbyEngine.CARDS[name].sabotage);if(canSabotageAgain){game.announcement=`${story} ${player.name} may play one more Sabotage card or end the turn.`;game.sequence+=1;emitDerbyState(room,cue);return acknowledge(callback,{ok:true,extraSabotage:true})}}const next=advanceDerbyTurn(game);game.announcement=`${story} ${next.name} now has the turn.`;game.sequence+=1;emitDerbyState(room,cue);acknowledge(callback,{ok:true});
  });

  socket.on('derby-end-turn', (_data, callback) => {const room=roomForPlayer(socket,callback);if(!room)return;const game=room.derby,playerId=socket.data.playerId,validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'Horse Race');if(validationError)return acknowledge(callback,{ok:false,error:validationError});if(game.activeLap!==6||game.sabotagePlays<1)return acknowledge(callback,{ok:false,error:'There is no extra Sabotage action to end.'});const player=game.players.get(playerId),next=advanceDerbyTurn(game);game.announcement=`${player.name} ended the Sabotage turn. ${next.name} now has the turn.`;game.sequence+=1;emitDerbyState(room,{type:'move',activeLap:game.activeLap});acknowledge(callback,{ok:true})});

  socket.on('life-spin', (_data, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;const game=room.life;const playerId=socket.data.playerId;
    const validationError=turnError(game,playerId,game?.turnOrder[game.turnIndex],'The Game of Life');if(validationError)return acknowledge(callback,{ok:false,error:validationError});
    if(game.pendingChoice)return acknowledge(callback,{ok:false,error:'Choose a route with Left or Right Arrow, then press Enter.'});
    const player=game.players.get(playerId),result=Math.floor(Math.random()*10)+1;let steps=result;
    while(steps>0){const space=game.board[player.position];if(space.next.length>1){game.pendingChoice={playerId,options:[...space.next]};break}if(!space.next.length)break;player.position=space.next[0];steps-=1;if(game.board[player.position].type==='fork'){game.pendingChoice={playerId,options:[...game.board[player.position].next]};break}}
    let secondary=null;if(game.pendingChoice){game.announcement=`${player.name} spun ${result} and reached ${game.board[player.position].name}. Choose a route with Left or Right Arrow, then press Enter.`;}else{secondary=applyLifeLanding(game,playerId);if(game.status==='playing'){const next=advanceLifeTurn(game);if(next)game.announcement+=` It is ${next.name}'s turn.`}}
    game.sequence+=1;emitLifeState(room,{type:'spinner',result,secondary});broadcastGames();acknowledge(callback,{ok:true,result});
  });

  socket.on('life-choose', (data={}, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;const game=room.life;const pending=game?.pendingChoice;
    if(!pending||pending.playerId!==socket.data.playerId)return acknowledge(callback,{ok:false,error:'No route choice is waiting for you.'});
    const choice=Number(data.choice);if(!Number.isInteger(choice)||choice<0||choice>=pending.options.length)return acknowledge(callback,{ok:false,error:'Choose one of the available routes.'});
    const player=game.players.get(socket.data.playerId);player.position=pending.options[choice];game.pendingChoice=null;const secondary=applyLifeLanding(game,socket.data.playerId);const next=advanceLifeTurn(game);if(next&&game.status==='playing')game.announcement+=` It is ${next.name}'s turn.`;game.sequence+=1;emitLifeState(room,{type:'route',secondary});broadcastGames();acknowledge(callback,{ok:true});
  });

  socket.on('uno-play',(data={},callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.uno;const validationError=turnError(game,socket.data.playerId,game?.players[game.turnIndex]?.id,'UNO');if(validationError)return acknowledge(callback,{ok:false,error:validationError});try{const result=UnoRules.play(game,socket.data.playerId,data.indexes,{color:data.color,centerIndex:data.centerIndex});emitUnoState(room,result.cue);broadcastGames();acknowledge(callback,{ok:true});}catch(error){acknowledge(callback,{ok:false,error:error.message});}});
  socket.on('uno-draw',(_data,callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;const game=room.uno;const validationError=turnError(game,socket.data.playerId,game?.players[game.turnIndex]?.id,'UNO');if(validationError)return acknowledge(callback,{ok:false,error:validationError});try{const result=UnoRules.draw(game,socket.data.playerId);emitUnoState(room,result.cue);broadcastGames();acknowledge(callback,{ok:true});}catch(error){acknowledge(callback,{ok:false,error:error.message});}});
  socket.on('uno-declare',(data={},callback)=>{const room=roomForPlayer(socket,callback);if(!room)return;try{const result=UnoRules.declare(room.uno,socket.data.playerId,String(data.word||'').toUpperCase());emitUnoState(room,result.cue);acknowledge(callback,{ok:true});}catch(error){acknowledge(callback,{ok:false,error:error.message});}});

  socket.on('monopoly-roll', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    const game = room.monopoly;
    const playerId = socket.data.playerId;
    const validationError = turnError(game, playerId, game?.turnOrder[game.turnIndex], 'Monopoly');
    if (validationError) return acknowledge(callback, { ok: false, error: validationError });
    if (game.pendingPurchase) return acknowledge(callback, { ok: false, error: 'Answer the purchase offer with Y or N first.' });
    const player = game.players.get(playerId);
    const dieOne = Math.floor(Math.random() * 6) + 1;
    const dieTwo = Math.floor(Math.random() * 6) + 1;
    const oldPosition = player.position;
    player.position = (player.position + dieOne + dieTwo) % 40;
    const passedGo = player.position < oldPosition;
    if (passedGo) player.balance += 200;
    let space = game.board[player.position];
    let story = `${player.name} rolled ${dieOne} and ${dieTwo}.${passedGo ? ` Passed GO and collected ${monopolyMoney(game, 200)}.` : ''} Landed on ${space.name}.`;
    let cue = { type: 'dice' };
    const ownerId = game.owners[space.index];
    if (space.type === 'Go to Jail') {
      player.position = 10; player.inJail = true; story += ' Go directly to Jail.'; cue.secondary = { type: 'jail' };
    } else if (space.type === 'Tax') {
      player.balance -= space.amount; story += ` Paid ${monopolyMoney(game, space.amount)} in tax.`; cue.secondary = { type: 'transaction', electronic: game.edition === 'Electronic Banking' };
    } else if (space.type === 'Chance' || space.type === 'Community Chest') {
      const amount = Math.random() < 0.5 ? 100 : -50; player.balance += amount;
      story += amount > 0 ? ` Received ${monopolyMoney(game, amount)}.` : ` Paid ${monopolyMoney(game, Math.abs(amount))}.`; cue.secondary = { type: 'transaction', electronic: game.edition === 'Electronic Banking' };
    } else if (space.price && ownerId && ownerId !== playerId) {
      const rent = MonopolyBoards.rentFor(game.board, game.owners, space, ownerId);
      player.balance -= rent; game.players.get(ownerId).balance += rent;
      story += ` Paid ${monopolyMoney(game, rent)} rent to ${game.players.get(ownerId).name}.`; cue.secondary = { type: 'transaction', electronic: game.edition === 'Electronic Banking' };
    } else if (space.price && !ownerId && player.balance >= space.price) {
      game.pendingPurchase = { playerId, spaceIndex: space.index };
      story += ` It is unowned and costs ${monopolyMoney(game, space.price)}. Press Y to buy or N to decline.`;
    }
    let next = null;
    if (!game.pendingPurchase) next = advanceMonopolyTurn(game);
    if (next) story += ` It is now ${next.name}'s turn.`;
    game.announcement = story; game.sequence += 1;
    emitMonopolyState(room, cue); acknowledge(callback, { ok: true });
  });

  socket.on('monopoly-purchase-response', (data = {}, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    const game = room.monopoly;
    const pending = game?.pendingPurchase;
    if (!pending || pending.playerId !== socket.data.playerId) return acknowledge(callback, { ok: false, error: 'There is no purchase for you to answer.' });
    const player = game.players.get(socket.data.playerId);
    const space = game.board[pending.spaceIndex];
    const accepted = data.accept === true;
    let cue = null;
    if (accepted && !game.owners[space.index] && player.balance >= space.price) {
      player.balance -= space.price; game.owners[space.index] = socket.data.playerId;
      const completeGroup = MonopolyBoards.ownsGroup(game.board, game.owners, socket.data.playerId, space.group);
      game.announcement = `${player.name} bought ${space.name} for ${monopolyMoney(game, space.price)}. It is in the ${space.group.replace('-', ' ')} group.${completeGroup ? ` ${player.name} completed the ${space.group.replace('-', ' ')} group!` : ` ${player.name} can press P to hear their properties and color-set progress.`}`;
      cue = { type: 'purchase', completeGroup, electronic: game.edition === 'Electronic Banking' };
    } else game.announcement = `${player.name} declined ${space.name}.`;
    const next = advanceMonopolyTurn(game);
    game.announcement += ` It is now ${next.name}'s turn.`; game.sequence += 1;
    emitMonopolyState(room, cue); acknowledge(callback, { ok: true });
  });

  socket.on('monopoly-trade-offer', (data = {}, callback) => {
    const room = roomForPlayer(socket, callback); if (!room) return;
    const game = room.monopoly; const fromId = socket.data.playerId; const toId = String(data.toId || '');
    const propertyIndex = Number(data.propertyIndex); const amount = Math.max(0, Math.floor(Number(data.amount) || 0));
    if (!game || game.status !== 'playing') return acknowledge(callback, { ok: false, error: 'Monopoly has not started.' });
    if (game.pendingTrade) return acknowledge(callback, { ok: false, error: 'Another trade offer is awaiting an answer.' });
    if (toId === fromId || !game.players.has(toId)) return acknowledge(callback, { ok: false, error: 'Choose another active player.' });
    if (game.owners[propertyIndex] !== fromId) return acknowledge(callback, { ok: false, error: 'You can only offer a property you own.' });
    if (game.players.get(toId).balance < amount) return acknowledge(callback, { ok: false, error: 'That player does not have enough balance for this offer.' });
    game.pendingTrade = { fromId, toId, propertyIndex, amount };
    game.announcement = `${game.players.get(fromId).name} offers ${game.board[propertyIndex].name} to ${game.players.get(toId).name} for ${monopolyMoney(game, amount)}. ${game.players.get(toId).name}, press Y to accept or N to decline.`;
    game.sequence += 1; emitMonopolyState(room); acknowledge(callback, { ok: true });
  });

  socket.on('monopoly-trade-response', (data = {}, callback) => {
    const room = roomForPlayer(socket, callback); if (!room) return;
    const game = room.monopoly; const trade = game?.pendingTrade;
    if (!trade || trade.toId !== socket.data.playerId) return acknowledge(callback, { ok: false, error: 'There is no trade offer for you to answer.' });
    const accepted = data.accept === true; const buyer = game.players.get(trade.toId); const seller = game.players.get(trade.fromId);
    if (accepted && seller && game.owners[trade.propertyIndex] === trade.fromId && buyer.balance >= trade.amount) {
      buyer.balance -= trade.amount; seller.balance += trade.amount; game.owners[trade.propertyIndex] = trade.toId;
      game.announcement = `${buyer.name} accepted the trade and bought ${game.board[trade.propertyIndex].name} from ${seller.name} for ${monopolyMoney(game, trade.amount)}.`;
      game.pendingTrade = null; game.sequence += 1; emitMonopolyState(room, { type: 'transaction', electronic: game.edition === 'Electronic Banking' });
    } else {
      game.announcement = `${buyer.name} declined the trade offer.`; game.pendingTrade = null; game.sequence += 1; emitMonopolyState(room);
    }
    acknowledge(callback, { ok: true });
  });

  socket.on('ducks-race-roll', (_data, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    const game = room.ducksRace;
    if (!game || game.status !== 'playing') return acknowledge(callback, { ok: false, error: 'The race has not started.' });
    const playerId = socket.data.playerId;
    if (game.turnOrder[game.turnIndex] !== playerId) return acknowledge(callback, { ok: false, error: 'Wait for your turn.' });

    const duck = game.ducks.get(playerId);
    const roll = Math.floor(Math.random() * 6) + 1;
    duck.distance += roll;
    duck.square = (duck.distance % BOARD_SIZE) + 1;
    const landingSquare = duck.square;
    const landedSpace = BOARD_SPACES[landingSquare - 1];
    let effectStory = landedSpace.description;
    let movementStory = '';
    let needsQuack = ['forward', 'backward', 'mud'].includes(landedSpace.effect);

    if (landedSpace.effect === 'feathers') {
      const gained = Math.floor(Math.random() * 2) + 1;
      duck.feathers += gained;
      effectStory = `You found a Feather Nest! Gained ${gained} feather${gained === 1 ? '' : 's'}.`;
    } else if (landedSpace.effect === 'forward') {
      duck.distance += 3;
      duck.square = (duck.distance % BOARD_SIZE) + 1;
      const finalSpace = BOARD_SPACES[duck.square - 1];
      movementStory = ` Moving to Space ${duck.square}: ${finalSpace.name}!`;
    } else if (landedSpace.effect === 'backward') {
      duck.distance = Math.max(0, duck.distance - 3);
      duck.square = (duck.distance % BOARD_SIZE) + 1;
      const finalSpace = BOARD_SPACES[duck.square - 1];
      movementStory = ` Moving to Space ${duck.square}: ${finalSpace.name}!`;
    } else if (landedSpace.effect === 'mud') {
      if (duck.shielded) {
        duck.shielded = false;
        effectStory = 'The Mud Trap sprung, but your Shield protected you. No feather lost.';
      } else {
        const lost = duck.feathers > 0 ? 1 : 0;
        duck.feathers -= lost;
        effectStory = lost ? 'Stuck in the mud! Lost 1 feather.' : 'Stuck in the mud, but you had no feather to lose.';
      }
    }

    const opponentOnFinalSpace = game.turnOrder.some(id => id !== playerId && game.ducks.get(id)?.square === duck.square);
    needsQuack ||= opponentOnFinalSpace;
    let announcement = `${duck.name} rolled ${roll}. ${duck.name} landed on Space ${landingSquare}: ${landedSpace.name}! ${effectStory}${movementStory}`;
    let localAnnouncement = `You rolled a ${roll}. You landed on Space ${landingSquare}: ${landedSpace.name}! ${effectStory}${movementStory}`;
    const cue = { type: 'dice', square: duck.square, actorId: playerId, localAnnouncement };
    if (needsQuack) cue.secondary = { type: 'quack', square: duck.square };

    if (duck.distance >= BOARD_SIZE) {
      game.status = 'finished';
      game.winnerId = playerId;
      const winStory = ` ${duck.name} completed the loop and wins Duck Race!`;
      announcement += winStory;
      localAnnouncement += ` You completed the loop and won Duck Race!`;
      cue.localAnnouncement = localAnnouncement;
    }

    if (game.status === 'playing') {
      game.turnIndex = (game.turnIndex + 1) % game.turnOrder.length;
      const next = game.ducks.get(game.turnOrder[game.turnIndex]);
      const turnStory = ` It is now ${next.name}'s turn.`;
      announcement += turnStory;
      localAnnouncement += turnStory;
      cue.localAnnouncement = localAnnouncement;
    }
    game.announcement = announcement;
    game.sequence += 1;
    emitDuckState(room, cue);
    acknowledge(callback, { ok: true });
  });

  socket.on('ducks-race-play-card', (data = {}, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    const game = room.ducksRace;
    if (!game || game.status !== 'playing') return acknowledge(callback, { ok: false, error: 'The race has not started.' });
    const playerId = socket.data.playerId;
    if (game.turnOrder[game.turnIndex] !== playerId) return acknowledge(callback, { ok: false, error: 'You can only play a card on your turn.' });
    const card = CARD_TYPES.includes(data.card) ? data.card : null;
    const duck = game.ducks.get(playerId);
    const handIndex = duck.hand.indexOf(card);
    if (handIndex < 0) return acknowledge(callback, { ok: false, error: 'That card is not in your hand.' });
    const cost = CARD_COSTS[card];
    if (duck.feathers < cost) return acknowledge(callback, { ok: false, error: `${card} costs ${cost} feather${cost === 1 ? '' : 's'}.` });

    let target = null;
    if (card !== 'Shield') {
      target = game.ducks.get(String(data.targetId || ''));
      if (!target || data.targetId === playerId) return acknowledge(callback, { ok: false, error: `Choose another player for ${card}.` });
    }
    duck.feathers -= cost;
    duck.hand.splice(handIndex, 1);
    let announcement;
    let cue = { type: 'magic', square: duck.square };
    if (card === 'Shield') {
      duck.shielded = true;
      announcement = `${duck.name} played Shield! ${duck.name} is protected from the next hazard.`;
    } else if (card === 'Wind Gust') {
      target.distance = Math.max(0, target.distance - 3);
      target.square = (target.distance % BOARD_SIZE) + 1;
      announcement = `${duck.name} played Wind Gust on ${target.name}, spent 1 feather, and pushed them back 3 spaces to square ${target.square}.`;
      cue = { type: 'magic', square: duck.square, secondary: { type: 'quack', square: target.square } };
    } else {
      const stolen = target.feathers > 0 ? 1 : 0;
      target.feathers -= stolen;
      duck.feathers += stolen;
      announcement = `${duck.name} played Pluck on ${target.name}, spent 1 feather, and stole ${stolen} feather${stolen === 1 ? '' : 's'}.`;
      cue = { type: 'magic', square: duck.square, secondary: { type: 'quack', square: target.square } };
    }
    game.announcement = `${announcement} ${duck.name} may still roll.`;
    game.sequence += 1;
    emitDuckState(room, cue);
    acknowledge(callback, { ok: true });
  });

  socket.on('game-state', (state, callback) => {
    const room = roomForPlayer(socket, callback);
    if (!room) return;
    room.gameState = state;
    socket.to(room.code).emit('game-state', state);
    acknowledge(callback, { ok: true });
  });

  socket.on('chat-message', (message, callback) => {
    if (!requireAuthentication(socket, callback)) return;
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.players.has(socket.data.playerId)) return acknowledge(callback, { ok: false, error: 'Join a game before sending chat messages.' });
    const payload = message && typeof message === 'object' ? message : { text: message, recipientId: 'everyone' };
    const text = String(payload.text || '').trim().slice(0, 500);
    if (!text) return acknowledge(callback, { ok: false, error: 'Message cannot be empty.' });
    const recipientId = String(payload.recipientId || 'everyone');
    const sentAt = new Date().toISOString();
    if (recipientId === 'everyone') {
      io.to(room.code).emit('chat-message', { sender: socket.data.username, senderId: socket.data.playerId, text, private: false, sentAt });
      return acknowledge(callback, { ok: true, private: false });
    }
    const recipient = room.players.get(recipientId);
    if (!recipient) return acknowledge(callback, { ok: false, error: 'That player is no longer in this game.' });
    if (!recipient.socketId) return acknowledge(callback, { ok: false, error: `${recipient.name} is reconnecting. Try again shortly.` });
    const privateMessage = { sender: socket.data.username, senderId: socket.data.playerId, recipient: recipient.name, recipientId, text, private: true, sentAt };
    io.to(socket.id).emit('chat-message', privateMessage);
    if (recipient.socketId !== socket.id) io.to(recipient.socketId).emit('chat-message', privateMessage);
    acknowledge(callback, { ok: true, private: true, recipient: recipient.name });
  });

  socket.on('set-game-options', (data = {}, callback) => {
    const room=roomForPlayer(socket,callback);if(!room)return;
    const duckTypes=['Mallard','Rubber Duck','Wood Duck','Mandarin Duck','Pekin Duck','Muscovy Duck','Duckling'];
    const horseTypes=['Miniature Horse','Shetland Pony','Miniature Appaloosa','Full-size Thoroughbred','Full-size Arabian','Full-size Quarter Horse','Full-size Clydesdale'];
    const colors=['Black','White','Gray','Brown','Chestnut','Bay','Palomino','Pinto','Blue','Green','Yellow','Red','Purple','Pink','Orange','Green and brown'];
    if(room.game==='Duck Race'||room.game==='Horse Race'){
      const allowedTypes=room.game==='Duck Race'?duckTypes:horseTypes,type=allowedTypes.includes(data.type)?data.type:allowedTypes[0],color=colors.includes(data.secondary)?data.secondary:colors[0];room.raceSelections.set(socket.data.playerId,{type,color});
      if(room.hostId===socket.data.playerId){if([2,3,5].includes(Number(data.startingCards)))room.raceSettings.startingCards=Number(data.startingCards);if(room.game==='Duck Race'&&[3,5,8].includes(Number(data.startingFeathers)))room.raceSettings.startingFeathers=Number(data.startingFeathers);}
    }else if(room.game==='Monopoly Multi-Edition'){
      if(room.hostId===socket.data.playerId&&MonopolyBoards.editions.includes(data.type)&&room.monopolyEdition!==data.type){room.monopolyEdition=data.type;room.monopolyTokens.clear();}
      const tokens=MonopolyBoards.tokens[room.monopolyEdition]||[],selected=tokens.find(token=>token.id===data.secondary||token.name===data.secondary);if(!selected)return acknowledge(callback,{ok:false,error:'Choose an available token for the selected board.'});const taken=[...room.monopolyTokens.entries()].some(([id,token])=>id!==socket.data.playerId&&token.id===selected.id);if(taken)return acknowledge(callback,{ok:false,error:`${selected.name} is already selected. Choose another token.`});room.monopolyTokens.set(socket.data.playerId,{...selected});
    }else if(room.game==='Accessible Uno & Dos Lounge'&&room.hostId===socket.data.playerId&&UnoRules.VARIANTS.includes(data.type))room.unoVariant=data.type;
    else if(room.game==='The Game of Life Lounge'&&room.hostId===socket.data.playerId&&LifeThemes.themes.includes(data.type))room.lifeTheme=data.type;
    else if(room.game==='Accessible Dominoes Lounge'&&room.hostId===socket.data.playerId){if(Object.hasOwn(DominoesEngine.SETS,data.type))room.dominoSet=data.type;if(DominoesEngine.MODES.includes(data.secondary))room.dominoMode=data.secondary;}
    else if(room.game==='Accessible Skip-Bo Lounge'&&room.hostId===socket.data.playerId&&['Standard game','Quick game'].includes(data.type))room.skipboPace=data.type;
    else if(room.game==='Accessible Mall Madness Lounge'&&room.hostId===socket.data.playerId&&['Standard shopping list','Quick shopping list'].includes(data.type))room.mallChallenge=data.type;
    io.to(room.code).emit('lobby-updated',publicRoom(room));
    acknowledge(callback,{ok:true,message:'Game options saved. The host can start when everyone is ready.'});
  });

  socket.on('leave-room', () => leaveCurrentRoom(socket, true));
  socket.on('disconnect', () => leaveCurrentRoom(socket, false));
});

function leaveCurrentRoom(socket, permanent) {
  const code = socket.data.roomCode;
  const playerId = socket.data.playerId;
  const room = rooms.get(code);
  if (!room || !playerId) return;
  const player = room.players.get(playerId);
  if (!player || player.socketId !== socket.id) return;
  player.socketId = null;
  socket.leave(code);
  delete socket.data.roomCode;

  const removePlayer = () => {
    const current = room.players.get(playerId);
    if (!current || current.socketId) return;
    room.players.delete(playerId);
    room.monopolyTokens?.delete(playerId);
    if (room.players.size > 0 && [...room.players.keys()].every(id => id.startsWith('computer-'))) {
      rooms.delete(code);
      const bot=computerSockets.get(code);computerSockets.delete(code);if(bot?.connected)bot.disconnect();
      broadcastGames();
      return;
    }
    if (room.players.size === 0) {
      rooms.delete(code);
      computerSockets.delete(code);
      broadcastGames();
      return;
    }
    if (room.hostId === playerId) room.hostId = room.players.keys().next().value;
    if (room.monopoly?.players.has(playerId)) {
      const game = room.monopoly;
      const removedIndex = game.turnOrder.indexOf(playerId);
      game.turnOrder.splice(removedIndex, 1); game.players.delete(playerId);
      Object.keys(game.owners).forEach(index => { if (game.owners[index] === playerId) delete game.owners[index]; });
      if (game.pendingPurchase?.playerId === playerId) game.pendingPurchase = null;
      if (game.pendingTrade && [game.pendingTrade.fromId, game.pendingTrade.toId].includes(playerId)) game.pendingTrade = null;
      if (game.turnOrder.length < 2) {
        game.status = 'finished'; game.announcement = 'Monopoly ended because fewer than two players remain.';
      } else {
        if (removedIndex < game.turnIndex || game.turnIndex >= game.turnOrder.length) game.turnIndex = Math.max(0, game.turnIndex - 1);
        game.announcement = `${current.name} left the game. It is ${game.players.get(game.turnOrder[game.turnIndex]).name}'s turn.`;
      }
      game.sequence += 1; emitMonopolyState(room);
    }
    if (room.uno?.players.some(player=>player.id===playerId)) {
      const game=room.uno;const removedIndex=game.players.findIndex(player=>player.id===playerId);const removed=game.players.splice(removedIndex,1)[0];
      if(game.players.length<2){game.status='finished';game.announcement='The UNO game ended because fewer than two players remain.';}
      else{if(removedIndex<game.turnIndex||game.turnIndex>=game.players.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${removed.name} left. It is ${game.players[game.turnIndex].name}'s turn.`;}
      game.sequence+=1;emitUnoState(room);
    }
    if (room.life?.players.has(playerId)) {
      const game=room.life;const removedIndex=game.turnOrder.indexOf(playerId);game.turnOrder.splice(removedIndex,1);game.players.delete(playerId);if(game.pendingChoice?.playerId===playerId)game.pendingChoice=null;
      if(game.turnOrder.length<2){game.status='finished';game.announcement='The Game of Life ended because fewer than two players remain.';}else{if(removedIndex<game.turnIndex||game.turnIndex>=game.turnOrder.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${current.name} left. It is ${game.players.get(game.turnOrder[game.turnIndex]).name}'s turn.`;}game.sequence+=1;emitLifeState(room);
    }
    if(room.derby?.players.has(playerId)){const game=room.derby,removedIndex=game.turnOrder.indexOf(playerId);game.turnOrder.splice(removedIndex,1);game.players.delete(playerId);if(game.turnOrder.length<2){game.status='finished';game.announcement='Horse Race ended because fewer than two players remain.';}else{if(removedIndex<game.turnIndex||game.turnIndex>=game.turnOrder.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${current.name} left the Horse Race. ${game.players.get(game.turnOrder[game.turnIndex]).name} now has the turn.`}game.sequence+=1;emitDerbyState(room)}
    if(room.dominoes?.players.has(playerId)){const game=room.dominoes,removedIndex=game.turnOrder.indexOf(playerId);game.turnOrder.splice(removedIndex,1);game.players.delete(playerId);if(game.turnOrder.length<2){game.status='finished';game.announcement='Dominoes ended because fewer than two players remain.';}else{if(removedIndex<game.turnIndex||game.turnIndex>=game.turnOrder.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${current.name} left Dominoes. ${game.players.get(game.turnOrder[game.turnIndex]).name} now has the turn.`}game.sequence+=1;emitDominoState(room)}
    if(room.skipbo?.players.has(playerId)){const game=room.skipbo,removedIndex=game.turnOrder.indexOf(playerId);game.turnOrder.splice(removedIndex,1);game.players.delete(playerId);if(game.turnOrder.length<2){game.status='finished';game.announcement='Skip-Bo ended because fewer than two players remain.';}else{if(removedIndex<game.turnIndex||game.turnIndex>=game.turnOrder.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${current.name} left Skip-Bo. ${game.players.get(game.turnOrder[game.turnIndex]).name} now has the turn.`}game.sequence+=1;emitSkipBoState(room)}
    if(room.mall?.players.has(playerId)){const game=room.mall,removedIndex=game.turnOrder.indexOf(playerId);game.turnOrder.splice(removedIndex,1);game.players.delete(playerId);if(game.turnOrder.length<2){game.status='finished';game.announcement='Mall Madness ended because fewer than two shoppers remain.';}else{if(removedIndex<game.turnIndex||game.turnIndex>=game.turnOrder.length)game.turnIndex=Math.max(0,game.turnIndex-1);game.announcement=`${current.name} left the mall. ${game.players.get(game.turnOrder[game.turnIndex]).name} now has the turn.`}game.sequence+=1;emitMallState(room)}
    io.to(code).emit('lobby-updated', publicRoom(room));
    broadcastGames();
  };
  if (permanent) removePlayer();
  else player.disconnectTimer = setTimeout(removePlayer, 30000);
}

function startServer(port = PORT, host = process.env.HOST || '0.0.0.0') {
  if (server.listening) return Promise.resolve(server);
  return new Promise((resolve, reject) => {
    const onError = error => { server.off('listening', onListening); reject(error); };
    const onListening = () => {
      server.off('error', onError);
      const address = server.address();
      console.log(`Accessible Game Lounge is running at http://localhost:${address.port}`);
      resolve(server);
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(port, host);
  });
}

if (require.main === module) startServer().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { app, server, io, startServer };
