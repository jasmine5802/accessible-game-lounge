'use strict';

(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MallMadnessEngine=api}(typeof globalThis!=='undefined'?globalThis:this,function(){
  const WIDTH=11,HEIGHT=4;
  const STORES=[
    ['Neon Threads','Fashion','Jacket',45],['Sole Station','Fashion','Sneakers',40],['Glamour Glow','Beauty','Makeup Kit',24],['Salon Spark','Beauty','Hair Set',28],
    ['Pixel Palace','Electronics','Video Game',50],['Sound Circuit','Electronics','Headphones',36],['Book Nook','Leisure','Novel',16],['Hobby Hub','Leisure','Model Kit',22],
    ['Sweet Street','Food','Candy Box',12],['Food Court Fiesta','Food','Taco Meal',14],['Home Bright','Home','Desk Lamp',30],['Cozy Corner','Home','Throw Pillow',20],
    ['Sport Zone','Sports','Basketball',26],['Outdoor Trek','Sports','Backpack',34],['Toy Galaxy','Toys','Robot Toy',32],['Plush Planet','Toys','Stuffed Bear',18]
  ].map(([name,category,item,price],index)=>({id:`store-${index+1}`,name,category,item,price}));
  const STORE_SPACE_IDS=[1,3,5,7,9,12,14,16,18,20,23,25,29,33,38,42];
  const storeSpaces=new Map(STORE_SPACE_IDS.map((spaceId,index)=>[spaceId,index]));
  const atmSpaces=new Set([6,17,28,39]),escalatorSpaces=new Set([10,32]);
  const MALL=Array.from({length:WIDTH*HEIGHT},(_,id)=>{const storeIndex=storeSpaces.get(id),x=id%WIDTH,y=Math.floor(id/WIDTH);if(storeIndex!==undefined){const store=STORES[storeIndex];return{id,x,y,type:'store',storeId:store.id,name:store.name,category:store.category,item:store.item,price:store.price}}if(atmSpaces.has(id))return{id,x,y,type:'atm',name:`Bank ATM ${[...atmSpaces].indexOf(id)+1}`};if(escalatorSpaces.has(id))return{id,x,y,type:'escalator',name:'Escalator'};return{id,x,y,type:'hallway',name:`Hallway ${id+1}`}});
  const DIRECTIONS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
  const CATEGORIES=[...new Set(STORES.map(store=>store.category))];
  const ANNOUNCEMENTS=['The mall is closing in 10 minutes!','A lost child has been reunited with their family.','The fountain show begins in five minutes.','Please remember where you parked.'];
  function space(id){return MALL[id]||null}function neighbors(id){const current=space(id);if(!current)return[];return Object.entries(DIRECTIONS).map(([direction,[dx,dy]])=>({direction,space:MALL.find(candidate=>candidate.x===current.x+dx&&candidate.y===current.y+dy)})).filter(entry=>entry.space)}
  function move(id,direction){const destination=neighbors(id).find(entry=>entry.direction===direction)?.space;if(!destination)throw new Error('The mall wall blocks that direction.');return destination.id}
  function makeShoppingList(playerIndex=0){return Array.from({length:6},(_,index)=>{const storeIndex=(playerIndex*3+index*5)%STORES.length,store=STORES[storeIndex];return{storeId:STORE_SPACE_IDS[storeIndex],storeName:store.name,category:store.category,item:store.item,price:store.price,bought:false}})}
  function director(random=Math.random){const roll=random();if(roll<.75)return{type:'move',count:1+Math.floor(random()*6),message:null};if(roll<.9){const category=CATEGORIES[Math.floor(random()*CATEGORIES.length)];return{type:'sale',category,discount:.5,message:`Flash sale! All ${category} items are 50 percent off.`}}const message=ANNOUNCEMENTS[Math.floor(random()*ANNOUNCEMENTS.length)];return{type:'announcement',message}}
  function priceFor(item,sale){return sale?.category===item.category?Math.ceil(item.price*(1-sale.discount)):item.price}
  function nearbyStores(id){return neighbors(id).filter(entry=>entry.space.type==='store').map(entry=>entry.space.name)}
  return{WIDTH,HEIGHT,STORES,MALL,DIRECTIONS,CATEGORIES,ANNOUNCEMENTS,space,neighbors,move,makeShoppingList,director,priceFor,nearbyStores};
}));
