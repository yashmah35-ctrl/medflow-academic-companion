import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { scheduleBlocks, days, subjectColorMap, subjects, type SubjectColor, type ScheduleBlock } from "@/data/mockData";
import { Trash2, AlertCircle, CheckCircle2, Plus, Circle, CircleDot, CircleCheck } from "lucide-react";
import { useState, useEffect } from "react";

const hours = Array.from({ length: 24 }, (_, i) => i);

const typeColors: Record<string, string> = {
  Découverte: "bg-info/10 text-info",
  Révision: "bg-warning/10 text-warning",
  Flashcards: "bg-primary/10 text-primary",
  "Erreurs à revoir": "bg-destructive/10 text-destructive",
};

type CompletionStatus = "not_done" | "partial" | "done";

const completionConfig: Record<CompletionStatus, { icon: typeof Circle; label: string; className: string }> = {
  not_done: { icon: Circle, label: "Pas fait", className: "text-muted-foreground hover:text-destructive" },
  partial: { icon: CircleDot, label: "Partiellement", className: "text-warning" },
  done: { icon: CircleCheck, label: "Terminé", className: "text-success" },
};

const statusCycle: CompletionStatus[] = ["not_done", "partial", "done"];

const blockTypes: ScheduleBlock["type"][] = ["Découverte", "Révision", "Flashcards", "Erreurs à revoir"];

export default function Schedule() {
  const [blocks, setBlocks] = useState(scheduleBlocks);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [completionMap, setCompletionMap] = useState<Record<string, CompletionStatus>>(() => {
    try {
      const saved = localStorage.getItem("schedule-completion");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  // New block form state
  const [newTitle, setNewTitle] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState<SubjectColor>("chemistry");
  const [newHours, setNewHours] = useState(1);
  const [newMinutes, setNewMinutes] = useState(0);
  const [newType, setNewType] = useState<ScheduleBlock["type"]>("Découverte");
  const [newDay, setNewDay] = useState(0);
  const [newHour, setNewHour] = useState(8);

  // Compute progress status
  const totalBlocks = blocks.length;
  const doneCount = Object.values(completionMap).filter((s) => s === "done").length;
  const partialCount = Object.values(completionMap).filter((s) => s === "partial").length;
  const progressRatio = totalBlocks > 0 ? (doneCount + partialCount * 0.5) / totalBlocks : 0;
  const behindSchedule = totalBlocks > 0 && progressRatio < 0.5;

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setCompletionMap((prev) => {
      const next = { ...prev };
      delete next[id];
      localStorage.setItem("schedule-completion", JSON.stringify(next));
      return next;
    });
  };

  const cycleCompletion = (id: string) => {
    setCompletionMap((prev) => {
      const current = prev[id] || "not_done";
      const idx = statusCycle.indexOf(current);
      const next = statusCycle[(idx + 1) % statusCycle.length];
      const updated = { ...prev, [id]: next };
      localStorage.setItem("schedule-completion", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDragStart = (blockId: string) => setDraggedBlock(blockId);

  const handleDrop = (dayIdx: number, hour: number) => {
    if (!draggedBlock) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === draggedBlock ? { ...b, day: dayIdx, hour } : b))
    );
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleAddBlock = () => {
    if (!newTitle.trim()) return;
    const durationStr =
      newHours > 0 && newMinutes > 0
        ? `${newHours}h${String(newMinutes).padStart(2, "0")}`
        : newHours > 0
        ? `${newHours}h`
        : `${newMinutes}min`;

    const newBlock: ScheduleBlock = {
      id: `manual-${Date.now()}`,
      subjectColor: newSubjectColor,
      title: newTitle.trim(),
      duration: durationStr,
      type: newType,
      day: newDay,
      hour: newHour,
    };
    setBlocks((prev) => [...prev, newBlock]);
    setNewTitle("");
    setNewHours(1);
    setNewMinutes(0);
    setNewType("Découverte");
    setDialogOpen(false);
  };

  const subjectOptions = subjects.map((s) => ({ name: s.name, color: s.color as SubjectColor, icon: s.icon }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emploi du Temps</h1>
          <p className="text-muted-foreground mt-1">
            Ton planning de révision intelligent basé sur la répétition espacée.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ajouter un bloc
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une session</DialogTitle>
              <DialogDescription>Crée un bloc de révision personnalisé dans ton emploi du temps.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input placeholder="Ex: Chimie Organique - Chap 3" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Matière</Label>
                <Select value={newSubjectColor} onValueChange={(v) => setNewSubjectColor(v as SubjectColor)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((s) => (
                      <SelectItem key={s.color + s.name} value={s.color}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heures</Label>
                  <Input type="number" min={0} max={12} value={newHours} onChange={(e) => setNewHours(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Minutes</Label>
                  <Input type="number" min={0} max={59} step={5} value={newMinutes} onChange={(e) => setNewMinutes(Number(e.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as ScheduleBlock["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {blockTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jour</Label>
                  <Select value={String(newDay)} onValueChange={(v) => setNewDay(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {days.slice(0, 7).map((d, i) => (
                        <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Heure</Label>
                  <Select value={String(newHour)} onValueChange={(v) => setNewHour(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hours.map((h) => (
                        <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleAddBlock} disabled={!newTitle.trim()}>
                Ajouter au planning
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          behindSchedule ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"
        }`}
      >
        {behindSchedule ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-success" />}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {behindSchedule
              ? "Tu as du retard sur ton planning. Il est temps de s'y remettre !"
              : "Tu es à jour ! Continue comme ça 💪"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doneCount} terminé{doneCount > 1 ? "s" : ""} · {partialCount} partiel{partialCount > 1 ? "s" : ""} · {totalBlocks - doneCount - partialCount} restant{totalBlocks - doneCount - partialCount > 1 ? "s" : ""} — Clique sur le ● pour marquer l'avancement
          </p>
        </div>
      </motion.div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-1 mb-2">
            <div className="text-xs text-muted-foreground font-medium p-2">Heure</div>
            {days.slice(0, 7).map((day, i) => (
              <div key={i} className="text-xs text-muted-foreground font-medium p-2 text-center">{day}</div>
            ))}
          </div>

          {hours.map((hour) => (
            <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
              <div className="text-xs text-muted-foreground p-2 flex items-start">
                {String(hour).padStart(2, "0")}:00
              </div>
              {Array.from({ length: 7 }, (_, dayIdx) => {
                const block = blocks.find((b) => b.day === dayIdx && b.hour === hour);
                if (!block) {
                  return (
                    <div
                      key={dayIdx}
                      className="min-h-[52px] rounded-lg border border-border/40 bg-muted/20"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(dayIdx, hour)}
                    />
                  );
                }
                const colors = subjectColorMap[block.subjectColor];
                const status = completionMap[block.id] || "not_done";
                const StatusIcon = completionConfig[status].icon;

                return (
                  <motion.div
                    key={dayIdx}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`min-h-[52px] rounded-lg ${colors.light} border border-border/30 p-2 flex flex-col justify-between group cursor-grab active:cursor-grabbing ${status === "done" ? "opacity-60" : ""}`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dayIdx, hour)}
                  >
                    <div>
                      <p className={`text-xs font-medium text-foreground leading-tight line-clamp-2 ${status === "done" ? "line-through" : ""}`}>{block.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{block.duration}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge className={`text-[9px] px-1.5 py-0 ${typeColors[block.type]}`} variant="secondary">{block.type}</Badge>
                      <div className="flex gap-0.5 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-5 w-5 ${completionConfig[status].className}`}
                          onClick={(e) => { e.stopPropagation(); cycleCompletion(block.id); }}
                          title={completionConfig[status].label}
                        >
                          <StatusIcon className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
