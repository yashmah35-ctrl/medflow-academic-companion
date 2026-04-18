import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Gift, Wallet, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const PAYOUT_THRESHOLD = 20;

export function ReferralTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aff, setAff] = useState<any>(null);
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [savingIban, setSavingIban] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        // Garantir l'existence du code d'affilié pour l'utilisateur
        await supabase.rpc("ensure_user_affiliate", { _user_id: user.id });
        const { data } = await supabase
          .from("affiliates")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        setAff(data);

        const { data: prof } = await supabase
          .from("profiles")
          .select("iban_encrypted, bic")
          .eq("user_id", user.id)
          .maybeSingle();
        if (prof) { setIban(prof.iban_encrypted ?? ""); setBic(prof.bic ?? ""); }
      } finally { setLoading(false); }
    })();
  }, [user]);

  const code = aff?.code ?? "";
  const link = code ? `${window.location.origin}/auth?ref=${encodeURIComponent(code)}` : "";
  const pending = Number(aff?.pending_balance ?? 0);
  const totalSubs = Number(aff?.total_subscribers ?? 0);
  const totalEarned = Number(aff?.total_commission_earned ?? 0);
  const totalPaid = Number(aff?.total_paid_out ?? 0);
  const reachedThreshold = pending >= PAYOUT_THRESHOLD;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text); toast.success(`${label} copié`);
  };

  const saveIban = async () => {
    if (!user) return;
    setSavingIban(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ iban_encrypted: iban.trim() || null, bic: bic.trim() || null })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Coordonnées bancaires enregistrées");
    } catch (e: any) { toast.error(e.message ?? "Erreur"); }
    finally { setSavingIban(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Votre code de parrainage</CardTitle>
          <CardDescription>
            Partagez votre code : vos filleuls obtiennent 0,50 € de réduction et vous recevez 0,50 € de commission validée à leur premier paiement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Input value={code} readOnly className="font-mono text-base font-bold" />
            <Button variant="outline" onClick={() => copy(code, "Code")}><Copy className="h-4 w-4" /> Code</Button>
            <Button onClick={() => copy(link, "Lien")}><Copy className="h-4 w-4" /> Lien</Button>
          </div>
          <p className="text-xs text-muted-foreground break-all">{link}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Users className="h-3.5 w-3.5" /> Filleuls validés</div>
            <p className="text-2xl font-bold">{totalSubs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wallet className="h-3.5 w-3.5" /> Solde à percevoir</div>
            <p className="text-2xl font-bold text-primary">{pending.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1"><Wallet className="h-3.5 w-3.5" /> Total versé</div>
            <p className="text-2xl font-bold">{totalPaid.toFixed(2)} €</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Cumul gains : {totalEarned.toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" />Coordonnées bancaires (IBAN)</CardTitle>
          <CardDescription>
            Requises pour recevoir vos commissions. Les paiements sont effectués manuellement par virement à partir de {PAYOUT_THRESHOLD} € accumulés.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending > 0 && !iban && (
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground">
              <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p>Vous avez des gains en attente. Renseignez votre IBAN pour pouvoir être payé.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input id="iban" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="FR76 ..." className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bic">BIC (optionnel)</Label>
              <Input id="bic" value={bic} onChange={(e) => setBic(e.target.value.toUpperCase())} placeholder="BNPAFRPPXXX" className="font-mono" />
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {reachedThreshold
                ? "✅ Seuil atteint, votre prochain virement est planifié."
                : `Seuil de virement : ${PAYOUT_THRESHOLD} €.`}
            </p>
            <Button onClick={saveIban} disabled={savingIban}>
              {savingIban && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
