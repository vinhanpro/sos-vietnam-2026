const tls = require('tls');
const https = require('https');

async function testTls13(port) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host: '127.0.0.1',
      port: port,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.3',
      maxVersion: 'TLSv1.3',
      servername: 'localhost'
    }, () => {
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher();
      const authorized = socket.authorized;
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve({
        success: true,
        protocol,
        cipher,
        issuer: cert ? cert.issuer : null,
        subject: cert ? cert.subject : null
      });
    });

    socket.on('error', (err) => {
      reject(err);
    });
  });
}

async function testTls12Rejection(port) {
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: '127.0.0.1',
      port: port,
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.2',
      servername: 'localhost'
    }, () => {
      const protocol = socket.getProtocol();
      socket.end();
      resolve({
        rejected: false,
        protocol
      });
    });

    socket.on('error', (err) => {
      resolve({
        rejected: true,
        error: err.message,
        code: err.code
      });
    });
  });
}

async function testHttpsRequest(port) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: '127.0.0.1',
      port: port,
      path: '/healthz',
      method: 'GET',
      servername: 'localhost',
      rejectUnauthorized: false,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function run() {
  const port = parseInt(process.argv[2] || '8443', 10);
  console.log(`[P4-A TLS Verification] Testing Caddy reverse-proxy at 127.0.0.1:${port}...`);

  console.log('1. Testing TLS 1.3 handshake...');
  const tls13Res = await testTls13(port);
  console.log('TLS 1.3 handshake result:', JSON.stringify(tls13Res, null, 2));

  console.log('2. Testing TLS 1.2 client rejection (enforcing TLS 1.3 minimum)...');
  const tls12Res = await testTls12Rejection(port);
  console.log('TLS 1.2 rejection result:', JSON.stringify(tls12Res, null, 2));

  console.log('3. Testing HTTPS request proxied through Caddy to sos-vietnam /healthz...');
  const httpRes = await testHttpsRequest(port);
  console.log('HTTPS proxied response:', JSON.stringify(httpRes, null, 2));

  if (tls13Res.protocol === 'TLSv1.3' && tls12Res.rejected && httpRes.statusCode === 200) {
    console.log('\nPASS: Caddy TLS 1.3 reverse proxy successfully verified!');
    process.exit(0);
  } else {
    console.error('\nFAIL: TLS verification requirements not met.');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
