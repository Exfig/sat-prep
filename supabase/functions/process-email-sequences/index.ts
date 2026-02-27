// Supabase Edge Function: process-email-sequences
// Called by pg_cron every 15 minutes
// Reads queued emails from email_sends, checks unsubscribes/conditions,
// replaces template vars, sends via Resend, updates status.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { signUrl } from '../_shared/hmac.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const BATCH_SIZE = 50; // Max emails per run to avoid timeouts

function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  return authHeader.replace('Bearer ', '') === SUPABASE_SERVICE_ROLE_KEY;
}

function replaceTemplateVars(
  template: string,
  vars: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

function processConditionals(
  html: string,
  vars: Record<string, string>,
): string {
  let result = html;
  // {{#if var}}...{{/if}}
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      const val = vars[varName];
      return val && val !== '0' && val !== '' && val !== 'false' && val !== 'null'
        ? content
        : '';
    },
  );
  // {{#unless var}}...{{/unless}}
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, varName, content) => {
      const val = vars[varName];
      return !val || val === '0' || val === '' || val === 'false' || val === 'null'
        ? content
        : '';
    },
  );
  return result;
}

function wrapInBrandedLayout(bodyHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Caliber</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#08090d;padding:24px 32px;text-align:center;">
              <img src="https://topscore.school/lp-images/caliber-icon-01.png" alt="Caliber" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                Caliber &mdash; by TopScore
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                <a href="https://topscore.school/caliber/dashboard" style="color:#94a3b8;text-decoration:underline;">Visit App</a>
                &nbsp;&middot;&nbsp;
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<{ id?: string; error?: string }> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Caliber Team <sales@topscore.school>',
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { error: `Resend ${res.status}: ${err}` };
    }

    const data = await res.json();
    return { id: data.id };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

function evaluateCondition(
  condition: Record<string, unknown>,
  profile: Record<string, unknown>,
  vars: Record<string, string>,
): boolean {
  for (const [key, value] of Object.entries(condition)) {
    if (key === 'tier' && profile.tier !== value) return false;
    if (key === 'tier_not' && profile.tier === value) return false;
    if (key === 'tier_in' && Array.isArray(value) && !value.includes(profile.tier)) return false;
    if (key === 'role' && profile.role !== value) return false;
    if (key === 'role_not' && profile.role === value) return false;
    if (key === 'min_questions') {
      if (parseInt(vars.questions_completed || '0') < (value as number)) return false;
    }
    if (key === 'has_reviewed_not' && value === true) {
      if (vars.has_reviewed === 'true') return false;
    }
    if (key === 'has_reviewed' && value === true) {
      if (vars.has_reviewed !== 'true') return false;
    }
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // 1. Fetch queued emails that are due
    const { data: pendingEmails, error: fetchErr } = await supabase
      .from('email_sends')
      .select(`
        id,
        user_id,
        sequence_id,
        step_id
      `)
      .eq('status', 'queued')
      .eq('cancelled', false)
      .lte('scheduled_at', new Date().toISOString())
      .limit(BATCH_SIZE);

    if (fetchErr) throw fetchErr;
    if (!pendingEmails || pendingEmails.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        // 2. Get user email, profile, and template vars
        const [authRes, profileRes, varsRes] = await Promise.all([
          supabase.auth.admin.getUserById(email.user_id),
          supabase.from('profiles').select('full_name, role').eq('id', email.user_id).single(),
          supabase.rpc('get_email_template_vars', { p_user_id: email.user_id }),
        ]);

        const userEmail = authRes.data?.user?.email;
        if (!userEmail) {
          await supabase.from('email_sends').update({
            cancelled: true,
            cancel_reason: 'user_not_found',
          }).eq('id', email.id);
          skipped++;
          continue;
        }

        // 3. Check unsubscribe
        const { data: unsub } = await supabase
          .from('email_unsubscribes')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (unsub) {
          await supabase.from('email_sends').update({
            cancelled: true,
            cancel_reason: 'unsubscribed',
          }).eq('id', email.id);
          skipped++;
          continue;
        }

        // 4. Build template variables from RPC
        const unsubQs = await signUrl(email.user_id);
        const unsubscribeUrl = `${SUPABASE_URL}/functions/v1/unsubscribe?${unsubQs}`;
        const templateVars = (varsRes.data as Record<string, unknown>) || {};
        const vars: Record<string, string> = {};
        for (const [k, v] of Object.entries(templateVars)) {
          vars[k] = String(v ?? '');
        }
        vars.unsubscribe_url = unsubscribeUrl;

        // Rating URLs for email #5 star ratings
        for (let i = 1; i <= 5; i++) {
          const rateQs = await signUrl(email.user_id, { score: String(i) });
          vars[`rating_url_${i}`] = `${SUPABASE_URL}/functions/v1/rate-experience?${rateQs}`;
        }

        // Review page URL for email #6 (signed)
        const reviewQs = await signUrl(email.user_id);
        vars.review_site_url = `https://topscore.school/caliber/review?${reviewQs}`;

        // 5. Get step details
        const { data: step } = await supabase
          .from('email_sequence_steps')
          .select('subject, body_html, send_condition')
          .eq('id', email.step_id)
          .single();

        if (!step) {
          await supabase.from('email_sends').update({
            cancelled: true,
            cancel_reason: 'step_not_found',
          }).eq('id', email.id);
          skipped++;
          continue;
        }

        // 6. Check send_condition
        if (step.send_condition) {
          try {
            const condition = JSON.parse(step.send_condition);
            if (!evaluateCondition(condition, profileRes.data || {}, vars)) {
              await supabase.from('email_sends').update({
                cancelled: true,
                cancel_reason: 'condition_not_met',
              }).eq('id', email.id);
              skipped++;
              continue;
            }
          } catch {
            // Invalid JSON condition — skip safety
            console.error(`Invalid send_condition for step ${email.step_id}`);
          }
        }

        // 7. Process template
        const subject = replaceTemplateVars(step.subject, vars);
        let bodyHtml = processConditionals(step.body_html, vars);
        bodyHtml = replaceTemplateVars(bodyHtml, vars);
        const html = wrapInBrandedLayout(bodyHtml, unsubscribeUrl);

        // 7. Send via Resend
        const result = await sendViaResend(userEmail, subject, html);

        if (result.error) {
          await supabase.from('email_sends').update({
            status: 'failed',
          }).eq('id', email.id);
          console.error(`Failed to send email ${email.id}: ${result.error}`);
          failed++;
          continue;
        }

        // 8. Mark as sent
        await supabase.from('email_sends').update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          resend_message_id: result.id || null,
        }).eq('id', email.id);

        sent++;
      } catch (emailErr) {
        console.error(`Error processing email ${email.id}:`, emailErr);
        await supabase.from('email_sends').update({
          status: 'failed',
        }).eq('id', email.id);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ processed: pendingEmails.length, sent, skipped, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('Process email sequences error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
