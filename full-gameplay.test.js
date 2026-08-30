'use strict';
const fs=require('fs'),os=require('os'),path=require('path');
process.env.LOUNGE_DATA_DIR=fs.mkdtempSync(path.join(os.tmpdir(),'lounge-full-suite-'));
process.env.NODE_ENV='test';
process.env.LOUNGE_TEST_MONOPOLY_BALANCE='1';
let randomState=1;Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/0x100000000};
const{io}=require('socket.io-client');
const Dominoes=require('./dominoes-engine'),SkipBo=require('./skipbo-engine'),Mall=require('./mallmadness-engine');
const{startServer,server}=require('./server');
let hostSocket=null;
const call=(socket,event,data={})=>new Promise(resolve=>socket.emit(event,data,resolve));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const definitions=[
 {name:'Duck Race',category:'ducks-race',event:'ducks-race-state',start:'start-ducks-race'},
 {name:'Monopoly',category:'monopoly',event:'monopoly-state',start:'start-monopoly',options:{type:'Classic',secondary:'Top Hat'}},
 {name:'Classic UNO',category:'uno-classic',event:'uno-state',start:'start-uno'},
 {name:'UNO Flip',category:'uno-flip',event:'uno-state',start:'start-uno'},
 {name:'DOS',category:'uno-dos',event:'uno-state',start:'start-uno'},
 {name:"UNO Show 'Em No Mercy",category:'uno-no-mercy',event:'uno-state',start:'start-uno'},
 {name:'UNO Attack',category:'uno-attack',event:'uno-state',start:'start-uno'},
 {name:'Horse Race',category:'horse-race',event:'derby-state',start:'start-derby'},
 {name:'Dominoes',category:'dominoes',event:'domino-state',start:'start-dominoes',options:{type:'Double-Six',secondary:'Draw Game'}},
 {name:'Skip-Bo',category:'skip-bo',event:'skipbo-state',start:'start-skipbo',options:{type:'Quick game',secondary:'Standard rules'}},
 {name:'Mall Madness',category:'mall-madness',event:'mall-state',start:'start-mall',options:{type:'Quick shopping list',secondary:'Standard rules'}},
 {name:'The Game of Life',category:'life',event:'life-state',start:'start-life'}
];
function mallDirection(from,target){
 const queue=[[from,[]]],seen=new Set([from]);
 while(queue.length){const[id,path]=queue.shift();if(id===target)return path[0]||null;for(const next of Mall.neighbors(id))if(!seen.has(next.space.id)){seen.add(next.space.id);queue.push([next.space.id,[...path,next.direction]])}}
 return null;
}
async function act(socket,definition,game,hostId){
 if(definition.category==='ducks-race')return game.pendingMiniGame?.canAnswer?call(socket,'ducks-race-mini-answer',{choice:0}):call(socket,'ducks-race-roll');
 if(definition.category==='monopoly')return game.pendingPurchase?.playerId===hostId?call(socket,'monopoly-purchase-response',{accept:true}):call(socket,'monopoly-roll');
 if(definition.category.startsWith('uno-')){
  const attempts=[];
  if(game.variant==='Uno Dos')for(let centerIndex=0;centerIndex<game.centerRow.length;centerIndex++)for(let first=0;first<game.myHand.length;first++){attempts.push({indexes:[first],centerIndex,color:'Red'});for(let second=first+1;second<game.myHand.length;second++)attempts.push({indexes:[first,second],centerIndex,color:'Red'})}
  else {const colors=game.variant==='Uno Flip!'&&game.side==='dark'?['Pink','Teal','Orange','Purple']:['Red','Yellow','Green','Blue'],bestColor=colors.sort((a,b)=>game.myHand.filter(card=>(game.variant==='Uno Flip!'?card[game.side]:card)?.color===b).length-game.myHand.filter(card=>(game.variant==='Uno Flip!'?card[game.side]:card)?.color===a).length)[0];game.myHand.forEach((_card,index)=>attempts.push({indexes:[index],color:bestColor,centerIndex:0}));}
  for(const attempt of attempts){const result=await call(socket,'uno-play',attempt);if(result.ok)return result}
  return call(socket,'uno-draw');
 }
 if(definition.category==='life')return game.pendingChoice?.playerId===hostId?call(socket,'life-choose',{choice:0}):call(socket,'life-spin');
 if(definition.category==='horse-race')return game.pendingMiniGame?.canAnswer?call(socket,'derby-mini-answer',{choice:0}):call(socket,'derby-roll');
 if(definition.category==='dominoes'){
  for(const tile of game.myHand)for(const end of ['left','right'])for(const flipped of [false,true]){try{Dominoes.placeTile(game.board,tile,end,flipped)}catch{continue}return call(socket,'domino-play',{tileId:tile.id,end,flipped})}
  return call(socket,'domino-draw');
 }
 if(definition.category==='skip-bo'){
  const sources=[];if(game.myStockTop)sources.push({source:'stock',sourceIndex:0,card:game.myStockTop});game.myHand.forEach((card,index)=>sources.push({source:'hand',sourceIndex:index,card}));game.myDiscards.forEach((pile,index)=>{if(pile.length)sources.push({source:'discard',sourceIndex:index,card:pile.at(-1)});});
  for(const source of sources)for(let targetIndex=0;targetIndex<4;targetIndex++)if(SkipBo.canBuild(source.card,game.buildingPiles[targetIndex]))return call(socket,'skipbo-play',{source:source.source,sourceIndex:source.sourceIndex,targetType:'building',targetIndex});
  return call(socket,'skipbo-play',{source:'hand',sourceIndex:0,targetType:'discard',targetIndex:0});
 }
 if(definition.category==='mall-madness'){
  if(game.phase==='director')return call(socket,'mall-director');
  const me=game.players.find(player=>player.id===hostId),wanted=game.myShoppingList.find(item=>!item.bought),target=wanted?.storeId;
  if((game.phase==='action'||game.phase==='moving')&&me.position===target)return call(socket,'mall-action');
  const direction=mallDirection(me.position,target);return direction?call(socket,'mall-move',{direction}):call(socket,'mall-action');
 }
 throw Error(`No strategy for ${definition.name}`);
}
(async()=>{
 await startServer(0,'127.0.0.1');const socket=hostSocket=io(`http://127.0.0.1:${server.address().port}`,{transports:['websocket']});await new Promise(resolve=>socket.once('connect',resolve));
 const registered=await call(socket,'register',{username:`FullSuite${Date.now()}`.slice(0,24),password:'FullGame9!'});if(!registered.ok)throw Error(registered.error);
 for(const definition of definitions.filter(item=>!process.env.FULL_GAME_FILTER||item.name===process.env.FULL_GAME_FILTER)){
  randomState=definition.name.split('').reduce((seed,character)=>((Math.imul(seed,31)+character.charCodeAt(0))>>>0),1);
  console.log(`${definition.name}: starting full-game test.`);
  const created=await call(socket,'create-game',{category:definition.category});if(!created.ok)throw Error(`${definition.name}: ${created.error}`);const hostId=created.room.hostId;
  if(definition.options){const configured=await call(socket,'set-game-options',definition.options);if(!configured.ok)throw Error(`${definition.name}: ${configured.error}`)}
  const added=await call(socket,'add-computer-player');if(!added.ok)throw Error(`${definition.name}: ${added.error}`);
  const entered=await call(socket,'start-game');if(!entered.ok)throw Error(`${definition.name}: ${entered.error}`);
  let latest=null;const receive=payload=>{latest=payload.game};socket.on(definition.event,receive);
  const started=await call(socket,definition.start);if(!started.ok)throw Error(`${definition.name}: ${started.error}`);latest=started.game;
  let actions=0,lastActedSequence=-1;const deadline=Date.now()+120000;
  while(latest?.status==='playing'&&Date.now()<deadline){
   if((latest.pendingMiniGame?.canAnswer||latest.turnPlayerId===hostId)&&latest.sequence!==lastActedSequence){const attemptedSequence=latest.sequence;lastActedSequence=attemptedSequence;const result=await act(socket,definition,latest,hostId);actions++;if(!result?.ok){const stateAdvanced=latest.sequence!==attemptedSequence,transientRace=['Wait for your turn.','Finish the current mini-game before rolling.'].includes(result.error);if(!stateAdvanced&&!transientRace)throw Error(`${definition.name} action ${actions}: ${result?.error}`)}}
   await pause(2);
  }
  socket.off(definition.event,receive);
  if(latest?.status!=='finished'||!latest.winnerId)throw Error(`${definition.name} did not finish with a winner after ${actions} host actions; last sequence ${latest?.sequence}, turn ${latest?.turnPlayerId}, status ${latest?.status}.`);
  console.log(`${definition.name}: full game completed, ${actions} host actions, winner ${latest.players.find(player=>player.id===latest.winnerId)?.name||latest.winnerId}.`);
  await call(socket,'leave-room');await pause(20);
 }
 socket.close();console.log('All full-game playthroughs passed.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{hostSocket?.close();server.closeAllConnections?.();if(server.listening)await new Promise(resolve=>server.close(resolve));fs.rmSync(process.env.LOUNGE_DATA_DIR,{recursive:true,force:true})});
