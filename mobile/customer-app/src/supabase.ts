import 'react-native-url-polyfill/auto';
import {AppState} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {createClient} from '@supabase/supabase-js';

const url=process.env.EXPO_PUBLIC_SUPABASE_URL;
const key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw new Error('Configure the existing Landshop Supabase project in EXPO_PUBLIC_* settings.');
const storage={
 async getItem(name:string){return SecureStore.getItemAsync(name);},
 async setItem(name:string,value:string){await SecureStore.setItemAsync(name,value);},
 async removeItem(name:string){await SecureStore.deleteItemAsync(name);}
};
export const supabase=createClient(url,key,{
 auth:{storage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce'}
});
AppState.addEventListener('change',state=>{
 if(state==='active')supabase.auth.startAutoRefresh();
 else supabase.auth.stopAutoRefresh();
});
