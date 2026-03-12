import { useState, useMemo, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ExercisePanel } from "@/components/training/ExercisePanel";

// In-memory cache for signed URLs so re-opening is instant
const urlCache = new Map<string, { url: string; expires: number }>();

function getCachedUrl(key: string): string | null {
  const entry = urlCache.get(key);
  if (!entry) return null;
  // Expired if less than 2 min remaining
  if (Date.now() > entry.expires - 120_000) {
    urlCache.delete(key);
    return null;
  }
  return entry.url;
}

export function cacheSignedUrl(fileKey: string, signedUrl: string, ttlSeconds = 900) {
  urlCache.set(fileKey, { url: signedUrl, expires: Date.now() + ttlSeconds * 1000 });
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
}

function DocumentSkeleton() {
  return (
    <div className="absolute inset-0 flex flex-col items-center p-8 gap-6 bg-background/90 backdrop-blur-sm z-10">
      {/* Fake document header */}
      <div className="w-full max-w-2xl space-y-4 mt-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
      {/* Fake paragraphs */}
      <div className="w-full max-w-2xl space-y-3 flex-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-4"
            style={{ width: `${65 + Math.random() * 35}%` }}
          />
        ))}
        <div className="pt-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`b${i}`}
            className="h-4"
            style={{ width: `${55 + Math.random() * 45}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function SecurePdfViewer({ open, onOpenChange, signedUrl, title, fileName, subjectId, subjectName, courseId }: SecurePdfViewerProps) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  const isDocx = useMemo(() => {
    if (fileName) return /\.docx?$/i.test(fileName);
    if (signedUrl) {
      try {
        const urlPath = new URL(signedUrl).pathname;
        return /\.docx?$/i.test(urlPath);
      } catch { return false; }
    }
    return false;
  }, [fileName, signedUrl]);

  const iframeSrc = useMemo(() => {
    if (!signedUrl) return null;
    if (isPdf) return signedUrl;
    // Use Microsoft Office Online for .docx — faster and more reliable than Google Docs Viewer
    if (isDocx) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`;
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`;
  }, [signedUrl, isPdf, isDocx]);

  // Cache the URL when we get one
  useEffect(() => {
    if (signedUrl && fileName) {
      cacheSignedUrl(fileName, signedUrl);
    }
  }, [signedUrl, fileName]);

  // Auto-dismiss skeleton after timeout (fallback for when onLoad doesn't fire)
  useEffect(() => {
    if (!open || !iframeSrc) return;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 5000);
    return () => clearTimeout(timer);
  }, [open, iframeSrc]);

  const showExercisePanel = !!subjectId;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setLoading(true); }}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden border-border/50 bg-card shadow-2xl"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
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

        {/* Content */}
        <div className="flex flex-1" style={{ height: "calc(92vh - 60px)" }}>
          <div
            className={`relative select-none bg-muted/20 ${showExercisePanel ? "flex-1" : "w-full"}`}
            onContextMenu={(e) => e.preventDefault()}
            style={{ userSelect: "none", WebkitUserSelect: "none" }}
          >
            {loading && <DocumentSkeleton />}
            {iframeSrc && (
              <iframe
                ref={iframeRef}
                key={iframeSrc}
                src={iframeSrc}
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                sandbox={isPdf ? undefined : "allow-same-origin allow-scripts allow-popups"}
                title={title}
                style={{ pointerEvents: "auto" }}
              />
            )}
          </div>

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
