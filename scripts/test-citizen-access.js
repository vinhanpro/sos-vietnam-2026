import assert from 'node:assert/strict';
import { securityCryptoService } from '../services/security-crypto-service.js';

const baseUrl = process.env.SOS_TEST_BASE_URL || 'http://127.0.0.1:3101';

async function request(path, { method = 'GET', headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await response.text();
  return { response, body: text ? JSON.parse(text) : null };
}

const created = await request('/api/sos/create', {
  method: 'POST',
  body: {
    agency: 'police',
    reporterName: 'Kiểm thử quyền truy cập',
    reporterPhone: '0900000000',
    lat: 21.0285,
    lng: 105.8542,
    address: 'Hà Nội'
  }
});
assert.equal(created.response.status, 200);
assert.equal(created.body.ok, true);
assert.match(created.body.citizenAccessToken, /^[A-Za-z0-9_-]{32,}$/);
assert.equal('citizenAccessTokenHash' in created.body.incident, false);

const incidentId = created.body.incident.id;
const citizenToken = created.body.citizenAccessToken;
const citizenHeaders = { 'X-SOS-Access-Token': citizenToken };

const anonymousRead = await request(`/api/sos/${incidentId}`);
assert.equal(anonymousRead.response.status, 404);

const citizenRead = await request(`/api/sos/${incidentId}`, { headers: citizenHeaders });
assert.equal(citizenRead.response.status, 200);
assert.equal(citizenRead.body.incident.id, incidentId);
assert.equal('citizenAccessTokenHash' in citizenRead.body.incident, false);

const streamResponse = await fetch(`${baseUrl}/api/sos/stream/${incidentId}?access_token=${encodeURIComponent(citizenToken)}`);
assert.equal(streamResponse.status, 200);
const streamReader = streamResponse.body.getReader();
const firstStreamChunk = await streamReader.read();
await streamReader.cancel();
assert.match(Buffer.from(firstStreamChunk.value || []).toString('utf8'), /event: (connected|sos_update)/);
assert.equal(Buffer.from(firstStreamChunk.value || []).toString('utf8').includes('citizenAccessTokenHash'), false);

const anonymousMessage = await request('/api/sos/message', {
  method: 'POST',
  body: { incidentId, sender: 'citizen', text: 'Không có token' }
});
assert.equal(anonymousMessage.response.status, 404);

const citizenMessage = await request('/api/sos/message', {
  method: 'POST',
  headers: citizenHeaders,
  body: { incidentId, sender: 'dispatcher', senderName: 'Giả mạo', text: 'Tin nhắn người dân' }
});
assert.equal(citizenMessage.response.status, 200);
assert.equal(citizenMessage.body.message.sender, 'citizen');
assert.equal(citizenMessage.body.message.senderName, created.body.incident.reporterName);

const officerSignatureAttempt = await request('/api/sos/sign', {
  method: 'POST',
  headers: citizenHeaders,
  body: { incidentId, signerRole: 'officer', name: 'Giả mạo' }
});
assert.equal(officerSignatureAttempt.response.status, 403);

const citizenDocumentUpdate = await request('/api/sos/sync-doc', {
  method: 'POST',
  headers: citizenHeaders,
  body: {
    id: incidentId,
    role: 'citizen',
    docFields: { reporterName: 'Người dân hợp lệ', resolutionResult: 'Không được ghi thay cán bộ' }
  }
});
assert.equal(citizenDocumentUpdate.response.status, 200);
assert.equal(citizenDocumentUpdate.body.docFields.resolutionResult, undefined);

const anonymousVideoSignal = await request('/api/sos/videocall/signal', {
  method: 'POST',
  body: { id: incidentId, action: 'request', sender: 'dispatcher' }
});
assert.equal(anonymousVideoSignal.response.status, 404);

const citizenVideoSignal = await request('/api/sos/videocall/signal', {
  method: 'POST',
  headers: citizenHeaders,
  body: { id: incidentId, action: 'accept', sender: 'dispatcher' }
});
assert.equal(citizenVideoSignal.response.status, 200);
assert.equal(citizenVideoSignal.body.signalPayload.sender, 'citizen');

const dispatcherToken = securityCryptoService.signSessionToken({
  username: 'test-dispatcher', role: 'police', agency: 'police'
});
const dispatcherMessage = await request('/api/sos/message', {
  method: 'POST',
  headers: { Authorization: `Bearer ${dispatcherToken}` },
  body: { incidentId, sender: 'dispatcher', senderName: 'Trực ban kiểm thử', text: 'Đã tiếp nhận' }
});
assert.equal(dispatcherMessage.response.status, 200);
assert.equal(dispatcherMessage.body.message.sender, 'dispatcher');

console.log('Citizen SOS access-control checks passed.');
