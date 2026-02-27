// Supabase Edge Function: unsubscribe
// One-click CAN-SPAM compliant unsubscribe handler.
// GET /unsubscribe?uid=<user_id> — adds to email_unsubscribes, cancels queued emails.
// Redirects to static thank-you page (Supabase forces text/plain on --no-verify-jwt functions).
// Deploy with --no-verify-jwt since users click this from email links.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySignature } from '../_shared/hmac.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAGE_URL = 'https://topscore.school/unsubscribed';

function redirect(error?: boolean): Response {
  const params = error ? '?error=true' : '';
  return new Response(null, {
    status: 302,
    headers: { Location: `${PAGE_URL}${params}` },
  });
}

Deno.serve(async (req: Request) => {
  // Accept both GET (email link click) and POST (List-Unsubscribe header)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const uid = url.searchParams.get('uid');
  const sig = url.searchParams.get('sig');

  if (!uid || !sig) {
    return redirect(true);
  }

  // Verify HMAC signature to prevent unauthorized unsubscribes
  const payload = new URLSearchParams({ uid }).toString();
  const valid = await verifySignature(payload, sig);
  if (!valid) {
    return redirect(true);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Get user email
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(uid);
    if (authErr || !authUser?.user?.email) {
      return redirect(true);
    }

    const email = authUser.user.email;

    // Check if already unsubscribed
    const { data: existing } = await supabase
      .from('email_unsubscribes')
      .select('id')
      .eq('user_id', uid)
      .maybeSingle();

    if (!existing) {
      // Add to unsubscribe list
      await supabase.from('email_unsubscribes').insert({
        user_id: uid,
        email,
      });
    }

    // Cancel all queued emails for this user
    await supabase
      .from('email_sends')
      .update({ cancelled: true, cancel_reason: 'unsubscribed' })
      .eq('user_id', uid)
      .eq('status', 'queued')
      .eq('cancelled', false);

    return redirect();
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return redirect(true);
  }
});
