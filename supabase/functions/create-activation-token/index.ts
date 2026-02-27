import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;

// Generate a URL-safe random token
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { stripe_checkout_session_id } = await req.json();

    if (!stripe_checkout_session_id) {
      return new Response(
        JSON.stringify({ error: "Missing stripe_checkout_session_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the Stripe session is real and paid
    const stripeRes = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${stripe_checkout_session_id}`,
      {
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        },
      }
    );

    if (!stripeRes.ok) {
      return new Response(
        JSON.stringify({ error: "Invalid Stripe session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripeRes.json();

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check for idempotency — don't create duplicate tokens for the same payment
    const { data: existing } = await supabase
      .from("activation_tokens")
      .select("token")
      .eq("stripe_checkout_session_id", stripe_checkout_session_id)
      .maybeSingle();

    if (existing) {
      // Return the existing token (idempotent)
      return new Response(
        JSON.stringify({
          token: existing.token,
          activation_url: `https://topscore.school/sat-prep/activate/${existing.token}`,
          already_existed: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get buyer name: try customer_details first, then cardholder name from payment method
    let buyerName = session.customer_details?.name || null;
    if (!buyerName && session.payment_intent) {
      try {
        const piRes = await fetch(
          `https://api.stripe.com/v1/payment_intents/${session.payment_intent}?expand[]=payment_method`,
          { headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` } }
        );
        if (piRes.ok) {
          const pi = await piRes.json();
          buyerName = pi.payment_method?.billing_details?.name || null;
        }
      } catch {
        // Non-critical — proceed without buyer name
      }
    }

    // Create the activation token
    const token = generateToken();

    const { data, error } = await supabase
      .from("activation_tokens")
      .insert({
        token,
        stripe_checkout_session_id: stripe_checkout_session_id,
        stripe_payment_intent_id: session.payment_intent,
        buyer_email: session.customer_details?.email || session.customer_email,
        buyer_name: buyerName,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create activation token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create activation token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        token: data.token,
        activation_url: `https://topscore.school/sat-prep/activate/${data.token}`,
        expires_at: data.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
