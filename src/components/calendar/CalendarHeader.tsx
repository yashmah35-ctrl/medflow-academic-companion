import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type CalendarView = "month" | "week" | "day";

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddEvent: () => void;
}

export function CalendarHeader({ currentDate, view, onViewChange, onPrev, onNext, onToday, onAddEvent }: CalendarHeaderProps) {
  const viewLabels: Record<CalendarView, string> = { month: "Mois", week: "Semaine", day: "Jour" };

  const title = view === "month"
    ? format(currentDate, "MMMM yyyy", { locale: fr })
    : view === "week"
    ? `Semaine du ${format(currentDate, "d MMMM yyyy", { locale: fr })}`
    : format(currentDate, "EEEE d MMMM yyyy", { locale: fr });

  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground capitalize">{title}</h1>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={onNext} className="h-9 w-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <Button variant="outline" size="sm" onClick={onToday} className="text-xs">Aujourd'hui</Button>
      </div>

      <div className="flex items-center gap-3">
        {/* View switcher */}
        <div className="flex bg-muted rounded-lg p-0.5">
          {(["month", "week", "day"] as CalendarView[]).map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>

        <Button onClick={onAddEvent} className="gap-2">
          <Plus className="h-4 w-4" /> Nouvel événement
        </Button>
      </div>
    </div>
  );
}
