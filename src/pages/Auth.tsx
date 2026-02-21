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
type RoleOption = "pass" | "lass" | "college" | "lycee";

const roleOptions: { value: RoleOption; label: string; emoji: string; desc: string }[] = [
  { value: "pass", label: "PASS", emoji: "🩺", desc: "Accès complet à toutes les matières" },
  { value: "lass", label: "L.AS", emoji: "📖", desc: "Accès complet sauf matières TC" },
  { value: "college", label: "Collège", emoji: "🎒", desc: "Matières & Modules interactifs" },
  { value: "lycee", label: "Lycée", emoji: "📚", desc: "Matières & Modules interactifs" },
];

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState<RoleOption>("pass");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Logo */}
        <div className="text-center">
          <img src={logo} alt="La Prépa du Peuple" className="h-24 w-auto mx-auto mb-3 object-contain" />
          <h1 className="text-2xl font-bold text-foreground">La Prépa du Peuple</h1>
          <p className="text-muted-foreground mt-1">
            {mode === "login" ? "Connecte-toi pour continuer" : "Crée ton compte pour commencer"}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted p-1">
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              }`}
              onClick={() => setMode("login")}
            >
              Connexion
            </button>
            <button
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                mode === "register" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
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
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Je suis en...</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as RoleOption)} className="grid grid-cols-2 gap-2">
                    {roleOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className={`cursor-pointer rounded-lg border p-3 text-center text-sm transition-all ${
                          role === opt.value
                            ? "border-primary bg-primary/5 text-foreground"
                            : "border-border text-muted-foreground"
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
              <Input id="email" type="email" placeholder="ton.email@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
