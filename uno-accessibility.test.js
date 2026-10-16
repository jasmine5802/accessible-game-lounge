'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const rules=require('./uno-rules'),source=fs.readFileSync('uno.js','utf8');
function element(){return {dataset:{},textContent:'',checked:false,tagName:'DIV',children:[],classList:{add(){}},setAttribute(){},append(){},addEventListener(type,handler){if(type==='focus')this.onfocus=handler},focus(){this.onfocus?.()},replaceChildren(...nodes){this.children=nodes},querySelector(){return null}}}
for(const accessible of [true,false])for(const variant of rules.VARIANTS){
 const elements=new Map(),handlers={},keys=[],frames=[],emitted=[];
 const document={activeElement:element(),body:element(),getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)},createElement:element,querySelector(){return null},addEventListener(type,handler){if(type==='keydown')keys.push(handler)}};
 const socket={on(event,handler){handlers[event]=handler},emit(...args){emitted.push(args)}};
 const context={document,window:{LoungeAccessibility:{accessibleMode:accessible,createGameStateController(){return null}},dispatchEvent(){}},io:()=>socket,location:{search:'?game=test'},URLSearchParams,sessionStorage:{getItem:()=>null},requestAnimationFrame:f=>frames.push(f),CustomEvent:function(){},UnoRules:rules,Option:function(){}};
 vm.createContext(context);vm.runInContext(source,context);
 const game={variant,status:'playing',sequence:1,side:'light',turnPlayerId:'a',players:[{id:'a',name:'Alex',cardCount:2},{id:'b',name:'Blair',cardCount:7}],myHand:[{color:'Red',value:4},{color:'Blue',value:2}],discard:{color:'Red',value:4},centerRow:[{color:'Red',value:4},{color:'Green',value:2}],announcement:`${variant} started. Alex goes first.`};
 vm.runInContext("playerId='a'",context);handlers['uno-state']({game});frames.splice(0).forEach(f=>f());
 const message=elements.get('live').textContent;
 assert.equal(message,elements.get('announcement').textContent);
 assert.equal(message.split(`${variant} started.`).length-1,1);assert.match(message,/Your turn/);
 const press=key=>keys[0]({key,preventDefault(){}});
 document.activeElement.tagName='TEXTAREA';press(' ');assert.equal(emitted.length,0,'Chat must not draw');document.activeElement.tagName='DIV';
 press('t');frames.splice(0).forEach(f=>f());assert.match(elements.get('live').textContent,/Your turn/);
 press('ArrowDown');frames.splice(0).forEach(f=>f());
 assert.match(elements.get('live').textContent,/Blue 2/,'ArrowDown must announce the selected card');
 if(accessible){press('ArrowDown');frames.splice(0).forEach(f=>f());assert.match(elements.get('live').textContent,/Draw Card|Activate Card Launcher/);press('Enter');assert.equal(emitted.at(-1)[0],'uno-draw','Enter must activate the draw menu item');}

 if(variant!=='Uno Dos'){press(' ');assert.equal(emitted.at(-1)[0],'uno-draw');}
 handlers['uno-state']({game});assert.equal(frames.length,0,'Repeated snapshots must not speak again');
 vm.runInContext("say('Old');say('Newest')",context);frames.splice(0).forEach(f=>f());assert.equal(elements.get('live').textContent,'Newest');
}
console.log('All five UNO variants: accessible/visual messages, duplicate snapshots, chat isolation, draw and turn shortcuts passed.');
