import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ subscribed: false, error: "No auth header" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      await adminClient.from("subscriptions").upsert({
        user_id: user.id,
        status: "inactive",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    const isActive = subscriptions.data.length > 0;
    const sub = subscriptions.data[0];
    const periodStartIso = sub ? new Date(sub.current_period_start * 1000).toISOString() : null;

    await adminClient.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customers.data[0].id,
      stripe_subscription_id: sub?.id || null,
      status: isActive ? "active" : "inactive",
      current_period_start: periodStartIso,
      current_period_end: sub ? new Date(sub.current_period_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Reset crédits à 4000 si abonnement actif et nouvelle période
    if (isActive && periodStartIso) {
      const { data: newBalance, error: rpcError } = await adminClient.rpc("reset_subscription_credits", {
        _user_id: user.id,
        _period_start: periodStartIso,
      });
      if (rpcError) console.error("reset_subscription_credits error:", rpcError);
      else console.log(`[check-subscription] credits reset for ${user.id}: balance=${newBalance}`);
    }

    return new Response(JSON.stringify({
      subscribed: isActive,
      subscription: isActive ? {
        id: sub.id,
        status: sub.status,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      } : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Check subscription error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
