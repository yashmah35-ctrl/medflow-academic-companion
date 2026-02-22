import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface SecurePdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
  fileName?: string;
}

export function SecurePdfViewer({ open, onOpenChange, signedUrl, title, fileName }: SecurePdfViewerProps) {
  const [loading, setLoading] = useState(true);

  const isPdf = useMemo(() => {
    if (fileName) return /\.pdf$/i.test(fileName);
    // If no fileName, check the URL path
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
    // For non-PDF files (docx, etc.), use Google Docs Viewer
    return `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`;
  }, [signedUrl, isPdf]);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setLoading(true); }}>
      <DialogContent
        className="max-w-[95vw] w-[95vw] h-[90vh] p-0 gap-0"
        onContextMenu={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 py-3 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-sm font-semibold truncate pr-4">{title}</DialogTitle>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div
          className="flex-1 relative select-none"
          onContextMenu={(e) => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Chargement du document...</span>
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
      </DialogContent>
    </Dialog>
  );
}
