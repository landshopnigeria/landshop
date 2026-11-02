/**
 * Landshop no-cost, privacy-preserving password screening for the official
 * customer/staff registration and password-reset forms.
 *
 * The proposed password is SHA-1 hashed IN THE BROWSER. Only its first five
 * hexadecimal hash characters are sent to Pwned Passwords. The full password
 * and full SHA-1 digest never leave the browser for this check.
 *
 * This complements Supabase Auth; because clients can call Auth directly, it
 * is not a substitute for provider-side enforcement against API bypass.
 * Fail closed on a range lookup outage instead of silently accepting a
 * password that has not passed the check.
 *
 * Source: https://haveibeenpwned.com/API/v3#PwnedPasswords
 */
const RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const EXPOSED_PASSWORD_MESSAGE =
  'This password has appeared in a known data breach. Choose a different, unique password.';
const CHECK_UNAVAILABLE_MESSAGE =
  'We could not verify this password against known breaches. Please try again.';

export async function assertLandshopPasswordSafe(password: string): Promise<void> {
  if (password.length < 12 || password.length > 256) {
    throw new Error('Choose a password between 12 and 256 characters.');
  }
  const lower = password.toLowerCase();
  if (
    ['landshop', 'password', '12345678', 'qwerty', 'letmein', 'admin123'].some(
      fragment => lower.includes(fragment)
    ) ||
    /^(.)\1{11,}$/u.test(password)
  ) {
    throw new Error('This password is too predictable. Choose a unique password or passphrase.');
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error(CHECK_UNAVAILABLE_MESSAGE);
  }
  // SHA-1 is used as a privacy-preserving lookup identifier only; it is not
  // used to store or authenticate passwords. Supabase Auth handles storage.
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(password)
  );
  const hash = Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  let range: string;
  try {
    const result = await fetch(RANGE_URL + prefix, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!result.ok) throw new Error('Password range service unavailable');
    range = await result.text();
  } catch {
    throw new Error(CHECK_UNAVAILABLE_MESSAGE);
  } finally {
    clearTimeout(timer);
  }

  // The API returns SHA-1 suffixes followed by breach counts, one per line.
  // Padded zero-count rows are ignored if the provider enables padding.
  for (const entry of range.split(/\r?\n/u)) {
    const [candidate, count] = entry.split(':', 2);
    if (
      candidate?.toUpperCase() === suffix &&
      Number(count) > 0
    ) {
      throw new Error(EXPOSED_PASSWORD_MESSAGE);
    }
  }
}
