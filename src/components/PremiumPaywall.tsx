import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, CheckCircle2, Sparkles, Loader2, Tag, Zap } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PLANS, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

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

const FEATURES: Record<PlanId, string[]> = {
  monthly: [
    "Cours La Prépa du Peuple",
    "Khôlles, Annales, Examens blancs",
    "4 000 crédits IA / mois",
  ],
  quarterly: [
    "Tous les avantages Premium",
    "15 000 crédits offerts immédiatement",
    "Économisez 2 € sur 3 mois",
  ],
  yearly: [
    "Tous les avantages Premium",
    "Crédits IA illimités toute l'année",
    "≈ 8,25 €/mois (vs 10 €)",
  ],
};

function PlanCards({
  onSelect,
  loadingPlan,
  promoValid,
  promoDiscount,
  promoCode,
}: {
  onSelect: (id: PlanId) => void;
  loadingPlan: PlanId | null;
  promoValid: boolean;
  promoDiscount: number;
  promoCode: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {(Object.keys(PLANS) as PlanId[]).map((id) => {
        const p = PLANS[id];
        const isMonthly = id === "monthly";
        const showPromo = isMonthly && promoValid;
        const finalPrice = showPromo ? (p.amountCents / 100) - promoDiscount : p.amountCents / 100;
        return (
          <div
            key={id}
            className={cn(
              "relative flex flex-col rounded-xl border p-4 text-left bg-card",
              p.highlight && "border-primary ring-1 ring-primary/30 shadow-sm"
            )}
          >
            {p.badge && (
              <div className={cn(
                "absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full whitespace-nowrap",
                p.highlight ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"
              )}>
                {p.badge}
              </div>
            )}
            <div className="text-sm font-semibold">{p.name}</div>
            <div className="flex items-baseline gap-1 mt-1">
              {showPromo && (
                <span className="text-sm text-muted-foreground line-through mr-1">
                  {(p.amountCents / 100).toFixed(0)}€
                </span>
              )}
              <span className="text-2xl font-bold">
                {finalPrice.toFixed(finalPrice % 1 === 0 ? 0 : 2)} €
              </span>
              <span className="text-xs text-muted-foreground">{p.intervalLabel}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{p.monthlyEquivalent}</p>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" /> {p.credits}
            </div>
            <ul className="space-y-1 mt-2 flex-1">
              {FEATURES[id].map((f) => (
                <li key={f} className="flex items-start gap-1.5 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            {showPromo && (
              <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                Code {promoCode.toUpperCase()} : -{promoDiscount}€
              </p>
            )}
            <Button
              size="sm"
              variant={p.highlight ? "default" : "outline"}
              className="mt-3 w-full"
              onClick={() => onSelect(id)}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Choisir
                </>
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

function PromoCodeBox({ promo }: { promo: ReturnType<typeof usePromoCode> }) {
  return (
    <div className="bg-card border rounded-xl p-4 space-y-2">
      <p className="text-sm font-medium text-foreground flex items-center justify-center gap-2">
        <Tag className="h-4 w-4" /> Code promo (Mensuel uniquement)
      </p>
      <div className="flex gap-2">
        <Input
          placeholder="Ex: ALEX50"
          value={promo.promoCode}
          onChange={(e) => promo.setPromoCode(e.target.value)}
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
      {promo.promoValid && (
        <p className="text-xs text-emerald-600 font-medium">
          Code appliqué : -{promo.promoDiscount}€/mois sur le plan Mensuel
        </p>
      )}
    </div>
  );
}

function useCheckoutHandler(promo: ReturnType<typeof usePromoCode>) {
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  const handleSubscribe = async (planId: PlanId) => {
    setLoadingPlan(planId);
    try {
      const body: any = {
        returnUrl: window.location.origin,
        priceId: PLANS[planId].priceId,
      };
      // Code promo applicable uniquement au plan mensuel
      if (planId === "monthly" && promo.promoValid && promo.promoCode) {
        body.affiliateCode = promo.promoCode.trim();
      }
      const { data, error } = await supabase.functions.invoke("create-checkout", { body });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e) {
      console.error("Checkout error:", e);
    }
    setLoadingPlan(null);
  };

  return { loadingPlan, handleSubscribe };
}

function UpgradeWall() {
  const promo = usePromoCode();
  const { loadingPlan, handleSubscribe } = useCheckoutHandler(promo);

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4 py-8">
      <div className="max-w-3xl w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Crown className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">MedFlow Premium</h2>
          <p className="text-muted-foreground text-sm">
            Débloque toutes les fonctionnalités pour réussir ta PASS/L.AS
          </p>
        </div>

        <PlanCards
          onSelect={handleSubscribe}
          loadingPlan={loadingPlan}
          promoValid={!!promo.promoValid}
          promoDiscount={promo.promoDiscount}
          promoCode={promo.promoCode}
        />

        <PromoCodeBox promo={promo} />

        <p className="text-xs text-muted-foreground text-center">
          Annulation possible à tout moment. Paiement sécurisé via Stripe.
        </p>
      </div>
    </div>
  );
}

/** Modal version for inline use */
export function PremiumModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const promo = usePromoCode();
  const { loadingPlan, handleSubscribe } = useCheckoutHandler(promo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">Contenu Premium</DialogTitle>
          <DialogDescription className="text-center">
            Choisis le plan qui te convient pour débloquer MedFlow Premium.
          </DialogDescription>
        </DialogHeader>

        <PlanCards
          onSelect={handleSubscribe}
          loadingPlan={loadingPlan}
          promoValid={!!promo.promoValid}
          promoDiscount={promo.promoDiscount}
          promoCode={promo.promoCode}
        />

        <PromoCodeBox promo={promo} />

        <p className="text-xs text-muted-foreground text-center">
          Annulation à tout moment · Paiement sécurisé
        </p>
      </DialogContent>
    </Dialog>
  );
}
