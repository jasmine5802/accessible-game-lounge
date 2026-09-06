'use strict';

const MonopolyBoards = (typeof require === 'function')
  ? require('./monopoly-boards')
  : (typeof globalThis !== 'undefined' ? globalThis.MonopolyBoards : null);

const CHANCE = Object.freeze([
  { text: 'Advance to Boardwalk.', action: 'move', position: 39 },
  { text: 'Advance to GO. Collect $200.', action: 'move', position: 0 },
  { text: 'Advance to Illinois Avenue. If you pass GO, collect $200.', action: 'move', position: 24 },
  { text: 'Advance to St. Charles Place. If you pass GO, collect $200.', action: 'move', position: 11 },
  { text: 'Advance to the nearest Railroad. If owned, pay twice the normal rent.', action: 'nearest-transit', rentMultiplier: 2 },
  { text: 'Advance to the nearest Railroad. If owned, pay twice the normal rent.', action: 'nearest-transit', rentMultiplier: 2 },
  { text: 'Advance to the nearest Utility. If owned, pay ten times the dice roll.', action: 'nearest-utility', rentMultiplier: 10 },
  { text: 'Bank pays you dividend of $50.', action: 'money', amount: 50 },
  { text: 'Get Out of Jail Free.', action: 'jail-free' },
  { text: 'Go Back 3 Spaces.', action: 'back', spaces: 3 },
  { text: 'Go directly to Jail. Do not pass GO. Do not collect $200.', action: 'jail' },
  { text: 'Make general repairs on all your property. Pay $25 per house and $100 per hotel.', action: 'repairs', house: 25, hotel: 100 },
  { text: 'Pay poor tax of $15.', action: 'money', amount: -15 },
  { text: 'Take a ride on the Reading Railroad. If you pass GO, collect $200.', action: 'move', position: 5 },
  { text: 'You have been elected Chairman of the Board. Pay each player $50.', action: 'pay-each', amount: 50 },
  { text: 'Your building and loan matures. Collect $150.', action: 'money', amount: 150 }
]);

const COMMUNITY_CHEST = Object.freeze([
  { text: 'Advance to GO. Collect $200.', action: 'move', position: 0 },
  { text: 'Bank error in your favor. Collect $200.', action: 'money', amount: 200 },
  { text: "Doctor's fee. Pay $50.", action: 'money', amount: -50 },
  { text: 'From sale of stock you get $45.', action: 'money', amount: 45 },
  { text: 'Get Out of Jail Free.', action: 'jail-free' },
  { text: 'Go directly to Jail. Do not pass GO. Do not collect $200.', action: 'jail' },
  { text: 'Christmas fund matures. Collect $100.', action: 'money', amount: 100 },
  { text: 'Income tax refund. Collect $20.', action: 'money', amount: 20 },
  { text: 'Grand Opera opening. Collect $50 from every player.', action: 'collect-each', amount: 50 },
  { text: 'Life insurance matures. Collect $100.', action: 'money', amount: 100 },
  { text: 'Pay hospital fees of $100.', action: 'money', amount: -100 },
  { text: 'Pay school tax of $150.', action: 'money', amount: -150 },
  { text: 'Receive $25 consultancy fee.', action: 'money', amount: 25 },
  { text: 'You are assessed for street repairs. Pay $40 per house and $115 per hotel.', action: 'repairs', house: 40, hotel: 115 },
  { text: 'You have won second prize in a beauty contest. Collect $10.', action: 'money', amount: 10 },
  { text: 'You inherit $100.', action: 'money', amount: 100 }
]);

function formatEditionMoney(edition, amount) {
  if (MonopolyBoards && typeof MonopolyBoards.formatMoney === 'function') {
    return MonopolyBoards.formatMoney(edition, amount);
  }
  return `$${amount}`;
}

function resolveBoard(edition, board) {
  if (board && Array.isArray(board) && board.length === 40) return board;
  if (MonopolyBoards && typeof MonopolyBoards.createBoard === 'function' && edition) {
    try {
      return MonopolyBoards.createBoard(edition);
    } catch {
      return null;
    }
  }
  return null;
}

function cleanJailName(jailName) {
  return (jailName || 'Jail').replace(/ \/ Just Visiting/i, '').trim();
}

function createChanceDeck(edition = 'Classic', board = null) {
  const activeBoard = resolveBoard(edition, board);
  if (!activeBoard || edition === 'Classic') {
    return CHANCE.map(card => ({ ...card }));
  }

  const goName = activeBoard.find(s => s.type === 'Go')?.name || 'GO';
  const jailName = cleanJailName(activeBoard.find(s => s.type === 'Jail')?.name || 'Jail');
  const space39 = activeBoard.find(s => s.index === 39)?.name || 'Boardwalk';
  const space24 = activeBoard.find(s => s.index === 24)?.name || 'Illinois Avenue';
  const space11 = activeBoard.find(s => s.index === 11)?.name || 'St. Charles Place';
  const space5 = activeBoard.find(s => s.index === 5)?.name || 'Reading Railroad';
  const transitType = activeBoard.filter(s => s.type === 'Transit').length ? 'Transit line' : 'Railroad';

  return [
    { text: `Advance to ${space39}.`, action: 'move', position: 39 },
    { text: `Advance to ${goName}. Collect ${formatEditionMoney(edition, 200)}.`, action: 'move', position: 0 },
    { text: `Advance to ${space24}. If you pass ${goName}, collect ${formatEditionMoney(edition, 200)}.`, action: 'move', position: 24 },
    { text: `Advance to ${space11}. If you pass ${goName}, collect ${formatEditionMoney(edition, 200)}.`, action: 'move', position: 11 },
    { text: `Advance to the nearest ${transitType}. If owned, pay twice the normal rent.`, action: 'nearest-transit', rentMultiplier: 2 },
    { text: `Advance to the nearest ${transitType}. If owned, pay twice the normal rent.`, action: 'nearest-transit', rentMultiplier: 2 },
    { text: `Advance to the nearest Utility. If owned, pay ten times the dice roll.`, action: 'nearest-utility', rentMultiplier: 10 },
    { text: `Special theme dividend and bonus payout. Collect ${formatEditionMoney(edition, 50)}.`, action: 'money', amount: 50 },
    { text: `Get Out of ${jailName} Free.`, action: 'jail-free' },
    { text: 'Go Back 3 Spaces.', action: 'back', spaces: 3 },
    { text: `Go directly to ${jailName}. Do not pass ${goName}. Do not collect ${formatEditionMoney(edition, 200)}.`, action: 'jail' },
    { text: `Make general repairs on all your property. Pay ${formatEditionMoney(edition, 25)} per house and ${formatEditionMoney(edition, 100)} per hotel.`, action: 'repairs', house: 25, hotel: 100 },
    { text: `Pay assessment and travel fee of ${formatEditionMoney(edition, 15)}.`, action: 'money', amount: -15 },
    { text: `Take a trip on ${space5}. If you pass ${goName}, collect ${formatEditionMoney(edition, 200)}.`, action: 'move', position: 5 },
    { text: `You have been elected Chairman of the Board. Pay each player ${formatEditionMoney(edition, 50)}.`, action: 'pay-each', amount: 50 },
    { text: `Your savings and investment fund matures. Collect ${formatEditionMoney(edition, 150)}.`, action: 'money', amount: 150 }
  ];
}

function createCommunityChestDeck(edition = 'Classic', board = null) {
  const activeBoard = resolveBoard(edition, board);
  if (!activeBoard || edition === 'Classic') {
    return COMMUNITY_CHEST.map(card => ({ ...card }));
  }

  const goName = activeBoard.find(s => s.type === 'Go')?.name || 'GO';
  const jailName = cleanJailName(activeBoard.find(s => s.type === 'Jail')?.name || 'Jail');

  return [
    { text: `Advance to ${goName}. Collect ${formatEditionMoney(edition, 200)}.`, action: 'move', position: 0 },
    { text: `Bank and treasury error in your favor. Collect ${formatEditionMoney(edition, 200)}.`, action: 'money', amount: 200 },
    { text: `Doctor and wellness clinic fee. Pay ${formatEditionMoney(edition, 50)}.`, action: 'money', amount: -50 },
    { text: `From sale of surplus inventory you get ${formatEditionMoney(edition, 45)}.`, action: 'money', amount: 45 },
    { text: `Get Out of ${jailName} Free.`, action: 'jail-free' },
    { text: `Go directly to ${jailName}. Do not pass ${goName}. Do not collect ${formatEditionMoney(edition, 200)}.`, action: 'jail' },
    { text: `Holiday and seasonal fund matures. Collect ${formatEditionMoney(edition, 100)}.`, action: 'money', amount: 100 },
    { text: `Income assessment refund rebate. Collect ${formatEditionMoney(edition, 20)}.`, action: 'money', amount: 20 },
    { text: `Grand community celebration opening. Collect ${formatEditionMoney(edition, 50)} from every player.`, action: 'collect-each', amount: 50 },
    { text: `Life and protection policy matures. Collect ${formatEditionMoney(edition, 100)}.`, action: 'money', amount: 100 },
    { text: `Pay hospital and care facility fees of ${formatEditionMoney(edition, 100)}.`, action: 'money', amount: -100 },
    { text: `Pay school and community tax of ${formatEditionMoney(edition, 150)}.`, action: 'money', amount: -150 },
    { text: `Receive ${formatEditionMoney(edition, 25)} consultancy fee.`, action: 'money', amount: 25 },
    { text: `You are assessed for street and property repairs. Pay ${formatEditionMoney(edition, 40)} per house and ${formatEditionMoney(edition, 115)} per hotel.`, action: 'repairs', house: 40, hotel: 115 },
    { text: `You have won second prize in the showcase contest. Collect ${formatEditionMoney(edition, 10)}.`, action: 'money', amount: 10 },
    { text: `You inherit ${formatEditionMoney(edition, 100)}.`, action: 'money', amount: 100 }
  ];
}

function getDeck(edition, type, board = null) {
  return type === 'Chance' ? createChanceDeck(edition, board) : createCommunityChestDeck(edition, board);
}

function shuffle(cards, random = Math.random) {
  const deck = cards.map(card => ({ ...card }));
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

function draw(game, type) {
  const key = type === 'Chance' ? 'chanceDeck' : 'communityChestDeck';
  if (!game[key]?.length) {
    game[key] = shuffle(getDeck(game.edition, type, game.board));
  }
  const card = game[key].shift();
  if (card.action !== 'jail-free') game[key].push(card);
  return card;
}

const api = Object.freeze({
  CHANCE,
  COMMUNITY_CHEST,
  createChanceDeck,
  createCommunityChestDeck,
  getDeck,
  shuffle,
  draw
});

if (typeof module === 'object' && module.exports) {
  module.exports = api;
} else if (typeof globalThis !== 'undefined') {
  globalThis.MonopolyCards = api;
}
