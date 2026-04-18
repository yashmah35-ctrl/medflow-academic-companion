// Crée une session Stripe Checkout one-time pour acheter un pack de crédits.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PACKS: Record<string, { priceId: string; credits: number; amountCents: number }> = {
  pack_50:   { priceId: "price_1TNfKo19EBNXe60DKk0Ruu6Y", credits: 50,   amountCents: 50 },
  pack_100:  { priceId: "price_1TNfL819EBNXe60DfG0W2Gf2", credits: 100,  amountCents: 100 },
  pack_150:  { priceId: "price_1TNfLL19EBNXe60DL1M198He", credits: 150,  amountCents: 150 },
  pack_4000: { priceId: "price_1TNfLq19EBNXe60D5CL11GtB", credits: 4000, amountCents: 4000 },
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
    if (userError || !userData.user?.email) throw new Error("Utilisateur non authentifié");
    const user = userData.user;

    const { packId, returnUrl } = await req.json();
    const pack = PACKS[packId];
    if (!pack) throw new Error(`Pack inconnu: ${packId}`);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Récupère/crée customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const origin = returnUrl || req.headers.get("origin") || "https://medflow-laprepadupeuple.org";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: pack.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/?credits_purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?credits_purchase=cancel`,
      metadata: {
        user_id: user.id,
        pack_id: packId,
        credits: String(pack.credits),
      },
    });

    // Enregistre l'achat en pending
    await adminClient.from("credit_purchases").insert({
      user_id: user.id,
      stripe_session_id: session.id,
      pack_credits: pack.credits,
      amount_paid_cents: pack.amountCents,
      status: "pending",
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("purchase-credits error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
