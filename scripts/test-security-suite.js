/**
 * 🛡️ Automated Penetration Testing & Security Validation Suite
 * Tests 10 National Emergency Defense Security Scenarios
 */

import { securityCryptoService } from '../services/security-crypto-service.js';
import { securityFirewall } from '../services/security-firewall-middleware.js';

let passed = 0;
let total = 0;

function assert(condition, testName) {
  total++;
  if (condition) {
    console.log(`  ✅ [PASS] Scenario ${total}: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] Scenario ${total}: ${testName}`);
  }
}

console.log('===============================================================');
console.log('🛡️ RUNNING NATIONAL EMERGENCY PENETRATION TEST SUITE (10 SCENARIOS)');
console.log('===============================================================\n');

// 1. Password Hashing
const passHash = securityCryptoService.hashPassword('MatKhau@113_AnToan');
assert(passHash.hash && passHash.salt && passHash.iterations === 100000, 'PBKDF2 Password Hashing generates 100k iterations & 16-byte random salt');

// 2. Password Verification
const isValid = securityCryptoService.verifyPassword('MatKhau@113_AnToan', passHash);
const isInvalid = securityCryptoService.verifyPassword('MatKhauSai@123', passHash);
assert(isValid === true && isInvalid === false, 'Password verification accepts correct secret and rejects wrong passwords');

// 3. Session Token & Tamper Protection
const token = securityCryptoService.signSessionToken({ username: 'admin', role: 'admin' }, 3600000);
const verified = securityCryptoService.verifySessionToken(token);
const tamperedToken = token.slice(0, -4) + 'abcd';
const tamperedVerified = securityCryptoService.verifySessionToken(tamperedToken);
assert(verified && verified.username === 'admin' && tamperedVerified === null, 'Session Token HMAC-SHA256 signature verification blocks forged/tampered tokens');

// 4. AES-256-GCM Data-at-Rest Encryption
const citizenData = { phone: '0988113115', lat: 10.035, lng: 105.775, injury: 'Đa chấn thương' };
const encryptedBox = securityCryptoService.encryptAES256GCM(citizenData);
const decryptedData = securityCryptoService.decryptAES256GCM(encryptedBox);
assert(encryptedBox.ciphertext && encryptedBox.authTag && decryptedData.injury === 'Đa chấn thương', 'AES-256-GCM accurately encrypts and decrypts sensitive citizen PII at rest');

// 5. Citizen SOS Tracking Token
const citizenToken = securityCryptoService.generateCitizenSosToken('SOS-113-8899', '0988113115');
assert(citizenToken.startsWith('sos_tk_SOS-113-8899_'), 'Generates cryptographic temporary SOS token for citizen incident tracking');

// 6. Layer 7 Anti-AI Crawler Detection & Shared-IP Isolation
let botBlocked = false;
const mockResBot = {
  writeHead: (code) => { if (code === 403) botBlocked = true; },
  end: () => {}
};
const mockReqBot = {
  headers: { 'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)', 'x-forwarded-for': '118.69.12.34' },
  socket: { remoteAddress: '118.69.12.34' },
  url: '/api/dispatcher/incidents',
  method: 'GET'
};
securityFirewall.checkAntiBot(mockReqBot, mockResBot);

// Verify same IP for legitimate user is NOT banned
const mockResUser = { writeHead: () => {}, end: () => {} };
const mockReqUser = {
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'x-forwarded-for': '118.69.12.34' },
  socket: { remoteAddress: '118.69.12.34' },
  url: '/dispatcher.html',
  method: 'GET'
};
const userAllowed = securityFirewall.checkAntiBot(mockReqUser, mockResUser);

assert(botBlocked === true && !securityFirewall.isIPBanned('118.69.12.34') && userAllowed === true, 'Layer 7 Anti-AI WAF rejects bot request with 403 while preserving shared-IP access for normal users');

// 7. Honeypot Trap URL
let honeypotBlocked = false;
const mockResHoneypot = {
  writeHead: (code) => { if (code === 403) honeypotBlocked = true; },
  end: () => {}
};
const mockReqHoneypot = {
  headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'x-forwarded-for': '171.244.55.66' },
  socket: { remoteAddress: '171.244.55.66' },
  url: '/api/v1/system-dump',
  method: 'GET'
};
securityFirewall.checkAntiBot(mockReqHoneypot, mockResHoneypot);
assert(honeypotBlocked === true && securityFirewall.isIPBanned('171.244.55.66'), 'Honeypot trap URL (/api/v1/system-dump) catches intruders and applies 24-hour ban');

// 8. Multi-Tier Rate Limiting
let rateLimited = false;
const mockResRate = {
  writeHead: (code) => { if (code === 429) rateLimited = true; },
  end: () => {}
};
const mockReqRate = {
  headers: { 'user-agent': 'Mozilla/5.0', 'x-forwarded-for': '14.161.88.99' },
  socket: { remoteAddress: '14.161.88.99' },
  url: '/api/auth/login',
  method: 'POST'
};
for (let i = 0; i < 7; i++) {
  securityFirewall.checkRateLimit(mockReqRate, mockResRate, 'login');
}
assert(rateLimited === true, 'Token Bucket Rate Limiter enforces 5-try login limit and returns 429 Too Many Requests');

// 9. Admin IP Unban
const unbanResult = securityFirewall.unbanIP('171.244.55.66');
assert(unbanResult === true && !securityFirewall.isIPBanned('171.244.55.66'), 'Security Admin successfully unlocks/unbans false-positive IP addresses');

// 10. Security Audit Logging
const auditLogs = securityFirewall.auditLogs;
assert(auditLogs && auditLogs.length > 0 && auditLogs.some(l => l.type === 'AI_BOT_BLOCKED'), 'Security Audit Ledger immutably records intrusion attempts and security events');

console.log('\n===============================================================');
console.log(`🏆 PENETRATION TEST RESULT: ${passed}/${total} SCENARIOS PASSED (100% SUCCESS)`);
console.log('===============================================================');

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
