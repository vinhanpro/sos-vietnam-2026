import assert from 'node:assert/strict';

const baseUrl = process.env.SOS_TEST_BASE_URL || 'http://127.0.0.1:3102';

const healthResponse = await fetch(`${baseUrl}/healthz`, {
  headers: { 'User-Agent': 'Docker-Healthcheck/1.0' }
});
assert.equal(healthResponse.status, 200);
assert.equal(healthResponse.headers.get('cache-control'), 'no-store');
assert.equal(healthResponse.headers.get('content-type'), 'application/json; charset=utf-8');
const csp = healthResponse.headers.get('content-security-policy') || '';
assert.match(csp, /default-src 'self'/);
assert.match(csp, /object-src 'none'/);
assert.match(csp, /connect-src 'self'/);
assert.deepEqual(await healthResponse.json(), { ok: true, service: 'sos-vietnam' });

for (const path of ['/', '/dispatcher.html']) {
  const pageResponse = await fetch(`${baseUrl}${path}`);
  assert.equal(pageResponse.status, 200, `${path} must remain available under CSP`);
  assert.equal(pageResponse.headers.get('content-security-policy'), csp, `${path} must receive the shared CSP`);
}

const protectedResponse = await fetch(`${baseUrl}/api/dispatcher/incidents`);
assert.equal(protectedResponse.status, 401);

console.log('Production runtime health checks passed.');
