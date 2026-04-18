import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Sparkles, Crown, Check } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Pack = {
  id: "pack_50" | "pack_100" | "pack_150" | "pack_4000";
  credits: number;
  price: string;
  popular?: boolean;
  best?: boolean;
};

const PACKS: Pack[] = [
  { id: "pack_50",   credits: 50,   price: "0,50 €" },
  { id: "pack_100",  credits: 100,  price: "1,00 €", popular: true },
  { id: "pack_150",  credits: 150,  price: "1,50 €" },
  { id: "pack_4000", credits: 4000, price: "40,00 €", best: true },
];

export function PurchaseCreditsModal() {
  const { purchaseModalOpen, setPurchaseModalOpen, balance, buyPack } = useCredits();
  const [busy, setBusy] = useState<string | null>(null);

  const handleBuy = async (packId: typeof PACKS[number]["id"]) => {
    setBusy(packId);
    await buyPack(packId);
    setBusy(null);
  };

  return (
    <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Zap className="h-5 w-5 fill-primary text-primary" />
            Acheter des crédits IA
          </DialogTitle>
          <DialogDescription>
            Solde actuel : <span className="font-bold text-foreground">{balance} crédits</span>
            {" "}— Chaque message à l'assistant IA coûte 25 crédits.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2 mt-2">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleBuy(pack.id)}
              disabled={busy !== null}
              className={cn(
                "relative rounded-2xl border-2 p-4 text-left transition-all hover:shadow-md disabled:opacity-50",
                pack.best ? "border-amber-400 bg-amber-50" :
                pack.popular ? "border-primary bg-primary/5" :
                "border-border bg-card hover:border-primary/40"
              )}
            >
              {pack.popular && (
                <span className="absolute -top-2 left-3 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                  Populaire
                </span>
              )}
              {pack.best && (
                <span className="absolute -top-2 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Crown className="h-2.5 w-2.5" /> Meilleure valeur
                </span>
              )}
              <div className="flex items-center gap-2">
                <Sparkles className={cn("h-5 w-5", pack.best ? "text-amber-500" : "text-primary")} />
                <span className="text-2xl font-bold text-foreground tabular-nums">{pack.credits}</span>
                <span className="text-sm text-muted-foreground">crédits</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-lg font-bold text-foreground">{pack.price}</span>
                <span className="text-xs text-muted-foreground">
                  ≈ {Math.floor(pack.credits / 25)} messages IA
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                <Check className="mr-1 inline h-3 w-3 text-emerald-600" />
                Crédits ajoutés instantanément
              </div>
            </button>
          ))}
        </div>

        <div className="mt-2 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
          💡 <strong>Astuce :</strong> L'abonnement Premium à 10 €/mois inclut <strong>4000 crédits</strong> rechargés à chaque renouvellement, en plus du déblocage de toutes les sections (Khôlles, Annales, Examens, Erreurs).
        </div>

        <Button variant="ghost" onClick={() => setPurchaseModalOpen(false)} className="mt-2">
          Fermer
        </Button>
      </DialogContent>
    </Dialog>
  );
}
