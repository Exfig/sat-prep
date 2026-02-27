// Supabase Edge Function: send-auth-email
// Handles Supabase Auth Hook "Send Email" webhook
// Sends branded transactional emails via Resend REST API

import {
  welcomeEmail,
  passwordResetEmail,
  emailChangeEmail,
} from '../_shared/email-templates.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://frgacrwgukenptidfrqt.supabase.co';

interface AuthEmailPayload {
  user: {
    email: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: 'signup' | 'recovery' | 'email_change' | 'magic_link' | 'invite';
    site_url?: string;
    token_new?: string;
    token_hash_new?: string;
  };
}

function buildConfirmUrl(
  tokenHash: string,
  type: string,
  redirectTo?: string,
): string {
  const base = SUPABASE_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    token: tokenHash,
    type,
  });
  if (redirectTo) params.set('redirect_to', redirectTo);
  return `${base}/auth/v1/verify?${params.toString()}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Caliber <support@topscore.school>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const payload: AuthEmailPayload = JSON.parse(body);
  const { user, email_data } = payload;
  const { email } = user;
  const { email_action_type, token, token_hash } = email_data;

  // Redirect to the appropriate app page based on action type
  const appRedirect = email_action_type === 'recovery'
    ? 'https://topscore.school/caliber/reset-password'
    : 'https://topscore.school/caliber/dashboard';

  try {
    switch (email_action_type) {
      case 'signup': {
        const confirmUrl = buildConfirmUrl(token_hash, 'signup', appRedirect);
        const html = welcomeEmail(confirmUrl, token);
        await sendEmail(email, 'Welcome to Caliber — Confirm Your Email', html);
        break;
      }

      case 'recovery': {
        const resetUrl = buildConfirmUrl(token_hash, 'recovery', appRedirect);
        const html = passwordResetEmail(resetUrl, token);
        await sendEmail(email, 'Reset Your Caliber Password', html);
        break;
      }

      case 'email_change': {
        const confirmUrl = buildConfirmUrl(
          email_data.token_hash_new || token_hash,
          'email_change',
          appRedirect,
        );
        const html = emailChangeEmail(confirmUrl, email_data.token_new || token);
        await sendEmail(email, 'Confirm Your New Email Address — Caliber', html);
        break;
      }

      case 'magic_link': {
        const magicUrl = buildConfirmUrl(token_hash, 'magiclink', appRedirect);
        const html = passwordResetEmail(magicUrl, token);
        await sendEmail(email, 'Your Caliber Login Link', html);
        break;
      }

      default:
        console.log(`Unhandled email action type: ${email_action_type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email send error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
