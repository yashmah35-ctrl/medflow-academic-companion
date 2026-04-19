import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AuthShield3D from "@/components/auth/AuthShield3D";
import { syncUserToExternal } from "@/lib/externalUserSync";

type AuthMode = "login" | "register";
type RoleOption = "pass" | "lass" | "college_lycee";

const roleOptions: { value: RoleOption; label: string; emoji: string; desc: string }[] = [
  { value: "pass", label: "PASS", emoji: "🩺", desc: "Accès complet" },
  { value: "lass", label: "L.AS", emoji: "📖", desc: "Sauf TC" },
  { value: "college_lycee", label: "Collège / Lycée", emoji: "🎒", desc: "Modules interactifs" },
];

const TITLE_TEXT = "La Prépa du Peuple";

/* ============ CURSOR TRAIL — Multicolor ============ */
function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<{ x: number; y: number; age: number; vx: number; vy: number }[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, prevX: -1000, prevY: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const handleMove = (e: MouseEvent) => {
      mouseRef.current.prevX = mouseRef.current.x;
      mouseRef.current.prevY = mouseRef.current.y;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      const dx = mouseRef.current.x - mouseRef.current.prevX;
      const dy = mouseRef.current.y - mouseRef.current.prevY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.max(1, Math.floor(dist / 2));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        pointsRef.current.push({
          x: mouseRef.current.prevX + dx * t + (Math.random() - 0.5) * 2,
          y: mouseRef.current.prevY + dy * t + (Math.random() - 0.5) * 2,
          age: 0,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3 - 0.2,
        });
      }
    };
    window.addEventListener("mousemove", handleMove);

    const colors: [number, number, number][] = [
      [255, 50, 50], [255, 100, 100], [255, 80, 180], [200, 60, 255],
      [120, 80, 255], [60, 120, 255], [60, 200, 255], [60, 255, 180],
      [60, 255, 100], [180, 255, 60], [255, 220, 60], [255, 180, 60],
      [255, 140, 60], [255, 255, 255],
    ];

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pointsRef.current = pointsRef.current
        .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, age: p.age + 1 }))
        .filter((p) => p.age < 40);

      if (pointsRef.current.length > 2) {
        for (let i = 1; i < pointsRef.current.length; i++) {
          const p1 = pointsRef.current[i - 1];
          const p2 = pointsRef.current[i];
          const life = 1 - p1.age / 40;
          const colorIdx = Math.min(Math.floor((1 - life) * colors.length), colors.length - 1);
          const [r, g, b] = colors[colorIdx];
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${life * 0.6})`;
          ctx.lineWidth = life * 2;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      pointsRef.current.forEach((p) => {
        const life = 1 - p.age / 40;
        const colorIdx = Math.min(Math.floor((1 - life) * colors.length), colors.length - 1);
        const [r, g, b] = colors[colorIdx];
        const size = life * 2.5 + 0.5;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3);
        gradient.addColorStop(0, `rgba(${r},${g},${b},${life * 0.5})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${life * 0.7})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

/* ============ Typing effect ============ */
function useTyping(text: string, speed = 80, startDelay = 0) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let iv: ReturnType<typeof setInterval> | null = null;
    const timer = setTimeout(() => {
      iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          if (iv) clearInterval(iv);
          setDone(true);
        }
      }, speed);
    }, startDelay);
    return () => {
      clearTimeout(timer);
      if (iv) clearInterval(iv);
    };
  }, [text, speed, startDelay]);
  return { displayed, done };
}

/* ============ Animated counter ============ */
function AnimatedCounter({ target, suffix = "", delay = 0 }: { target: number; suffix?: string; delay?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(elapsed / 2000, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);
  return <>{count.toLocaleString("fr-FR")}{suffix}</>;
}

/* ============ Splash scrambled title ============ */
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
    <div className="flex justify-center items-center h-16 relative" translate="no">
      {letters.map((letter, i) => (
        <motion.span
          key={letter.id}
          className="text-3xl font-bold text-white inline-block"
          style={{ display: letter.char === " " ? "inline" : "inline-block", minWidth: letter.char === " " ? "0.3em" : undefined }}
          initial={{ x: letter.offsetX, y: letter.offsetY, rotate: letter.rotation, opacity: 0, scale: 0.3 }}
          animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
          transition={{ delay: 3 + i * 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [stats, setStats] = useState({ users: 0, questions: 0 });
  const navigate = useNavigate();

  const title1 = useTyping("Bienvenue", 120, 300);
  const title2 = useTyping("sur La Prépa du Peuple.", 80, 1700);

  // Auth listener
  useEffect(() => {
    let isMounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted && session) {
        syncUserToExternal(session.user.id, session.user.email || "")
          .then((ok) => console.log("[Auth] External sync result:", ok))
          .catch((err) => console.error("[Auth] External sync error:", err));
        navigate("/dashboard", { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted && session) navigate("/dashboard", { replace: true });
    });
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch real stats
  useEffect(() => {
    supabase.rpc("get_public_landing_stats").then(({ data }) => {
      if (data && typeof data === "object") {
        const d = data as { users_count?: number; questions_count?: number };
        setStats({ users: d.users_count ?? 0, questions: d.questions_count ?? 0 });
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Compte créé ! Vérifie tes emails pour confirmer ton inscription.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          syncUserToExternal(data.user.id, data.user.email || email)
            .then((ok) => console.log("[Auth] Login sync result:", ok))
            .catch((err) => console.error("[Auth] Login sync error:", err));
        }
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  /* ============ SPLASH SCREEN (20s) ============ */
  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px]" />
        </div>
        <motion.div className="flex flex-col items-center z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AuthShield3D animate />
          <div className="mt-6"><ScrambledTitle /></div>
          <motion.p className="text-white/60 text-sm mt-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 14, duration: 1 }}>
            Prépare-toi à réussir
          </motion.p>
          <motion.div className="mt-8 h-1 rounded-full bg-blue-500/30 w-48 overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 15 }}>
            <motion.div
              className="h-full rounded-full bg-blue-500"
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

  /* ============ MAIN AUTH PAGE ============ */
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Cursor trail */}
      <CursorTrail />

      {/* Morphing blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]"
          animate={{ x: [0, 100, 0], y: [0, 80, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px]"
          animate={{ x: [0, -120, 0], y: [0, -100, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px]"
          animate={{ x: [-200, 200, -200], y: [-100, 100, -100], scale: [1, 1.4, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/40"
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 5 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 3D Shield Logo */}
          <div className="flex justify-center mb-2">
            <AuthShield3D />
          </div>

          {/* Typing title */}
          <div className="text-center mb-8" translate="no">
            <h1 className="text-4xl font-bold text-white tracking-tight" translate="no">
              {title1.displayed}
              {!title1.done && <span className="inline-block w-1 h-8 ml-1 bg-blue-500 animate-pulse align-middle" />}
            </h1>
            {title1.done && (
              <h2 className="text-2xl font-semibold mt-2 bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent" translate="no">
                {title2.displayed}
                {!title2.done && <span className="inline-block w-1 h-6 ml-1 bg-purple-400 animate-pulse align-middle" />}
              </h2>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-xl font-bold text-white">
                <AnimatedCounter target={stats.users} delay={500} />
              </div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Étudiants</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-xl font-bold text-white">
                <AnimatedCounter target={stats.questions} delay={700} />
              </div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Questions</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="text-xl font-bold text-white">
                <AnimatedCounter target={85} suffix="%" delay={900} />
              </div>
              <div className="text-[10px] text-white/50 uppercase tracking-wider mt-1">Réussite</div>
            </div>
          </div>

          {/* Toggle */}
          <div className="flex p-1 rounded-full bg-white/[0.03] border border-white/10 mb-5">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-500 ${
                mode === "login" ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/30" : "text-white/40 hover:text-white/70"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all duration-500 ${
                mode === "register" ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/30" : "text-white/40 hover:text-white/70"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Form with rotating gradient border */}
          <div className="relative rounded-2xl p-[1px] overflow-hidden">
            <motion.div
              className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0%,#2563eb_25%,#a855f7_50%,#06b6d4_75%,transparent_100%)]"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <form onSubmit={handleSubmit} className="relative bg-[#0a0a0f] rounded-2xl p-6 space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-white/60">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jean Dupont"
                        required
                        className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:border-[#2563eb]/40 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-white/60">Je suis en...</label>
                    <div className="grid grid-cols-3 gap-2">
                      {roleOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setRole(opt.value)}
                          className={`rounded-xl border p-2.5 text-center text-xs transition-all ${
                            role === opt.value
                              ? "border-[#2563eb] bg-[#2563eb]/15 text-white shadow-lg shadow-blue-500/20"
                              : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20"
                          }`}
                        >
                          <span className="text-base block mb-0.5">{opt.emoji}</span>
                          <span className="font-semibold block text-[11px]">{opt.label}</span>
                          <span className="text-[9px] block mt-0.5 text-white/40">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@exemple.fr"
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:border-[#2563eb]/40 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/60">Mot de passe</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder-white/15 focus:outline-none focus:border-[#2563eb]/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="text-right">
                  <button
                    type="button"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    onClick={async () => {
                      if (!email) {
                        toast.error("Entre ton email d'abord");
                        return;
                      }
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast.error(error.message);
                      else toast.success("Email de réinitialisation envoyé !");
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:from-[#1d4ed8] hover:to-[#6d28d9] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Chargement..." : (
                  <>
                    {mode === "login" ? "Se connecter" : "Créer mon compte"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-white/30 mt-6">
            © 2026 La Prépa du Peuple — Tous droits réservés
          </p>
        </motion.div>
      </div>
    </div>
  );
}
