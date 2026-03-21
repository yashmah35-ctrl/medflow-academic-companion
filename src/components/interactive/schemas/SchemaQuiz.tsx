import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Check, X, RotateCcw, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Marker {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface SchemaQuizProps {
  schema: {
    id: string;
    title: string;
    image_url: string;
    markers_json: Marker[];
  };
  onBack: () => void;
}

type QuizMode = "select" | "text" | "dragdrop";

interface Answer {
  markerId: number;
  userAnswer: string;
  correct: boolean;
}

export default function SchemaQuiz({ schema, onBack }: SchemaQuizProps) {
  const [mode, setMode] = useState<QuizMode>("select");
  const markers = schema.markers_json as Marker[];

  if (mode === "select") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>
          <h1 className="text-xl font-bold text-foreground">{schema.title}</h1>
        </div>
        <div className="max-w-md mx-auto space-y-4 py-8">
          <p className="text-center text-muted-foreground">Choisissez un mode de quiz</p>
          <Button className="w-full h-14 text-base" onClick={() => setMode("text")}>
            ✏️ Saisie de texte
          </Button>
          <Button className="w-full h-14 text-base" variant="outline" onClick={() => setMode("dragdrop")}>
            🎯 Glisser-déposer
          </Button>
        </div>
      </div>
    );
  }

  if (mode === "text") {
    return <TextQuiz schema={schema} markers={markers} onBack={() => setMode("select")} />;
  }

  return <DragDropQuiz schema={schema} markers={markers} onBack={() => setMode("select")} />;
}

/* ─── TEXT INPUT MODE ─── */
function TextQuiz({ schema, markers, onBack }: { schema: SchemaQuizProps["schema"]; markers: Marker[]; onBack: () => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [results, setResults] = useState<Answer[] | null>(null);
  const [retryIds, setRetryIds] = useState<number[] | null>(null);

  const activeMarkers = retryIds ? markers.filter(m => retryIds.includes(m.id)) : markers;

  const handleSubmit = () => {
    const res: Answer[] = activeMarkers.map(m => ({
      markerId: m.id,
      userAnswer: (answers[m.id] || "").trim(),
      correct: (answers[m.id] || "").trim().toLowerCase() === m.label.trim().toLowerCase(),
    }));
    setResults(res);
  };

  const handleRetryWrong = () => {
    const wrongIds = results!.filter(r => !r.correct).map(r => r.markerId);
    setRetryIds(wrongIds);
    setResults(null);
    setAnswers({});
  };

  const handleRetryAll = () => {
    setRetryIds(null);
    setResults(null);
    setAnswers({});
  };

  const score = results ? results.filter(r => r.correct).length : 0;
  const total = results ? results.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h1 className="text-xl font-bold text-foreground">{schema.title}</h1>
        {retryIds && <Badge variant="secondary">Révision erreurs</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        {/* Image with markers */}
        <div className="relative rounded-xl border border-border overflow-hidden bg-card">
          <div className="relative inline-block w-full">
            <img src={schema.image_url} alt={schema.title} className="w-full h-auto select-none" draggable={false} />
            {activeMarkers.map(m => {
              const result = results?.find(r => r.markerId === m.id);
              return (
                <div
                  key={m.id}
                  className={cn(
                    "absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ring-2 ring-background",
                    result ? (result.correct ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground") : "bg-destructive text-destructive-foreground"
                  )}
                  style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                >
                  {result ? (result.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />) : m.id}
                </div>
              );
            })}
          </div>
        </div>

        {/* Answer panel */}
        <div className="space-y-3">
          {!results ? (
            <>
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {activeMarkers.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {m.id}
                    </span>
                    <Input
                      value={answers[m.id] || ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [m.id]: e.target.value }))}
                      placeholder="Votre réponse..."
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Valider les réponses
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{score}/{total}</p>
                <p className="text-sm text-muted-foreground">
                  {score === total ? "Parfait ! 🎉" : "Continue tes efforts 💪"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2 max-h-[400px] overflow-y-auto">
                {results.map(r => {
                  const marker = markers.find(m => m.id === r.markerId)!;
                  return (
                    <div key={r.markerId} className={cn("flex items-center gap-2 p-2 rounded-lg text-sm", r.correct ? "bg-green-500/10" : "bg-destructive/10")}>
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{r.markerId}</span>
                      {r.correct ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {marker.label}</span>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="text-destructive line-through">{r.userAnswer || "(vide)"}</span>
                          <span className="text-green-600 dark:text-green-400 ml-2">→ {marker.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {results.some(r => !r.correct) && (
                  <Button variant="outline" className="flex-1" onClick={handleRetryWrong}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Revoir les erreurs
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleRetryAll}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Tout refaire
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── DRAG & DROP MODE ─── */
function DragDropQuiz({ schema, markers, onBack }: { schema: SchemaQuizProps["schema"]; markers: Marker[]; onBack: () => void }) {
  const [placements, setPlacements] = useState<Record<number, string>>({});
  const [availableLabels, setAvailableLabels] = useState<string[]>(() =>
    [...markers.map(m => m.label)].sort(() => Math.random() - 0.5)
  );
  const [results, setResults] = useState<Answer[] | null>(null);
  const [draggedLabel, setDraggedLabel] = useState<string | null>(null);
  const [retryIds, setRetryIds] = useState<number[] | null>(null);

  const activeMarkers = retryIds ? markers.filter(m => retryIds.includes(m.id)) : markers;

  const handleDrop = (markerId: number) => {
    if (!draggedLabel) return;
    // If marker already has a label, put it back
    if (placements[markerId]) {
      setAvailableLabels(prev => [...prev, placements[markerId]]);
    }
    setPlacements(prev => ({ ...prev, [markerId]: draggedLabel }));
    setAvailableLabels(prev => prev.filter(l => l !== draggedLabel));
    setDraggedLabel(null);
  };

  const removeFromMarker = (markerId: number) => {
    if (results) return;
    const label = placements[markerId];
    if (label) {
      setAvailableLabels(prev => [...prev, label]);
      setPlacements(prev => {
        const next = { ...prev };
        delete next[markerId];
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const res: Answer[] = activeMarkers.map(m => ({
      markerId: m.id,
      userAnswer: placements[m.id] || "",
      correct: (placements[m.id] || "").toLowerCase() === m.label.toLowerCase(),
    }));
    setResults(res);
  };

  const handleRetryWrong = () => {
    const wrongIds = results!.filter(r => !r.correct).map(r => r.markerId);
    setRetryIds(wrongIds);
    setResults(null);
    setPlacements({});
    const wrongMarkers = markers.filter(m => wrongIds.includes(m.id));
    setAvailableLabels([...wrongMarkers.map(m => m.label)].sort(() => Math.random() - 0.5));
  };

  const handleRetryAll = () => {
    setRetryIds(null);
    setResults(null);
    setPlacements({});
    setAvailableLabels([...markers.map(m => m.label)].sort(() => Math.random() - 0.5));
  };

  const score = results ? results.filter(r => r.correct).length : 0;
  const total = results ? results.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <h1 className="text-xl font-bold text-foreground">{schema.title}</h1>
        {retryIds && <Badge variant="secondary">Révision erreurs</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Image with drop zones */}
        <div className="relative rounded-xl border border-border overflow-hidden bg-card">
          <div className="relative inline-block w-full">
            <img src={schema.image_url} alt={schema.title} className="w-full h-auto select-none" draggable={false} />
            {activeMarkers.map(m => {
              const result = results?.find(r => r.markerId === m.id);
              const placed = placements[m.id];
              return (
                <div
                  key={m.id}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center shadow-lg ring-2 ring-background cursor-pointer transition-all",
                    placed ? "px-2 py-1 min-w-[28px]" : "w-7 h-7",
                    result
                      ? (result.correct ? "bg-green-500 text-white" : "bg-destructive text-destructive-foreground")
                      : placed
                        ? "bg-primary text-primary-foreground"
                        : "bg-destructive/80 text-destructive-foreground"
                  )}
                  style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); handleDrop(m.id); }}
                  onClick={() => removeFromMarker(m.id)}
                >
                  {result ? (
                    result.correct ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />
                  ) : placed ? (
                    <span className="text-[10px] font-medium whitespace-nowrap">{placed}</span>
                  ) : (
                    <span className="text-xs font-bold">{m.id}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Labels + results */}
        <div className="space-y-3">
          {!results ? (
            <>
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Labels à placer ({availableLabels.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label, i) => (
                    <div
                      key={`${label}-${i}`}
                      draggable
                      onDragStart={() => setDraggedLabel(label)}
                      onDragEnd={() => setDraggedLabel(null)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing border transition-colors",
                        draggedLabel === label
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/50 text-foreground hover:bg-muted"
                      )}
                    >
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      {label}
                    </div>
                  ))}
                  {availableLabels.length === 0 && (
                    <p className="text-xs text-muted-foreground">Tous les labels sont placés</p>
                  )}
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit} disabled={Object.keys(placements).length < activeMarkers.length}>
                Valider les réponses
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{score}/{total}</p>
                <p className="text-sm text-muted-foreground">
                  {score === total ? "Parfait ! 🎉" : "Continue tes efforts 💪"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2 max-h-[400px] overflow-y-auto">
                {results.map(r => {
                  const marker = markers.find(m => m.id === r.markerId)!;
                  return (
                    <div key={r.markerId} className={cn("flex items-center gap-2 p-2 rounded-lg text-sm", r.correct ? "bg-green-500/10" : "bg-destructive/10")}>
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{r.markerId}</span>
                      {r.correct ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> {marker.label}</span>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <span className="text-destructive line-through">{r.userAnswer || "(vide)"}</span>
                          <span className="text-green-600 dark:text-green-400 ml-2">→ {marker.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {results.some(r => !r.correct) && (
                  <Button variant="outline" className="flex-1" onClick={handleRetryWrong}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Revoir les erreurs
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={handleRetryAll}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Tout refaire
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
