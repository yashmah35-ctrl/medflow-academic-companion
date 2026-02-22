import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

interface SecurePdfViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signedUrl: string | null;
  title: string;
}

export function SecurePdfViewer({ open, onOpenChange, signedUrl, title }: SecurePdfViewerProps) {
  const [loading, setLoading] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {signedUrl && (
            <iframe
              src={`${signedUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              sandbox="allow-same-origin allow-scripts"
              title={title}
              style={{ pointerEvents: "auto" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
