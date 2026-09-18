const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const stateDir = path.join(root, '.tmp', `auth-lockout-${Date.now()}`);
const port = 3214;

function requestLogin() {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'SOS auth lockout test' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.once('error', reject);
    req.end(JSON.stringify({ username: 'missing-user', password: 'wrong-password' }));
  });
}

function start() {
  const child = spawn(process.execPath, ['server.js'], { cwd: root, env: { ...process.env, PORT: String(port), SOS_SECURITY_STATE_DIR: stateDir, TRUST_PROXY: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server did not start')), 15000);
    child.stdout.on('data', chunk => { if (String(chunk).includes(`http://localhost:${port}`)) { clearTimeout(timer); resolve(child); } });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`server exited early: ${code}`)); });
  });
}

async function main() {
  fs.mkdirSync(stateDir, { recursive: true });
  let child;
  try {
    child = await start();
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const result = await requestLogin();
      assert.equal(result.status, 401, `attempt ${attempt} must reject without lockout`);
      assert.equal(result.body.isLocked, undefined);
    }
    const fourth = await requestLogin();
    assert.equal(fourth.status, 429, 'fourth failed login must lock the source IP');
    assert.equal(fourth.body.isLocked, true);
    child.kill('SIGTERM');
    await new Promise(resolve => child.once('exit', resolve));

    child = await start();
    const afterRestart = await requestLogin();
    assert.equal(afterRestart.status, 429, 'persisted lockout must survive restart');
    assert.equal(afterRestart.body.isLocked, true);
    console.log('Auth lockout regression checks passed.');
  } finally {
    if (child && !child.killed) child.kill('SIGTERM');
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
