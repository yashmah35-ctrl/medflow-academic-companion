import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, BookCheck, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { TrainingEngine, type Question } from "@/components/training/TrainingEngine";

interface EntCoursePanelProps {
  courseTitle: string;
  courseUrl: string | null;
  courseContent: string | null;
  courseSubject: string | null;
}

export function EntCoursePanel({ courseTitle, courseUrl, courseContent, courseSubject }: EntCoursePanelProps) {
  const { user } = useAuth();
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingReview, setGeneratingReview] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[] | null>(null);
  const [training, setTraining] = useState(false);

  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          content: `Cours : ${courseTitle}\nMatière : ${courseSubject ?? "Inconnue"}\nURL du document : ${courseUrl ?? "non disponible"}`,
          subject: courseSubject ?? "Médecine",
          cardCount: 10,
        },
      });
      if (error) throw error;
      if (data?.flashcards?.length > 0) {
        toast.success(`${data.flashcards.length} flashcards générées !`);
      } else {
        toast.info("Aucune flashcard générée.");
      }
    } catch (err: any) {
      console.error("Flashcard generation error:", err);
      toast.error("Erreur lors de la génération des flashcards");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateReview = async () => {
    setGeneratingReview(true);
    try {
      const contextText = courseContent
        ? `Contenu du cours "${courseTitle}" (matière: ${courseSubject ?? "Médecine"}):\n\n${courseContent}`
        : `Cours : ${courseTitle}\nMatière : ${courseSubject ?? "Médecine"}\nURL du document : ${courseUrl ?? "non disponible"}`;

      const { data, error } = await supabase.functions.invoke("generate-chapter-review", {
        body: {
          content: contextText,
          subject: courseSubject ?? "Médecine",
          title: courseTitle,
          questionCount: 10,
        },
      });
      if (error) throw error;
      if (data?.questions?.length > 0) {
        setReviewQuestions(data.questions);
        toast.success(`${data.questions.length} questions de révision générées !`);
      } else {
        toast.info("Aucune question générée.");
      }
    } catch (err: any) {
      console.error("Review generation error:", err);
      toast.error("Erreur lors de la génération de la révision");
    } finally {
      setGeneratingReview(false);
    }
  };

  if (training && reviewQuestions && reviewQuestions.length > 0) {
    return (
      <div className="h-full overflow-y-auto p-4">
        <TrainingEngine
          title={`Révision - ${courseTitle}`}
          format="QCM"
          questions={reviewQuestions}
          onFinish={() => {}}
          onBack={() => setTraining(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6 p-4">
      {/* Generate Flashcards section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">Générer les flashcards</h3>
        </div>

        <Button
          className="w-full gap-2"
          onClick={handleGenerateFlashcards}
          disabled={generatingFlashcards}
        >
          {generatingFlashcards ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generatingFlashcards ? "Génération en cours..." : "Générer les flashcards"}
        </Button>
      </div>

      {/* Chapter Review section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/50">
            <BookCheck className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-bold text-foreground text-sm">Révisions de chapitre</h3>
        </div>

        {reviewQuestions && reviewQuestions.length > 0 ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">Révision - {courseTitle}</p>
                  <span className="text-[10px] text-muted-foreground">{reviewQuestions.length} Q</span>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1"
                  onClick={() => setTraining(true)}>
                  <Play className="h-3 w-3" /> Démarrer
                </Button>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 gap-1"
              onClick={handleGenerateReview}
              disabled={generatingReview}
            >
              {generatingReview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Régénérer
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGenerateReview}
            disabled={generatingReview}
          >
            {generatingReview ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generatingReview ? "Génération en cours..." : "Générer la révision"}
          </Button>
        )}
      </div>
    </div>
  );
}
