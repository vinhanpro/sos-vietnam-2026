/**
 * Encrypted runtime persistence for records that contain citizen, officer, or
 * security telemetry data.  Runtime state must live outside the source tree
 * in production; legacy assets are read only as a one-time development bridge.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { securityCryptoService } from './security-crypto-service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '..');
const LEGACY_ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
const configuredDir = process.env.SOS_RUNTIME_DATA_DIR;

if (process.env.NODE_ENV === 'production' && !configuredDir) {
  throw new Error('SOS_RUNTIME_DATA_DIR must be configured in production.');
}

const RUNTIME_DATA_DIR = configuredDir
  ? path.resolve(configuredDir)
  : path.join(PROJECT_ROOT, '.runtime-data');

function assertSafeName(name) {
  if (!/^[a-z0-9][a-z0-9-]*\.json$/i.test(name)) {
    throw new Error(`Invalid runtime data filename: ${name}`);
  }
}

export function runtimeDataPath(name) {
  assertSafeName(name);
  return path.join(RUNTIME_DATA_DIR, name);
}

function parseStoredJson(raw, name) {
  const value = JSON.parse(raw);
  if (value && value.format === 'sos-encrypted-runtime-v1' && value.encryptedBox) {
    return securityCryptoService.decryptAES256GCM(value.encryptedBox);
  }
  return value;
}

export function readRuntimeData(name, fallback) {
  const target = runtimeDataPath(name);
  try {
    if (fs.existsSync(target)) {
      const parsed = parseStoredJson(fs.readFileSync(target, 'utf8'), name);
      if (parsed !== null && parsed !== undefined) return parsed;
    }
    // Development-only bridge. Production data must be explicitly migrated.
    const legacy = path.join(LEGACY_ASSETS_DIR, name);
    if (process.env.NODE_ENV !== 'production' && fs.existsSync(legacy)) {
      console.warn(`Loading legacy runtime data for ${name}; run the migration before production.`);
      const parsedLegacy = JSON.parse(fs.readFileSync(legacy, 'utf8'));
      if (parsedLegacy !== null && parsedLegacy !== undefined) return parsedLegacy;
    }
  } catch (error) {
    console.error(`Could not read runtime data ${name}:`, error.message);
  }
  return fallback;
}

export function writeRuntimeData(name, value) {
  const target = runtimeDataPath(name);
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const envelope = {
    format: 'sos-encrypted-runtime-v1',
    version: 1,
    writtenAt: new Date().toISOString(),
    encryptedBox: securityCryptoService.encryptAES256GCM(value)
  };
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(envelope), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(temporary, target);
    fs.chmodSync(target, 0o600);
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary, { force: true });
  }
}

export { RUNTIME_DATA_DIR };
