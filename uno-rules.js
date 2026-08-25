'use strict';

(function exposeUnoRules(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UnoRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const VARIANTS = Object.freeze(['Classic Uno', 'Uno Flip!', 'Uno Dos', "Show 'Em No Mercy", 'Uno Attack']);
  const LIGHT_COLORS = ['Red', 'Yellow', 'Green', 'Blue'];
  const DARK_COLORS = ['Pink', 'Teal', 'Orange', 'Purple'];
  let nextCardId = 1;

  function card(color, value) { return { id: `uno-${nextCardId++}`, color, value }; }
  function dualCard(lightColor, lightValue, darkColor, darkValue) { return { id: `flip-${nextCardId++}`, light: { color: lightColor, value: lightValue }, dark: { color: darkColor, value: darkValue } }; }
  function shuffle(cards, random = Math.random) {
    for (let index = cards.length - 1; index > 0; index -= 1) { const other = Math.floor(random() * (index + 1)); [cards[index], cards[other]] = [cards[other], cards[index]]; }
    return cards;
  }
  function standardDeck(variant) {
    const deck = [];
    for (const color of LIGHT_COLORS) {
      deck.push(card(color, 0));
      for (let copy = 0; copy < 2; copy += 1) {
        for (let value = 1; value <= 9; value += 1) deck.push(card(color, value));
        ['Skip', 'Reverse', 'Draw 2'].forEach(value => deck.push(card(color, value)));
        if (variant === "Show 'Em No Mercy") ['Draw 4', 'Draw 6', 'Draw 10'].forEach(value => deck.push(card(color, value)));
        if (variant === 'Uno Attack') deck.push(card(color, 'Attack'));
      }
    }
    for (let index = 0; index < 4; index += 1) { deck.push(card('Wild', 'Wild')); deck.push(card('Wild', 'Wild Draw 4')); }
    return deck;
  }
  function flipDeck() {
    const deck = [];
    for (let colorIndex = 0; colorIndex < 4; colorIndex += 1) {
      for (let copy = 0; copy < 2; copy += 1) {
        for (let value = copy; value <= 9; value += 1) deck.push(dualCard(LIGHT_COLORS[colorIndex], value, DARK_COLORS[(colorIndex + copy) % 4], 9 - value));
        deck.push(dualCard(LIGHT_COLORS[colorIndex], 'Draw 1', DARK_COLORS[colorIndex], 'Draw 5'));
        deck.push(dualCard(LIGHT_COLORS[colorIndex], 'Skip', DARK_COLORS[colorIndex], 'Skip Everyone'));
        deck.push(dualCard(LIGHT_COLORS[colorIndex], 'Reverse', DARK_COLORS[colorIndex], 'Reverse'));
        deck.push(dualCard(LIGHT_COLORS[colorIndex], 'Flip', DARK_COLORS[colorIndex], 'Flip'));
      }
      deck.push(dualCard('Wild', 'Wild', 'Wild', 'Wild'));
      deck.push(dualCard('Wild', 'Wild Draw 2', 'Wild', 'Wild Draw Color'));
    }
    return deck;
  }
  function dosDeck() {
    const deck = [];
    for (const color of LIGHT_COLORS) for (let copy = 0; copy < 2; copy += 1) for (let value = copy; value <= 10; value += 1) deck.push(card(color, value));
    for (let index = 0; index < 12; index += 1) deck.push(card('Wild', index % 2 ? 2 : 5));
    return deck;
  }
  function face(game, selectedCard) { return game.variant === 'Uno Flip!' ? selectedCard[game.side] : selectedCard; }
  function describeCard(game, selectedCard) { const shown = face(game, selectedCard); return `${shown.color} ${shown.value}`; }
  function drawOne(game) {
    if (!game.deck.length && game.discard?.length) {
      if (game.variant === 'Uno Dos') game.deck = shuffle(game.discard.splice(0));
      else if (game.discard.length > 1) { const top = game.discard.pop(); game.deck = shuffle(game.discard.splice(0)); game.discard = [top]; }
    }
    return game.deck.pop() || null;
  }
  function drawCards(game, player, count) { for (let index = 0; index < count; index += 1) { const drawn = drawOne(game); if (drawn) player.hand.push(drawn); } }
  function activePlayer(game) { return game.players[game.turnIndex]; }
  function advance(game, steps = 1) {
    if (game.status !== 'playing') return;
    for (let count = 0; count < steps; count += 1) {
      do { game.turnIndex = (game.turnIndex + game.direction + game.players.length) % game.players.length; } while (game.players[game.turnIndex].eliminated);
    }
  }
  function checkWinner(game, player) {
    if (player.hand.length === 0) { game.status = 'finished'; game.winnerId = player.id; return true; }
    const remaining = game.players.filter(item => !item.eliminated);
    if (remaining.length === 1) { game.status = 'finished'; game.winnerId = remaining[0].id; return true; }
    return false;
  }
  function createGame(variant, playerList, random = Math.random) {
    if (!VARIANTS.includes(variant)) throw new Error(`Unknown UNO variant: ${variant}`);
    if (!Array.isArray(playerList) || playerList.length < 2) throw new Error('At least two players are required.');
    const deck = shuffle(variant === 'Uno Flip!' ? flipDeck() : variant === 'Uno Dos' ? dosDeck() : standardDeck(variant), random);
    const players = playerList.map(player => ({ id: player.id, name: player.name, hand: [], eliminated: false, declaration: null }));
    const game = { variant, status: 'playing', side: 'light', direction: 1, turnIndex: 0, players, deck, discard: [], centerRow: [], pendingDraw: 0, winnerId: null, sequence: 1, announcement: `${variant} started. ${players[0].name} goes first.` };
    players.forEach(player => drawCards(game, player, 7));
    if (variant === 'Uno Dos') { game.centerRow = [drawOne(game), drawOne(game)]; }
    else {
      let first = drawOne(game); while (first && typeof face(game, first).value !== 'number') { game.deck.unshift(first); first = drawOne(game); }
      game.discard.push(first);
    }
    return game;
  }
  function isDrawValue(value) { return ['Draw 1','Draw 2','Draw 4','Draw 5','Draw 6','Draw 10','Wild Draw 2','Wild Draw 4','Wild Draw Color'].includes(value); }
  function drawAmount(value) { return Number(String(value).match(/\d+/)?.[0] || 0); }
  function canMatch(game, selectedCard) {
    const shown = face(game, selectedCard); const top = face(game, game.discard[game.discard.length - 1]);
    return shown.color === 'Wild' || shown.color === (top.chosenColor || top.color) || shown.value === top.value;
  }
  function playDos(game, player, indexes, targetCenterIndex) {
    if (![1,2].includes(indexes.length)) throw new Error('DOS requires one number card or two cards whose numbers add together.');
    const centerIndex = Number(targetCenterIndex);
    if (![0,1].includes(centerIndex)) throw new Error('Choose the left or right Center Row card.');
    const selected = indexes.map(index => player.hand[index]);
    if (selected.some(item => !item || typeof face(game, item).value !== 'number')) throw new Error('DOS Center Row matches must use number cards.');
    const target = face(game, game.centerRow[centerIndex]);
    const total = selected.reduce((sum, item) => sum + face(game, item).value, 0);
    if (total !== target.value) throw new Error(`Those cards total ${total}, not ${target.value}.`);
    const colorMatches = selected.filter(item => face(game, item).color === target.color || face(game, item).color === 'Wild').length;
    indexes.slice().sort((a,b)=>b-a).forEach(index => player.hand.splice(index,1));
    const bonuses = [];
    for (let count = 0; count < colorMatches && player.hand.length; count += 1) bonuses.push(player.hand.shift());
    game.discard.push(game.centerRow[centerIndex], ...selected, ...bonuses);
    game.centerRow[centerIndex] = drawOne(game);
    const names = selected.map(item => describeCard(game,item)).join(' plus ');
    let message = `${player.name} matched ${names} to the ${target.color} ${target.value} Center Row card.`;
    if (bonuses.length) message += ` Color Match Bonus discarded ${bonuses.length} extra card${bonuses.length === 1 ? '' : 's'}.`;
    if (!checkWinner(game, player)) advance(game);
    return { message, cue: { type: 'card', pan: centerIndex ? .7 : -.7 } };
  }
  function play(game, playerId, indexes, options = {}, random = Math.random) {
    if (game.status !== 'playing') throw new Error('The game is finished.');
    const player = activePlayer(game); if (player.id !== playerId) throw new Error('Wait for your turn.');
    const unique = [...new Set((Array.isArray(indexes) ? indexes : [indexes]).map(Number))];
    if (game.variant === 'Uno Dos') return finish(game, playDos(game, player, unique, options.centerIndex));
    if (unique.length !== 1 || !player.hand[unique[0]]) throw new Error('Choose one card to play.');
    const selected = player.hand[unique[0]]; const shown = face(game, selected);
    if (game.pendingDraw && !isDrawValue(shown.value)) throw new Error(`Stack a draw card or draw the pending ${game.pendingDraw} cards.`);
    if (!game.pendingDraw && !canMatch(game, selected)) throw new Error(`${describeCard(game, selected)} does not match the discard.`);
    player.hand.splice(unique[0],1); if (shown.color === 'Wild') shown.chosenColor = options.color || (game.side === 'dark' ? DARK_COLORS[0] : LIGHT_COLORS[0]);
    game.discard.push(selected); let cue = { type: 'card', pan: .75 }; let message = `${player.name} played ${describeCard(game, selected)}.`;
    if (game.variant === 'Uno Flip!' && shown.value === 'Flip') { game.side = game.side === 'light' ? 'dark' : 'light'; cue = { type:'flip' }; message += ` Every hand and deck flipped to the ${game.side === 'light' ? 'Light Side' : 'Dark Side'}.`; }
    if (game.variant === 'Uno Flip!' && shown.value === 'Skip Everyone') { message += ' Everyone else was skipped.'; }
    else if (shown.value === 'Reverse') { game.direction *= -1; if (game.players.filter(item=>!item.eliminated).length === 2) advance(game); advance(game); }
    else if (shown.value === 'Skip') advance(game, 2);
    else if (shown.value === 'Attack') { advance(game); const target = activePlayer(game); const amount = Math.floor(random() * 9); drawCards(game,target,amount); message += ` The launcher dealt ${amount} card${amount===1?'':'s'} to ${target.name}.`; cue={type:'launcher',amount}; advance(game); }
    else if (shown.value === 'Wild Draw Color') { advance(game); const target=activePlayer(game); const wanted=shown.chosenColor; let amount=0,drawn; do { drawn=drawOne(game); if(drawn){target.hand.push(drawn);amount+=1;} } while(drawn && face(game,drawn).color!==wanted && amount<20); message += ` ${target.name} drew ${amount} cards seeking ${wanted}.`; advance(game); }
    else if (isDrawValue(shown.value)) {
      const amount=drawAmount(shown.value);
      if (game.variant === "Show 'Em No Mercy") { game.pendingDraw += amount; message += ` The draw stack is now ${game.pendingDraw}.`; advance(game); }
      else { advance(game); const target=activePlayer(game); drawCards(game,target,amount); message += ` ${target.name} drew ${amount} and was skipped.`; advance(game); }
    } else if (!(game.variant === 'Uno Flip!' && shown.value === 'Skip Everyone')) advance(game);
    if (checkWinner(game,player)) message += ` ${player.name} wins!`;
    return finish(game,{message,cue});
  }
  function draw(game, playerId, random = Math.random) {
    if (game.status !== 'playing') throw new Error('The game is finished.');
    const player=activePlayer(game);if(player.id!==playerId)throw new Error('Wait for your turn.');
    let amount=game.pendingDraw || 1; let cue={type:'warning'};
    if(game.variant==='Uno Attack'&&!game.pendingDraw){amount=Math.floor(random()*9);cue={type:'launcher',amount};}
    drawCards(game,player,amount);game.pendingDraw=0;let message=`${player.name} drew ${amount} card${amount===1?'':'s'}.`;
    if(game.variant==="Show 'Em No Mercy"&&player.hand.length>=10){player.eliminated=true;message+=` ${player.name} reached 10 cards and was eliminated.`;}
    if(!checkWinner(game,player))advance(game);return finish(game,{message,cue});
  }
  function declare(game,playerId,word){const player=game.players.find(item=>item.id===playerId);if(!player)throw new Error('Player not found.');const expected=game.variant==='Uno Dos'?'DOS':'UNO';if(word!==expected)throw new Error(`Declare ${expected} in this variant.`);const required=expected==='DOS'?2:1;if(player.hand.length!==required)throw new Error(`${expected} must be declared with exactly ${required} cards remaining.`);player.declaration=expected;return finish(game,{message:`${player.name} declared ${expected}!`,cue:{type:'declare'}});}
  function finish(game,result){game.announcement=result.message;game.sequence+=1;return result;}
  return Object.freeze({ VARIANTS, LIGHT_COLORS, DARK_COLORS, createGame, face, describeCard, canMatch, play, draw, declare });
});
