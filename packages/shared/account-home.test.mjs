import test from 'node:test';
import assert from 'node:assert/strict';
import {accountHome} from './account-home.ts';
function client(manager,staff=false,error=null){return {rpc:async()=>({data:manager,error}),from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:staff?{user_id:'test'}:null})})})})}}
test('trusted management takes precedence over staff signup and membership',async()=>{assert.equal(await accountHome(client(true,true),{id:'test',user_metadata:{staff_signup:true}}),'/admin')});
test('customer-selected owner title cannot confer management access',async()=>{assert.equal(await accountHome(client(false),{id:'test',user_metadata:{requested_role:'owner'}}),'/dashboard')});
test('staff records go to the staff dashboard',async()=>{assert.equal(await accountHome(client(false,true),{id:'test'}),'/staff')});
test('confirmed staff signup can reach personal onboarding, not management',async()=>{assert.equal(await accountHome(client(false),{id:'test',user_metadata:{staff_signup:true,requested_role:'owner'}}),'/staff')});
test('management lookup failure never grants administrative access',async()=>{assert.equal(await accountHome(client(true,false,new Error('unavailable')),{id:'test'}),'/dashboard')});

test('restricted account is sent to the access notice before role resolution',async()=>{const c=client(true,true);const original=c.rpc;c.rpc=async fn=>fn==='landshop_my_account_state'?{data:'suspended',error:null}:original();assert.equal(await accountHome(c,{id:'test'}),'/account-unavailable')});
