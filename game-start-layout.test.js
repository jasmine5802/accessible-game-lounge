'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const gameFiles = [
  'ducks-race.js',
  'monopoly.js',
  'uno.js',
  'life.js',
  'horserace.js',
  'dominoes.js',
  'skipbo.js',
  'mallmadness.js'
];

for (const file of gameFiles) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  assert(source.includes("window.dispatchEvent(new CustomEvent('lounge-gameplay-started'))"), `${file} must dispatch the shared gameplay-started event when gameplay begins.`);
}

console.log('Gameplay start layout event dispatch checks passed.');
