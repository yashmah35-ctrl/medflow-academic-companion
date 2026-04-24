import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check hash
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Mot de passe mis à jour !");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center space-y-4">
          <img src={logo} alt="Logo" className="h-20 mx-auto" />
          <p className="text-muted-foreground">Vérification en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={logo} alt="Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
        </div>
        <form onSubmit={handleReset} className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 space-y-4 shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input id="new-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-muted border-border" />
          </div>
          <Button type="submit" className="w-full rounded-xl py-3 font-bold" disabled={loading}>
            {loading ? "Chargement..." : "Mettre à jour"}
          </Button>
        </form>
      </div>
    </div>
  );
}
