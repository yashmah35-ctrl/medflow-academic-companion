import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText, Plus, Upload, Play, CheckCircle2, Pencil, Trash2, ScanLine } from "lucide-react";
import { renderAsync } from "docx-preview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface CourseExercise {
  id: string;
  title: string;
  format: string;
  questions_json: any[] | null;
}

interface SecurePdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
  fileName?: string;
  subjectId?: string;
  subjectName?: string;
  courseId?: string;
  folderId?: string;
  // Side panel
  exercises?: CourseExercise[];
  exerciseScores?: Record<string, { correct: number; total: number }>;
  isAdmin?: boolean;
  onOpenTraining?: (exerciseId: string) => void;
  onCreateManual?: () => void;
  onImportOcr?: () => void;
  onAddQuestion?: (exerciseId: string) => void;
  onEditQuestions?: (exerciseId: string) => void;
  onImportOCR?: (exerciseId: string) => void;
  onDeleteExercise?: (exerciseId: string) => void;
}

export function SecurePdfViewer({
  open,
  onOpenChange,
  signedUrl,
  title,
  fileName,
  courseId,
  folderId,
  exercises = [],
  exerciseScores = {},
  isAdmin = false,
  onOpenTraining,
  onCreateManual,
  onImportOcr,
  onAddQuestion,
  onEditQuestions,
  onImportOCR,
  onDeleteExercise,
}: SecurePdfViewerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const docxDesktopRef = useRef<HTMLDivElement>(null);

  // Track course open for progression
  useEffect(() => {
    if (!open || !courseId || !folderId || !user) return;
    supabase.from("user_course_progress").upsert(
      { user_id: user.id, course_id: courseId, folder_id: folderId },
      { onConflict: "user_id,course_id" }
    ).then();
  }, [open, courseId, folderId, user]);

  const fileType = useMemo(() => {
    const name = fileName || "";
    if (/\.pdf$/i.test(name)) return "pdf";
    if (/\.docx?$/i.test(name)) return "docx";
    if (signedUrl) {
      try {
        const urlPath = new URL(signedUrl).pathname;
        if (/\.pdf$/i.test(urlPath)) return "pdf";
        if (/\.docx?$/i.test(urlPath)) return "docx";
      } catch {}
    }
    return "docx";
  }, [fileName, signedUrl]);

  // Fetch and render DOCX
  useEffect(() => {
    if (!open || !signedUrl || fileType !== "docx") return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadDocx = async () => {
      try {
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error("Impossible de charger le document");
        const blob = await response.blob();

        if (cancelled) return;

        if (docxContainerRef.current) {
          docxContainerRef.current.innerHTML = "";
          await renderAsync(blob, docxContainerRef.current, undefined, {
            className: "docx-viewer",
            inWrapper: true,
            ignoreWidth: true,
            ignoreHeight: true,
            ignoreFonts: false,
            breakPages: false,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          });
          const allEls = docxContainerRef.current.querySelectorAll("*");
          allEls.forEach((el) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.style.width) htmlEl.style.width = "";
            if (htmlEl.style.minWidth) htmlEl.style.minWidth = "";
          });
        }

        if (docxDesktopRef.current) {
          docxDesktopRef.current.innerHTML = "";
          const response2 = await fetch(signedUrl);
          const blob2 = await response2.blob();
          await renderAsync(blob2, docxDesktopRef.current, undefined, {
            className: "docx-viewer",
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          });
        }

        if (!cancelled) setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Erreur de chargement");
          setLoading(false);
        }
      }
    };

    loadDocx();
    return () => { cancelled = true; };
  }, [open, signedUrl, fileType]);

  const pdfSrc = useMemo(() => {
    if (!signedUrl || fileType !== "pdf") return null;
    return signedUrl + (signedUrl.includes("#") ? "&toolbar=0" : "#toolbar=0");
  }, [signedUrl, fileType]);

  // Block keyboard shortcuts + completely lock background page scroll
  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const body = document.body;
    const mainContent = document.getElementById("main-content");

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.position = "fixed";
    html.style.inset = "0";
    body.style.position = "fixed";
    body.style.inset = "0";
    body.style.width = "100%";
    if (mainContent) mainContent.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      html.style.overflow = "";
      html.style.position = "";
      html.style.inset = "";
      body.style.overflow = "";
      body.style.position = "";
      body.style.inset = "";
      body.style.width = "";
      if (mainContent) mainContent.style.overflow = "";
    };
  }, [open]);

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </div>
      <p className="text-sm font-medium text-foreground">Chargement du document</p>
    </div>
  );

  const ErrorDisplay = () => (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <FileText className="h-12 w-12 text-muted-foreground" />
      <p className="text-sm text-destructive font-medium">{error}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setLoading(true); setError(null); } }}>
      <DialogContent
        className="max-w-[100vw] md:max-w-[95vw] w-[100vw] md:w-[95vw] h-[100dvh] md:h-[92vh] p-0 gap-0 overflow-hidden border-0 md:border md:border-border/50 bg-card shadow-2xl [&>button:last-child]:hidden rounded-none md:rounded-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-card via-card to-muted/30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
              <p className="text-xs text-muted-foreground">Consultation en lecture seule</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ===== MOBILE ===== */}
        <div className="flex-1 overflow-y-auto md:hidden" style={{ overflowX: "hidden" }}>
          <div
            className="relative select-none bg-muted/20 w-full"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {loading && <LoadingSpinner />}
            {error && <ErrorDisplay />}

            {fileType === "docx" && signedUrl && (
              <div
                ref={docxContainerRef}
                className="w-full docx-secure-container"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none", maxWidth: "100vw", overflow: "hidden" }}
              />
            )}

            {fileType === "pdf" && pdfSrc && (
              <iframe
                key={pdfSrc + "-mobile"}
                src={pdfSrc}
                className="w-full border-0"
                style={{ height: "85dvh", pointerEvents: "auto" }}
                onLoad={() => setLoading(false)}
                title={title}
              />
            )}
          </div>
        </div>

        {/* ===== DESKTOP ===== */}
        <div className="hidden md:flex flex-1 overflow-hidden" style={{ height: "calc(92vh - 56px)" }}>
          {/* Document area (~65%) */}
          <div
            className="relative select-none bg-muted/20 flex-1 overflow-auto"
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 gap-4">
                <LoadingSpinner />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <ErrorDisplay />
              </div>
            )}

            {fileType === "docx" && signedUrl && (
              <div
                ref={docxDesktopRef}
                className="w-full h-full overflow-auto docx-secure-container"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              />
            )}

            {fileType === "pdf" && pdfSrc && (
              <iframe
                key={pdfSrc + "-desktop"}
                src={pdfSrc}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                title={title}
                style={{ pointerEvents: "auto" }}
              />
            )}
          </div>

          {/* Side panel (~35%) — exercises list + admin actions */}
          <aside className="w-[35%] min-w-[320px] max-w-[480px] border-l border-border/50 bg-card flex flex-col">
            <div className="px-4 py-3 border-b border-border/50 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">Exercices du cours</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exercises.length === 0
                  ? "Aucun exercice pour ce cours"
                  : `${exercises.length} exercice${exercises.length > 1 ? "s" : ""} disponible${exercises.length > 1 ? "s" : ""}`}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {exercises.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8 px-4">
                  {isAdmin
                    ? "Ajoute un exercice via les boutons ci-dessous."
                    : "Les exercices arriveront bientôt."}
                </div>
              )}
              {exercises.map((ex) => {
                const score = exerciseScores[ex.id];
                const pct = score && score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;
                const qCount = Array.isArray(ex.questions_json) ? ex.questions_json.length : 0;
                const disabled = qCount === 0;
                return (
                  <div
                    key={ex.id}
                    className="w-full p-3 rounded-lg border border-border/60 bg-background hover:border-primary/40 transition-colors"
                  >
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onOpenTraining?.(ex.id)}
                      className="w-full text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0 group-hover:bg-primary/20 transition-colors">
                          {pct !== null && pct >= 70 ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{ex.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="px-1.5 py-0.5 rounded bg-muted">{ex.format}</span>
                            <span>{qCount} question{qCount > 1 ? "s" : ""}</span>
                            {pct !== null && (
                              <span className={pct >= 70 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                                {pct}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                    {isAdmin && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => onAddQuestion?.(ex.id)}
                        >
                          <Plus className="h-3 w-3" /> Question
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] gap-1"
                          disabled={qCount === 0}
                          onClick={() => onEditQuestions?.(ex.id)}
                        >
                          <Pencil className="h-3 w-3" /> Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] gap-1"
                          onClick={() => onImportOCR?.(ex.id)}
                        >
                          <ScanLine className="h-3 w-3" /> OCR
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive ml-auto"
                          onClick={() => {
                            if (confirm(`Supprimer l'exercice "${ex.title}" ?`)) {
                              onDeleteExercise?.(ex.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {isAdmin && (
              <div className="p-3 border-t border-border/50 bg-muted/20 shrink-0 space-y-2">
                <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground px-1">Espace admin</p>
                <Button
                  onClick={onCreateManual}
                  variant="default"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <Plus className="h-4 w-4" /> Créer un exercice manuel (QCM/QIM)
                </Button>
                <Button
                  onClick={onImportOcr}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <Upload className="h-4 w-4" /> Importer via OCR (PDF/image)
                </Button>
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
