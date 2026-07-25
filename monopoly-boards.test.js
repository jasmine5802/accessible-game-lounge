'use strict';

const assert = require('node:assert/strict');
const MonopolyBoards = require('./monopoly-boards');

const board = MonopolyBoards.createBoard('Classic');
const brown = board.filter(space => space.group === 'brown');
const lightBlue = board.filter(space => space.group === 'light-blue');
const owners = {
  [brown[0].index]: 'player-one',
  [lightBlue[0].index]: 'player-one'
};

let progress = MonopolyBoards.ownershipProgress(board, owners, 'player-one');
assert.deepEqual(progress.map(group => [group.group, group.owned, group.total, group.needed, group.complete]), [
  ['brown', 1, 2, 1, false],
  ['light-blue', 1, 3, 2, false]
]);
assert.deepEqual(progress[0].properties, [brown[0].name]);

owners[brown[1].index] = 'player-one';
progress = MonopolyBoards.ownershipProgress(board, owners, 'player-one');
assert.equal(progress[0].complete, true);
assert.equal(progress[0].needed, 0);
assert.deepEqual(MonopolyBoards.ownershipProgress(board, owners, 'player-two'), []);

console.log('Monopoly ownership color-set progress tests passed.');
