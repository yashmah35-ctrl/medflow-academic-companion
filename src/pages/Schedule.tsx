import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scheduleBlocks, days, subjectColorMap } from "@/data/mockData";
import { Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const hours = Array.from({ length: 24 }, (_, i) => i);

const typeColors: Record<string, string> = {
  Découverte: "bg-info/10 text-info",
  Révision: "bg-warning/10 text-warning",
  Flashcards: "bg-primary/10 text-primary",
  "Erreurs à revoir": "bg-destructive/10 text-destructive",
};

export default function Schedule() {
  const [blocks, setBlocks] = useState(scheduleBlocks);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const behindSchedule = false;

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDragStart = (blockId: string) => {
    setDraggedBlock(blockId);
  };

  const handleDrop = (dayIdx: number, hour: number) => {
    if (!draggedBlock) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === draggedBlock ? { ...b, day: dayIdx, hour } : b))
    );
    setDraggedBlock(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Emploi du Temps</h1>
        <p className="text-muted-foreground mt-1">
          Ton planning de révision intelligent basé sur la répétition espacée.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          behindSchedule ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success/5"
        }`}
      >
        {behindSchedule ? <AlertCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-success" />}
        <p className="text-sm font-medium">
          {behindSchedule ? "Tu as du retard sur ton planning. Il est temps de s'y remettre !" : "Tu es à jour ! Continue comme ça 💪"}
        </p>
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
                return (
                  <motion.div
                    key={dayIdx}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`min-h-[52px] rounded-lg ${colors.light} border border-border/30 p-2 flex flex-col justify-between group cursor-grab active:cursor-grabbing`}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dayIdx, hour)}
                  >
                    <div>
                      <p className="text-xs font-medium text-foreground leading-tight line-clamp-2">{block.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{block.duration}</p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <Badge className={`text-[9px] px-1.5 py-0 ${typeColors[block.type]}`} variant="secondary">{block.type}</Badge>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
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
