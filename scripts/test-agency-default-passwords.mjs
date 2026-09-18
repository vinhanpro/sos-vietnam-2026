import assert from 'assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultPasswordForAccount } from '../services/agency-password-policy.js';
import { securityCryptoService } from '../services/security-crypto-service.js';
import { readRuntimeData } from '../services/runtime-data-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seed = JSON.parse(fs.readFileSync(path.join(projectRoot, 'assets', 'agency-accounts.json'), 'utf8'));
const runtime = readRuntimeData('agency-accounts.json', null);

function verifyStore(label, accounts) {
  assert(accounts && typeof accounts === 'object' && !Array.isArray(accounts), `${label} must be an account map`);
  const rows = Object.values(accounts);
  assert.equal(rows.length, 193, `${label} account count`);
  for (const account of rows) {
    assert(account.username, `${label} account needs username`);
    assert(account.passwordHash, `${label} ${account.username} needs PBKDF2 hash`);
    assert.equal(Object.hasOwn(account, 'password'), false, `${label} ${account.username} must not persist password`);
    assert.equal(Object.hasOwn(account, 'initialPassword'), false, `${label} ${account.username} must not persist initialPassword`);
    assert.equal(Object.hasOwn(account, 'rawPassword'), false, `${label} ${account.username} must not persist rawPassword`);
    assert.equal(
      securityCryptoService.verifyPassword(defaultPasswordForAccount(account), account.passwordHash),
      true,
      `${label} ${account.username} default hash mismatch`
    );
  }
  return rows.length;
}

const seedAccounts = verifyStore('seed', seed);
const runtimeAccounts = verifyStore('runtime', runtime);
console.log(JSON.stringify({ ok: true, seedAccounts, runtimeAccounts, policyMatches: seedAccounts + runtimeAccounts }));
