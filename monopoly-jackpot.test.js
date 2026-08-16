'use strict';

const assert = require('node:assert/strict');
const Jackpot = require('./monopoly-jackpot');

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

console.log('Monopoly Free Parking jackpot collection, payout, reset, and disabled rule checks passed.');
