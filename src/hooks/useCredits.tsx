import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const CHAT_CREDIT_COST = 25;

interface CreditsContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
  setBalance: (n: number) => void;
  buyPack: (packId: "pack_50" | "pack_100" | "pack_150" | "pack_4000") => Promise<void>;
  purchaseModalOpen: boolean;
  setPurchaseModalOpen: (b: boolean) => void;
}

const CreditsContext = createContext<CreditsContextType>({
  balance: 0,
  loading: true,
  refresh: async () => {},
  setBalance: () => {},
  buyPack: async () => {},
  purchaseModalOpen: false,
  setPurchaseModalOpen: () => {},
});

export function CreditsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setBalance(0); setLoading(false); return;
    }
    try {
      const { data, error } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!error && data) setBalance(data.balance);
      else if (!data) {
        // Crée la ligne si inexistante
        await supabase.from("user_credits").insert({ user_id: user.id, balance: 0 });
        setBalance(0);
      }
    } catch (e) {
      console.error("refresh credits error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Réclamation crédit quotidien + chargement initial
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: claimed } = await supabase.rpc("claim_daily_credit", { _user_id: user.id });
        if (claimed !== null && claimed !== undefined) {
          toast.success("🎁 +1 crédit quotidien !");
        }
      } catch (e) { console.error("daily claim error:", e); }
      await refresh();
    })();
  }, [user, refresh]);

  // Realtime sur user_credits
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`credits-${user.id}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "user_credits",
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        if (payload.new?.balance !== undefined) setBalance(payload.new.balance);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Vérification après retour Stripe (achat de crédits)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("credits_purchase");
    const sessionId = params.get("session_id");
    if (status === "success" && sessionId) {
      (async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-credit-purchase", {
            body: { sessionId },
          });
          if (!error && data?.paid) {
            toast.success(`✨ +${data.credits} crédits ajoutés !`);
            refresh();
          } else if (data?.already_credited) {
            refresh();
          }
        } catch (e) { console.error(e); }
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete("credits_purchase");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url.toString());
      })();
    } else if (status === "cancel") {
      toast.info("Achat annulé");
      const url = new URL(window.location.href);
      url.searchParams.delete("credits_purchase");
      window.history.replaceState({}, "", url.toString());
    }
  }, [user, refresh]);

  const buyPack = useCallback(async (packId: "pack_50" | "pack_100" | "pack_150" | "pack_4000") => {
    try {
      const { data, error } = await supabase.functions.invoke("purchase-credits", {
        body: { packId, returnUrl: window.location.origin },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("buyPack error:", e);
      toast.error("Erreur lors de l'achat");
    }
  }, []);

  return (
    <CreditsContext.Provider value={{ balance, loading, refresh, setBalance, buyPack, purchaseModalOpen, setPurchaseModalOpen }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
