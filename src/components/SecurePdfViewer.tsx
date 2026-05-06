import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText, Plus, Upload, Play, CheckCircle2 } from "lucide-react";
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
          <div
            className="relative select-none bg-muted/20 w-full overflow-auto"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
