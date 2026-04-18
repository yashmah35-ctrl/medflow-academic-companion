import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionContextType {
  isSubscribed: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  startCheckout: (opts?: { priceId?: string; affiliateCode?: string }) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  loading: true,
  checkSubscription: async () => {},
  startCheckout: async () => {},
  openCustomerPortal: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setIsSubscribed(false);
      setLoading(false);
      return;
    }

    // Admin always has access
    if (isAdmin) {
      setIsSubscribed(true);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: {},
      });
      if (!error && data) {
        setIsSubscribed(data.subscribed === true);
      }
    } catch (e) {
      console.error("Subscription check failed:", e);
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Check on URL param after Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      // Small delay for Stripe webhook to process
      setTimeout(() => checkSubscription(), 2000);
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkSubscription]);

  const startCheckout = useCallback(async (opts?: { priceId?: string; affiliateCode?: string }) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          returnUrl: window.location.origin,
          priceId: opts?.priceId,
          affiliateCode: opts?.affiliateCode,
        },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error("Checkout error:", e);
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", { body: {} });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("Portal error:", e);
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, loading, checkSubscription, startCheckout, openCustomerPortal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
