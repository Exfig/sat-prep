// Supabase Edge Function: resend-webhook
// Receives delivery tracking events from Resend (delivered, opened, clicked, bounced)
// Updates email_sends status accordingly.
// Deploy with --no-verify-jwt since Resend calls this without Supabase auth.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

const encoder = new TextEncoder();

async function verifyWebhookSignature(
  payload: string,
  svixId: string | null,
  svixTimestamp: string | null,
  svixSignature: string | null,
): Promise<boolean> {
  if (!RESEND_WEBHOOK_SECRET || !svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Reject timestamps older than 5 minutes to prevent replay attacks
  const ts = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return false;
  }

  // Resend webhook secrets are prefixed with "whsec_"
  const secret = RESEND_WEBHOOK_SECRET.startsWith('whsec_')
    ? RESEND_WEBHOOK_SECRET.slice(6)
    : RESEND_WEBHOOK_SECRET;
  const secretBytes = Uint8Array.from(atob(secret), c => c.charCodeAt(0));

  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(toSign));
  const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // Svix sends multiple signatures separated by spaces (e.g. "v1,abc v1,def")
  const signatures = svixSignature.split(' ');
  return signatures.some(s => {
    const [version, value] = s.split(',');
    return version === 'v1' && value === expected;
  });
}

Deno.serve(async (req: Request) => {
  // Resend sends POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const rawBody = await req.text();

    // Verify Resend/Svix webhook signature
    if (RESEND_WEBHOOK_SECRET) {
      const valid = await verifyWebhookSignature(
        rawBody,
        req.headers.get('svix-id'),
        req.headers.get('svix-timestamp'),
        req.headers.get('svix-signature'),
      );
      if (!valid) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const { type, data } = body;
    const messageId = data?.email_id;

    if (!messageId) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no_message_id' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const updates: Record<string, unknown> = {};

    switch (type) {
      case 'email.delivered':
        updates.status = 'delivered';
        break;
      case 'email.opened':
        updates.status = 'opened';
        updates.opened_at = new Date().toISOString();
        break;
      case 'email.clicked':
        updates.status = 'clicked';
        updates.clicked_at = new Date().toISOString();
        break;
      case 'email.bounced':
        updates.status = 'bounced';
        break;
      case 'email.complained':
        updates.status = 'failed';
        break;
      default:
        return new Response(JSON.stringify({ ok: true, skipped: `unhandled_type:${type}` }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    const { error } = await supabase
      .from('email_sends')
      .update(updates)
      .eq('resend_message_id', messageId);

    if (error) {
      console.error('Failed to update email_sends:', error);
    }

    return new Response(JSON.stringify({ ok: true, type, messageId }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Resend webhook error:', error);
    // Always return 200 to Resend so it doesn't retry
    return new Response(JSON.stringify({ ok: true, error: (error as Error).message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
