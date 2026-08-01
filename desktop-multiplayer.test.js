'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const source = fs.readFileSync(path.join(__dirname, 'main.js'), 'utf8');

assert(source.includes("const PRODUCTION_SERVER_URL = 'https://accessible-game-lounge.onrender.com/'"), 'Desktop app is not configured for the shared production lounge.');
assert(!source.includes("require('./server')"), 'Desktop app still starts an isolated local fallback server.');
assert(!source.includes("startServer(0, '127.0.0.1')"), 'Desktop app still contains the private localhost fallback.');
assert(source.includes("buttons: ['Retry Connection', 'Quit']"), 'Desktop app does not offer an explicit shared-server retry flow.');
assert(source.includes('Offline local rooms are disabled'), 'Desktop connection failure does not explain why local rooms are unsafe for multiplayer.');

console.log('Desktop client always uses the shared multiplayer server and never creates an isolated fallback lounge.');
