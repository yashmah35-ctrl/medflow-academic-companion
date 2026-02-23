import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X, FileText } from "lucide-react";
import { ExercisePanel } from "@/components/training/ExercisePanel";

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

  const isPdf = useMemo(() => {
    if (fileName) return /\.pdf$/i.test(fileName);
    if (signedUrl) {
      try {
        const urlPath = new URL(signedUrl).pathname;
        return /\.pdf$/i.test(urlPath);
      } catch { return true; }
    }
    return true;
  }, [fileName, signedUrl]);

  const iframeSrc = useMemo(() => {
    if (!signedUrl) return null;
    if (isPdf) {
      return `${signedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`;
  }, [signedUrl, isPdf]);

  const showExercisePanel = !!subjectId;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setLoading(true); }}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden border-border/50 bg-card shadow-2xl"
        onContextMenu={(e) => e.preventDefault()}
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

        {/* Content area: PDF + Exercise Panel */}
        <div className="flex flex-1" style={{ height: "calc(92vh - 60px)" }}>
          {/* Document area */}
          <div
            className={`relative select-none bg-muted/20 ${showExercisePanel ? "flex-1" : "w-full"}`}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
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
            {iframeSrc && (
              <iframe
                src={iframeSrc}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                sandbox="allow-same-origin allow-scripts allow-popups"
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
