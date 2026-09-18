import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { securityCryptoService } from '../services/security-crypto-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const accountsPath = path.join(__dirname, '..', 'assets', 'agency-accounts.json');
if (!fs.existsSync(accountsPath)) {
  console.error('File not found:', accountsPath);
  process.exit(1);
}

const raw = fs.readFileSync(accountsPath, 'utf8');
const accounts = JSON.parse(raw);

let count = 0;
for (const [key, acc] of Object.entries(accounts)) {
  if (acc.password && typeof acc.password === 'string') {
    acc.passwordHash = securityCryptoService.hashPassword(acc.password);
    delete acc.password; // Remove plaintext password completely!
    count++;
  }
}

fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf8');
console.log(`[Migration] Successfully hashed ${count} account passwords in agency-accounts.json`);
