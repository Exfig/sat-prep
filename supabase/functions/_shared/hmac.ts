// HMAC-SHA256 signing for email action links (unsubscribe, rate, review)
// Uses LINK_SIGNING_SECRET env var set in Supabase project secrets.

const encoder = new TextEncoder();

export async function signPayload(payload: string): Promise<string> {
  const secret = Deno.env.get('LINK_SIGNING_SECRET');
  if (!secret) throw new Error('LINK_SIGNING_SECRET not configured');

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const expected = await signPayload(payload);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

/** Build a signed URL query string: ?uid=xxx&sig=xxx (or &score=x&sig=xxx) */
export async function signUrl(uid: string, extra?: Record<string, string>): Promise<string> {
  const params = new URLSearchParams({ uid, ...extra });
  // Sign the full query minus the sig itself
  const payload = params.toString();
  const sig = await signPayload(payload);
  params.set('sig', sig);
  return params.toString();
}
