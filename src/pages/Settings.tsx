import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Loader2, CheckCircle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  const [entLogin, setEntLogin] = useState("");
  const [entPassword, setEntPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleConnectENT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entLogin.trim() || !entPassword.trim() || !user) return;

    setLoading(true);
    setSynced(false);

    try {
      const res = await fetch(
        "https://n8n.srv1366613.hstgr.cloud/webhook/medflow/ent-connexion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user.id,
            ent_login: entLogin.trim(),
            ent_password: entPassword.trim(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`);
      }

      setSynced(true);
      toast.success("Vos cours ont été synchronisés !");
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la connexion à l'ENT");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <SettingsIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
            <p className="text-sm text-muted-foreground">Gérer votre compte et vos connexions</p>
          </div>
        </div>
      </motion.div>

      {/* ENT Connection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Wifi className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Connexion ENT</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Connectez votre ENT universitaire pour synchroniser automatiquement vos cours.
        </p>

        <form onSubmit={handleConnectENT} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ent-login">Identifiant ENT</Label>
            <Input
              id="ent-login"
              placeholder="prenom.nom"
              value={entLogin}
              onChange={(e) => setEntLogin(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ent-password">Mot de passe ENT</Label>
            <Input
              id="ent-password"
              type="password"
              placeholder="••••••••"
              value={entPassword}
              onChange={(e) => setEntPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <Button type="submit" disabled={loading || !entLogin.trim() || !entPassword.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Synchronisation en cours…
              </>
            ) : synced ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Synchronisé !
              </>
            ) : (
              "Connecter mon ENT"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
