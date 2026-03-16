import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { ExercisePanel } from "@/components/training/ExercisePanel";
import { renderAsync } from "docx-preview";

interface SecurePdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
  fileName?: string;
  subjectId?: string;
  subjectName?: string;
  courseId?: string;
}

export function SecurePdfViewer({ open, onOpenChange, signedUrl, title, fileName, subjectId, subjectName, courseId }: SecurePdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const fileType = useMemo(() => {
    const name = fileName || "";
    if (/\.pdf$/i.test(name)) return "pdf";
    if (/\.docx?$/i.test(name)) return "docx";
    // Try from URL
    if (signedUrl) {
      try {
        const urlPath = new URL(signedUrl).pathname;
        if (/\.pdf$/i.test(urlPath)) return "pdf";
        if (/\.docx?$/i.test(urlPath)) return "docx";
      } catch {}
    }
    // Default to docx since user primarily uploads Word docs
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

        if (cancelled || !docxContainerRef.current) return;

        // Clear previous content
        docxContainerRef.current.innerHTML = "";

        await renderAsync(blob, docxContainerRef.current, undefined, {
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

  // For PDF files, use sandbox to block toolbar
  const pdfSrc = useMemo(() => {
    if (!signedUrl || fileType !== "pdf") return null;
    // Add #toolbar=0 to hide the native PDF toolbar
    return signedUrl + (signedUrl.includes("#") ? "&toolbar=0" : "#toolbar=0");
  }, [signedUrl, fileType]);

  const showExercisePanel = !!subjectId;

  // Block keyboard shortcuts for downloading/printing
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+S, Ctrl+P, Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setLoading(true); setError(null); } }}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden border-border/50 bg-card shadow-2xl [&>button:last-child]:hidden"
      >
        {/* Premium header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-gradient-to-r from-card via-card to-muted/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FileText className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground truncate">{title}</h2>
              <p className="text-xs text-muted-foreground">Consultation en lecture seule</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content area */}
        <div className="flex flex-1" style={{ height: "calc(92vh - 60px)" }}>
          {/* Document area */}
          <div
            className={`relative select-none bg-muted/20 ${showExercisePanel ? "flex-1" : "w-full"}`}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {/* Loading spinner */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Chargement du document</p>
                  <p className="text-xs text-muted-foreground mt-1">Veuillez patienter...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 gap-3">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-destructive font-medium">{error}</p>
                <p className="text-xs text-muted-foreground">Impossible d'afficher ce document</p>
              </div>
            )}

            {/* DOCX Viewer */}
            {fileType === "docx" && signedUrl && (
              <div
                ref={docxContainerRef}
                className="w-full h-full overflow-auto docx-secure-container"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              />
            )}

            {/* PDF Viewer (fallback with toolbar hidden) */}
            {fileType === "pdf" && pdfSrc && (
              <iframe
                key={pdfSrc}
                src={pdfSrc}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                title={title}
                style={{ pointerEvents: "auto" }}
              />
            )}
          </div>

          {/* Exercise Panel on the right */}
          {showExercisePanel && (
            <div className="w-[380px] shrink-0 border-l border-border/50 bg-card overflow-hidden">
              <ExercisePanel
                subjectId={subjectId!}
                courseId={courseId}
                subjectName={subjectName || ""}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
