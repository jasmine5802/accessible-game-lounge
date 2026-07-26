'use strict';

const fs = require('fs');
const path = require('path');

function readLocalVersion() {
  const packagePath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  if (!pkg.version) throw new Error('Local package.json is missing a version field.');
  return String(pkg.version).trim();
}

async function readRemoteVersion(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
    const body = await response.json();
    const version = body && typeof body.version === 'string' ? body.version.trim() : '';
    if (!version) throw new Error('Remote response does not include a valid version field.');
    return version;
  } finally {
    clearTimeout(timeout);
  }
}

async function readFirstAvailableVersion(urls) {
  let lastError = null;
  for (const url of urls) {
    try {
      return await readRemoteVersion(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Could not read a remote version.');
}

(async () => {
  const base = process.env.RENDER_BASE_URL || 'https://accessible-game-lounge.onrender.com';
  const endpoint = process.env.RENDER_VERSION_URL;
  const candidates = endpoint ? [endpoint] : [`${base}/version.json`, `${base}/package.json`];
  const localVersion = readLocalVersion();
  const remoteVersion = await readFirstAvailableVersion(candidates);

  if (localVersion !== remoteVersion) {
    console.error(`Version mismatch. Local installer version is ${localVersion}, but Render reports ${remoteVersion}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Version check passed. Local installer version ${localVersion} matches Render.`);
})().catch(error => {
  console.error(`Render version check failed: ${error.message}`);
  process.exitCode = 1;
});
