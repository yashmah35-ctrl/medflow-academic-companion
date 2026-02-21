import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { subjects, subjectColorMap } from "@/data/mockData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
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
              className="group rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer flex flex-col"
              onClick={() => navigate(`/subject/${s.id}`)}
            >
              {/* Icon + color bar */}
              <div className="flex items-start justify-between mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.light} text-2xl`}>
                  {s.icon}
                </div>
                <div className={`h-2 w-2 rounded-full ${colors.bg}`} />
              </div>

              {/* Name */}
              <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {s.name}
              </h3>

              {/* Stats */}
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                <span>{s.courseCount} Cours</span>
                <span>•</span>
                <span>{s.exerciseCount} Exercices</span>
              </div>

              {/* Progress */}
              <div className="mt-auto space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-semibold text-foreground">{s.progress}%</span>
                </div>
                <Progress value={s.progress} className="h-2" />
              </div>

              {/* Professors */}
              <div className="flex items-center gap-1 mt-4">
                {s.professors.map((p, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-card -ml-1 first:ml-0">
                    <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
                      {p.split(" ").map((w) => w[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {s.professors.join(", ")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default Index;
