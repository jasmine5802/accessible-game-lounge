'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
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

const mainSource = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');
assert(
  mainSource.includes('configuredServerUrl(process.argv, process.env, app.isPackaged)'),
  'Packaged desktop builds must select Render from Electron app.isPackaged instead of NODE_ENV.'
);

console.log('Main server URL resolution checks passed.');
