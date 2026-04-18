import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

export function CreditsBadge() {
  const { balance, loading, setPurchaseModalOpen } = useCredits();

  if (loading) return null;

  const low = balance < 25;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setPurchaseModalOpen(true)}
      className={cn(
        "h-9 gap-1.5 rounded-full px-3 font-semibold transition-colors",
        low
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-primary/10 text-primary hover:bg-primary/20"
      )}
      title="Crédits IA"
    >
      <Zap className={cn("h-4 w-4", low ? "" : "fill-primary")} />
      <span className="tabular-nums">{balance}</span>
    </Button>
  );
}
