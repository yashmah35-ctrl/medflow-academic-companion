import { useSubscription } from "@/hooks/useSubscription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

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

function UpgradeWall() {
  const { startCheckout } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleSubscribe = async () => {
    setCheckingOut(true);
    await startCheckout();
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
            <span className="text-4xl font-bold">10€</span>
            <span className="text-muted-foreground">/mois</span>
          </div>

          <div className="space-y-3 pt-2">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
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
              S'abonner à MedFlow Premium
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

/** Modal version for inline use (e.g. locking a specific course) */
export function PremiumModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { startCheckout } = useSubscription();
  const [checkingOut, setCheckingOut] = useState(false);

  const handleSubscribe = async () => {
    setCheckingOut(true);
    await startCheckout();
    setCheckingOut(false);
  };

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
          <span className="text-3xl font-bold">10€</span>
          <span className="text-muted-foreground">/mois</span>
        </div>

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
              S'abonner — 10€/mois
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
