import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function serverSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase configuration is missing');
  return createServerClient(url, key, {
    cookieOptions: { domain: '.landshopnigeria.com', path: '/', sameSite: 'lax', secure: true },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (changes) => {
        try { changes.forEach(({name,value,options}) => cookieStore.set(name,value,options)); }
        catch { /* Session refresh must also be handled in proxy/middleware. */ }
      }
    }
  });
}
