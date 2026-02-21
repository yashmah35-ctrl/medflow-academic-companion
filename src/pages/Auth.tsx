import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "react-router-dom";

type AuthMode = "login" | "register";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [role, setRole] = useState("medical");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up with Supabase auth
    navigate("/");
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
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl mb-4">
            M
          </div>
          <h1 className="text-2xl font-bold text-foreground">MedFlow</h1>
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
              <div className="space-y-3">
                <Label className="text-sm font-medium">Je suis...</Label>
                <RadioGroup value={role} onValueChange={setRole} className="flex gap-3">
                  <label className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm transition-all ${
                    role === "medical" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                  }`}>
                    <RadioGroupItem value="medical" className="sr-only" />
                    <span className="text-lg block mb-1">🩺</span>
                    Étudiant en médecine
                  </label>
                  <label className={`flex-1 cursor-pointer rounded-lg border p-3 text-center text-sm transition-all ${
                    role === "lyceen" ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                  }`}>
                    <RadioGroupItem value="lyceen" className="sr-only" />
                    <span className="text-lg block mb-1">📚</span>
                    Lycéen / Collégien
                  </label>
                </RadioGroup>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ton.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {mode === "login" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
