// Shared branded email templates for Caliber (TopScore SAT Prep)
// All templates use inline CSS for maximum email client compatibility

const BRAND_DARK = '#08090d';
const BRAND_GOLD = '#c8a24e';
const BRAND_GOLD_LIGHT = '#faf6eb';
const LOGO_URL = 'https://topscore.school/lp-images/caliber-icon-01.png';

function baseLayout(content: string): string {
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
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_DARK};padding:24px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Caliber" width="160" style="display:block;margin:0 auto;max-width:160px;height:auto;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                Caliber &mdash; by TopScore
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                <a href="https://topscore.school/caliber/dashboard" style="color:#94a3b8;text-decoration:underline;">Visit App</a>
                &nbsp;&middot;&nbsp;
                <a href="https://topscore.school/caliber/settings" style="color:#94a3b8;text-decoration:underline;">Email Preferences</a>
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

function ctaButton(text: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="background-color:${BRAND_DARK};border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:${BRAND_GOLD};text-decoration:none;border-radius:8px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;
}

export function welcomeEmail(confirmUrl: string, otp: string): string {
  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">Welcome to Caliber!</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      You're one step away from starting your SAT prep journey. Confirm your email address to get started.
    </p>
    ${ctaButton('Confirm My Email', confirmUrl)}
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or enter this code manually:
    </p>
    <p style="margin:0 0 24px;font-size:28px;font-weight:700;color:${BRAND_GOLD};text-align:center;letter-spacing:4px;">
      ${otp}
    </p>
    <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;margin-top:8px;">
      <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">
        <strong>What's next?</strong> Once confirmed, you'll have access to 2,000+ practice questions, adaptive mock tests, and personalized study plans across all SAT sections.
      </p>
    </div>
  `);
}

export function passwordResetEmail(resetUrl: string, otp: string): string {
  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">Reset Your Password</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    ${ctaButton('Reset Password', resetUrl)}
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or enter this code manually:
    </p>
    <p style="margin:0 0 24px;font-size:28px;font-weight:700;color:${BRAND_GOLD};text-align:center;letter-spacing:4px;">
      ${otp}
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't request this, you can safely ignore this email. Your password won't change.
    </p>
  `);
}

export function emailChangeEmail(confirmUrl: string, otp: string): string {
  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">Confirm Email Change</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
      You requested to change your email address. Please confirm by clicking the button below.
    </p>
    ${ctaButton('Confirm New Email', confirmUrl)}
    <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;">
      Or enter this code manually:
    </p>
    <p style="margin:0 0 24px;font-size:28px;font-weight:700;color:${BRAND_GOLD};text-align:center;letter-spacing:4px;">
      ${otp}
    </p>
    <p style="margin:0;font-size:13px;color:#94a3b8;">
      If you didn't request this change, please contact support immediately.
    </p>
  `);
}

export interface DigestData {
  userName: string;
  xp: number;
  studyStreak: number;
  questionsThisPeriod: number;
  accuracyThisPeriod: number;
  periodLabel: string; // "this week" or "today"
}

export function progressDigestEmail(data: DigestData): string {
  const streakEmoji = data.studyStreak >= 7 ? '&#128293;' : data.studyStreak >= 3 ? '&#11088;' : '&#128170;';
  const accuracyColor = data.accuracyThisPeriod >= 80 ? '#16a34a' : data.accuracyThisPeriod >= 60 ? '#d97706' : '#dc2626';

  return baseLayout(`
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">Your Progress Report</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
      Hey ${data.userName || 'there'}! Here's how you did ${data.periodLabel}.
    </p>

    <!-- Stats Grid -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding:4px;">
          <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Study Streak</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_GOLD};">${streakEmoji} ${data.studyStreak}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">days</p>
          </div>
        </td>
        <td width="50%" style="padding:4px;">
          <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Total XP</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_GOLD};">${data.xp.toLocaleString()}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">points</p>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:4px;">
          <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Questions</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:${BRAND_GOLD};">${data.questionsThisPeriod}</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${data.periodLabel}</p>
          </div>
        </td>
        <td width="50%" style="padding:4px;">
          <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b;">Accuracy</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:${accuracyColor};">${data.accuracyThisPeriod}%</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">${data.periodLabel}</p>
          </div>
        </td>
      </tr>
    </table>

    ${data.questionsThisPeriod === 0
      ? `<div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin-bottom:16px;">
          <p style="margin:0;font-size:14px;color:#92400e;line-height:1.5;">
            No questions answered ${data.periodLabel}. Jump back in to keep your streak alive!
          </p>
        </div>`
      : data.accuracyThisPeriod >= 80
        ? `<p style="margin:0 0 16px;font-size:15px;color:#16a34a;font-weight:600;">Great work! You're crushing it. Keep it up!</p>`
        : `<p style="margin:0 0 16px;font-size:15px;color:#475569;">Keep practicing &mdash; consistency is the key to SAT success.</p>`
    }

    ${ctaButton('Continue Studying', 'https://topscore.school/caliber/dashboard')}
  `);
}
