import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export async function getStripeSecretKey(): Promise<string> {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { data, error } = await supabaseClient
      .from('app_settings')
      .select('value')
      .eq('key', 'stripe_mode')
      .single();

    if (error) {
      console.log("[STRIPE-CONFIG] Error fetching mode, defaulting to test:", error.message);
      return Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY") || "";
    }

    const mode = data?.value || 'test';
    console.log("[STRIPE-CONFIG] Using Stripe mode:", mode);

    if (mode === 'live') {
      const liveKey = Deno.env.get("STRIPE_SECRET_KEY_LIVE");
      if (!liveKey) {
        console.error("[STRIPE-CONFIG] STRIPE_SECRET_KEY_LIVE not set, falling back to test");
        return Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY") || "";
      }
      return liveKey;
    }

    return Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY") || "";
  } catch (error) {
    console.error("[STRIPE-CONFIG] Unexpected error:", error);
    return Deno.env.get("STRIPE_SECRET_KEY_TEST") || Deno.env.get("STRIPE_SECRET_KEY") || "";
  }
}
