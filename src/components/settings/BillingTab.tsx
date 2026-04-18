import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { useCredits } from "@/hooks/useCredits";
import { PLANS, type PlanId } from "@/lib/plans";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES: Record<PlanId, string[]> = {
  monthly: [
    "Accès Khôlles, Examens Blancs, Annales",
    "4 000 crédits IA par mois",
    "Annulable à tout moment",
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

export function BillingTab() {
  const { isSubscribed, startCheckout, openCustomerPortal } = useSubscription();
  const { balance, setPurchaseModalOpen } = useCredits();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSubscribe = async (plan: PlanId) => {
    setLoadingPlan(plan);
    try { await startCheckout({ priceId: PLANS[plan].priceId }); }
    finally { setLoadingPlan(null); }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try { await openCustomerPortal(); } finally { setPortalLoading(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-warning" />
            Votre abonnement
          </CardTitle>
          <CardDescription>
            {isSubscribed ? "Vous êtes Premium. Merci de soutenir la prépa !" : "Passez Premium pour débloquer toutes les fonctionnalités."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge variant={isSubscribed ? "default" : "outline"} className="text-sm py-1.5 px-3">
            {isSubscribed ? "Premium actif" : "Plan Freemium"}
          </Badge>
          <span className="text-sm text-muted-foreground">Crédits IA : <span className="font-semibold text-foreground">{balance}</span></span>
          {isSubscribed && (
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Gérer mon abonnement
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Choisissez votre plan</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANS) as PlanId[]).map((id) => {
            const p = PLANS[id];
            return (
              <Card
                key={id}
                className={cn(
                  "relative flex flex-col",
                  p.highlight && "border-primary shadow-md ring-1 ring-primary/30"
                )}
              >
                {p.badge && (
                  <div className={cn(
                    "absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full",
                    p.highlight ? "bg-primary text-primary-foreground" : "bg-warning text-warning-foreground"
                  )}>
                    {p.badge}
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-bold">{(p.amountCents / 100).toFixed(p.amountCents % 100 === 0 ? 0 : 2)} €</span>
                    <span className="text-sm text-muted-foreground">{p.intervalLabel}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.monthlyEquivalent}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-2.5">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Zap className="h-4 w-4" /> {p.credits}
                  </div>
                  <ul className="space-y-1.5">
                    {FEATURES[id].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button
                    className="w-full"
                    variant={p.highlight ? "default" : "outline"}
                    onClick={() => handleSubscribe(id)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubscribed ? "Changer pour ce plan" : "Choisir ce plan"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Packs de crédits</CardTitle>
          <CardDescription>Achetez des crédits IA ponctuels sans abonnement (utilisables à vie).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setPurchaseModalOpen(true)}>
            Voir les packs
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
