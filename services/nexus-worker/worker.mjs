// NEXUS safe-preview worker. No provider, email, payment or device actions.
import {randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !/^https:\/\//.test(url) || !key) {
  throw new Error('SUPABASE_URL (https) and SUPABASE_SERVICE_ROLE_KEY are required');
}
const worker = 'nexus.' + randomUUID().replaceAll('-', '');
const batch = Math.min(4, Math.max(1, Number(process.env.NEXUS_BATCH_SIZE || 2)));
const pollMs = Math.max(1000, Number(process.env.NEXUS_POLL_MS || 3000));
let stopping = false;
process.on('SIGTERM', () => {stopping = true;});
process.on('SIGINT', () => {stopping = true;});

async function rpc(name, args) {
  const response = await fetch(url + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: {'apikey': key, 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error('RPC ' + name + ' failed (HTTP ' + response.status + ')');
  return response.json();
}

async function advance(runId) {
  try {
    const result = await rpc('landshop_nexus_worker_advance', {
      p_run: runId, p_worker: worker, p_result: 'success', p_error_code: null
    });
    console.log(JSON.stringify({event:'nexus_advanced',run:runId,status:result.status,reason:result.reason}));
  } catch (error) {
    console.error(JSON.stringify({event:'nexus_advance_error',run:runId,error:String(error.message || error)}));
    try {
      await rpc('landshop_nexus_worker_advance', {
        p_run: runId,p_worker:worker,p_result:'retry',p_error_code:'worker_execution_error'
      });
    } catch {
      // Lease expiry and atomic claim recovery handle this; do not acknowledge a failed transition.
      console.error(JSON.stringify({event:'nexus_lease_recovery_required',run:runId}));
    }
  }
}

console.log(JSON.stringify({event:'nexus_worker_started',worker,batch,pollMs,mode:'preview_only'}));
while (!stopping) {
  try {
    const claimed = await rpc('landshop_nexus_worker_claim',{p_worker:worker,p_limit:batch});
    if (!Array.isArray(claimed)) throw new Error('Unexpected claim RPC response');
    // Batch is bounded so work completes well within the server-side 60 second lease.
    await Promise.all(claimed.map(item => advance(item.run_id)));
    if (claimed.length === 0 && !stopping) await sleep(pollMs);
  } catch (error) {
    console.error(JSON.stringify({event:'nexus_poll_error',error:String(error.message || error)}));
    if (!stopping) await sleep(Math.max(3000,pollMs));
  }
}
console.log(JSON.stringify({event:'nexus_worker_stopped',worker}));
