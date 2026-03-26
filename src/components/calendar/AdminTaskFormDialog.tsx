import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16", "#EC4899",
];

export interface AdminTaskFormData {
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  color: string;
}

interface AdminTaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AdminTaskFormData) => void;
  initialDate?: Date;
  initialHour?: number;
}

export function AdminTaskFormDialog({ open, onOpenChange, onSubmit, initialDate, initialHour }: AdminTaskFormDialogProps) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [customColor, setCustomColor] = useState("");

  useEffect(() => {
    if (open) {
      const now = initialDate || new Date();
      const hour = initialHour ?? now.getHours();
      setTitle("");
      setStartDate(format(now, "yyyy-MM-dd"));
      setStartTime(`${String(hour).padStart(2, "0")}:00`);
      setEndDate(format(now, "yyyy-MM-dd"));
      setEndTime(`${String(Math.min(hour + 1, 23)).padStart(2, "0")}:00`);
      setCustomColor("");
    }
  }, [open, initialDate, initialHour]);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
      color: customColor || "#3B82F6",
    });
    setTitle("");
    setCustomColor("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary-foreground" />
            </div>
            <DialogTitle className="text-lg font-semibold">Nouvelle tâche</DialogTitle>
          </div>
          <DialogDescription className="sr-only">Formulaire de création de tâche</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Task name */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Tâche</Label>
            <Input
              placeholder="Nom de la tâche..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold">Début</Label>
              <Input
                type="datetime-local"
                value={`${startDate}T${startTime}`}
                onChange={(e) => { const [d, t] = e.target.value.split("T"); setStartDate(d); setStartTime(t); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Fin</Label>
              <Input
                type="datetime-local"
                value={`${endDate}T${endTime}`}
                onChange={(e) => { const [d, t] = e.target.value.split("T"); setEndDate(d); setEndTime(t); }}
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Couleur</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`h-7 w-7 rounded-full border-2 transition-all ${customColor === c ? "border-foreground scale-110 ring-2 ring-primary/30" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setCustomColor(prev => prev === c ? "" : c)}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!title.trim()} className="bg-primary">Ajouter</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
