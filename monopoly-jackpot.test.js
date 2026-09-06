'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const Jackpot = require('./monopoly-jackpot');
const Cards = require('./monopoly-cards');

const game = { freeParkingJackpot: true, freeParkingPot: 0 };
const player = { balance: 1200 };
assert.equal(Jackpot.collect(game, 200), 200, 'Tax payment should enter the jackpot.');
assert.equal(Jackpot.collect(game, 50), 250, 'Negative card payment should enter the same jackpot.');
assert.equal(Jackpot.award(game, player), 250, 'Free Parking should award the entire jackpot.');
assert.equal(player.balance, 1450, 'The jackpot should be added to the landing player balance.');
assert.equal(game.freeParkingPot, 0, 'The jackpot should reset after collection.');

const disabled = { freeParkingJackpot: false, freeParkingPot: 0 };
const restingPlayer = { balance: 1200 };
assert.equal(Jackpot.collect(disabled, 200), 0, 'Payments should not enter a disabled jackpot.');
assert.equal(Jackpot.award(disabled, restingPlayer), 0, 'Disabled Free Parking should award nothing.');
assert.equal(restingPlayer.balance, 1200);

const server = fs.readFileSync(require.resolve('./server'), 'utf8');
const client = fs.readFileSync(require.resolve('./monopoly'), 'utf8');
assert(server.includes('const rolledDoubles = dieOne === dieTwo') && server.includes("Doubles! Roll again."), 'Rolling doubles must earn another roll.');
assert(server.includes('game.doublesCount >= 3') && server.includes('the third consecutive doubles roll. Go directly to Jail.'), 'Three consecutive doubles must send the player to Jail.');
assert(server.includes('Jail attempt ${player.jailTurns} of 3 failed') && server.includes('Third failed attempt') && server.includes('Rolled doubles and left Jail'), 'Jail must support three roll attempts, release on doubles, and payment after the third failure.');
assert(server.includes('extraRoll: earnsExtraRoll') && server.includes('const extraRoll = pending.extraRoll === true'), 'A property decision must preserve an extra roll earned by doubles.');
assert(server.includes('the ${space.group.replace(\'-\', \' \')} property ${space.name}, priced at ${monopolyMoney(game, space.price)}'), 'Property landing announcements must include the color, property name, and price.');
assert(client.includes('player.inJail') && client.includes('failed attempt'), 'The Monopoly player list must report Jail status and failed attempts.');
assert.equal(Cards.CHANCE.length, 16, 'The classic Chance deck must contain 16 cards.');
assert.equal(Cards.COMMUNITY_CHEST.length, 16, 'The classic Community Chest deck must contain 16 cards.');
assert.equal(Cards.CHANCE.filter(card => card.action === 'nearest-transit').length, 2, 'Chance must contain both nearest Railroad cards.');
assert.equal(Cards.CHANCE.filter(card => card.action === 'jail-free').length, 1, 'Chance must contain one Get Out of Jail Free card.');
assert.equal(Cards.COMMUNITY_CHEST.filter(card => card.action === 'jail-free').length, 1, 'Community Chest must contain one Get Out of Jail Free card.');
assert(server.includes('MonopolyCards.draw(game, space.type)') && server.includes('Card: ${card.text}'), 'Chance and Community Chest must draw and announce real cards.');
assert(server.includes("socket.on('monopoly-house'") && server.includes("action === 'buy'") && server.includes("action === 'sell'"), 'Players must be able to buy and sell houses.');
assert(server.includes('count !== Math.min(...counts)') && server.includes('count !== Math.max(...counts)'), 'House buying and selling must enforce even building.');
assert(client.includes("changeHouse('buy')") && client.includes("changeHouse('sell')"), 'Accessible client controls must expose house buying and selling.');

const spongebobDeck = Cards.getDeck('SpongeBob SquarePants', 'Chance');
assert.equal(spongebobDeck.length, 16, 'SpongeBob Chance deck must have 16 cards.');
assert(spongebobDeck.some(card => card.text.includes("King Neptune’s Palace") || card.text.includes("King Neptune")), 'SpongeBob Chance must reference King Neptune’s Palace for space 39.');
assert(spongebobDeck.some(card => card.text.includes('Crabby Patties') || card.text.includes('Crabby Patty')), 'SpongeBob Chance must format currency as Crabby Patties.');

const halloweenChest = Cards.getDeck('Aspects of Halloween', 'Community Chest');
assert.equal(halloweenChest.length, 16, 'Halloween Community Chest deck must have 16 cards.');
assert(halloweenChest.some(card => card.text.includes('Happy Halloween')), 'Halloween deck must reference Happy Halloween as the Go space.');
assert(halloweenChest.some(card => card.text.includes("Frankenstein's Lab")), 'Halloween deck must reference Frankenstein’s Lab as the Jail.');

const alaskaChance = Cards.getDeck('Alaska Edition Monopoly (1996) (USAopoly)', 'Chance');
assert.equal(alaskaChance.length, 16);
assert(alaskaChance.some(card => card.text.includes('Mount McKinley')), 'Alaska Chance must advance to Mount McKinley.');

console.log('Monopoly dice, doubles, Jail, Free Parking jackpot, themed cards, and hotel rule checks passed.');
