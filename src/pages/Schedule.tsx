import { useState, useEffect, useCallback } from "react";
import { addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { CalendarHeader, type CalendarView } from "@/components/calendar/CalendarHeader";
import { MonthView, type CalendarEvent } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventFormDialog, type EventFormData } from "@/components/calendar/EventFormDialog";

interface DbSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function Schedule() {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [subjects, setSubjects] = useState<DbSubject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitialDate, setDialogInitialDate] = useState<Date | undefined>();
  const [dialogInitialHour, setDialogInitialHour] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  // Fetch subjects
  useEffect(() => {
    supabase.from("subjects").select("id, name, icon, color").then(({ data }) => {
      if (data) setSubjects(data);
    });
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("user_id", user.id)
      .eq("deleted_by_user", false);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de charger les événements", variant: "destructive" });
    } else {
      setEvents(
        (data || []).map((b: any) => ({
          id: b.id,
          title: b.title,
          description: b.description || "",
          scheduled_date: b.scheduled_date,
          start_hour: b.start_hour,
          start_minutes: b.start_minutes || 0,
          end_hour: b.end_hour,
          end_minutes: b.end_minutes || 0,
          duration_minutes: b.duration_minutes,
          color: b.color || "#3B82F6",
          tags: b.tags || [],
          completed: b.completed,
          type: b.type,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Navigation
  const goNext = () => {
    if (view === "month") setCurrentDate(prev => addMonths(prev, 1));
    else if (view === "week") setCurrentDate(prev => addWeeks(prev, 1));
    else setCurrentDate(prev => addDays(prev, 1));
  };
  const goPrev = () => {
    if (view === "month") setCurrentDate(prev => subMonths(prev, 1));
    else if (view === "week") setCurrentDate(prev => subWeeks(prev, 1));
    else setCurrentDate(prev => subDays(prev, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // Open dialog
  const openAddEvent = (date?: Date, hour?: number) => {
    setDialogInitialDate(date);
    setDialogInitialHour(hour);
    setDialogOpen(true);
  };

  // Create event(s)
  const handleCreateEvent = async (data: EventFormData) => {
    if (!user) return;

    const [startH, startM] = data.startTime.split(":").map(Number);
    const [endH, endM] = data.endTime.split(":").map(Number);
    const durationMin = (endH * 60 + endM) - (startH * 60 + startM);

    const baseEvent = {
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      start_hour: startH,
      start_minutes: startM,
      end_hour: endH,
      end_minutes: endM,
      duration_minutes: Math.max(durationMin, 15),
      color: data.color,
      tags: data.tags,
      type: "Découverte" as string,
    };

    // Collect all dates: base + spaced repetition + recurrence
    const dates: string[] = [data.startDate];
    const baseDate = parseISO(data.startDate);

    // Spaced repetition
    for (const d of data.spacedRepetitionDays) {
      dates.push(format(addDays(baseDate, d), "yyyy-MM-dd"));
    }

    // Recurrence
    if (data.recurrenceEveryNDays && data.recurrenceOccurrences) {
      for (let i = 1; i < data.recurrenceOccurrences; i++) {
        dates.push(format(addDays(baseDate, data.recurrenceEveryNDays * i), "yyyy-MM-dd"));
      }
    }

    const rows = dates.map(d => ({ ...baseEvent, scheduled_date: d }));

    console.log("[Schedule] Inserting rows:", rows);
    const { error } = await supabase.from("schedule_blocks").insert(rows);
    if (error) {
      console.error("[Schedule] Insert error:", error);
      toast({ title: "Erreur", description: "Impossible de créer l'événement: " + error.message, variant: "destructive" });
    } else {
      toast({ title: "Événement créé", description: `${rows.length} événement${rows.length > 1 ? "s" : ""} ajouté${rows.length > 1 ? "s" : ""}` });
      setDialogOpen(false);
      fetchEvents();
    }
  };

  // Event click -> toggle completion
  const handleEventClick = async (event: CalendarEvent) => {
    const { error } = await supabase
      .from("schedule_blocks")
      .update({ completed: !event.completed })
      .eq("id", event.id);
    if (!error) fetchEvents();
  };

  // Day click -> switch to day view or open dialog
  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView("day");
  };

  const handleSlotClick = (date: Date, hour: number) => openAddEvent(date, hour);
  const handleDaySlotClick = (hour: number) => openAddEvent(currentDate, hour);

  return (
    <div className="space-y-4">
      <CalendarHeader
        currentDate={currentDate}
        view={view}
        onViewChange={setView}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onAddEvent={() => openAddEvent()}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          {view === "month" && <MonthView currentDate={currentDate} events={events} onDayClick={handleDayClick} onEventClick={handleEventClick} />}
          {view === "week" && <WeekView currentDate={currentDate} events={events} onSlotClick={handleSlotClick} onEventClick={handleEventClick} />}
          {view === "day" && <DayView currentDate={currentDate} events={events} onSlotClick={handleDaySlotClick} onEventClick={handleEventClick} />}
        </>
      )}

      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreateEvent}
        subjects={subjects}
        initialDate={dialogInitialDate}
        initialHour={dialogInitialHour}
      />
    </div>
  );
}
