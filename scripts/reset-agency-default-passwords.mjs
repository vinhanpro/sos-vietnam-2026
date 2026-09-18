import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultPasswordForAccount } from '../services/agency-password-policy.js';
import { securityCryptoService } from '../services/security-crypto-service.js';
import { readRuntimeData, writeRuntimeData } from '../services/runtime-data-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const seedPath = path.join(projectRoot, 'assets', 'agency-accounts.json');

function requireAccountMap(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} is not an account map`);
  }
  return value;
}

function resetAccountMap(accounts) {
  const normalized = {};
  for (const [key, source] of Object.entries(accounts)) {
    const account = { ...source, username: String(source?.username || key).trim().toLowerCase() };
    if (!account.username) throw new Error(`Account ${key} has no username`);
    account.passwordHash = securityCryptoService.hashPassword(defaultPasswordForAccount(account));
    delete account.password;
    delete account.initialPassword;
    delete account.rawPassword;
    normalized[key] = account;
  }
  return normalized;
}

function writeSeedAtomically(accounts) {
  const tempPath = `${seedPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(accounts, null, 2), 'utf8');
    fs.renameSync(tempPath, seedPath);
  } finally {
    if (fs.existsSync(tempPath)) fs.rmSync(tempPath, { force: true });
  }
}

const seed = requireAccountMap(JSON.parse(fs.readFileSync(seedPath, 'utf8')), 'Seed accounts');
const runtime = requireAccountMap(readRuntimeData('agency-accounts.json', null), 'Runtime accounts');
const resetSeed = resetAccountMap(seed);
const resetRuntime = resetAccountMap(runtime);

if (Object.keys(resetSeed).length !== Object.keys(resetRuntime).length) {
  throw new Error('Seed and runtime account counts differ; refusing partial reset');
}

writeSeedAtomically(resetSeed);
writeRuntimeData('agency-accounts.json', resetRuntime);

console.log(JSON.stringify({
  ok: true,
  seedAccounts: Object.keys(resetSeed).length,
  runtimeAccounts: Object.keys(resetRuntime).length,
  plaintextPasswordFieldsPersisted: 0
}));
