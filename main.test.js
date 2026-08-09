'use strict';

const assert = require('assert');
const { configuredServerUrl } = require('./main');

assert.strictEqual(
  configuredServerUrl(['node', 'main.js'], { LOUNGE_SERVER_URL: '' }, false),
  'http://127.0.0.1:3000/'
);

assert.strictEqual(
  configuredServerUrl(['node', 'main.js', '--server-url=https://example.test/'], {}, false),
  'https://example.test/'
);

assert.strictEqual(
  configuredServerUrl(['node', 'main.js'], {}, true),
  'https://accessible-game-lounge.onrender.com/'
);

console.log('Main server URL resolution checks passed.');
