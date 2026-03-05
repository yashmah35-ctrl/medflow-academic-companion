import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { AMINO_ACIDS, CATEGORY_COLORS } from "@/data/aminoAcids";

export default function FlashcardsMode() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const aa = AMINO_ACIDS[index];

  const next = () => { setFlipped(false); setIndex((i) => (i + 1) % AMINO_ACIDS.length); };
  const prev = () => { setFlipped(false); setIndex((i) => (i - 1 + AMINO_ACIDS.length) % AMINO_ACIDS.length); };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Progress */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{index + 1}</span>
        <span>/</span>
        <span>{AMINO_ACIDS.length}</span>
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-md cursor-pointer select-none"
        style={{ perspective: 1000, minHeight: 360 }}
        onClick={() => setFlipped((f) => !f)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped}`}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 shadow-lg bg-card p-6"
            style={{ borderColor: CATEGORY_COLORS[aa.category] + "40" }}
          >
            {!flipped ? (
              /* FRONT: Name + code */
              <div className="flex flex-col items-center justify-center gap-4 min-h-[300px]">
                <span
                  className="text-xs font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[aa.category] + "20", color: CATEGORY_COLORS[aa.category] }}
                >
                  {aa.categoryLabel}
                </span>
                <h2 className="text-3xl font-bold text-foreground">{aa.name}</h2>
                <div className="flex gap-3 text-lg">
                  <span className="font-mono bg-muted px-3 py-1 rounded-lg">{aa.code3}</span>
                  <span className="font-mono bg-muted px-3 py-1 rounded-lg font-bold">{aa.code1}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">Clique pour voir la structure →</p>
              </div>
            ) : (
              /* BACK: Structure + properties */
              <div className="flex flex-col items-center gap-3 min-h-[300px]">
                <h3 className="text-lg font-semibold text-foreground">{aa.name} ({aa.code1})</h3>
                <div className="w-48 h-40">{aa.structure}</div>
                <div className="text-center space-y-2">
                  <div className="flex gap-4 text-xs text-muted-foreground justify-center">
                    <span>PM : <b>{aa.mw}</b> Da</span>
                    <span>pI : <b>{aa.pI}</b></span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{aa.properties}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Clique pour retourner ←</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={() => setFlipped(false)}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Dot indicators */}
      <div className="flex flex-wrap gap-1 justify-center max-w-md">
        {AMINO_ACIDS.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFlipped(false); setIndex(i); }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === index ? "bg-primary scale-125" : "bg-muted-foreground/30"}`}
          />
        ))}
      </div>
    </div>
  );
}
