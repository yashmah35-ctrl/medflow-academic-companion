import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Plus, TrendingUp, FileText } from "lucide-react";

const exams = [
  { id: 1, name: "Partiel Chimie S1", subject: "Chimie", date: "Dec 2024", score: 14.5, total: 20 },
  { id: 2, name: "Partiel Anatomie S1", subject: "Anatomie", date: "Dec 2024", score: 12, total: 20 },
  { id: 3, name: "CC2 Bio Cellulaire", subject: "Bio Cellulaire", date: "Nov 2024", score: 16, total: 20 },
];

export default function ExamsBlancs() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Examens Blancs</h1>
          <p className="text-muted-foreground mt-1">
            Importe tes sujets d'examen et suis ta progression.
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> Ajouter un Examen
        </Button>
      </div>

      {/* Upload zone */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 text-center"
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-foreground">Importer un sujet d'examen</p>
        <p className="text-sm text-muted-foreground mt-1">
          Sujet + correction. L'IA extraira les questions automatiquement.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{exams.length}</p>
          <p className="text-xs text-muted-foreground">Examens importés</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">14.2</p>
          <p className="text-xs text-muted-foreground">Moyenne générale</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-success" />
          <div>
            <p className="text-2xl font-bold text-success">+2.3</p>
            <p className="text-xs text-muted-foreground">Progression</p>
          </div>
        </div>
      </div>

      {/* Exam list */}
      <div className="space-y-3">
        {exams.map((exam) => (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium text-foreground">{exam.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{exam.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm font-semibold">
                {exam.score}/{exam.total}
              </Badge>
              <Button variant="outline" size="sm">S'entraîner</Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
