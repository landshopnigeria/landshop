import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import {supabase} from './supabase';
import type {Inbound} from './auth-links';

export const nativeCallbackUrl='landshop://auth/callback';
export const nativeAuthEnabled=process.env.EXPO_PUBLIC_NATIVE_AUTH_REDIRECT_READY==='true';
export const webCallbackUrl='https://portal.landshopnigeria.com/auth/callback';
const PENDING_REFERRAL_KEY='landshop.native.pending_referral';
const referralPattern=/^LANDSHOP[0-9]{2,12}$/;
WebBrowser.maybeCompleteAuthSession();

/**
 * Native authentication must remain behind a verified redirect allowlist.
 * This prevents a disabled/incorrect Supabase redirect from sending tokens
 * to the site URL rather than back to the signed app.
 */
export async function signInWithNativeGoogle(referral:string):Promise<string|null>{
 if(!nativeAuthEnabled)return 'Native Google sign-in is not configured yet.';
 const normalized=referral.trim().toUpperCase();
 if(referralPattern.test(normalized))await SecureStore.setItemAsync(PENDING_REFERRAL_KEY,normalized);
 else await SecureStore.deleteItemAsync(PENDING_REFERRAL_KEY);
 const {data,error}=await supabase.auth.signInWithOAuth({
  provider:'google',
  options:{redirectTo:nativeCallbackUrl,skipBrowserRedirect:true}
 });
 if(error)throw error;
 if(!data.url)throw new Error('The Google authorization URL was unavailable.');
 const result=await WebBrowser.openAuthSessionAsync(data.url,nativeCallbackUrl);
 if(result.type==='cancel'||result.type==='dismiss')return 'Google sign-in was cancelled.';
 if(result.type!=='success')throw new Error('The Google authorization session could not be completed.');
 return result.url;
}

/** Supabase verifies the single-use PKCE code or server-generated token hash. */
export async function finishNativeAuthentication(link:Extract<Inbound,{kind:'auth-code'|'auth-token'}>){
 const result=link.kind==='auth-code'
  ?await supabase.auth.exchangeCodeForSession(link.code)
  :await supabase.auth.verifyOtp({token_hash:link.tokenHash,type:link.otpType});
 if(result.error)throw result.error;
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)throw error||new Error('Account verification completed without a session.');
 if(!user.email_confirmed_at)throw new Error('Please confirm your email address before continuing.');
 const pending=await SecureStore.getItemAsync(PENDING_REFERRAL_KEY);
 if(pending&&referralPattern.test(pending)){
  // Existing customers cannot attribute old accounts: the server requires a
  // newly registered, authenticated user and prevents duplicate/upline claims.
  try{await supabase.rpc('landshop_claim_signup_referral',{p_code:pending})}
  finally{await SecureStore.deleteItemAsync(PENDING_REFERRAL_KEY)}
 }
 return link.kind==='auth-code'?link.recovery:link.otpType==='recovery';
}
