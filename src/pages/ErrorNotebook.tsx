import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { errors, subjectColorMap } from "@/data/mockData";
import { AlertTriangle, RotateCcw, Search } from "lucide-react";
import { useState } from "react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function ErrorNotebook() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = errors
    .filter((e) => filter === "all" || e.subjectId === filter)
    .filter((e) => e.question.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cahier d'Erreurs</h1>
        <p className="text-muted-foreground mt-1">
          Retrouve toutes tes erreurs et retravaille-les pour ne plus les refaire.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une erreur..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toutes les matières" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les matières</SelectItem>
            <SelectItem value="1">Chimie</SelectItem>
            <SelectItem value="2">Bio Cellulaire</SelectItem>
            <SelectItem value="3">Biophysique</SelectItem>
            <SelectItem value="4">Anatomie</SelectItem>
            <SelectItem value="6">Physiologie</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error list */}
      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        {filtered.map((err) => {
          const colors = subjectColorMap[err.subjectColor];
          const isFrequent = err.occurrenceCount >= 3;

          return (
            <motion.div
              key={err.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={`${colors.light} ${colors.text} text-xs`} variant="secondary">
                      {err.subjectName}
                    </Badge>
                    {isFrequent && (
                      <Badge variant="destructive" className="text-xs flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Erreur fréquente
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">×{err.occurrenceCount}</span>
                  </div>
                  <p className="font-medium text-foreground">{err.question}</p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0">
                  <RotateCcw className="h-3 w-3 mr-1" /> Retravailler
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3">
                  <span className="text-xs text-muted-foreground">Ta réponse</span>
                  <p className="text-foreground mt-0.5">{err.wrongAnswer}</p>
                </div>
                <div className="rounded-lg bg-success/5 border border-success/10 p-3">
                  <span className="text-xs text-muted-foreground">Bonne réponse</span>
                  <p className="text-foreground mt-0.5">{err.correctAnswer}</p>
                </div>
              </div>

              {isFrequent && (
                <div className="rounded-lg bg-warning/5 border border-warning/20 p-3 text-xs text-warning">
                  ⚠️ Cette erreur est planifiée pour révision prioritaire dans ton emploi du temps.
                </div>
              )}

              <p className="text-xs text-muted-foreground">{err.date}</p>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="font-medium">Aucune erreur trouvée</p>
            <p className="text-sm mt-1">Continue à t'entraîner pour remplir ton cahier d'erreurs !</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
