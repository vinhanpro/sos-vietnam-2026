/**
 * 🛡️ National Emergency Cryptographic & Security Service (ES Module)
 * Implements PBKDF2 Password Hashing, AES-256-GCM Data Encryption,
 * HMAC-SHA256 Token Signing & Verification, and Citizen SOS Tokens.
 */

import crypto from 'crypto';

class SecurityCryptoService {
  constructor(secretKey = null) {
    const masterSecret = secretKey || process.env.SOS_MASTER_SECRET;
    const tokenSecret = process.env.SOS_TOKEN_SECRET;
    if (process.env.NODE_ENV === 'production' && (!masterSecret || !tokenSecret)) {
      throw new Error('SOS_MASTER_SECRET and SOS_TOKEN_SECRET must be configured in production.');
    }
    // The legacy values keep existing local development data readable. Production
    // is required to provide distinct secrets through the process environment.
    this.masterSecret = masterSecret || 'sos_vietnam_national_defense_master_secret_key_2026_x89';
    this.tokenSecret = tokenSecret || 'sos_session_hmac_secret_token_defense_9921_vn';
    this.aesKey = crypto.createHash('sha256').update(this.masterSecret).digest(); // Exactly 32 bytes for AES-256
  }

  /**
   * Hashes a password using PBKDF2 with a 16-byte random salt and 100,000 iterations (OWASP standard)
   */
  hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password provided for hashing');
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';
    const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    return {
      hash,
      salt,
      iterations,
      digest
    };
  }

  /**
   * Verifies a password against stored PBKDF2 hash parameters
   */
  verifyPassword(password, storedData) {
    if (!password || !storedData || !storedData.hash || !storedData.salt) {
      return false;
    }
    const iterations = storedData.iterations || 100000;
    const keylen = 64;
    const digest = storedData.digest || 'sha512';
    const derived = crypto.pbkdf2Sync(password, storedData.salt, iterations, keylen, digest).toString('hex');
    const derivedBuffer = Buffer.from(derived, 'hex');
    const storedBuffer = Buffer.from(storedData.hash, 'hex');
    return derivedBuffer.length === storedBuffer.length && crypto.timingSafeEqual(derivedBuffer, storedBuffer);
  }

  /**
   * Signs a cryptographic session token with payload, expiration, and HMAC-SHA256 signature
   */
  signSessionToken(payload, expiresInMs = 8 * 60 * 60 * 1000) {
    const exp = Date.now() + expiresInMs;
    const data = {
      ...payload,
      exp,
      iat: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex')
    };
    const encodedPayload = Buffer.from(JSON.stringify(data)).toString('base64url');
    const signature = crypto.createHmac('sha256', this.tokenSecret).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Verifies a session token and returns decoded payload if valid and not expired
   */
  verifySessionToken(token) {
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      return null;
    }
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    if (!encodedPayload || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', this.tokenSecret).update(encodedPayload).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);
    const isValidSig = signatureBuffer.length === expectedBuffer.length
      && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    if (!isValidSig) return null;

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) {
        return null; // Expired
      }
      return payload;
    } catch (e) {
      return null;
    }
  }

  /**
   * Generates a temporary HMAC token for citizen SOS real-time tracking
   */
  generateCitizenSosToken(incidentId, phone = '') {
    const data = `${incidentId}:${phone}:${Date.now()}`;
    const sig = crypto.createHmac('sha256', this.tokenSecret).update(data).digest('hex').substring(0, 32);
    return `sos_tk_${incidentId}_${sig}`;
  }

  /**
   * Encrypts sensitive PII string or JSON object using AES-256-GCM
   */
  encryptAES256GCM(plainData) {
    if (plainData === undefined || plainData === null) return null;
    const text = typeof plainData === 'object' ? JSON.stringify(plainData) : String(plainData);
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.aesKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return {
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag,
      algo: 'aes-256-gcm'
    };
  }

  /**
   * Decrypts AES-256-GCM ciphertext back to plaintext or original object
   */
  decryptAES256GCM(encryptedBox) {
    if (!encryptedBox || !encryptedBox.ciphertext || !encryptedBox.iv || !encryptedBox.authTag) {
      return null;
    }
    try {
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.aesKey,
        Buffer.from(encryptedBox.iv, 'hex')
      );
      decipher.setAuthTag(Buffer.from(encryptedBox.authTag, 'hex'));

      let decrypted = decipher.update(encryptedBox.ciphertext, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      try {
        return JSON.parse(decrypted);
      } catch (e) {
        return decrypted;
      }
    } catch (err) {
      console.error('[SecurityCryptoService] Decryption failed (Authentication Tag mismatch or corrupted data):', err.message);
      return null;
    }
  }
}

export const securityCryptoService = new SecurityCryptoService();
export default securityCryptoService;
