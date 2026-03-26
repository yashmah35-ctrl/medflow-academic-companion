import { format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "./MonthView";

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5h-22h

export function DayView({ currentDate, events, onSlotClick, onEventClick }: DayViewProps) {
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const dayEvents = events.filter(e => e.scheduled_date === dateStr);
  const today = isToday(currentDate);

  const getEventsForHour = (hour: number) => dayEvents.filter(e => e.start_hour === hour);

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border text-center">
        <div className="text-sm text-muted-foreground capitalize">{format(currentDate, "EEEE", { locale: fr })}</div>
        <div className={`text-2xl font-bold mt-1 w-10 h-10 mx-auto flex items-center justify-center rounded-full ${
          today ? "bg-primary text-primary-foreground" : "text-foreground"
        }`}>
          {format(currentDate, "d")}
        </div>
      </div>

      {/* Hours */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              onClick={() => onSlotClick(hour)}
              className="grid grid-cols-[60px_1fr] border-b border-border last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-2">
                {String(hour).padStart(2, "0")}:00
              </div>
              <div className="min-h-[56px] p-1 border-l border-border space-y-1">
                {hourEvents.map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className={`px-3 py-2 rounded-lg text-white font-medium cursor-pointer hover:opacity-80 transition-opacity ${ev.completed ? "opacity-50 line-through" : ""}`}
                    style={{ backgroundColor: ev.color }}
                  >
                    <div className="text-sm">{ev.title}</div>
                    <div className="text-xs opacity-80">
                      {String(ev.start_hour).padStart(2, "0")}:{String(ev.start_minutes).padStart(2, "0")}
                      {ev.end_hour != null && ` - ${String(ev.end_hour).padStart(2, "0")}:${String(ev.end_minutes || 0).padStart(2, "0")}`}
                    </div>
                    {ev.description && <div className="text-xs opacity-70 mt-0.5">{ev.description}</div>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
