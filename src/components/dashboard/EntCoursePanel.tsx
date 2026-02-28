import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, BookCheck, Play, RotateCcw, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { entSupabase } from "@/lib/entSupabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { TrainingEngine, type Question } from "@/components/training/TrainingEngine";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface EntCoursePanelProps {
  courseId: string;
  courseTitle: string;
  courseUrl: string | null;
  courseContent: string | null;
  courseSubject: string | null;
}

interface CourseMaterial {
  id: string;
  course_id: string;
  summary: string | null;
  flashcards: { front: string; back: string }[] | null;
  mcq: { question: string; options: string[]; answer: string; explanation?: string }[] | null;
}

function FlipCard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer perspective-[600px]"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={cn(
          "relative w-full min-h-[120px] transition-transform duration-500 transform-style-preserve-3d",
          flipped && "[transform:rotateY(180deg)]"
        )}
      >
        {/* Front */}
        <div className="absolute inset-0 backface-hidden rounded-xl border border-border bg-gradient-to-br from-primary/5 to-primary/10 p-4 flex flex-col justify-center">
          <p className="text-xs font-semibold text-primary/60 mb-1">Question</p>
          <p className="text-sm text-foreground leading-relaxed">{front}</p>
          <p className="text-[10px] text-muted-foreground mt-2 italic">Cliquez pour révéler</p>
        </div>
        {/* Back */}
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-xl border border-border bg-gradient-to-br from-accent/30 to-accent/50 p-4 flex flex-col justify-center">
          <p className="text-xs font-semibold text-primary/60 mb-1">Réponse</p>
          <p className="text-sm text-foreground leading-relaxed">{back}</p>
        </div>
      </div>
    </div>
  );
}

function McqCard({
  question,
  options,
  answer,
  explanation,
}: {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const answered = selected !== null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium text-foreground">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isCorrect = opt === answer;
          const isSelected = opt === selected;
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setSelected(opt)}
              className={cn(
                "w-full text-left text-xs rounded-lg border px-3 py-2 transition-colors",
                !answered && "hover:bg-muted border-border",
                answered && isCorrect && "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400",
                answered && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400",
                answered && !isSelected && !isCorrect && "border-border opacity-50"
              )}
            >
              <span className="font-semibold mr-1.5">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && explanation && (
        <button
          className="text-[10px] text-primary underline"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          {showExplanation ? "Masquer" : "Voir"} l'explication
        </button>
      )}
      {showExplanation && explanation && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{explanation}</p>
      )}
    </div>
  );
}

export function EntCoursePanel({ courseId, courseTitle, courseUrl, courseContent, courseSubject }: EntCoursePanelProps) {
  const { user } = useAuth();
  const [material, setMaterial] = useState<CourseMaterial | null>(null);
  const [loadingMaterial, setLoadingMaterial] = useState(true);

  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingReview, setGeneratingReview] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState<Question[] | null>(null);
  const [training, setTraining] = useState(false);

  // Fetch course_materials from external Supabase
  useEffect(() => {
    if (!courseId) return;
    setLoadingMaterial(true);
    entSupabase
      .from("course_materials")
      .select("*")
      .eq("course_id", courseId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching course_materials:", error);
        }
        if (data) {
          setMaterial({
            id: data.id,
            course_id: data.course_id,
            summary: data.summary ?? null,
            flashcards: data.flashcards ?? null,
            mcq: data.mcq ?? null,
          });
        } else {
          setMaterial(null);
        }
        setLoadingMaterial(false);
      });
  }, [courseId]);

  const handleGenerateFlashcards = async () => {
    if (!user) { toast.error("Vous devez être connecté"); return; }
    setGeneratingFlashcards(true);
    try {
      const contentText = courseContent
        ? `Cours : ${courseTitle}\nMatière : ${courseSubject ?? "Médecine"}\n\n${courseContent}`
        : `Cours : ${courseTitle}\nMatière : ${courseSubject ?? "Inconnue"}\nURL du document : ${courseUrl ?? "non disponible"}`;

      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          content: contentText,
          subject: courseSubject ?? "Médecine",
          cardCount: 10,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); setGeneratingFlashcards(false); return; }
      const cards = data?.flashcards || [];
      if (cards.length === 0) { toast.info("Aucune flashcard générée."); setGeneratingFlashcards(false); return; }

      // Create or find deck
      const deckName = `ENT - ${courseSubject ?? courseTitle}`;
      let deckId: string | null = null;
      const { data: existingDecks } = await supabase
        .from("flashcard_decks")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", deckName)
        .limit(1);

      if (existingDecks && existingDecks.length > 0) {
        deckId = existingDecks[0].id;
      } else {
        const { data: newDeck, error: deckError } = await supabase
          .from("flashcard_decks")
          .insert({ user_id: user.id, name: deckName })
          .select("id")
          .single();
        if (deckError) { toast.error("Erreur création du deck"); setGeneratingFlashcards(false); return; }
        deckId = newDeck.id;
      }

      const inserts = cards.map((c: any) => ({
        deck_id: deckId!,
        user_id: user.id,
        card_type: "qr",
        front: c.front,
        back: c.back,
        explanation: c.explanation || null,
      }));
      const { error: insertError } = await supabase.from("flashcards").insert(inserts);
      if (insertError) { toast.error("Erreur lors de l'import"); return; }
      toast.success(`${cards.length} flashcards sauvegardées dans "${deckName}" !`);
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

  const hasFlashcards = material?.flashcards && material.flashcards.length > 0;
  const hasMcq = material?.mcq && material.mcq.length > 0;
  const hasSummary = !!material?.summary;
  const hasAnyMaterial = hasFlashcards || hasMcq || hasSummary;

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue={hasAnyMaterial ? "materials" : "tools"} className="flex flex-col h-full">
        <TabsList className="mx-4 mt-3 shrink-0">
          <TabsTrigger value="materials" className="text-xs">Contenu</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">Outils IA</TabsTrigger>
        </TabsList>

        {/* Materials tab */}
        <TabsContent value="materials" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-5">
              {loadingMaterial ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : !hasAnyMaterial ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <FileText className="h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm font-medium text-foreground">Aucun contenu disponible</p>
                  <p className="text-xs text-muted-foreground">
                    Utilisez l'onglet "Outils IA" pour générer des flashcards et des révisions.
                  </p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  {hasSummary && (
                    <section>
                      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Résumé du cours
                      </h3>
                      <div className="rounded-xl border border-border bg-muted/30 p-4">
                        <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {material!.summary}
                        </p>
                      </div>
                    </section>
                  )}

                  {/* Flashcards */}
                  {hasFlashcards && (
                    <section>
                      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Flashcards ({material!.flashcards!.length})
                      </h3>
                      <div className="space-y-3">
                        {material!.flashcards!.map((fc, i) => (
                          <FlipCard key={i} front={fc.front} back={fc.back} />
                        ))}
                      </div>
                    </section>
                  )}

                  {/* MCQ */}
                  {hasMcq && (
                    <section>
                      <h3 className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        QCM ({material!.mcq!.length})
                      </h3>
                      <div className="space-y-3">
                        {material!.mcq!.map((q, i) => (
                          <McqCard key={i} {...q} />
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* AI Tools tab */}
        <TabsContent value="tools" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-6">
              {/* Generate Flashcards */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">Générer les flashcards</h3>
                </div>
                <Button className="w-full gap-2" onClick={handleGenerateFlashcards} disabled={generatingFlashcards}>
                  {generatingFlashcards ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generatingFlashcards ? "Génération en cours..." : "Générer les flashcards"}
                </Button>
              </div>

              {/* Chapter Review */}
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
                        <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs gap-1" onClick={() => setTraining(true)}>
                          <Play className="h-3 w-3" /> Démarrer
                        </Button>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1" onClick={handleGenerateReview} disabled={generatingReview}>
                      {generatingReview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                      Régénérer
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full gap-2" onClick={handleGenerateReview} disabled={generatingReview}>
                    {generatingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generatingReview ? "Génération en cours..." : "Générer la révision"}
                  </Button>
                )}
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
