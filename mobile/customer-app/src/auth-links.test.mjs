import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInboundUrl} from './auth-links.ts';
test('native referral invite keeps LANDSHOPnn convention',()=>{
 assert.deepEqual(parseInboundUrl('landshop://invite?ref=landshop09'),{kind:'invitation',referral:'LANDSHOP09'});
 assert.deepEqual(parseInboundUrl('https://portal.landshopnigeria.com/?mode=signup&ref=LANDSHOP12'),{kind:'invitation',referral:'LANDSHOP12'});
});
test('ignores untrusted hosts and unexpected schemes',()=>{
 for(const url of ['https://attacker.example/?ref=LANDSHOP23','javascript:alert(1)','https://portal.landshopnigeria.com.evil.test/?ref=LANDSHOP02','landshop://other?code=abc'])
 assert.deepEqual(parseInboundUrl(url),{kind:'ignored'});
});
test('validates PKCE callback with recovery context',()=>{
 assert.deepEqual(parseInboundUrl('landshop://auth/callback?code=abc123&type=recovery'),{kind:'auth-code',code:'abc123',recovery:true});
 assert.deepEqual(parseInboundUrl('landshop:///auth/callback?code=abc123'),{kind:'auth-code',code:'abc123',recovery:false});
});
test('validates email token callback and rejects unsupported OTP type',()=>{
 assert.deepEqual(parseInboundUrl('landshop://auth/callback?token_hash=abc123&type=signup'),{kind:'auth-token',tokenHash:'abc123',otpType:'signup'});
 assert.equal(parseInboundUrl('landshop://auth/callback?token_hash=abc123&type=unknown').kind,'auth-error');
});
test('returns harmless error for expired links, never leaks provider text',()=>{
 assert.equal(parseInboundUrl('landshop://auth/callback?error=access_denied&error_description=SECRET').kind,'auth-error');
 assert.deepEqual(parseInboundUrl(null),{kind:'ignored'});
});
