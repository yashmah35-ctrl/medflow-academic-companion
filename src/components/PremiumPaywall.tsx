import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, CheckCircle2, Sparkles, Loader2, Tag } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PremiumPaywallProps {
  children: React.ReactNode;
}

export function PremiumPaywall({ children }: PremiumPaywallProps) {
  const { isSubscribed, loading } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isSubscribed) return <>{children}</>;

  return <UpgradeWall />;
}

function usePromoCode() {
  const [promoCode, setPromoCode] = useState("");
  const [promoValid, setPromoValid] = useState<boolean | null>(null);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoFinalPrice, setPromoFinalPrice] = useState(10);
  const [validating, setValidating] = useState(false);

  const validateCode = async () => {
    if (!promoCode.trim()) return;
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-affiliate", {
        body: { code: promoCode.trim() },
      });
      if (!error && data?.valid) {
        setPromoValid(true);
        setPromoDiscount(data.discount_amount);
        setPromoFinalPrice(data.final_price);
      } else {
        setPromoValid(false);
      }
    } catch {
      setPromoValid(false);
    }
    setValidating(false);
  };

  return { promoCode, setPromoCode, promoValid, promoDiscount, promoFinalPrice, validating, validateCode };
}

function UpgradeWall() {
  const { startCheckout } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);
  const promo = usePromoCode();

  const handleSubscribe = async () => {
    setCheckingOut(true);
    try {
      const body: any = { returnUrl: window.location.origin };
      if (promo.promoValid && promo.promoCode) {
        body.affiliateCode = promo.promoCode.trim();
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
    setCheckingOut(false);
  };

  const features = [
    "Cours La Prépa du Peuple",
    "Modules interactifs (Quiz, Tableau Périodique…)",
    "Khôlles illimitées",
    "Annales complètes",
    "Examens blancs",
    "Cahier d'erreurs intelligent",
  ];

  const displayPrice = promo.promoValid ? promo.promoFinalPrice : 10;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Crown className="h-8 w-8 text-white" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">MedFlow Premium</h2>
          <p className="text-muted-foreground text-sm">
            Débloque toutes les fonctionnalités pour réussir ta PASS/L.AS
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6 space-y-4 text-left">
          <div className="flex items-baseline justify-center gap-1">
            {promo.promoValid && (
              <span className="text-xl text-muted-foreground line-through mr-2">10€</span>
            )}
            <span className="text-4xl font-bold">{displayPrice}€</span>
            <span className="text-muted-foreground">/mois</span>
          </div>

          {promo.promoValid && (
            <div className="text-center">
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full">
                <Tag className="h-3.5 w-3.5" />
                Code {promo.promoCode.toUpperCase()} : -{promo.promoDiscount}€/mois
              </span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Promo code input */}
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" /> Code promo
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: ALEX50"
              value={promo.promoCode}
              onChange={e => { promo.setPromoCode(e.target.value); if (promo.promoValid !== null) promo.setPromoCode(e.target.value); }}
              className="uppercase font-mono"
            />
            <Button
              variant="outline"
              onClick={promo.validateCode}
              disabled={promo.validating || !promo.promoCode.trim()}
            >
              {promo.validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Appliquer"}
            </Button>
          </div>
          {promo.promoValid === false && (
            <p className="text-xs text-destructive">Code invalide ou expiré</p>
          )}
        </div>

        <Button
          onClick={handleSubscribe}
          disabled={checkingOut}
          className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
        >
          {checkingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              S'abonner — {displayPrice}€/mois
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Annulation possible à tout moment. Paiement sécurisé via Stripe.
        </p>
      </div>
    </div>
  );
}

/** Modal version for inline use */
export function PremiumModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { startCheckout } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);
  const promo = usePromoCode();

  const handleSubscribe = async () => {
    setCheckingOut(true);
    try {
      const body: any = { returnUrl: window.location.origin };
      if (promo.promoValid && promo.promoCode) {
        body.affiliateCode = promo.promoCode.trim();
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
    setCheckingOut(false);
  };

  const displayPrice = promo.promoValid ? promo.promoFinalPrice : 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">Contenu Premium</DialogTitle>
          <DialogDescription className="text-center">
            Ce contenu est réservé aux abonnés MedFlow Premium.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-baseline justify-center gap-1 py-2">
          {promo.promoValid && <span className="text-lg text-muted-foreground line-through mr-1">10€</span>}
          <span className="text-3xl font-bold">{displayPrice}€</span>
          <span className="text-muted-foreground">/mois</span>
        </div>

        {promo.promoValid && (
          <p className="text-center text-sm text-emerald-600 font-medium">
            Code {promo.promoCode.toUpperCase()} appliqué !
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Code promo"
            value={promo.promoCode}
            onChange={e => promo.setPromoCode(e.target.value)}
            className="uppercase font-mono"
          />
          <Button variant="outline" size="sm" onClick={promo.validateCode} disabled={promo.validating || !promo.promoCode.trim()}>
            {promo.validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "OK"}
          </Button>
        </div>
        {promo.promoValid === false && <p className="text-xs text-destructive">Code invalide</p>}

        <Button
          onClick={handleSubscribe}
          disabled={checkingOut}
          className="w-full h-11 font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-lg shadow-amber-500/25 active:scale-[0.98]"
        >
          {checkingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              S'abonner — {displayPrice}€/mois
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Annulation à tout moment · Paiement sécurisé
        </p>
      </DialogContent>
    </Dialog>
  );
}
