'use strict';
const assert = require('node:assert/strict');
const rules = require('./uno-rules');
const players = [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Blair' }];
const take = (game, predicate) => {
  for (const player of game.players) {
    const index = player.hand.findIndex(card => predicate(rules.face(game, card)));
    if (index >= 0) return player.hand.splice(index, 1)[0];
  }
  const index = game.deck.findIndex(card => predicate(rules.face(game, card)));
  assert.notEqual(index, -1, 'Required test card exists');
  return game.deck.splice(index, 1)[0];
};
for (const variant of rules.VARIANTS) {
  const game = rules.createGame(variant, players, () => 0.42);
  assert.equal(game.players.length, 2);
  assert.equal(game.players[0].hand.length, 7);
  assert.ok(variant === 'Uno Dos' ? game.centerRow.length === 2 : game.discard.length > 0);
}
{
  const game = rules.createGame('Uno Flip!', players, () => 0.42);
  const flip = take(game, card => card.value === 'Flip');
  const color = rules.face(game, flip).color;
  game.players[0].hand = [flip];
  game.discard = [take(game, card => card.color === color && card.value !== 'Flip')];
  const result = rules.play(game, 'a', 0);
  assert.equal(game.side, 'dark');
  assert.equal(result.cue.type, 'flip');
}
{
  const game = rules.createGame('Uno Dos', players, () => 0.42);
  game.players[0].hand = [take(game, card => card.value === 2), take(game, card => card.value === 3), take(game, card => card.value === 9)];
  game.centerRow[0] = take(game, card => card.value === 5);
  rules.play(game, 'a', [0, 1], { centerIndex: 0 });
  assert.match(game.announcement, /matched .* plus .* Center Row/i);
}
{
  const game = rules.createGame('Uno Dos', players, () => 0.42);
  const match = take(game, card => card.value === 2);
  const spare = take(game, card => card.value === 9);
  const center = take(game, card => card.value === 2);
  const discarded = take(game, () => true);
  game.players[0].hand = [match, spare];
  game.centerRow[0] = center;
  game.discard = [discarded];
  game.deck = [];
  rules.play(game, 'a', [0], { centerIndex: 0 });
  assert.ok(game.centerRow[0], 'DOS must recycle matched and discarded cards when replacing an exhausted Center Row.');
}
{
  const game = rules.createGame("Show 'Em No Mercy", players, () => 0.42);
  const card = take(game, face => face.value === 'Draw 10');
  const color = rules.face(game, card).color;
  game.players[0].hand = [card, take(game, face => face.value === 1)];
  game.discard = [take(game, face => face.color === color && face.value !== 'Draw 10')];
  rules.play(game, 'a', 0);
  assert.equal(game.pendingDraw, 10);
  rules.draw(game, 'b');
  assert.equal(game.players[1].eliminated, true);
}
{
  const game = rules.createGame('Uno Attack', players, () => 0.42);
  const card = take(game, face => face.value === 'Attack');
  const color = rules.face(game, card).color;
  game.players[0].hand = [card, take(game, face => face.value === 1)];
  game.discard = [take(game, face => face.color === color && face.value !== 'Attack')];
  const before = game.players[1].hand.length;
  const result = rules.play(game, 'a', 0, {}, () => 0.999);
  assert.equal(game.players[1].hand.length, before + 8);
  assert.deepEqual(result.cue, { type: 'launcher', amount: 8 });
}
{
  const make=(illegal=false)=>{const game=rules.createGame('Classic Uno',players,()=>0.42);game.discard=[{color:'Red',value:5}];game.players[0].hand=[{color:'Wild',value:'Wild Draw 4'},{color:illegal?'Red':'Blue',value:5}];return game;};
  for(const [illegal,challenge,penalty] of [[false,false,4],[true,false,4],[false,true,6],[true,true,4]]){
    const game=make(illegal),before=game.players.map(p=>p.hand.length);rules.play(game,'a',0,{color:'Yellow'});
    assert.equal(game.turnIndex,1);assert.equal(game.pendingChallenge.illegal,illegal);assert.equal(game.players[1].hand.length,before[1]);
    assert.throws(()=>rules.play(game,'b',0),/Accept or challenge/);assert.throws(()=>rules.resolveDrawFour(game,'a',challenge),/Only the next/);
    const result=rules.resolveDrawFour(game,'b',challenge);assert.equal(game.pendingChallenge,null);
    if(illegal&&challenge){assert.equal(game.players[0].hand.length,before[0]-1+penalty);assert.equal(game.turnIndex,1);assert.equal(game.players[1].hand.length,before[1]);}
    else{assert.equal(game.players[1].hand.length,before[1]+penalty);assert.equal(game.turnIndex,0);}
    assert.equal(game.discard.at(-1).chosenColor,'Yellow');assert.equal(game.pendingDraw,0);
    assert.deepEqual(result.revealedHand,challenge?[`${illegal?'Red':'Blue'} 5`]:null);
    assert.throws(()=>rules.resolveDrawFour(game,'b',challenge),/no Wild Draw Four/);
  }
  const final=make();final.players[0].hand.length=1;rules.play(final,'a',0,{color:'Blue'});assert.equal(final.status,'playing');rules.resolveDrawFour(final,'b',true);assert.equal(final.status,'finished');assert.equal(final.winnerId,'a');
  const draw=make();rules.play(draw,'a',0,{color:'Blue'});const count=draw.players[1].hand.length;rules.draw(draw,'b');assert.equal(draw.players[1].hand.length,count+4);
  const regular=make(true);regular.players[0].hand[0].value='Wild';rules.play(regular,'a',0,{color:'Green'});assert.equal(regular.pendingChallenge,undefined);assert.equal(regular.discard.at(-1).chosenColor,'Green');
  const invalid=make();const snapshot=JSON.stringify(invalid);assert.throws(()=>rules.play(invalid,'a',0,{color:'Pink'}),/valid wild color/);assert.equal(JSON.stringify(invalid),snapshot);

}
console.log('UNO rules regression checks passed.');
