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

  function isWildCard(card) {
    return Boolean(card && (card.value === WILD || card.value === 'W' || card.value === 0 || card.isWild));
  }

  function getBuildingPileNextValue(pile) {
    if (!pile || pile.length === 0) return 1;
    const topCard = pile[pile.length - 1];
    // If top card was a wild, ensure value was assigned, else use card number
    const currentValue = topCard.effectiveValue || topCard.playedAs || topCard.value;
    return currentValue + 1;
  }

  function expectedValue(pile) {
    return getBuildingPileNextValue(pile);
  }

  function cardLabel(card) {
    if (!card) return 'empty';
    if (isWildCard(card)) return 'Skip-Bo Wild';
    return String(card.value);
  }

  function canBuild(card, pile) {
    if (!card || !Array.isArray(pile)) return false;
    const nextRequiredValue = getBuildingPileNextValue(pile);
    if (nextRequiredValue > 12) return false;
    const isWild = isWildCard(card);
    return isWild || card.value === nextRequiredValue;
  }

  function playToBuilding(card, pile) {
    if (!canBuild(card, pile)) throw new Error(`That card cannot be played here. Building pile needs ${expectedValue(pile)}.`);
    const playedAs = isWildCard(card) ? expectedValue(pile) : card.value;
    const playedCard = { ...card, playedAs, effectiveValue: playedAs };
    const next = [...pile, playedCard];
    return {
      pile: playedAs === 12 ? [] : next,
      completed: playedAs === 12,
      playedAs,
      effectiveValue: playedAs,
      completedPile: next
    };
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

  function refillHand(gameState, player, count = 5) {
    const drawDeck = gameState.drawDeck || gameState.drawPile;
    const completedCards = gameState.completedCards || gameState.completed;
    let drawn = 0;
    while (player.hand.length < count) {
      if (drawDeck && drawDeck.length === 0) {
        if (!completedCards || completedCards.length === 0) break; // Out of cards
        const recycled = shuffle(completedCards);
        drawDeck.push(...recycled);
        completedCards.length = 0;
      }
      if (!drawDeck || drawDeck.length === 0) break;
      player.hand.push(drawDeck.pop());
      drawn += 1;
    }
    return drawn;
  }

  function advanceTurn(gameState) {
    if (!gameState) return null;
    if (typeof gameState.advanceTurn === 'function') {
      return gameState.advanceTurn();
    }
    if (Array.isArray(gameState.turnOrder) && gameState.turnOrder.length) {
      gameState.turnIndex = ((gameState.turnIndex || 0) + 1) % gameState.turnOrder.length;
      return gameState.turnOrder[gameState.turnIndex];
    }
    return null;
  }

  // 1 & 2: Wildcard resolution and 12-clear rule
  function playCardToBuildPile(gameState, player, cardSource, sourceIndex, targetPileIndex) {
    const pile = gameState.buildingPiles[targetPileIndex];
    const nextRequiredValue = getBuildingPileNextValue(pile);

    // Retrieve the card based on where it came from
    const stock = player.stockPile || player.stock;
    const discards = player.discardPiles || player.discards;
    let card = null;
    if (cardSource === 'hand') {
      card = player.hand[sourceIndex];
    } else if (cardSource === 'stock') {
      card = stock ? stock[stock.length - 1] : null;
    } else if (cardSource === 'discard') {
      const discardPile = discards ? discards[sourceIndex] : null;
      card = discardPile ? discardPile[discardPile.length - 1] : null;
    }

    if (!card) return { success: false, reason: "Card not found" };

    // Check validity: card must match nextRequiredValue OR be a Skip-Bo wild ('W' or 0)
    const isWild = isWildCard(card);
    if (!isWild && card.value !== nextRequiredValue) {
      return { success: false, reason: `Invalid move. Pile needs ${nextRequiredValue}` };
    }

    // Remove card from source
    if (cardSource === 'hand') {
      player.hand.splice(sourceIndex, 1);
    } else if (cardSource === 'stock') {
      stock.pop();
    } else if (cardSource === 'discard') {
      discards[sourceIndex].pop();
    }

    // Fix 2: Bind the dynamic effective value if it's a wild
    const playedCard = {
      ...card,
      playedAs: nextRequiredValue,
      effectiveValue: nextRequiredValue // Wild becomes the exact number it represents
    };

    pile.push(playedCard);

    // Fix 4: Instant Win Condition Check (if card came from stock)
    const stockRemaining = stock ? stock.length : 0;
    if (cardSource === 'stock' && stockRemaining === 0) {
      gameState.winner = player.id;
      if (gameState.winnerId === undefined || gameState.winnerId === null) {
        gameState.winnerId = player.id;
      }
      gameState.isGameOver = true;
      gameState.status = 'finished';
      return { success: true, event: "GAME_OVER", winner: player.id };
    }

    // Fix 1: Auto-clear pile if it reaches 12
    let pileCleared = false;
    if (nextRequiredValue === 12) {
      // Move cards to completed/discard deck to reshuffle when draw deck empties
      const completed = gameState.completedCards || gameState.completed;
      if (completed) completed.push(...pile);
      gameState.buildingPiles[targetPileIndex] = []; // Reset to empty slot
      pileCleared = true;
    }

    // Fix 3: Hand refill mid-turn if all 5 cards played
    let refilled = false;
    if (player.hand.length === 0) {
      refillHand(gameState, player, 5);
      refilled = true;
    }

    return {
      success: true,
      pileCleared,
      refilled,
      nextRequiredValue: pileCleared ? 1 : nextRequiredValue + 1
    };
  }

  // Fix 3: Proper turn end on discard only
  function discardToEndTurn(gameState, player, handIndex, discardPileIndex) {
    if (handIndex < 0 || handIndex >= player.hand.length) {
      return { success: false, reason: "Invalid hand card" };
    }
    if (discardPileIndex < 0 || discardPileIndex > 3) {
      return { success: false, reason: "Invalid discard pile" };
    }

    const discards = player.discardPiles || player.discards;
    const [discardedCard] = player.hand.splice(handIndex, 1);
    discards[discardPileIndex].push(discardedCard);

    // Pass turn to next active player
    advanceTurn(gameState);

    return { success: true, event: "TURN_ENDED" };
  }

  return {
    WILD,
    BUILDING_PILES,
    DISCARD_PILES,
    STOCK_SIZE,
    HAND_SIZE,
    createDeck,
    shuffle,
    isWildCard,
    getBuildingPileNextValue,
    expectedValue,
    cardLabel,
    canBuild,
    playToBuilding,
    drawToFive,
    recycleCompleted,
    refillHand,
    advanceTurn,
    playCardToBuildPile,
    discardToEndTurn
  };
}));
