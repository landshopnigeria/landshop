#!/usr/bin/env node
/* Release-gate smoke test for private automation UI; does not perform provider sends. */
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import assert from 'node:assert/strict';

const read=path=>readFileSync(path,'utf8');
const path='apps/dashboard/app/admin/automation/NexusWorkspaceHTML.ts';
const literal=read(path);
const equals=literal.indexOf('=');
assert(equals>0,'Workspace HTML export was not found');
const source=literal.slice(equals+1).trim().replace(/;\s*$/,'');
const html=JSON.parse(source);
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match=>match[1]);
assert.equal(scripts.length,1,'Studio must have one verified sandbox script');
new Script(scripts[0],{filename:'NexusWorkspaceHTML.inline.js'});
for(const id of [
 'app','library','library-list','canvas-stage','inspector',
 'mobile-steps-list','mobile-activity-list','mobile-add','mobile-save','mobile-test',
 'mobile-canvas','mobile-step-count','save-workflow','run-workflow'
]){
 assert(html.includes('id="'+id+'"'),'Missing required control: '+id);
}
for(const feature of [
 'enhanceLibraryAccordions()','openLibraryGroup','category-body','aria-expanded',
 'setMobileMode(','renderMobileSteps()','renderMobileLogs()',
 'data-mobile-mode="steps"','data-mobile-mode="canvas"','data-mobile-mode="logs"',
 'window.parent.postMessage({nexus:true,type:\'save\'',
 'window.parent.postMessage({nexus:true,type:\'generate-ai\''
]){
 assert(html.includes(feature),'Required studio behavior missing: '+feature);
}
assert(html.includes('prefers-reduced-motion'),'Reduced-motion handling missing');
assert(html.includes('max-width:760px'),'Phone-specific layout missing');
const host=read('apps/dashboard/app/admin/automation/NexusHost.tsx');
for(const feature of [
 'landshop_automation_save','landshop_automation_create','landshop_automation_rehearse',
 'landshop_nexus_queue_preview','nexus-host-more','nexus-host-primary',
 '/admin/communications','/admin/automation/connections',
 'sandbox="allow-scripts allow-downloads"'
]){
 assert(host.includes(feature),'Preserved execution or command UI missing: '+feature);
}
const hostCSS=read('apps/dashboard/app/admin/automation/nexus-host.css');
assert(hostCSS.includes('nexus-host-menu'),'Compact operations menu styling missing');
console.log('PASS: Landshop studio script parses, accessible mobile modes and single-open library are present.');
console.log('PASS: Versioned drafts, authorized rehearsal, queue preview and communications navigation remain intact.');
