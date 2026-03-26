import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import splashLogo from "@/assets/logo-splash.png";
import AuthShield3D from "@/components/auth/AuthShield3D";
import { syncUserToExternal } from "@/lib/externalUserSync";

type AuthMode = "login" | "register";
type RoleOption = "pass" | "lass" | "college_lycee" | "prepa_du_peuple";

const roleOptions: { value: RoleOption; label: string; emoji: string; desc: string }[] = [
  { value: "pass", label: "PASS", emoji: "🩺", desc: "Accès complet à toutes les matières" },
  { value: "lass", label: "L.AS", emoji: "📖", desc: "Accès complet sauf matières TC" },
  { value: "college_lycee", label: "Collège / Lycée", emoji: "🎒", desc: "Matières & Modules interactifs" },
  
];

const TITLE_TEXT = "La Prépa du Peuple";

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ScrambledTitle() {
  const letters = useMemo(() => {
    return TITLE_TEXT.split("").map((char, i) => ({
      char,
      id: i,
      offsetX: (Math.random() - 0.5) * 400,
      offsetY: (Math.random() - 0.5) * 300,
      rotation: (Math.random() - 0.5) * 720,
    }));
  }, []);

  return (
    <div className="flex justify-center items-center h-16 relative">
      {letters.map((letter, i) => (
        <motion.span
          key={letter.id}
          className="text-3xl font-bold text-foreground inline-block"
          style={{ display: letter.char === " " ? "inline" : "inline-block", minWidth: letter.char === " " ? "0.3em" : undefined }}
          initial={{
            x: letter.offsetX,
            y: letter.offsetY,
            rotate: letter.rotation,
            opacity: 0,
            scale: 0.3,
          }}
          animate={{
            x: 0,
            y: 0,
            rotate: 0,
            opacity: 1,
            scale: 1,
          }}
          transition={{
            delay: 3 + i * 0.4,
            duration: 1.2,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {letter.char}
        </motion.span>
      ))}
    </div>
  );
}

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
        // Fire sync without blocking navigation
        syncUserToExternal(session.user.id, session.user.email || '')
          .then(ok => console.log('[Auth] External sync result:', ok))
          .catch(err => console.error('[Auth] External sync error:', err));
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
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          syncUserToExternal(data.user.id, data.user.email || email)
            .then(ok => console.log('[Auth] Login sync result:', ok))
            .catch(err => console.error('[Auth] Login sync error:', err));
        }
        navigate("/");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  // Splash screen animation — ~20s total
  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Subtle background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        </div>

        <motion.div
          className="flex flex-col items-center z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
        {/* 3D Shield descending + rotating */}
          <AuthShield3D animate />

          {/* Scrambled title — letters fly in one by one */}
          <div className="mt-6">
            <ScrambledTitle />
          </div>

          {/* Subtitle */}
          <motion.p
            className="text-muted-foreground text-sm mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 14, duration: 1 }}
          >
            Prépare-toi à réussir
          </motion.p>

          {/* Loading bar — starts late, finishes at ~20s */}
          <motion.div
            className="mt-8 h-1 rounded-full bg-primary/30 w-48 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 15 }}
          >
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 15.5, duration: 4, ease: "easeInOut" }}
              onAnimationComplete={() => setShowSplash(false)}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Logo */}
        <div className="text-center flex flex-col items-center">
          <AuthShield3D />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">La Prépa du Peuple</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {mode === "login" ? "Connecte-toi pour continuer" : "Crée ton compte pour commencer"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-lg shadow-black/5">
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