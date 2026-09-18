import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 3103;
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['server.js'], {
  cwd: new URL('..', import.meta.url),
  env: { ...process.env, PORT: String(port), GRACEFUL_SHUTDOWN_TIMEOUT_MS: '2000' },
  stdio: ['ignore', 'ignore', 'ignore', 'ipc']
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/healthz`);
      if (response.status === 200) return;
    } catch {}
    await delay(100);
  }
  throw new Error('Test server did not become healthy');
}

try {
  await waitForHealth();
  child.send({ type: 'sos:graceful-shutdown' });
  const [exitCode, signal] = await new Promise(resolve => child.once('exit', (code, exitSignal) => resolve([code, exitSignal])));
  assert.equal(signal, null);
  assert.equal(exitCode, 0);

  await assert.rejects(fetch(`${baseUrl}/healthz`));
  console.log('Graceful shutdown checks passed.');
} finally {
  if (!child.killed) child.kill('SIGKILL');
}
