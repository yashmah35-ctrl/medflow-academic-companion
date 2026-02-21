import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subjects, subjectColorMap } from "@/data/mockData";
import { BookOpen, BarChart3 } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mes Matières</h1>
        <p className="text-muted-foreground mt-1">
          Retrouve ici toutes tes matières et commence à réviser.
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {subjects.map((s) => {
          const colors = subjectColorMap[s.color];
          return (
            <motion.div
              key={s.id}
              variants={item}
              className={`group rounded-xl border border-border ${colors.light} p-5 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col`}
              onClick={() => navigate(`/subject/${s.id}`)}
            >
              {/* Badge + Icon */}
              <div className="flex items-start justify-between mb-3">
                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                  Matière
                </Badge>
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-card text-3xl shadow-sm">
                  {s.icon}
                </div>
              </div>

              {/* Name */}
              <h3 className="font-bold text-foreground mb-3 text-base leading-tight">
                {s.name}
              </h3>

              {/* Stats */}
              <div className="flex gap-4 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {s.courseCount} Cours
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> {s.exerciseCount} Exercices
                </span>
              </div>

              {/* Progress */}
              <div className="space-y-1.5 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold text-foreground">{s.progress}%</span>
                </div>
                <Progress value={s.progress} className="h-2" />
              </div>

              {/* Accéder button */}
              <div className="mt-auto flex justify-end">
                <Button size="sm" className="rounded-lg font-semibold">
                  Accéder
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Index;
