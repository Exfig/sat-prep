// Supabase Edge Function: submit-review
// Accepts a review submission from the /review page and inserts into user_reviews

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { verifySignature } from '../_shared/hmac.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ReviewPayload {
  uid: string;
  sig: string;
  rating: number;
  review_text: string;
  display_name?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload: ReviewPayload = await req.json();

    // Validate required fields
    if (!payload.uid?.trim() || !payload.sig?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Invalid review link. Please use the link from your email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    // Validate uid is a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(payload.uid.trim())) {
      return new Response(
        JSON.stringify({ error: 'Invalid review link. Please use the link from your email.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    // Verify HMAC signature
    const sigPayload = new URLSearchParams({ uid: payload.uid }).toString();
    const valid = await verifySignature(sigPayload, payload.sig);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid review link. Please use the link from your email.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
      return new Response(
        JSON.stringify({ error: 'Rating must be between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!payload.review_text?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Review text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user exists
    const { data: user } = await supabase.auth.admin.getUserById(payload.uid);
    if (!user?.user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Insert review
    const { error: insertErr } = await supabase.from('user_reviews').insert({
      user_id: payload.uid,
      rating: payload.rating,
      review_text: payload.review_text.trim(),
      display_name: payload.display_name?.trim() || null,
    });

    if (insertErr) throw insertErr;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Submit review error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
