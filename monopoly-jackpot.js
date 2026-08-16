'use strict';

function collect(game, amount) {
  const payment = Math.max(0, Number(amount) || 0);
  if (!game?.freeParkingJackpot || !payment) return game?.freeParkingPot || 0;
  game.freeParkingPot = (Number(game.freeParkingPot) || 0) + payment;
  return game.freeParkingPot;
}

function award(game, player) {
  if (!game?.freeParkingJackpot || !player) return 0;
  const winnings = Math.max(0, Number(game.freeParkingPot) || 0);
  player.balance += winnings;
  game.freeParkingPot = 0;
  return winnings;
}

module.exports = Object.freeze({ collect, award });
