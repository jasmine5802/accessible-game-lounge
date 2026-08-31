'use strict';

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
  const source = type === 'Chance' ? CHANCE : COMMUNITY_CHEST;
  if (!game[key]?.length) game[key] = shuffle(source);
  const card = game[key].shift();
  if (card.action !== 'jail-free') game[key].push(card);
  return card;
}

module.exports = Object.freeze({ CHANCE, COMMUNITY_CHEST, shuffle, draw });
