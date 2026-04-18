import { Swords, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Battles() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 mb-6">
          <Swords className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Battles</h1>
        <p className="text-base text-muted-foreground mt-3 max-w-md mx-auto">
          Affrontez d'autres étudiants en QCM en temps réel et grimpez dans le classement.
        </p>
        <div className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
          <Sparkles className="h-4 w-4" />
          Bientôt disponible
        </div>
      </motion.div>
    </div>
  );
}
