// Supabase Edge Function: submit-support-request
// Sends a support request email to support@topscore.school via Resend

import { corsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

interface SupportPayload {
  userEmail: string;
  userName: string;
  category: string;
  message: string;
}

function buildHtml(data: SupportPayload): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #1a1a1a; margin-bottom: 16px;">New Support Request</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px 12px; font-weight: 600; color: #555; width: 100px;">From</td>
          <td style="padding: 8px 12px;">${data.userName} &lt;${data.userEmail}&gt;</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: 600; color: #555;">Category</td>
          <td style="padding: 8px 12px;">${data.category}</td>
        </tr>
      </table>
      <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; white-space: pre-wrap;">${data.message}</div>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const payload: SupportPayload = await req.json();

    if (!payload.message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const subject = `[Caliber Support] ${payload.category} — from ${payload.userName || payload.userEmail}`;
    const html = buildHtml(payload);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Caliber <support@topscore.school>',
        to: ['support@topscore.school'],
        reply_to: payload.userEmail,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Resend API error ${res.status}: ${err}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Support request error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
