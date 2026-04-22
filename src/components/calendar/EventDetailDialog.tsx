import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Clock, Timer, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "./MonthView";
import { resolveEventColor } from "./MonthView";

interface EventDetailDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onToggleComplete?: (event: CalendarEvent) => void;
}

export function EventDetailDialog({ event, open, onOpenChange, onDelete, onEdit, onToggleComplete }: EventDetailDialogProps) {
  if (!event) return null;

  const dateObj = parseISO(event.scheduled_date);
  const dateStr = format(dateObj, "EEEE d MMMM yyyy", { locale: fr });
  const startStr = `${String(event.start_hour).padStart(2, "0")}:${String(event.start_minutes).padStart(2, "0")}`;
  const endStr = event.end_hour != null
    ? `${String(event.end_hour).padStart(2, "0")}:${String(event.end_minutes || 0).padStart(2, "0")}`
    : null;

  const hours = Math.floor(event.duration_minutes / 60);
  const mins = event.duration_minutes % 60;
  const durationStr = hours > 0 && mins > 0 ? `${hours}h${String(mins).padStart(2, "0")}` : hours > 0 ? `${hours}h` : `${mins}min`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">Détails de l&apos;événement</DialogTitle>
          </div>
        </DialogHeader>

        <div className="pt-2 space-y-4">
          {/* Title + color dot */}
          <div>
            <h3 className="text-xl font-bold text-foreground">{event.title}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              {event.tags?.map(t => (
                <span key={t} className="text-xs text-muted-foreground">⚙️</span>
              ))}
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: resolveEventColor(event.color) }}
              />
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>Date : <span className="text-foreground font-medium">{dateStr}</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Heure : <span className="text-foreground font-medium">{startStr}{endStr ? ` - ${endStr}` : ""}</span></span>
            </div>
            <div className="flex items-center gap-2.5">
              <Timer className="h-4 w-4 shrink-0" />
              <span>Durée : <span className="text-foreground font-medium">{durationStr}</span></span>
            </div>
          </div>

          {event.description && (
            <p className="text-sm text-muted-foreground border-t border-border pt-3">{event.description}</p>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-3">
            <Button variant="outline" onClick={() => onEdit(event)}>
              Modifier
            </Button>
            <Button
              variant="destructive"
              onClick={() => onDelete(event)}
            >
              Supprimer l&apos;événement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
