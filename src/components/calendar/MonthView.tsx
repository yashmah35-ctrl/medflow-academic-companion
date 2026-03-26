import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, format, isToday } from "date-fns";
import { fr } from "date-fns/locale";

// Map subject color keys to actual HSL values for inline styles
const SUBJECT_COLOR_HEX: Record<string, string> = {
  chemistry: "hsl(340, 75%, 55%)",
  cellbio: "hsl(45, 85%, 50%)",
  biophysics: "hsl(175, 65%, 38%)",
  anatomy: "hsl(25, 65%, 50%)",
  histology: "hsl(270, 55%, 55%)",
  physiology: "hsl(145, 55%, 38%)",
  pharmacology: "hsl(210, 60%, 50%)",
  embryology: "hsl(15, 70%, 55%)",
  biomolgen: "hsl(280, 60%, 50%)",
  shs: "hsl(260, 45%, 50%)",
  biostatistique: "hsl(200, 70%, 45%)",
  medicament: "hsl(350, 60%, 58%)",
  santepublique: "hsl(0, 55%, 50%)",
  microbiologie: "hsl(80, 55%, 40%)",
  specialite: "hsl(210, 40%, 55%)",
};

export function resolveEventColor(color: string): string {
  if (SUBJECT_COLOR_HEX[color]) return SUBJECT_COLOR_HEX[color];
  if (color.startsWith("#") || color.startsWith("hsl") || color.startsWith("rgb")) return color;
  return "#3B82F6";
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  scheduled_date: string;
  start_hour: number;
  start_minutes: number;
  end_hour?: number;
  end_minutes?: number;
  duration_minutes: number;
  color: string;
  tags: string[];
  completed: boolean;
  type: string;
}

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function MonthView({ currentDate, events, onDayClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.filter(e => e.scheduled_date === dateStr);
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {dayNames.map(d => (
          <div key={d} className="py-2.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayEvents = getEventsForDay(day);
          const inMonth = isSameMonth(day, currentDate);
          const today = isToday(day);

          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer hover:bg-muted/50 transition-colors ${
                !inMonth ? "bg-muted/30" : ""
              }`}
            >
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                today ? "bg-primary text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground/50"
              }`}>
                {format(day, "d")}
              </div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); onEventClick(ev); }}
                    className={`text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white font-medium cursor-pointer hover:opacity-80 transition-opacity ${ev.completed ? "opacity-50 line-through" : ""}`}
                    style={{ backgroundColor: resolveEventColor(ev.color) }}
                  >
                    {String(ev.start_hour).padStart(2, "0")}:{String(ev.start_minutes).padStart(2, "0")} {ev.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1.5">+{dayEvents.length - 3} de plus</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
