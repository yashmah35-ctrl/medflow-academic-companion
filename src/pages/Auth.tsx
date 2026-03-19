import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type AuthMode = "login" | "register";
type RoleOption = "pass" | "lass" | "college" | "lycee" | "prepa_du_peuple";

const roleOptions: { value: RoleOption; label: string; emoji: string; desc: string }[] = [
  { value: "pass", label: "PASS", emoji: "🩺", desc: "Accès complet à toutes les matières" },
  { value: "lass", label: "L.AS", emoji: "📖", desc: "Accès complet sauf matières TC" },
  { value: "college", label: "Collège", emoji: "🎒", desc: "Matières & Modules interactifs" },
  { value: "lycee", label: "Lycée", emoji: "📚", desc: "Matières & Modules interactifs" },
  { value: "prepa_du_peuple", label: "Prépa du Peuple", emoji: "🛠️", desc: "Accès réservé aux administrateurs" },
];

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<RoleOption>("pass");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted && session) {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session) {
        navigate("/", { replace: true });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifie tes emails pour confirmer ton inscription.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Logo */}
        <div className="text-center">
          <img src={logo} alt="La Prépa du Peuple" className="h-28 w-auto mx-auto mb-4 object-contain drop-shadow-2xl" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">La Prépa du Peuple</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "login" ? "Connecte-toi pour continuer" : "Crée ton compte pour commencer"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm p-6 space-y-5 shadow-xl shadow-black/20">
          {/* Tabs */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "login" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("login")}
            >
              Connexion
            </button>
            <button
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                mode === "register" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setMode("register")}
            >
              Inscription
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    placeholder="Ton nom"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="bg-muted border-border"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Je suis en...</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as RoleOption)} className="grid grid-cols-2 gap-2">
                    {roleOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-xl border p-3 text-center text-sm transition-all ${
                          role === opt.value
                            ? "border-primary bg-primary/15 text-foreground shadow-md shadow-primary/20"
                            : "border-border bg-muted/50 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <RadioGroupItem value={opt.value} className="sr-only" />
                        <span className="text-lg block mb-1">{opt.emoji}</span>
                        <span className="font-semibold block">{opt.label}</span>
                        <span className="text-[10px] block mt-0.5 text-muted-foreground">{opt.desc}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="ton.email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-muted border-border" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-muted border-border" />
            </div>

            <Button type="submit" className="w-full rounded-xl py-3 font-bold text-base shadow-lg shadow-primary/30" disabled={loading}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>

            {mode === "login" && (
              <button
                type="button"
                className="w-full text-sm text-primary hover:underline mt-2"
                onClick={async () => {
                  if (!email) { toast.error("Entre ton email d'abord"); return; }
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                  });
                  if (error) toast.error(error.message);
                  else toast.success("Email de réinitialisation envoyé ! Vérifie ta boîte mail.");
                }}
              >
                Mot de passe oublié ?
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          © 2026 La Prépa du Peuple — Tous droits réservés
        </p>
      </motion.div>
    </div>
  );
}