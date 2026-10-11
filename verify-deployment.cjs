'use strict';

const fs = require('node:fs');
const path = require('node:path');

const normalize = value => String(value).replace(/\r\n/g, '\n');
const applicationFiles = () => fs.readdirSync(__dirname).filter(file =>
  /\.(js|html)$/.test(file) && !file.endsWith('.test.js') &&
  !['test-skipbo-modes.js', 'verify-render-version.js'].includes(file));

async function verifyDeployment(base, fetchFile = fetch) {
  const failures = [];
  const files = applicationFiles();
  // Limit concurrent requests so checking a sleeping Render instance does not
  // overload it. Compare text after normalizing Git's Windows line endings.
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < files.length) {
      const file = files[next++];
      try {
        const response = await fetchFile(new URL(file, base.endsWith('/') ? base : `${base}/`), {
          cache: 'no-store', signal: AbortSignal.timeout(60000)
        });
        if (!response.ok) failures.push(`${file}: HTTP ${response.status}`);
        else if (normalize(await response.text()) !== normalize(fs.readFileSync(path.join(__dirname, file), 'utf8'))) {
          failures.push(`${file}: deployed content differs from local source`);
        }
      } catch (error) {
        failures.push(`${file}: ${error.message}`);
      }
    }
  }));
  if (failures.length) throw new Error(`Deployment verification failed:\n${failures.sort().join('\n')}`);
  return files.length;
}

if (require.main === module) {
  verifyDeployment(process.env.RENDER_BASE_URL || 'https://accessible-game-lounge.onrender.com/')
    .then(count => console.log(`Deployment verification passed: ${count} application files match local source.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { verifyDeployment, applicationFiles };
