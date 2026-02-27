import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { token, student_email, buyer_name } = await req.json();

    if (!token || !student_email) {
      return new Response(
        JSON.stringify({ error: "Missing token or student_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student_email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the token exists and is unused
    const { data: tokenData, error: tokenError } = await supabase
      .from("activation_tokens")
      .select("status, expires_at")
      .eq("token", token)
      .eq("status", "unused")
      .maybeSingle();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: "Invalid or already used token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save the student email to the token record
    await supabase
      .from("activation_tokens")
      .update({ student_email, updated_at: new Date().toISOString() })
      .eq("token", token);

    // Send the activation email
    const activationUrl = `https://topscore.school/sat-prep/activate/${token}`;
    const fromName = buyer_name || "Your parent";

    const html = activationEmailTemplate(activationUrl, fromName);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Caliber <support@topscore.school>",
        to: [student_email],
        subject: "You've been gifted Caliber!",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ sent: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function activationEmailTemplate(
  activationUrl: string,
  fromName: string
): string {
  const BRAND_DARK = "#08090d";
  const BRAND_GOLD = "#c8a24e";
  const BRAND_GOLD_LIGHT = "#faf6eb";
  const LOGO_URL = "https://topscore.school/lp-images/caliber-icon-01.png";

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
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1e293b;">You've been gifted Caliber!</h1>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
                ${fromName} just got you <strong>Caliber</strong> &mdash; the complete SAT study app with 2,000+ practice questions, adaptive mock tests, boss fights, and more.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                Create your account to get started. It takes about 30 seconds.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
                <tr>
                  <td style="background-color:${BRAND_DARK};border-radius:8px;">
                    <a href="${activationUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:${BRAND_GOLD};text-decoration:none;border-radius:8px;">
                      Create My Account
                    </a>
                  </td>
                </tr>
              </table>

              <div style="background-color:${BRAND_GOLD_LIGHT};border-radius:8px;padding:16px;margin-top:8px;">
                <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">
                  <strong>What you get:</strong> 2,143 real SAT questions, 8 study modes, full adaptive mock tests, spaced repetition, XP &amp; badges, boss fights, and a built-in strategy guide. All yours &mdash; no subscription, no expiration.
                </p>
              </div>

              <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
                This link can only be used once and expires in 30 days. If you have any issues, reply to this email for help.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                Caliber &mdash; by TopScore
              </p>
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                <a href="https://topscore.school/caliber" style="color:#94a3b8;text-decoration:underline;">topscore.school/caliber</a>
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
