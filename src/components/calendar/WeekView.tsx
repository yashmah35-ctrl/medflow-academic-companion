import { startOfWeek, addDays, format, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import type { CalendarEvent } from "./MonthView";

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onSlotClick: (date: Date, hour: number) => void;
  onEventClick: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h-21h

export function WeekView({ currentDate, events, onSlotClick, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDayHour = (date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter(e => e.scheduled_date === dateStr && e.start_hour === hour);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="p-2" />
        {weekDays.map((d, i) => {
          const today = isToday(d);
          return (
            <div key={i} className="p-2 text-center border-l border-border">
              <div className="text-xs text-muted-foreground">{format(d, "EEE", { locale: fr })}</div>
              <div className={`text-sm font-semibold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                today ? "bg-primary text-primary-foreground" : "text-foreground"
              }`}>
                {format(d, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {HOURS.map(hour => (
          <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0">
            <div className="p-2 text-xs text-muted-foreground text-right pr-3 pt-1">
              {String(hour).padStart(2, "0")}:00
            </div>
            {weekDays.map((day, di) => {
              const cellEvents = getEventsForDayHour(day, hour);
              return (
                <div
                  key={di}
                  onClick={() => onSlotClick(day, hour)}
                  className="min-h-[52px] border-l border-border p-0.5 cursor-pointer hover:bg-muted/30 transition-colors relative"
                >
                  {cellEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                      className={`text-[11px] px-1.5 py-1 rounded text-white font-medium truncate cursor-pointer hover:opacity-80 ${ev.completed ? "opacity-50 line-through" : ""}`}
                      style={{ backgroundColor: ev.color }}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
