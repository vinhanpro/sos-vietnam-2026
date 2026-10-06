#!/usr/bin/env node
/**
 * 🔐 SOS Vietnam 2026 - Git Secret Filter & File Encryption CLI
 * Uses AES-256-GCM from SecurityCryptoService.
 *
 * Usage:
 *   1. Git Clean filter (Plaintext -> Encrypted for Git Staging/Push):
 *      node scripts/secret-crypto.js clean
 *
 *   2. Git Smudge filter (Encrypted -> Plaintext on local checkout):
 *      node scripts/secret-crypto.js smudge
 *
 *   3. Manual File Encryption:
 *      node scripts/secret-crypto.js encrypt .env.example
 *
 *   4. Manual File Decryption:
 *      node scripts/secret-crypto.js decrypt .env.example
 *
 *   5. Setup Git filter automatically:
 *      node scripts/secret-crypto.js setup
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { securityCryptoService } from '../services/security-crypto-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import crypto from 'crypto';

const HEADER_MARKER = '-----BEGIN SOS-ENCRYPTED-PAYLOAD-----';
const FOOTER_MARKER = '-----END SOS-ENCRYPTED-PAYLOAD-----';

export function encryptPayload(rawText) {
  if (rawText.includes(HEADER_MARKER)) {
    return rawText; // Already encrypted
  }
  const key = securityCryptoService.aesKey;
  // Deterministic 12-byte IV for stable Git clean filter diffs
  const iv = crypto.createHmac('sha256', key).update(rawText, 'utf8').digest().subarray(0, 12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(rawText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  const box = {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag,
    algo: 'aes-256-gcm'
  };
  return `${HEADER_MARKER}\n${JSON.stringify(box, null, 2)}\n${FOOTER_MARKER}\n`;
}

export function decryptPayload(cipherText) {
  if (!cipherText.includes(HEADER_MARKER)) {
    return cipherText; // Already plaintext
  }
  try {
    const rawJson = cipherText.replace(HEADER_MARKER, '').replace(FOOTER_MARKER, '').trim();
    const box = JSON.parse(rawJson);
    const decrypted = securityCryptoService.decryptAES256GCM(box);
    return decrypted !== null ? decrypted : cipherText;
  } catch (e) {
    return cipherText; // Leave as-is if cannot decrypt
  }
}

// Read all data from stdin
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
  });
}

async function main() {
  const command = process.argv[2];
  const targetFile = process.argv[3];

  if (command === 'clean') {
    // Git clean: Stdin (plain) -> Stdout (encrypted)
    const input = await readStdin();
    const output = encryptPayload(input);
    process.stdout.write(output);
    return;
  }

  if (command === 'smudge') {
    // Git smudge: Stdin (encrypted) -> Stdout (plain)
    const input = await readStdin();
    const output = decryptPayload(input);
    process.stdout.write(output);
    return;
  }

  if (command === 'encrypt') {
    if (!targetFile || !fs.existsSync(targetFile)) {
      console.error(`[ERROR] File not found: ${targetFile}`);
      process.exit(1);
    }
    const content = fs.readFileSync(targetFile, 'utf8');
    const encrypted = encryptPayload(content);
    fs.writeFileSync(targetFile, encrypted, 'utf8');
    console.log(`[OK] Successfully encrypted ${targetFile}`);
    return;
  }

  if (command === 'decrypt') {
    if (!targetFile || !fs.existsSync(targetFile)) {
      console.error(`[ERROR] File not found: ${targetFile}`);
      process.exit(1);
    }
    const content = fs.readFileSync(targetFile, 'utf8');
    const decrypted = decryptPayload(content);
    fs.writeFileSync(targetFile, decrypted, 'utf8');
    console.log(`[OK] Successfully decrypted ${targetFile}`);
    return;
  }

  if (command === 'setup') {
    // 1. Create or update .gitattributes
    const gitattributesPath = path.join(__dirname, '..', '.gitattributes');
    let gitattributesContent = '';
    if (fs.existsSync(gitattributesPath)) {
      gitattributesContent = fs.readFileSync(gitattributesPath, 'utf8');
    }
    if (!gitattributesContent.includes('.env.example filter=sos-crypto')) {
      const addition = '\n# Encrypt sensitive files on git push\n.env.example filter=sos-crypto\n';
      fs.writeFileSync(gitattributesPath, gitattributesContent + addition, 'utf8');
      console.log('[OK] Added .env.example filter to .gitattributes');
    }

    // 2. Configure git filters
    try {
      execSync('git config filter.sos-crypto.clean "node scripts/secret-crypto.js clean"');
      execSync('git config filter.sos-crypto.smudge "node scripts/secret-crypto.js smudge"');
      console.log('[OK] Configured Git filter.sos-crypto.clean and smudge successfully!');
    } catch (e) {
      console.error('[ERROR] Failed to configure git filter:', e.message);
    }
    return;
  }

  console.log(`
Usage:
  node scripts/secret-crypto.js setup
  node scripts/secret-crypto.js encrypt <file>
  node scripts/secret-crypto.js decrypt <file>
  node scripts/secret-crypto.js clean < stdin > stdout
  node scripts/secret-crypto.js smudge < stdin > stdout
`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
