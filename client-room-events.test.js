'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
for (const name of ['mallmadness', 'life']) {
  const html = fs.readFileSync(`${name}.html`, 'utf8');
  const elements = new Map();
  function element() {
    return {textContent:'',children:[],options:[],addEventListener(){},setAttribute(){},append(...nodes){this.children.push(...nodes)},replaceChildren(...nodes){this.children=nodes},scrollIntoView(){},focus(){}};
  }
  for (const match of html.matchAll(/id="([^"]+)"/g)) elements.set(match[1], element());
  const handlers = new Map();
  const spoken = [];
  const socket = {on(event,handler){handlers.set(event,handler)},emit(){}};
  const context = {
    io:()=>socket, URLSearchParams, location:{search:'?game=TEST'},
    sessionStorage:{getItem(key){return {loungeUsername:'TestHost',loungeSessionToken:'test-token'}[key]||null}},
    window:{addEventListener(){},dispatchEvent(){},LoungeAccessibility:{createGameStateController:()=>null,speak:message=>spoken.push(message)}},
    document:{getElementById:id=>elements.get(id)||null,querySelector:selector=>elements.get(selector.slice(1))||null,createElement:()=>element(),addEventListener(){}},
    requestAnimationFrame:fn=>fn(),setTimeout:fn=>fn(),CustomEvent:function(){},
    MallMadnessEngine:require('./mallmadness-engine'), LifeThemes:require('./life-themes')
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(`${name}.js`,'utf8'),context,{filename:`${name}.js`});
  const room={code:'TEST',hostId:'testhost',lifeTheme:'Classic 1960',players:[{id:'testhost',name:'TestHost'}]};
  for(let n=0;n<2;n++){
    assert.doesNotThrow(()=>handlers.get('lobby-updated')(room),`${name}: repeated lobby updates must not throw`);
    assert.doesNotThrow(()=>handlers.get('table-player-joined')({message:'TestGuest joined.'}),`${name}: player joins must not throw`);
  }
  assert.equal(spoken.at(-1),'TestGuest joined.');
  assert.equal(elements.get(name==='life'?'announcer':'turn').textContent,'TestGuest joined.');
}
console.log('Mall Madness and Life client lobby/join event regressions passed.');

