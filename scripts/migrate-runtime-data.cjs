#!/usr/bin/env node
// One-way copy into encrypted runtime storage. It never deletes legacy files.
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const names = [
  'agency-accounts.json', 'incident-history.json', 'history-trash.json',
  'login-history.json', 'login-lockouts.json', 'security-alerts.json',
  'security-audit.json', 'banned-ips.json', 'fake-incidents-archive.json'
];

if (!process.env.SOS_RUNTIME_DATA_DIR || !process.env.SOS_MASTER_SECRET || !process.env.SOS_TOKEN_SECRET) {
  throw new Error('Set SOS_RUNTIME_DATA_DIR, SOS_MASTER_SECRET, and SOS_TOKEN_SECRET before migrating.');
}

(async () => {
  const { writeRuntimeData, readRuntimeData, RUNTIME_DATA_DIR } = await import('../services/runtime-data-store.js');
  let migrated = 0;
  for (const name of names) {
    const source = path.join(root, 'assets', name);
    if (!fs.existsSync(source)) continue;
    const data = JSON.parse(fs.readFileSync(source, 'utf8'));
    writeRuntimeData(name, data);
    const restored = readRuntimeData(name, null);
    if (JSON.stringify(restored) !== JSON.stringify(data)) throw new Error(`Verification failed for ${name}`);
    migrated += 1;
  }
  console.log(`Migrated and verified ${migrated} files to ${RUNTIME_DATA_DIR}.`);
})();
