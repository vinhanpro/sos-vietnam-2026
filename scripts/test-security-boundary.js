import http from 'http';
import { securityCryptoService } from '../services/security-crypto-service.js';

const port = Number(process.env.PORT || 3000);
const hostname = process.env.SOS_TEST_HOST || 'localhost';

function request(path, headers = {}, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, path, method, headers: { 'User-Agent': 'Mozilla/5.0 Security Regression', ...headers } }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const adminToken = securityCryptoService.signSessionToken({ username: 'security-regression', role: 'admin' });
const dispatcherToken = securityCryptoService.signSessionToken({ username: 'dispatcher-regression', role: 'police', agency: 'police' });
const unauthAudit = await request('/api/security/audit-logs');
assert(unauthAudit.status === 401, `audit log must reject anonymous requests (received ${unauthAudit.status})`);

const unauthAccounts = await request('/api/admin/accounts');
assert(unauthAccounts.status === 401, `admin accounts must reject anonymous requests (received ${unauthAccounts.status})`);

const unauthOfficers = await request('/api/dispatcher/officers');
assert(unauthOfficers.status === 401, `officer directory must reject anonymous requests (received ${unauthOfficers.status})`);

const unauthIncidents = await request('/api/dispatcher/incidents');
assert(unauthIncidents.status === 401, `dispatcher incidents must reject anonymous requests (received ${unauthIncidents.status})`);

const dispatcherIncidents = await request('/api/dispatcher/incidents', { Authorization: `Bearer ${dispatcherToken}` });
assert(dispatcherIncidents.status === 200, `valid dispatcher session must retain incident access (received ${dispatcherIncidents.status})`);

const nonAdminStationWrite = await request('/api/stations/update', { Authorization: `Bearer ${dispatcherToken}` }, 'POST');
assert(nonAdminStationWrite.status === 403, `non-admin must not reach station write handler (received ${nonAdminStationWrite.status})`);

const anonStationWrite = await request('/api/stations/update', {}, 'POST');
assert(anonStationWrite.status === 401, `anonymous caller must not reach station write handler (received ${anonStationWrite.status})`);

const nonAdminGeoSync = await request('/api/geo/sync-status', { Authorization: `Bearer ${dispatcherToken}` });
assert(nonAdminGeoSync.status === 403, `non-admin must not access geo sync controls (received ${nonAdminGeoSync.status})`);

const unauthRegistryWrite = await request('/api/hospitals/register', {}, 'POST');
assert(unauthRegistryWrite.status === 401, `anonymous caller must not reach hospital registry writes (received ${unauthRegistryWrite.status})`);

const nonAdminRegistryWrite = await request('/api/enterprises/register', { Authorization: `Bearer ${dispatcherToken}` }, 'POST');
assert(nonAdminRegistryWrite.status === 403, `non-admin must not reach enterprise registry writes (received ${nonAdminRegistryWrite.status})`);

const malformedToken = await request('/api/admin/accounts', { Authorization: 'Bearer a.broken' });
assert(malformedToken.status === 401, `malformed token must be rejected without a server error (received ${malformedToken.status})`);

const queryTokenAdmin = await request(`/api/admin/accounts?token=${encodeURIComponent(adminToken)}`);
assert(queryTokenAdmin.status === 401, `query-string session tokens must not authorize admin routes (received ${queryTokenAdmin.status})`);

const cookieAdmin = await request('/api/admin/accounts', { Cookie: `sos_session=${adminToken}` });
assert(cookieAdmin.status === 200, `HttpOnly session cookie must retain admin access (received ${cookieAdmin.status})`);

for (const privateAsset of ['/assets/agency-accounts.json', '/assets/security-config.json', '/assets/security-audit.json']) {
  const result = await request(privateAsset);
  assert(result.status === 404, `${privateAsset} must not be served statically (received ${result.status})`);
}

const caseVariantAsset = await request('/assets/AGENCY-ACCOUNTS.JSON');
assert(caseVariantAsset.status === 404, `case-variant private assets must not bypass the static block (received ${caseVariantAsset.status})`);

const publicConfig = await request('/api/security/config');
assert(publicConfig.status === 200, `public security config must remain available (received ${publicConfig.status})`);
assert(!/gatekeeperPass|passwordHash|tokenSecret/i.test(publicConfig.body), 'public security config must not expose credentials');

const adminAccounts = await request('/api/admin/accounts', { Authorization: `Bearer ${adminToken}` });
assert(adminAccounts.status === 200, `valid admin session must retain access (received ${adminAccounts.status})`);
assert(!/"password"\s*:|"passwordHash"\s*:/i.test(adminAccounts.body), 'admin account response must not disclose password material');
assert(adminAccounts.headers['access-control-allow-origin'] !== '*', 'server must not allow every browser origin');

console.log('Security boundary regression checks passed.');
