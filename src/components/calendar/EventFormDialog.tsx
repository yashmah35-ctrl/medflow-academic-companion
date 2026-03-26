import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import { format } from "date-fns";

const PRESET_COLORS = [
  "#3B82F6", "#EF4444", "#10B981", "#F59E0B",
  "#8B5CF6", "#06B6D4", "#F97316", "#84CC16", "#EC4899",
];

const SPACED_REPETITION_DAYS = [1, 3, 5, 6, 10, 15, 30, 45, 60];

interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  subjectId: string | null;
  color: string;
  tags: string[];
  spacedRepetitionDays: number[];
  recurrenceEveryNDays: number | null;
  recurrenceOccurrences: number | null;
}

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EventFormData) => void;
  subjects: Subject[];
  initialDate?: Date;
  initialHour?: number;
}

export function EventFormDialog({ open, onOpenChange, onSubmit, subjects, initialDate, initialHour }: EventFormDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [customColor, setCustomColor] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [spacedDays, setSpacedDays] = useState<number[]>([]);
  const [customJ, setCustomJ] = useState("");
  const [recurrenceN, setRecurrenceN] = useState<string>("");
  const [recurrenceOcc, setRecurrenceOcc] = useState<string>("");

  // Reset form with correct initial values when dialog opens
  useState(() => {});
  if (open && !startDate) {
    const now = initialDate || new Date();
    const hour = initialHour ?? now.getHours();
    setStartDate(format(now, "yyyy-MM-dd"));
    setStartTime(`${String(hour).padStart(2, "0")}:00`);
    setEndDate(format(now, "yyyy-MM-dd"));
    setEndTime(`${String(Math.min(hour + 1, 23)).padStart(2, "0")}:00`);
  }

  const resetForm = () => {
    setTitle(""); setDescription(""); setSubjectId(null); setCustomColor("");
    setTags([]); setNewTag(""); setSpacedDays([]); setCustomJ("");
    setRecurrenceN(""); setRecurrenceOcc("");
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const selectedSubject = subjects.find(s => s.id === subjectId);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      startDate, startTime, endDate, endTime,
      subjectId,
      color: customColor || (selectedSubject ? selectedSubject.color : "#3B82F6"),
      tags,
      spacedRepetitionDays: spacedDays,
      recurrenceEveryNDays: recurrenceN ? Number(recurrenceN) : null,
      recurrenceOccurrences: recurrenceOcc ? Number(recurrenceOcc) : null,
    });
    resetForm();
  };

  const toggleSpacedDay = (d: number) => {
    setSpacedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const addCustomJ = () => {
    const n = parseInt(customJ);
    if (n > 0 && !spacedDays.includes(n)) {
      setSpacedDays(prev => [...prev, n].sort((a, b) => a - b));
      setCustomJ("");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-lg font-semibold">Nouvel événement</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Titre</Label>
            <Input placeholder="Titre de l'événement" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Description (optionnelle)</Label>
            <Textarea placeholder="Description de l'événement..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold">Début</Label>
              <Input type="datetime-local" value={`${startDate}T${startTime}`} onChange={(e) => { const [d, t] = e.target.value.split("T"); setStartDate(d); setStartTime(t); }} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Fin</Label>
              <Input type="datetime-local" value={`${endDate}T${endTime}`} onChange={(e) => { const [d, t] = e.target.value.split("T"); setEndDate(d); setEndTime(t); }} />
            </div>
          </div>

          {/* Subject & Color */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            💡 Choisissez soit une matière (avec sa couleur), soit une couleur personnalisée
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-semibold">Matière</Label>
              <Select value={subjectId || ""} onValueChange={(v) => { setSubjectId(v || null); setCustomColor(""); }}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une matière" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.icon} {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Couleur personnalisée</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={`h-7 w-7 rounded-full border-2 transition-all ${customColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                    onClick={() => { setCustomColor(c); setSubjectId(null); }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Tags</Label>
            <div className="flex gap-2">
              <Input placeholder="Nouveau tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
              <Button type="button" size="icon" className="shrink-0 bg-primary" onClick={addTag}><Plus className="h-4 w-4" /></Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(t => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t} <X className="h-3 w-3 cursor-pointer" onClick={() => setTags(prev => prev.filter(x => x !== t))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Spaced Repetition */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Répétition espacée</Label>
            <div className="flex flex-wrap gap-2">
              {SPACED_REPETITION_DAYS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleSpacedDay(d)}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    spacedDays.includes(d) ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  J{d}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input placeholder="Ajouter un J (ex: 2)" value={customJ} onChange={(e) => setCustomJ(e.target.value)} className="w-40" />
              <Button type="button" size="sm" onClick={addCustomJ} className="bg-primary">Ajouter</Button>
            </div>
            <p className="text-xs text-muted-foreground">Les répétitions sélectionnées créeront des événements supplémentaires à J+N jours à la même heure.</p>
          </div>

          {/* Recurrence */}
          <div className="space-y-1.5">
            <Label className="font-semibold">Récurrence</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Tous les N jours</span>
                <Input placeholder="N (jours)" value={recurrenceN} onChange={(e) => setRecurrenceN(e.target.value)} />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Nombre d'occurrences</span>
                <Input placeholder="Ex: 5" value={recurrenceOcc} onChange={(e) => setRecurrenceOcc(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Ex.: Tous les 2 jours pendant 5 occurrences créera 4 événements supplémentaires à J+2, J+4, J+6, J+8.</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => { onOpenChange(false); resetForm(); }}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={!title.trim()} className="bg-primary">Ajouter</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
