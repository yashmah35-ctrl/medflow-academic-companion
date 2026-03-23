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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const body = await req.json().catch(() => ({}));
    const returnUrl = body?.returnUrl || req.headers.get("origin") || "https://medflow.app";
    const affiliateCode = body?.affiliateCode || null;

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;

    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    // Check for existing active subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (existingSubs.data.length > 0) {
      return new Response(JSON.stringify({ error: "already_subscribed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    if (!priceId) {
      throw new Error("STRIPE_PRICE_ID is not configured");
    }

    // Handle affiliate code discount
    let couponId: string | undefined;
    let affiliateData: any = null;

    if (affiliateCode) {
      console.log(`[CHECKOUT] Affiliate code provided: ${affiliateCode}`);
      const { data: aff } = await supabaseClient
        .from("affiliates")
        .select("*")
        .eq("code", affiliateCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (aff && aff.discount_amount > 0) {
        affiliateData = aff;
        // Create a one-time coupon in Stripe for this affiliate discount
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(aff.discount_amount * 100), // cents
          currency: "eur",
          duration: "forever",
          name: `Affilié ${aff.code} - ${aff.discount_amount}€ off`,
        });
        couponId = coupon.id;
        console.log(`[CHECKOUT] Created Stripe coupon ${couponId} for ${aff.discount_amount}€ off`);
      }
    }

    const sessionParams: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${returnUrl}/?subscription=success`,
      cancel_url: `${returnUrl}/?subscription=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        ...(affiliateCode ? { affiliate_code: affiliateCode.toUpperCase().trim() } : {}),
      },
    };

    if (couponId) {
      sessionParams.discounts = [{ coupon: couponId }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Record affiliate subscription if applicable
    if (affiliateData) {
      await supabaseClient.from("affiliate_subscriptions").insert({
        affiliate_id: affiliateData.id,
        affiliate_code: affiliateData.code,
        subscriber_user_id: user.id,
        subscriber_email: user.email,
        commission_amount: affiliateData.commission_per_subscriber,
      });

      // Update affiliate stats
      await supabaseClient.from("affiliates").update({
        total_subscribers: affiliateData.total_subscribers + 1,
        total_commission_earned: Number(affiliateData.total_commission_earned) + Number(affiliateData.commission_per_subscriber),
      }).eq("id", affiliateData.id);

      console.log(`[CHECKOUT] Recorded affiliate subscription for ${affiliateData.code}`);
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
