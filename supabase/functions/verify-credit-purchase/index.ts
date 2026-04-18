// Vérifie une session Stripe après retour, et crédite l'utilisateur si payée (idempotent).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Auth header missing");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Utilisateur non authentifié");
    const user = userData.user;

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId manquant");

    // Idempotence : si déjà completed, retourne directement
    const { data: existing } = await adminClient
      .from("credit_purchases")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) throw new Error("Achat introuvable");
    if (existing.status === "completed") {
      return new Response(JSON.stringify({ already_credited: true, credits: existing.pack_credits }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Crédite
    const { data: newBalance, error: rpcError } = await adminClient.rpc("add_purchased_credits", {
      _user_id: user.id,
      _amount: existing.pack_credits,
      _stripe_session_id: sessionId,
    });
    if (rpcError) throw rpcError;

    await adminClient
      .from("credit_purchases")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", existing.id);

    return new Response(JSON.stringify({ paid: true, credits: existing.pack_credits, new_balance: newBalance }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-credit-purchase error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
