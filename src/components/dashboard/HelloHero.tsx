import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface HelloHeroProps {
  firstName: string;
  streakDays: number;
}

export function HelloHero({ firstName, streakDays }: HelloHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center pt-2 pb-4"
    >
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        <span className="text-foreground">Hello </span>
        <span className="text-primary">{firstName}.</span>
      </h1>
      <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        {streakDays} {streakDays > 1 ? "jours" : "jour"} à la suite
        <Flame className="h-4 w-4 text-warning fill-warning/30" />
      </p>
    </motion.div>
  );
}
