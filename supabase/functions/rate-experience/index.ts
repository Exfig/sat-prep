// Supabase Edge Function: rate-experience
// Handles star rating clicks from email #5 ("Two weeks in").
// GET /rate-experience?uid=<user_id>&score=<1-5>
// Records rating, tags user (promoter/needs-attention), redirects to thank-you page.
// Deploy with --no-verify-jwt since users click this from email links.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySignature } from '../_shared/hmac.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const THANKS_URL = 'https://topscore.school/rating-thanks';

function redirect(score?: number, error?: boolean): Response {
  const params = error ? '?error=true' : `?score=${score}`;
  return new Response(null, {
    status: 302,
    headers: { Location: `${THANKS_URL}${params}` },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const uid = url.searchParams.get('uid');
  const scoreStr = url.searchParams.get('score');
  const sig = url.searchParams.get('sig');

  if (!uid || !scoreStr || !sig) {
    return redirect(undefined, true);
  }

  const score = parseInt(scoreStr, 10);
  if (isNaN(score) || score < 1 || score > 5) {
    return redirect(undefined, true);
  }

  // Verify HMAC signature to prevent unauthorized ratings
  const payload = new URLSearchParams({ uid, score: scoreStr }).toString();
  const valid = await verifySignature(payload, sig);
  if (!valid) {
    return redirect(undefined, true);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify user exists
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(uid);
    if (authErr || !authUser?.user) {
      return redirect(undefined, true);
    }

    // Upsert rating (one rating per user, updates on re-click)
    await supabase.from('user_ratings').upsert(
      { user_id: uid, rating: score, source: 'email_5', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

    // Tag user based on score
    const tag = score >= 4 ? 'promoter' : score <= 2 ? 'needs-attention' : null;
    if (tag) {
      await supabase
        .from('profiles')
        .update({ rating_tag: tag })
        .eq('id', uid);
    }

    return redirect(score);
  } catch (error) {
    console.error('Rate experience error:', error);
    return redirect(undefined, true);
  }
});
