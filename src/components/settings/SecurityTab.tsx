import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyRound, Mail } from "lucide-react";
import { toast } from "sonner";

export function SecurityTab() {
  const { user } = useAuth();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [updating, setUpdating] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const handleChange = async () => {
    if (pw1.length < 8) { toast.error("Mot de passe trop court (min. 8 caractères)"); return; }
    if (pw1 !== pw2) { toast.error("Les mots de passe ne correspondent pas"); return; }
    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw1 });
      if (error) throw error;
      toast.success("Mot de passe mis à jour");
      setPw1(""); setPw2("");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally { setUpdating(false); }
  };

  const handleReset = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Email de réinitialisation envoyé");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur");
    } finally { setSendingReset(false); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Mot de passe</CardTitle>
          <CardDescription>Choisissez un mot de passe long et unique.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pw1">Nouveau mot de passe</Label>
              <Input id="pw1" type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} autoComplete="new-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Confirmer</Label>
              <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleChange} disabled={updating || !pw1 || !pw2}>
              {updating && <Loader2 className="h-4 w-4 animate-spin" />}
              Mettre à jour
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary" />Réinitialisation par email</CardTitle>
          <CardDescription>Recevez un lien sécurisé sur votre adresse email.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleReset} disabled={sendingReset}>
            {sendingReset && <Loader2 className="h-4 w-4 animate-spin" />}
            Envoyer le lien
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
