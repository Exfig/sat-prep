import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { token, email } = await req.json();

    if (!token || !email) {
      return new Response(
        JSON.stringify({ error: "Missing token or email", claimed: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to verify user", claimed: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const user = userData.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (!user) {
      return new Response(
        JSON.stringify({ error: "User not found", claimed: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atomic claim: only update if status is still 'unused' and not expired
    // This prevents race conditions where two people try to claim simultaneously
    const { data, error } = await supabase
      .from("activation_tokens")
      .update({
        status: "used",
        claimed_by: user.id,
        claimed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("token", token)
      .eq("status", "unused")
      .gt("expires_at", new Date().toISOString())
      .select()
      .maybeSingle();

    if (error) {
      console.error("Token claim error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to claim token", claimed: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Copy buyer_name from token to profile as parent_name
    if (data?.buyer_name) {
      await supabase
        .from("profiles")
        .update({ parent_name: data.buyer_name })
        .eq("id", user.id);
    }

    if (!data) {
      // Token was already used, expired, or doesn't exist
      await supabase
        .rpc("increment_claim_attempts", { token_value: token })
        .catch(() => {});

      return new Response(
        JSON.stringify({
          error: "Token is invalid, already used, or expired",
          claimed: false,
        }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ claimed: true, user_id: user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message, claimed: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
