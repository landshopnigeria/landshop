import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const workerFile = join(dirname(fileURLToPath(import.meta.url)), 'worker.mjs');

function launch(environment, flags = []) {
  const child = spawn(process.execPath, [...flags, workerFile], {
    env: { ...process.env, ...environment },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', bytes => { stdout += bytes.toString(); });
  child.stderr.on('data', bytes => { stderr += bytes.toString(); });
  const finished = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
  return { child, finished, get stdout() { return stdout; } };
}
const validEnv = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'local_test_secret_never_real',
  NEXUS_BATCH_SIZE: '2',
  NEXUS_POLL_MS: '1000'
};

test('refuses non-HTTPS and credential-bearing database endpoints', async () => {
  for (const endpoint of ['http://example.supabase.co', 'https://user:pass@example.supabase.co']) {
    const result = await launch({ ...validEnv, SUPABASE_URL: endpoint }).finished;
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /SUPABASE_URL/);
  }
});

test('rejects invalid bounded queue configuration', async () => {
  const result = await launch({ ...validEnv, NEXUS_BATCH_SIZE: '99' }).finished;
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /NEXUS_BATCH_SIZE/);
});

test('polls a stubbed empty claim RPC without any outbound side effect', async () => {
  const bootstrap = [
    'globalThis.fetch = async (url, options) => {',
    '  if (!String(url).endsWith("/rpc/landshop_nexus_worker_claim")) throw Error("Unexpected RPC");',
    '  const payload = JSON.parse(options.body);',
    '  if (payload.p_limit !== 2) throw Error("Unexpected claim limit");',
    '  return { ok: true, json: async () => [] };',
    '};'
  ].join('\n');
  const preload = 'data:text/javascript,' + encodeURIComponent(bootstrap);
  const instance = launch(validEnv, ['--import', preload]);
  try {
    const deadline = Date.now() + 4000;
    while (!instance.stdout.includes('nexus_worker_started') && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    assert.match(instance.stdout, /nexus_worker_started/);
    instance.child.kill('SIGTERM');
    const result = await instance.finished;
    assert.equal(result.code, 0);
    assert.match(result.stdout, /nexus_worker_stopped/);
    assert.doesNotMatch(result.stderr, /Unexpected RPC/);
  } finally {
    instance.child.kill('SIGKILL');
  }
});
