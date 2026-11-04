#!/usr/bin/env node
/**
 * Offline release contract for optional, credential-backed production browser
 * checks. This does not authenticate, create users or contact production.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const test=readFileSync('scripts/check-landshop-authenticated-e2e.mjs','utf8');
const workflow=readFileSync('.github/workflows/landshop-production-e2e.yml','utf8');
const required=[
 '--suite=customer','--suite=staff-command',
 'LANDSHOP_E2E_CUSTOMER_EMAIL','LANDSHOP_E2E_CUSTOMER_PASSWORD',
 'LANDSHOP_E2E_STAFF_EMAIL','LANDSHOP_E2E_STAFF_PASSWORD',
 'LANDSHOP_E2E_MANAGEMENT_EMAIL','LANDSHOP_E2E_MANAGEMENT_PASSWORD',
 'AUTH E2E BLOCKED','Customer cannot enter management Command Center',
 'Staff account does not inherit Command Center privileges',
 'Automation visual canvas boots without JavaScript errors',
 'Automation mobile Steps and Canvas modes respond',
 'Communications mobile navigation and message preview respond',
 'Command Center responsive on phone tablet and desktop',
 'Dedicated employee sign-in reaches personal staff workspace'
];
for(const item of required)assert.ok(test.includes(item),'Missing authenticated test contract: '+item);
assert.ok(!/\.auth\.admin\.(?:createUser|updateUserById|deleteUser)/.test(test),'Authenticated test must not change Auth accounts');
assert.ok(!/\.rpc\(['"]landshop_(?:staff_task|clock|payment|send|approve)/.test(test),'Authenticated test must not dispatch production changes');
for(const job of ['authenticated-customer:','authenticated-staff-command:']){
 assert.ok(workflow.includes(job),'Missing separate authenticated job: '+job);
}
assert.ok(workflow.includes("vars.LANDSHOP_ENABLE_AUTH_E2E == 'true'"),'Post-deployment auth testing must be opt-in');
assert.ok(workflow.includes("github.event.workflow_run.head_branch == 'main'"),'Auth suite must only run automatically for deployed main');
assert.ok(workflow.includes("inputs.suite == 'all'"),'Manual all-suites dispatch missing');
assert.ok(workflow.includes('node --check scripts/check-landshop-authenticated-e2e.mjs'),'Test script syntax gate missing');
console.log('PASS: Separate fail-closed authenticated customer and staff/management suites are configured.');
console.log('PASS: Authenticated browser checks are read-only and require dedicated account secrets.');
