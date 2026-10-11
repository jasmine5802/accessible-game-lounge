'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { verifyDeployment, applicationFiles } = require('./verify-deployment.cjs');
const response = (url, overrides = {}) => ({
  ok: true,
  text: async () => fs.readFileSync(path.join(__dirname, path.basename(url.pathname)), 'utf8').replace(/\r\n/g, '\n'),
  ...overrides
});

(async () => {
  assert(applicationFiles().includes('race-accessible.js'), 'New race controls must be checked before release.');
  assert(!applicationFiles().some(file => file.endsWith('.test.js')), 'Do not require deployed tests.');
  assert.equal(await verifyDeployment('https://example.test', async url => response(url)), applicationFiles().length);
  await assert.rejects(verifyDeployment('https://example.test/', async url =>
    response(url, url.pathname === '/ducks-race.js' ? { text: async () => 'old source' } : {})), /ducks-race.js: deployed content differs/);
  await assert.rejects(verifyDeployment('https://example.test/', async url =>
    response(url, url.pathname === '/race-accessible.js' ? { ok: false, status: 404 } : {})), /race-accessible.js: HTTP 404/);
  await assert.rejects(verifyDeployment('https://example.test/', async url => {
    if (url.pathname === '/server.js') throw new Error('connection unavailable');
    return response(url);
  }), /server.js: connection unavailable/);
  console.log('Deployment checks detect stale files, missing assets, and connection failures; normalized matching files pass.');
})().catch(error => { console.error(error); process.exitCode = 1; });
