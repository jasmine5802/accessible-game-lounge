'use strict';
(function exposeDominoes(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DominoesEngine=api})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const SETS=Object.freeze({'Double-Six':6,'Double-Nine':9});
  const MODES=Object.freeze(['Draw Game','Block Game','All Fives']);
  function createDeck(setName='Double-Six'){const maximum=SETS[setName];if(maximum===undefined)throw new Error('Unknown domino set.');const tiles=[];for(let left=0;left<=maximum;left+=1)for(let right=left;right<=maximum;right+=1)tiles.push(Object.freeze({id:`${left}-${right}`,left,right}));return tiles}
  function shuffle(tiles,random=Math.random){const result=tiles.map(tile=>({...tile}));for(let index=result.length-1;index>0;index-=1){const other=Math.floor(random()*(index+1));[result[index],result[other]]=[result[other],result[index]]}return result}
  function openEnds(board){if(!board.length)return{left:null,right:null,sum:0};const left=board[0].left,right=board[board.length-1].right;return{left,right,sum:left+right}}
  function oriented(tile,flipped=false){return flipped?{...tile,left:tile.right,right:tile.left}:{...tile}}
  function placeTile(board,tile,end,flipped=false){if(!['left','right'].includes(end))throw new Error('Choose the left or right end.');const candidate=oriented(tile,flipped);if(!board.length)return[candidate];const ends=openEnds(board);if(end==='left'){if(candidate.right!==ends.left)throw new Error(`${candidate.left}-${candidate.right} does not match the open left end ${ends.left}.`);return[candidate,...board]}if(candidate.left!==ends.right)throw new Error(`${candidate.left}-${candidate.right} does not match the open right end ${ends.right}.`);return[...board,candidate]}
  function canPlay(tile,board){if(!board.length)return true;const ends=openEnds(board);return tile.left===ends.left||tile.right===ends.left||tile.left===ends.right||tile.right===ends.right}
  function hasMove(hand,board){return hand.some(tile=>canPlay(tile,board))}
  function allFivesScore(board){const sum=openEnds(board).sum;return sum>0&&sum%5===0?sum:0}
  function pipTotal(tiles){return tiles.reduce((sum,tile)=>sum+tile.left+tile.right,0)}
  function tileName(tile){return `${tile.left}-${tile.right}`}
  return Object.freeze({SETS,MODES,createDeck,shuffle,openEnds,oriented,placeTile,canPlay,hasMove,allFivesScore,pipTotal,tileName});
});
