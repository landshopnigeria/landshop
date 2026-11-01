// NEXUS safe-preview queue worker. External side effects are disabled in the database.
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

function positiveInteger(name, fallback, maximum) {
  const raw = process.env[name];
  const value = raw === undefined ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new Error(name + ' must be an integer between 1 and ' + maximum);
  }
  return value;
}
const endpoint = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
let url;
try {
  url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('SUPABASE_URL must be a clean HTTPS origin');
  }
} catch {
  throw new Error('SUPABASE_URL must be a valid HTTPS URL');
}
if (!secret) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required');
const base = url.origin;
const worker = 'nexus.' + randomUUID().replaceAll('-', '');
const batch = positiveInteger('NEXUS_BATCH_SIZE', 2, 4);
const pollMs = positiveInteger('NEXUS_POLL_MS', 3000, 60000);
let stopping = false;
process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });

async function rpc(name, args) {
  const response = await fetch(base + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {
      apikey: secret,
      Authorization: 'Bearer ' + secret,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error('RPC ' + name + ' failed HTTP ' + response.status);
  return response.json();
}

async function advance(runId) {
  try {
    const result = await rpc('landshop_nexus_worker_advance', {
      p_run: runId, p_worker: worker, p_result: 'success', p_error_code: null
    });
    console.log(JSON.stringify({ event: 'nexus_advanced', run_id: runId, status: result.status, reason: result.reason }));
  } catch (error) {
    console.error(JSON.stringify({ event: 'nexus_advance_error', run_id: runId, error: String(error.message || error) }));
    try {
      await rpc('landshop_nexus_worker_advance', {
        p_run: runId, p_worker: worker, p_result: 'retry', p_error_code: 'worker_execution_error'
      });
    } catch {
      // Do not acknowledge work whose state is unknown. Database lease expiry recovers it.
      console.error(JSON.stringify({ event: 'nexus_lease_recovery_required', run_id: runId }));
    }
  }
}

console.log(JSON.stringify({ event: 'nexus_worker_started', worker, batch, pollMs, mode: 'preview_only' }));
while (!stopping) {
  try {
    const claimed = await rpc('landshop_nexus_worker_claim', { p_worker: worker, p_limit: batch });
    if (!Array.isArray(claimed)) throw new Error('Claim RPC returned an unexpected response');
    if (claimed.length > batch) throw new Error('Claim RPC exceeded configured batch limit');
    for (const item of claimed) {
      if (typeof item?.run_id !== 'string') throw new Error('Claim RPC returned an invalid run');
    }
    // At most four concurrent transitions, with a 12-second request deadline each.
    await Promise.all(claimed.map(item => advance(item.run_id)));
    if (claimed.length === 0 && !stopping) await sleep(pollMs);
  } catch (error) {
    console.error(JSON.stringify({ event: 'nexus_poll_error', error: String(error.message || error) }));
    if (!stopping) await sleep(Math.max(3000, pollMs));
  }
}
console.log(JSON.stringify({ event: 'nexus_worker_stopped', worker }));
