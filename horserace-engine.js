'use strict';

(function exposeDerbyEngine(root, factory) {
  const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DerbyEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const terrainBySpace={4:'Deep Turf',7:'Hurdle',9:'Sugar Boost',11:'Deep Turf',13:'Wind Pocket',15:'Hurdle',16:'Sugar Boost',18:'Deep Turf'};
  const icons={'Normal Turf':'·','Deep Turf':'🟫','Hurdle':'🚧','Sugar Boost':'🍬','Wind Pocket':'💨','Finish':'🏁'};
  const TRACK=Object.freeze(Array.from({length:25},(_unused,index)=>{const number=index+1;const terrain=number===25?'Finish':terrainBySpace[number]||'Normal Turf';const descriptions={'Normal Turf':'Standard flat racing turf.','Deep Turf':'Heavy ground knocks a horse back one space.','Hurdle':'Movement stops here. Play High Jump on a later turn to pass it.','Sugar Boost':'A burst of energy moves the horse forward two more spaces.','Wind Pocket':'A tailwind carries the horse level with the current leader.','Finish':'Cross the finish line to win the Horse Race.'};return Object.freeze({index,number,terrain,icon:icons[terrain],description:descriptions[terrain]})}));
  const TOTAL_LAPS=6;
  const LAP_EVENTS=Object.freeze([
    Object.freeze({lap:1,name:'The Gates Open',description:'Standard, clean track.'}),
    Object.freeze({lap:2,name:'Torn Up Turf',description:'Two additional Deep Turf hazards are active in every lane.'}),
    Object.freeze({lap:3,name:'Towering Hurdles',description:'Hurdles knock horses back 2 spaces and immediately end their movement.'}),
    Object.freeze({lap:4,name:'Sugar Rush!',description:'Two additional Sugar Boost tiles are active in every lane.'}),
    Object.freeze({lap:5,name:'The Thunderstorm',description:'A second Wind Pocket drafting tile is active in every lane.'}),
    Object.freeze({lap:6,name:'The Final Sprint',description:'All Deep Turf is removed, and racers may play up to two Sabotage cards per turn.'})
  ]);
  const CARDS=Object.freeze({
    Canter:Object.freeze({name:'Canter',move:2,target:false,description:'Move forward 2 spaces.'}),
    Gallop:Object.freeze({name:'Gallop',move:3,target:false,description:'Move forward 3 spaces.'}),
    'High Jump':Object.freeze({name:'High Jump',move:2,target:false,jumpsHurdle:true,description:'Clear a Hurdle and move forward 2 spaces.'}),
    'Spur of the Moment':Object.freeze({name:'Spur of the Moment',move:5,target:false,discardHand:true,description:'Move forward 5 spaces, then discard the rest of your hand.'}),
    'Backstretch Burst':Object.freeze({name:'Backstretch Burst',move:4,target:false,description:'Charge forward 4 spaces.'}),
    'Home Stretch':Object.freeze({name:'Home Stretch',move:6,target:false,description:'Sprint forward 6 spaces.'}),
    Lasso:Object.freeze({name:'Lasso',move:0,target:true,sabotage:true,description:'Pull one opponent back 3 spaces.'}),
    'Position Swap':Object.freeze({name:'Position Swap',move:0,target:true,sabotage:true,description:'Swap track positions with one opponent.'}),
    'Mud Sling':Object.freeze({name:'Mud Sling',move:0,target:true,sabotage:true,description:'Place a one-use Deep Turf hazard on the next normal space in an opponent’s lane.'})
  });
  const CARD_NAMES=Object.freeze(Object.keys(CARDS));const HAND_LIMIT=4;
  function createDeck(random=Math.random){const deck=CARD_NAMES.flatMap(name=>Array.from({length:6},()=>name));for(let i=deck.length-1;i>0;i-=1){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
  function randomSpaces(count,excluded=[],random=Math.random){const choices=TRACK.filter(space=>space.number>1&&space.number<25&&!excluded.includes(space.number)&&space.terrain==='Normal Turf').map(space=>space.number);const picked=[];while(picked.length<count&&choices.length){const index=Math.floor(random()*choices.length);picked.push(choices.splice(index,1)[0])}return picked.sort((a,b)=>a-b)}
  function createLapHazards(lap,random=Math.random){if(lap===2)return{deep:randomSpaces(2,[],random),sugar:[],wind:[]};if(lap===4)return{deep:[],sugar:randomSpaces(2,[],random),wind:[]};if(lap===5)return{deep:[],sugar:[],wind:randomSpaces(1,[],random)};return{deep:[],sugar:[],wind:[]}}
  function terrainAt(position,mudHazards=[],lap=1,lapHazards={}){const number=position+1;if(mudHazards.includes(number)||(lap!==6&&lapHazards.deep?.includes(number)))return'Deep Turf';if(lapHazards.sugar?.includes(number))return'Sugar Boost';if(lapHazards.wind?.includes(number))return'Wind Pocket';const base=TRACK[position]?.terrain||'Finish';return lap===6&&base==='Deep Turf'?'Normal Turf':base}
  function nextHazard(position,mudHazards=[],lap=1,lapHazards={}){for(let index=position+1;index<TRACK.length;index+=1){const terrain=terrainAt(index,mudHazards,lap,lapHazards);if(terrain!=='Normal Turf'&&terrain!=='Finish')return {space:index+1,terrain,distance:index-position}}return null}
  function nextMudSpace(position,mudHazards=[],lap=1,lapHazards={}){for(let number=position+2;number<25;number+=1){if(terrainAt(number-1,mudHazards,lap,lapHazards)==='Normal Turf')return number}return null}
  function move(position,cardName,leaderPosition,mudHazards=[],lap=1,lapHazards={}){const card=CARDS[cardName];if(!card||!card.move)throw new Error('Choose a movement card.');if(terrainAt(position,mudHazards,lap,lapHazards)==='Hurdle'&&lap!==3&&!card.jumpsHurdle)throw new Error('The Hurdle blocks this horse. Play High Jump to continue.');let raw=position+card.move,crossedFinish=raw>=25,destination=raw%25,consumedMud=null;const effects=[],resolved=new Set();while(!resolved.has(destination)){resolved.add(destination);const terrain=terrainAt(destination,mudHazards,lap,lapHazards);if(terrain==='Deep Turf'){effects.push('Deep Turf knocks the horse back 1 space.');consumedMud=mudHazards.includes(destination+1)?destination+1:null;destination=Math.max(0,destination-1);break}if(terrain==='Hurdle'&&lap===3){effects.push('Towering Hurdles knocks the horse back 2 spaces and ends its movement.');destination=Math.max(0,destination-2);break}if(terrain==='Sugar Boost'){effects.push('Sugar Boost sends the horse forward 2 more spaces.');raw=destination+2;if(raw>=25)crossedFinish=true;destination=raw%25;continue}if(terrain==='Wind Pocket'){const matched=Math.max(destination,leaderPosition);effects.push(`Wind Pocket carries the horse to space ${matched+1}, matching the leader.`);destination=matched;break}break}return {position:destination,landing:TRACK[destination],effects,consumedMud,crossedFinish}}
  return Object.freeze({TRACK,CARDS,CARD_NAMES,HAND_LIMIT,TOTAL_LAPS,LAP_EVENTS,createDeck,createLapHazards,terrainAt,nextHazard,nextMudSpace,move});
});
