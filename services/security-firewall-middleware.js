/**
 * 🛡️ National Emergency Security Firewall & RBAC Middleware
 * Features:
 * 1. Layer 7 Anti-AI Crawler WAF & Honeypots
 * 2. Multi-Tier Token Bucket Rate Limiter & IP Lockout
 * 3. Zero-Trust RBAC & Session Token Guard
 * 4. Immutable Security Audit Logger
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { securityCryptoService } from './security-crypto-service.js';
import { readRuntimeData, runtimeDataPath, writeRuntimeData } from './runtime-data-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIT_LOG_PATH = runtimeDataPath('security-audit.json');
const BANNED_IPS_PATH = runtimeDataPath('banned-ips.json');

// Known AI Crawler & Scraper Bot Signatures
const AI_BOT_SIGNATURES = [
  'gptbot', 'chatgpt', 'chatgpt-user', 'claudebot', 'claude-web', 'anthropic-ai',
  'bytespider', 'bytedance', 'ccbot', 'commoncrawl', 'perplexitybot', 'perplexity',
  'petalbot', 'google-extended', 'diffbot', 'omgili', 'facebookexternalhit',
  'scrapy', 'headlesschrome', 'selenium', 'puppeteer', 'playwright', 'phantomjs',
  'python-requests', 'aiohttp', 'go-http-client', 'curl', 'wget'
];

class SecurityFirewall {
  constructor() {
    this.bannedIPs = new Map(); // ip -> { reason, bannedAt, expiresAt, attempts }
    this.revokedTokens = new Map(); // tokenSig -> expiresAt (Instant Session Invalidation)
    this.rateLimiters = {
      login: new Map(),      // ip -> { count, resetAt }
      sosCreate: new Map(),  // ip -> { count, resetAt }
      general: new Map()     // ip -> { count, resetAt }
    };
    this.auditLogs = [];
    this.loadState();
  }

  loadState() {
    try {
      {
        const data = readRuntimeData('banned-ips.json', {});
        for (const [ip, info] of Object.entries(data)) {
          if (info.expiresAt > Date.now()) {
            this.bannedIPs.set(ip, info);
          }
        }
      }
    } catch (e) {}

    try {
      {
        const logs = readRuntimeData('security-audit.json', []);
        this.auditLogs = Array.isArray(logs) ? logs : [];
        if (this.auditLogs.length > 5000) {
          this.auditLogs = this.auditLogs.slice(-5000); // Keep last 5000 logs
        }
      }
    } catch (e) {
      this.auditLogs = [];
    }
  }

  saveState() {
    try {
      const obj = {};
      for (const [ip, info] of this.bannedIPs.entries()) {
        if (info.expiresAt > Date.now()) {
          obj[ip] = info;
        }
      }
      writeRuntimeData('banned-ips.json', obj);
      writeRuntimeData('security-audit.json', this.auditLogs);
    } catch (e) {}
  }

  getClientIP(req) {
    const forwarded = (process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production' || Boolean(req.headers['x-forwarded-for'])) && req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    if (req.headers['x-real-ip']) {
      return req.headers['x-real-ip'].trim();
    }
    return req.socket?.remoteAddress || '127.0.0.1';
  }

  logEvent(type, req, detail = {}) {
    const ip = this.getClientIP(req);
    const logEntry = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      type,
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
      url: req.url,
      method: req.method,
      detail
    };
    if (!Array.isArray(this.auditLogs)) this.auditLogs = [];
    this.auditLogs.push(logEntry);
    if (this.auditLogs.length > 5000) {
      this.auditLogs.shift();
    }
    this.saveState();
    return logEntry;
  }

  isLoopback(ip) {
    if (!ip) return true;
    const clean = String(ip).replace(/^::ffff:/, '').trim();
    return clean === '127.0.0.1' || clean === '::1' || clean === 'localhost'
      || clean.startsWith('192.168.')
      || clean.startsWith('10.')
      || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean);
  }

  banIP(ip, reason, durationMs = 15 * 60 * 1000) {
    if (this.isLoopback(ip)) return;
    const expiresAt = Date.now() + durationMs;
    this.bannedIPs.set(ip, {
      reason,
      bannedAt: Date.now(),
      expiresAt
    });
    this.saveState();
    console.warn(`🚨 [SECURITY AUTO-BAN] IP ${ip} banned for ${durationMs / 60000} minutes. Reason: ${reason}`);
  }

  unbanIP(ip) {
    if (this.bannedIPs.has(ip)) {
      this.bannedIPs.delete(ip);
      this.saveState();
      return true;
    }
    return false;
  }

  isIPBanned(ip) {
    if (this.isLoopback(ip)) return false;
    const info = this.bannedIPs.get(ip);
    if (!info) return false;
    if (Date.now() > info.expiresAt) {
      this.bannedIPs.delete(ip);
      return false;
    }
    return true;
  }

  /**
   * Layer 7 Anti-AI Scraper & WAF Shield
   */
  checkAntiBot(req, res) {
    const ip = this.getClientIP(req);
    const ua = (req.headers['user-agent'] || '').toLowerCase();

    // 1. Check if IP is currently banned
    if (this.isIPBanned(ip)) {
      this.logEvent('BLOCKED_BANNED_IP', req, { reason: 'IP is on auto-ban blacklist' });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Access Denied: Your IP has been banned due to policy violations.', code: 'IP_BANNED' }));
      return false;
    }

    // 2. Check AI Scraper User-Agent (Request-scoped denial; preserves shared IP access)
    const isBot = AI_BOT_SIGNATURES.some(sig => ua.includes(sig));
    if (isBot) {
      this.logEvent('AI_BOT_BLOCKED', req, { userAgent: ua });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'AI Crawler & Automated Scraping Forbidden by National Defense Policy', code: 'AI_BOT_FORBIDDEN' }));
      return false;
    }

    // 3. Honeypot Traps
    if (req.url.includes('/api/v1/system-dump') || req.url.includes('/api/emergency/raw-feed') || req.url.includes('/.env')) {
      this.banIP(ip, 'Accessed Honeypot Trap URL', 24 * 60 * 60 * 1000); // 24 hour ban
      this.logEvent('HONEYPOT_TRIPPED', req, { url: req.url });
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Security Violation Recorded', code: 'HONEYPOT_BANNED' }));
      return false;
    }

    return true;
  }

  /**
   * Multi-Tier Rate Limiter
   */
  checkRateLimit(req, res, tier = 'general') {
    const ip = this.getClientIP(req);
    // Allow loopback (localhost) and internal LAN during operations
    if (this.isLoopback(ip)) {
      return true;
    }

    // Authenticated sessions (Admin, Commander, Officers) are exempt from rate limiting
    try {
      const token = this.extractToken(req);
      if (token && !this.isTokenRevoked(token)) {
        const session = securityCryptoService.verifySessionToken(token);
        if (session) {
          req.user = session;
          return true;
        }
      }
    } catch (e) {}

    const now = Date.now();

    const limits = {
      login: { max: 20, windowMs: 5 * 60 * 1000 },      // 20 attempts per 5 mins
      sosCreate: { max: 15, windowMs: 60 * 1000 },       // 15 SOS per min per IP
      general: { max: 600, windowMs: 60 * 1000 }        // 600 reqs per min
    };

    const config = limits[tier] || limits.general;
    const map = this.rateLimiters[tier] || this.rateLimiters.general;

    let record = map.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + config.windowMs };
      map.set(ip, record);
      return true;
    }

    record.count++;
    if (record.count > config.max) {
      if (tier === 'login') {
        this.banIP(ip, 'Excessive failed login attempts (Brute-force protection)', 15 * 60 * 1000);
      }
      this.logEvent('RATE_LIMIT_EXCEEDED', req, { tier, count: record.count, max: config.max });
      res.writeHead(429, {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil((record.resetAt - now) / 1000)
      });
      res.end(JSON.stringify({
        error: 'Too Many Requests. Please slow down.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfterSec: Math.ceil((record.resetAt - now) / 1000)
      }));
      return false;
    }

    return true;
  }

  /**
   * Extracts session token from Cookie or Authorization header
   */
  extractToken(req) {
    // 1. Check Authorization Bearer Header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }

    // 2. Check Cookie
    const cookieHeader = req.headers['cookie'];
    if (cookieHeader) {
      const match = cookieHeader.match(/sos_session=([^;]+)/);
      if (match) return match[1];
    }

    // 3. Check query param for SSE / EventSource fallback
    if (req.url && (req.url.includes('?token=') || req.url.includes('&token='))) {
      try {
        const u = new URL(req.url, 'http://localhost');
        const qToken = u.searchParams.get('token');
        if (qToken) return qToken;
      } catch (e) {}
    }

    return null;
  }

  /**
   * Revokes a session token immediately (Instant Logout / Blacklist)
   */
  revokeToken(token, expiresAt = null) {
    if (!token || typeof token !== 'string') return;
    const sig = token.includes('.') ? token.split('.')[1] : token;
    const expiry = expiresAt || (Date.now() + 8 * 60 * 60 * 1000);
    this.revokedTokens.set(sig, expiry);
    this.cleanupExpiredRevocations();
  }

  /**
   * Checks if token has been explicitly revoked
   */
  isTokenRevoked(token) {
    if (!token || typeof token !== 'string') return false;
    const sig = token.includes('.') ? token.split('.')[1] : token;
    const expiry = this.revokedTokens.get(sig);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.revokedTokens.delete(sig);
      return false;
    }
    return true;
  }

  cleanupExpiredRevocations() {
    const now = Date.now();
    for (const [sig, expiry] of this.revokedTokens.entries()) {
      if (now > expiry) {
        this.revokedTokens.delete(sig);
      }
    }
  }

  /**
   * RBAC Guard: Validates token and checks role authorization
   */
  authenticate(req, res, allowedRoles = null) {
    const token = this.extractToken(req);
    if (!token) {
      this.logEvent('AUTH_MISSING_TOKEN', req);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Authentication token required', code: 'AUTH_REQUIRED' }));
      return null;
    }

    if (this.isTokenRevoked(token)) {
      this.logEvent('AUTH_REVOKED_TOKEN', req);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Phiên làm việc đã bị thu hồi (đã đăng xuất)', code: 'SESSION_REVOKED' }));
      return null;
    }

    const payload = securityCryptoService.verifySessionToken(token);
    if (!payload) {
      this.logEvent('AUTH_INVALID_TOKEN', req);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Invalid or expired session token', code: 'TOKEN_INVALID' }));
      return null;
    }

    // Check Role
    if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
      const userRole = payload.role || payload.agency || 'officer';
      const isSuperAdmin = payload.role === 'admin' || payload.username === 'admin';
      if (!isSuperAdmin && !allowedRoles.includes(userRole)) {
        this.logEvent('AUTH_FORBIDDEN_ROLE', req, { user: payload.username, role: userRole, allowedRoles });
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden: Insufficient privileges for this operation', code: 'ROLE_FORBIDDEN' }));
        return null;
      }
    }

    req.user = payload;
    return payload;
  }

  /**
   * Set Secure Session Cookie Header
   */
  setSessionCookie(res, token, req = null) {
    const maxAgeSec = 8 * 60 * 60; // 8 hours
    const isHttps = req && (req.socket?.encrypted || (req.headers && req.headers['x-forwarded-proto'] === 'https'));
    const isLocal = req ? this.isLoopback(this.getClientIP(req)) : false;
    const secure = (process.env.NODE_ENV === 'production' && isHttps && !isLocal) ? '; Secure' : '';
    res.setHeader('Set-Cookie', `sos_session=${token}; Path=/; Max-Age=${maxAgeSec}; HttpOnly; SameSite=Lax${secure}`);
  }

  /**
   * Clear Session Cookie Header
   */
  clearSessionCookie(res) {
    res.setHeader('Set-Cookie', `sos_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict`);
  }
}

export const securityFirewall = new SecurityFirewall();
export default securityFirewall;


