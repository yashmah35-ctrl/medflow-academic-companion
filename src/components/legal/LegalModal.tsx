import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function LegalModal({ open, onOpenChange, title, subtitle, children }: LegalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 bg-white text-[#1a1a1a]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-[#1a1a1a]">{title}</DialogTitle>
          {subtitle && <DialogDescription className="text-sm text-gray-500">{subtitle}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] px-6 py-4">
          <div className="prose prose-sm max-w-none prose-headings:text-[#1a1a1a] prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-[#1a1a1a]">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
