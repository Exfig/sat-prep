// Supabase Edge Function: send-digest
// Called by pg_cron daily at 8 AM UTC
// Sends personalized progress digest emails to opted-in users via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { progressDigestEmail } from '../_shared/email-templates.ts';
import type { DigestData } from '../_shared/email-templates.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Authorization check for pg_cron/service-role calls
function isAuthorized(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;
  const token = authHeader.replace('Bearer ', '');
  return token === SUPABASE_SERVICE_ROLE_KEY;
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

  if (!isAuthorized(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch users with digest enabled, matching frequency, and due for a digest
    const now = new Date();
    const { data: eligibleUsers, error: fetchError } = await supabase
      .from('email_preferences')
      .select(`
        id,
        digest_frequency,
        last_digest_sent_at
      `)
      .eq('digest_enabled', true);

    if (fetchError) throw fetchError;
    if (!eligibleUsers || eligibleUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Filter by frequency: daily users always qualify, weekly users only on Mondays
    const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon
    const usersToEmail = eligibleUsers.filter((u) => {
      if (u.digest_frequency === 'daily') return true;
      if (u.digest_frequency === 'weekly' && dayOfWeek === 1) return true;
      return false;
    });

    let sentCount = 0;

    for (const userPref of usersToEmail) {
      try {
        // Get user email from auth
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
          userPref.id,
        );
        if (authError || !authUser?.user?.email) continue;

        // Get user profile for name
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', userPref.id)
          .single();

        // Get gamification state for XP and streak
        const { data: gamState } = await supabase
          .from('gamification_state')
          .select('xp, study_streak')
          .eq('id', userPref.id)
          .single();

        // Count recent attempts for the period
        const periodStart = new Date(now);
        if (userPref.digest_frequency === 'weekly') {
          periodStart.setUTCDate(periodStart.getUTCDate() - 7);
        } else {
          periodStart.setUTCDate(periodStart.getUTCDate() - 1);
        }

        const { data: recentAttempts } = await supabase
          .from('attempts')
          .select('correct')
          .eq('user_id', userPref.id)
          .gte('created_at', periodStart.toISOString());

        const questionsThisPeriod = recentAttempts?.length ?? 0;
        const correctThisPeriod = recentAttempts?.filter((a) => a.correct).length ?? 0;
        const accuracyThisPeriod =
          questionsThisPeriod > 0 ? Math.round((correctThisPeriod / questionsThisPeriod) * 100) : 0;

        const digestData: DigestData = {
          userName: profile?.full_name || '',
          xp: gamState?.xp ?? 0,
          studyStreak: gamState?.study_streak ?? 0,
          questionsThisPeriod,
          accuracyThisPeriod,
          periodLabel: userPref.digest_frequency === 'weekly' ? 'this week' : 'today',
        };

        const html = progressDigestEmail(digestData);
        const subject =
          userPref.digest_frequency === 'weekly'
            ? 'Your Weekly SAT Prep Report — TopScore'
            : 'Your Daily SAT Prep Report — TopScore';

        await sendEmail(authUser.user.email, subject, html);

        // Update last_digest_sent_at
        await supabase
          .from('email_preferences')
          .update({ last_digest_sent_at: now.toISOString() })
          .eq('id', userPref.id);

        sentCount++;
      } catch (userError) {
        console.error(`Failed to send digest to user ${userPref.id}:`, userError);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Digest function error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
