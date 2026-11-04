import {test} from 'node:test';
import assert from 'node:assert/strict';
import {boundedReadFetch,READ_TIMEOUT_MS} from './bounded-read-fetch.ts';

test('stalled reads abort at the deadline and release their timer',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 t.mock.method(globalThis,'fetch',(_input,init)=>new Promise((_resolve,reject)=>{
  init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true});
 }));
 const result=assert.rejects(boundedReadFetch('https://example.test/read'),{name:'TimeoutError'});
 t.mock.timers.tick(READ_TIMEOUT_MS);
 await result;
});
test('caller cancellation is preserved',async(t)=>{
 const upstream=new AbortController();
 t.mock.method(globalThis,'fetch',(_input,init)=>new Promise((_resolve,reject)=>{
  init.signal.addEventListener('abort',()=>reject(init.signal.reason),{once:true});
 }));
 const result=assert.rejects(boundedReadFetch('https://example.test/read',{signal:upstream.signal}),{name:'AbortError'});
 upstream.abort();await result;
});
test('writes pass through without a deadline, retry or replacement signal',async(t)=>{
 const upstream=new AbortController();const init={method:'POST',body:'payload',signal:upstream.signal};
 const response=new Response('ok');
 const mock=t.mock.method(globalThis,'fetch',async(_input,actual)=>{assert.equal(actual,init);return response;});
 assert.equal(await boundedReadFetch('https://example.test/write',init),response);
 assert.equal(mock.mock.callCount(),1);
});
