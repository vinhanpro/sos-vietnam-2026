const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sos-runtime-data-'));
process.env.SOS_RUNTIME_DATA_DIR = temp;
process.env.SOS_MASTER_SECRET = 'test-master-secret-not-for-production';
process.env.SOS_TOKEN_SECRET = 'test-token-secret-not-for-production';

(async () => {
  const { readRuntimeData, runtimeDataPath, writeRuntimeData } = await import('../services/runtime-data-store.js');
  const source = { citizen: { name: 'Nguyen Van A', phone: '0900000000' }, officer: { name: 'Tran B' } };
  writeRuntimeData('incident-history.json', source);
  const raw = fs.readFileSync(runtimeDataPath('incident-history.json'), 'utf8');
  assert(!raw.includes(source.citizen.phone));
  assert.deepStrictEqual(readRuntimeData('incident-history.json', null), source);
  fs.rmSync(temp, { recursive: true, force: true });
  console.log('runtime-data-store: passed');
})().catch(error => { console.error(error); process.exit(1); });
