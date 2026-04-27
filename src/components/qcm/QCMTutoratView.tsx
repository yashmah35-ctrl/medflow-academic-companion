import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { Question } from "@/components/training/TrainingEngine";

interface Props {
  title: string;
  questions: Question[];
  onBack: () => void;
  onFinish?: (score: { correct: number; total: number }) => void;
}

/**
 * Vue QCM au style "Tutorat Santé" :
 * - bandeau titre type Khôlle Classée
 * - énoncé en italique
 * - propositions A-E numérotées proprement
 * - cases à cocher, validation, correction par item
 */
export function QCMTutoratView({ title, questions, onBack, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Set<string>>>({});
  const [validated, setValidated] = useState<Record<string, boolean>>({});

  const q = questions[idx];
  if (!q) return null;

  const isMulti = (q.propositions || []).filter((p) => p.isCorrect).length > 1;
  const selected = answers[q.id] || new Set<string>();
  const isValidated = !!validated[q.id];

  const toggle = (pid: string) => {
    if (isValidated) return;
    setAnswers((prev) => {
      const cur = new Set(prev[q.id] || []);
      if (cur.has(pid)) cur.delete(pid);
      else cur.add(pid);
      return { ...prev, [q.id]: cur };
    });
  };

  const validate = () => setValidated((v) => ({ ...v, [q.id]: true }));

  const goNext = () => {
    if (idx < questions.length - 1) setIdx(idx + 1);
    else if (onFinish) {
      let correct = 0;
      questions.forEach((qq) => {
        const sel = answers[qq.id] || new Set();
        const correctIds = qq.propositions.filter((p) => p.isCorrect).map((p) => p.id);
        const ok =
          correctIds.length === sel.size &&
          correctIds.every((id) => sel.has(id));
        if (ok) correct++;
      });
      onFinish({ correct, total: questions.length });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" onClick={onBack} size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>

      {/* Bandeau Tutorat */}
      <div className="rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-primary/70 font-semibold">
          QCM Classé — Généré par IA
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mt-1 uppercase">
          {title}
        </h1>
        <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Nombre : {questions.length} QCM</span>
          <span>•</span>
          <span>
            Question {idx + 1} / {questions.length}
          </span>
          <span>•</span>
          <span>{isMulti ? "Choix multiples" : "Choix simple"}</span>
        </div>
      </div>

      {/* Carte question style PDF */}
      <motion.article
        key={q.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-card shadow-sm"
      >
        <header className="border-b border-border px-5 py-3 bg-muted/30 rounded-t-xl">
          <p className="font-bold text-foreground">
            Question n°{idx + 1} :{" "}
            <span className="font-normal italic text-foreground/90">
              {q.question}
            </span>
          </p>
        </header>

        <div className="px-5 py-4 space-y-2">
          {q.propositions.map((p) => {
            const isSel = selected.has(p.id);
            let stateClass = "border-border hover:border-primary/40 hover:bg-primary/5";
            let icon = null;

            if (isValidated) {
              if (p.isCorrect && isSel) {
                stateClass = "border-green-500 bg-green-500/10";
                icon = <CheckCircle2 className="h-4 w-4 text-green-600" />;
              } else if (p.isCorrect && !isSel) {
                stateClass = "border-amber-500 bg-amber-500/10";
                icon = <AlertCircle className="h-4 w-4 text-amber-600" />;
              } else if (!p.isCorrect && isSel) {
                stateClass = "border-destructive bg-destructive/10";
                icon = <XCircle className="h-4 w-4 text-destructive" />;
              }
            } else if (isSel) {
              stateClass = "border-primary bg-primary/10";
            }

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                disabled={isValidated}
                className={`w-full flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all ${stateClass}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-background border border-border font-bold text-sm text-foreground">
                  {p.id}
                </span>
                <span className="flex-1 text-sm text-foreground leading-relaxed pt-0.5">
                  {p.text}
                </span>
                {icon && <span className="shrink-0 pt-1">{icon}</span>}
              </button>
            );
          })}
        </div>

        {isValidated && q.explanation && (
          <div className="mx-5 mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3">
            <p className="text-xs font-bold text-primary mb-1">💡 Explication</p>
            <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
              {q.explanation}
            </p>
          </div>
        )}
      </motion.article>

      {/* Footer style Tutorat */}
      <p className="text-center text-[10px] text-muted-foreground italic">
        Document généré par MedFlow — Inspiré du format Tutorat Santé
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-2 sticky bottom-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
        </Button>

        {!isValidated ? (
          <Button onClick={validate} disabled={selected.size === 0}>
            Valider
          </Button>
        ) : (
          <Button onClick={goNext}>
            {idx < questions.length - 1 ? "Suivante" : "Terminer"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
