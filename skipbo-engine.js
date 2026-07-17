'use strict';

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SkipBoEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const WILD = 'Skip-Bo';
  const BUILDING_PILES = 4;
  const DISCARD_PILES = 4;
  const STOCK_SIZE = 20;
  const HAND_SIZE = 5;

  function createDeck() {
    const deck = [];
    let id = 0;
    for (let value = 1; value <= 12; value += 1) {
      for (let copy = 0; copy < 12; copy += 1) deck.push({ id: `skipbo-${id += 1}`, value });
    }
    for (let copy = 0; copy < 18; copy += 1) deck.push({ id: `skipbo-${id += 1}`, value: WILD });
    return deck;
  }

  function shuffle(cards, random = Math.random) {
    const result = cards.map(card => ({ ...card }));
    for (let index = result.length - 1; index > 0; index -= 1) {
      const other = Math.floor(random() * (index + 1));
      [result[index], result[other]] = [result[other], result[index]];
    }
    return result;
  }

  function expectedValue(pile) { return pile.length ? pile[pile.length - 1].playedAs + 1 : 1; }
  function cardLabel(card) { return card?.value === WILD ? 'Skip-Bo Wild' : card ? String(card.value) : 'empty'; }
  function canBuild(card, pile) {
    if (!card || !Array.isArray(pile)) return false;
    const expected = expectedValue(pile);
    return expected <= 12 && (card.value === WILD || card.value === expected);
  }
  function playToBuilding(card, pile) {
    if (!canBuild(card, pile)) throw new Error(`That card cannot be played here. Building pile needs ${expectedValue(pile)}.`);
    const playedAs = card.value === WILD ? expectedValue(pile) : card.value;
    const next = [...pile, { ...card, playedAs }];
    return { pile: playedAs === 12 ? [] : next, completed: playedAs === 12, playedAs };
  }
  function drawToFive(hand, drawPile) {
    const nextHand = hand.map(card => ({ ...card }));
    const nextDraw = drawPile.map(card => ({ ...card }));
    while (nextHand.length < HAND_SIZE && nextDraw.length) nextHand.push(nextDraw.pop());
    return { hand: nextHand, drawPile: nextDraw, drawn: nextHand.length - hand.length };
  }
  function recycleCompleted(completed, drawPile, random = Math.random) {
    return shuffle([...completed, ...drawPile].map(card => ({ id: card.id, value: card.value })), random);
  }

  return { WILD, BUILDING_PILES, DISCARD_PILES, STOCK_SIZE, HAND_SIZE, createDeck, shuffle, expectedValue, cardLabel, canBuild, playToBuilding, drawToFive, recycleCompleted };
}));
