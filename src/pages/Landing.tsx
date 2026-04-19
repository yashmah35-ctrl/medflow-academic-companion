import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  BarChart3,
  Target,
  Users,
  Timer,
  Zap,
  ArrowRight,
  ChevronDown,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LegalModal } from "@/components/legal/LegalModal";
import { CGUContent, PlaceholderContent } from "@/components/legal/CGUContent";

type LegalKey = "cgu" | "privacy" | "mentions" | "cookies";
const LEGAL_META: Record<LegalKey, { label: string; subtitle?: string }> = {
  cgu: { label: "Conditions d'utilisation", subtitle: "Dernière mise à jour : 4 juin 2025" },
  privacy: { label: "Politique de confidentialité" },
  mentions: { label: "Mentions légales" },
  cookies: { label: "Cookies" },
};

const features = [
  {
    icon: Zap,
    title: "Entraînement Intelligent",
    description:
      "Des milliers de questions classées par difficulté et par thème pour cibler tes révisions efficacement.",
  },
  {
    icon: BarChart3,
    title: "Statistiques Détaillées",
    description:
      "Suis ta progression en temps réel avec des graphiques et des analyses de tes points forts et faibles.",
  },
  {
    icon: Target,
    title: "Objectifs Personnalisés",
    description:
      "Fixe-toi des objectifs quotidiens et hebdomadaires. Notre algorithme adapte les questions à ton niveau.",
  },
  {
    icon: Users,
    title: "Communauté Active",
    description:
      "Rejoins un groupe d'étudiants motivés. Partage tes résultats et motive-toi mutuellement.",
  },
  {
    icon: Timer,
    title: "Mode Examen",
    description:
      "Simule les conditions réelles du concours avec un chronomètre et des QCM dans le format officiel.",
  },
  {
    icon: GraduationCap,
    title: "Révisions Rapides",
    description:
      "Des sessions flash de 5 à 15 minutes pour réviser n'importe où, n'importe quand.",
  },
];

const testimonials = [
  {
    quote:
      "La Prépa du Peuple a complètement transformé ma façon de réviser. Les statistiques me permettent de cibler mes faiblesses et le mode examen m'a vraiment préparée pour le jour J.",
    name: "Marie L.",
    role: "Étudiante en 3ème année",
    initial: "M",
  },
  {
    quote:
      "J'ai utilisé La Prépa du Peuple pendant 6 mois avant mon concours. Le résultat ? Une place dans mon internat de rêve. Cette plateforme est un game-changer.",
    name: "Thomas B.",
    role: "Externe en médecine",
    initial: "T",
  },
  {
    quote:
      "L'entraînement intelligent est bluffant. Les questions s'adaptent à mon niveau et je progresse vraiment chaque jour. Je recommande à 100% !",
    name: "Sarah K.",
    role: "Étudiante en révision",
    initial: "S",
  },
];

function formatNumberFr(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

function AnimatedNumber({
  value,
  duration = 1800,
  suffix = "",
  className,
}: {
  value: number | null;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useState<{ el: HTMLSpanElement | null }>({ el: null })[0];

  useEffect(() => {
    if (value === null) return;
    if (!started) return;
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const to = value;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, started]);

  useEffect(() => {
    if (!ref.el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setStarted(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    obs.observe(ref.el);
    return () => obs.disconnect();
  }, [ref]);

  return (
    <span
      ref={(el) => {
        ref.el = el;
      }}
      className={className}
    >
      {value === null ? "…" : `${formatNumberFr(display)}${suffix}`}
    </span>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [questionsCount, setQuestionsCount] = useState<number | null>(null);
  const [coursesCount, setCoursesCount] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -50]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      const { data, error } = await supabase.rpc("get_public_landing_stats");
      if (!error && data) {
        const d = data as {
          users_count: number;
          questions_count: number;
          courses_count: number;
        };
        setUsersCount(d.users_count ?? 0);
        setQuestionsCount(d.questions_count ?? 0);
        setCoursesCount(d.courses_count ?? 0);
      }
    };
    loadStats();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const stats: Array<{
    value: number | null;
    fixed?: string;
    label: string;
    icon: typeof Users;
  }> = [
    { value: usersCount, label: "Étudiants inscrits", icon: Users },
    { value: questionsCount, label: "Questions disponibles", icon: GraduationCap },
    { value: null, fixed: "85%", label: "Taux de réussite", icon: Target },
    { value: coursesCount, label: "Cours disponibles", icon: Zap },
  ];

  const heroStats: Array<{ value: number | null; fixed?: string; label: string }> = [
    { value: usersCount, label: "Étudiants" },
    { value: questionsCount, label: "Questions" },
    { value: null, fixed: "85%", label: "Réussite" },
  ];

  return (
    <div className="min-h-screen bg-[#e8e8e8] text-[#1a1a1a]">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => scrollToSection("hero")}
            className="flex items-center gap-2"
            aria-label="Accueil"
          >
            <div className="h-9 w-9 rounded-xl bg-[#2563eb] flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-lg text-[#1a1a1a]">
              LA PRÉPA DU PEUPLE
            </span>
          </button>

          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollToSection("hero")} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Accueil</button>
            <button onClick={() => scrollToSection("features")} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Fonctionnalités</button>
            <button onClick={() => scrollToSection("stats")} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Statistiques</button>
            <button onClick={() => scrollToSection("testimonials")} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Témoignages</button>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth" className="hidden sm:inline-flex items-center text-sm text-[#1a1a1a] hover:text-[#2563eb] transition-colors px-3 py-2">
              Connexion
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4fd1] text-white text-sm font-medium px-4 py-2 rounded-full transition-all"
            >
              Commencer
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#2563eb]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#2563eb]/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-white/30 rounded-full blur-3xl" />
        </div>

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
            <motion.h1
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-[#1a1a1a] text-center md:text-right"
            >
              TON
              <br />
              CONCOURS
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-[#2563eb] text-center md:text-left"
            >
              TA
              <br />
              RÉUSSITE
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-[#555]"
          >
            La plateforme de référence pour préparer ton concours de médecine.
            <br className="hidden sm:block" />
            Entraîne-toi, progresse, réussis.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/auth"
              className="flex items-center gap-2 px-8 py-4 bg-[#2563eb] hover:bg-[#1d4fd1] text-white rounded-full font-medium transition-all shadow-lg shadow-[#2563eb]/30"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => scrollToSection("features")}
              className="flex items-center gap-2 px-8 py-4 border border-[#ccc] text-[#555] hover:text-[#1a1a1a] hover:border-[#999] rounded-full font-medium transition-all bg-white/40"
            >
              Découvrir
              <ChevronDown className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto"
          >
            {heroStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-[#1a1a1a]">
                  {s.fixed ?? <AnimatedNumber value={s.value} />}
                </div>
                <div className="text-xs md:text-sm text-[#666] uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="mt-12 flex flex-col items-center text-[#888]"
          >
            <span className="text-xs uppercase tracking-widest mb-2">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-[#2563eb] font-semibold">Fonctionnalités</p>
            <h2 className="mt-2 text-4xl md:text-6xl font-black tracking-tighter text-[#1a1a1a]">
              TOUT POUR RÉUSSIR
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#666]">
              Une suite complète d'outils conçus par et pour les étudiants en médecine pour optimiser chaque minute de révision.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="bg-white rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all border border-[#e5e5e5]"
              >
                <div className="h-12 w-12 rounded-xl bg-[#2563eb]/10 flex items-center justify-center mb-5">
                  <f.icon className="h-6 w-6 text-[#2563eb]" />
                </div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">{f.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-24 bg-[#1e3a5f] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-[#60a5fa] font-semibold">Nos chiffres</p>
            <h2 className="mt-2 text-4xl md:text-6xl font-black tracking-tighter">
              DES RÉSULTATS PARLANTS
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="h-14 w-14 mx-auto rounded-xl bg-white/10 flex items-center justify-center mb-4">
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-black">
                  {s.fixed ?? <AnimatedNumber value={s.value} />}
                </div>
                <div className="mt-2 text-sm text-white/70 uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-[#f5f5f5]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-[#2563eb] font-semibold">Témoignages</p>
            <h2 className="mt-2 text-4xl md:text-6xl font-black tracking-tighter text-[#1a1a1a]">
              ILS ONT RÉUSSI
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-[#666]">
              Découvre les histoires de nos étudiants qui ont transformé leur préparation grâce à nous.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 border border-[#e5e5e5]"
              >
                <p className="text-[#444] italic leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold">
                    {t.initial}
                  </div>
                  <div>
                    <p className="font-bold text-[#1a1a1a]">{t.name}</p>
                    <p className="text-xs text-[#666]">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center mt-12 text-[#666]">
            Plus de {usersCount === null ? "…" : usersCount.toLocaleString("fr-FR")} étudiants nous font confiance
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#e8e8e8]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-black tracking-tighter text-[#1a1a1a]"
          >
            PRÊT À RÉUSSIR
            <br />
            <span className="text-[#2563eb]">TON CONCOURS ?</span>
          </motion.h2>
          <p className="mt-6 text-lg text-[#666]">
            Inscris-toi gratuitement et commence ton entraînement dès aujourd'hui. Pas de carte bancaire requise.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="flex items-center gap-2 px-8 py-4 bg-[#2563eb] hover:bg-[#1d4fd1] text-white rounded-full font-medium transition-all shadow-lg shadow-[#2563eb]/30"
            >
              Créer mon compte
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => scrollToSection("features")}
              className="px-8 py-4 border border-[#ccc] text-[#555] hover:text-[#1a1a1a] hover:border-[#999] rounded-full font-medium transition-all bg-white/40"
            >
              En savoir plus
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-[#2563eb] flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <span className="font-extrabold tracking-tight">LA PRÉPA DU PEUPLE</span>
              </div>
              <p className="mt-4 text-sm text-white/60 leading-relaxed">
                La plateforme de référence pour préparer ton concours de médecine. Rejoins des milliers d'étudiants et réussis ensemble.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><button onClick={() => scrollToSection("hero")} className="hover:text-white transition-colors">Accueil</button></li>
                <li><button onClick={() => scrollToSection("features")} className="hover:text-white transition-colors">Fonctionnalités</button></li>
                <li><button onClick={() => scrollToSection("stats")} className="hover:text-white transition-colors">Statistiques</button></li>
                <li><button onClick={() => scrollToSection("testimonials")} className="hover:text-white transition-colors">Témoignages</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                {(Object.keys(LEGAL_META) as LegalKey[]).map((key) => (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setLegalOpen(key)}
                      className="text-left hover:text-white transition-colors"
                    >
                      {LEGAL_META[key].label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  hello.tonagentia@gmail.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Sur demande
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  France
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
            <p>© {new Date().getFullYear()} La Prépa du Peuple — Tous droits réservés</p>
            <p>Fait avec ♥ pour les étudiants en médecine</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
