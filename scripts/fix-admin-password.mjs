import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { securityCryptoService } from '../services/security-crypto-service.js';
import { readRuntimeData, writeRuntimeData } from '../services/runtime-data-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// 1. Generate clean PBKDF2 hash for password 'Admin'
const adminHash = securityCryptoService.hashPassword('Admin');
console.log('Generated PBKDF2 hash for Admin:', adminHash);

// 2. Update assets/agency-accounts.json
const seedPath = path.join(projectRoot, 'assets', 'agency-accounts.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
if (seed.admin) {
  seed.admin.passwordHash = adminHash;
  delete seed.admin.password;
  seed.admin.initialPassword = 'Admin';
  fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
  console.log('Updated assets/agency-accounts.json');
}

// 3. Update runtime-data/agency-accounts.json
const runtime = readRuntimeData('agency-accounts.json', {});
if (runtime && runtime.admin) {
  runtime.admin.passwordHash = adminHash;
  delete runtime.admin.password;
  runtime.admin.initialPassword = 'Admin';
  writeRuntimeData('agency-accounts.json', runtime);
  console.log('Updated runtime-data/agency-accounts.json');
}

// 4. Clear all login lockouts and failed attempts
writeRuntimeData('login-lockouts.json', {});
console.log('Reset login-lockouts.json completely (all IP lockouts cleared)');

console.log('Admin password verification test:');
console.log('Verify "Admin":', securityCryptoService.verifyPassword('Admin', adminHash));
console.log('DONE!');
