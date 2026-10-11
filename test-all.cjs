'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

process.chdir(__dirname);
const outputDirectory = path.join('.tmp', 'feature-audit');
fs.mkdirSync(outputDirectory, { recursive: true });
const files = fs.readdirSync('.').filter(file => file.endsWith('.test.js') || file === 'test-skipbo-modes.js').sort();
const results = [];

for (const file of files) {
  console.log(`RUN ${file}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, [file], {
    encoding: 'utf8',
    timeout: 300000,
    env: { ...process.env, NODE_ENV: 'test' },
    maxBuffer: 10 * 1024 * 1024
  });
  const output = (result.stdout || '') + (result.stderr || '') + (result.error ? `\n${result.error.stack}` : '');
  fs.writeFileSync(path.join(outputDirectory, `${file}.log`), output);
  const summary = { file, passed: result.status === 0, exit: result.status, seconds: Math.round((Date.now() - started) / 1000) };
  results.push(summary);
  fs.writeFileSync(path.join(outputDirectory, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`${summary.passed ? 'PASS' : 'FAIL'} ${file} (${summary.seconds}s)`);
  if (!summary.passed) console.error(output.slice(-5000));
}

const passed = results.filter(result => result.passed).length;
console.log(`${passed}/${results.length} test suites passed. Logs: ${outputDirectory}`);
process.exitCode = passed === results.length ? 0 : 1;
