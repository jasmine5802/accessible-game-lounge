'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const gameFiles = [
  'ducks-race.js',
  'monopoly.js',
  'uno.js',
  'horserace.js',
  'dominoes.js',
  'skipbo.js',
  'mallmadness.js',
  'life.js'
];

const failures = [];
for (const file of gameFiles) {
  const source = fs.readFileSync(path.join(__dirname, file), 'utf8');
  if (!source.includes("socket.on('table-player-joined'")) {
    failures.push(`${file}: missing table-player-joined handler`);
    continue;
  }
  if (!source.includes("window.LoungeAccessibility?.speak?.(data.message);")) {
    failures.push(`${file}: missing shared speech announcement for join events`);
  }
}

assert.deepStrictEqual(failures, [], failures.join('\n'));
console.log('All gameplay pages announce player joins through the shared accessibility layer.');
