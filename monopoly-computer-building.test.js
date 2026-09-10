'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const Boards = require('./monopoly-boards');
const { chooseMonopolyBuilding } = require('./computer-player');
const board = Boards.boards.Classic;
const group = board.filter(space => space.type === 'Property' && space.group === board.find(space => space.type === 'Property').group);
function state() { return {status:'playing',sequence:1,board,players:[{id:'bot',balance:10000}],owners:Object.fromEntries(group.map(space=>[space.index,'bot'])),houses:{},turnPlayerId:'human'}; }
const game = state();
assert.equal(chooseMonopolyBuilding(game,'bot'),group[0].index);
delete game.owners[group[1].index];assert.equal(chooseMonopolyBuilding(game,'bot'),null);
game.owners[group[1].index]='human';assert.equal(chooseMonopolyBuilding(game,'bot'),null);
game.owners[group[1].index]='bot';game.houses[group[0].index]=1;
assert.equal(chooseMonopolyBuilding(game,'bot'),group[1].index);
game.players[0].balance=0;assert.equal(chooseMonopolyBuilding(game,'bot'),null);
game.players[0].balance=10000;game.pendingTrade={toId:'human'};assert.equal(chooseMonopolyBuilding(game,'bot'),null);
delete game.pendingTrade;game.pendingPurchase={playerId:'human'};assert.equal(chooseMonopolyBuilding(game,'bot'),null);
delete game.pendingPurchase;
for(const space of group)game.houses[space.index]=4;
assert.notEqual(chooseMonopolyBuilding(game,'bot'),null);
for(const space of group)game.houses[space.index]=5;
assert.equal(chooseMonopolyBuilding(game,'bot'),null);
game.status='finished';assert.equal(chooseMonopolyBuilding(game,'bot'),null);

(async()=>{
 const handlers={},actions=[],live=state();live.turnPlayerId='bot';
 let resolveFinished;const finished=new Promise(resolve=>resolveFinished=resolve);
 const socket={on:(event,handler)=>handlers[event]=handler,disconnect(){},emit(event,data,callback){
  if(event==='authenticate-computer')return callback({ok:true,playerId:'bot'});
  actions.push(event);
  if(event==='monopoly-house'){
   assert.equal(data.spaceIndex,chooseMonopolyBuilding(live,'bot'));
   live.players[0].balance-=Boards.buildingCost(board,board[data.spaceIndex]);
   live.houses[data.spaceIndex]=(live.houses[data.spaceIndex]||0)+1;
   live.sequence++;
   // Broadcast before acknowledgement, as the real server does.
   handlers['monopoly-state']({game:structuredClone(live)});
   callback({ok:true});
  } else if(event==='monopoly-roll'){
   live.status='finished';live.sequence++;
   handlers['monopoly-state']({game:structuredClone(live)});callback({ok:true});resolveFinished();
  }else throw Error('Unexpected action '+event);
 }};
 const sandbox={require:name=>name==='socket.io-client'?{io:()=>socket}:require(name),module:{exports:{}},process:{env:{NODE_ENV:'test'}},setTimeout};
 vm.runInNewContext(fs.readFileSync('computer-player.js','utf8'),sandbox);
 sandbox.module.exports.startComputerPlayer({url:'test',roomCode:'test',secret:'test'});
 handlers.connect();handlers['monopoly-state']({game:structuredClone(live)});
 const timer=setTimeout(()=>{console.error('Computer failed to finish building and roll.');process.exit(1);},3000);
 await finished;clearTimeout(timer);
 assert.equal(actions.filter(action=>action==='monopoly-house').length,group.length*5);
 assert.equal(actions.filter(action=>action==='monopoly-roll').length,1);
 assert(group.every(space=>live.houses[space.index]===5));
 console.log('Computer Monopoly complete sets, ownership, affordability, pending decisions, even building, hotels, and automatic build-to-roll flow passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
