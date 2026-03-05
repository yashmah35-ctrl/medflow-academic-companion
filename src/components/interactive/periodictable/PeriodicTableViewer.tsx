import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Atom, Heart, AlertTriangle, Sparkles } from "lucide-react";
import { ELEMENTS, type Element } from "@/data/medicalElements";

const CATEGORY_STYLES: Record<Element["category"], { bg: string; border: string; text: string; label: string }> = {
  essential: { bg: "bg-blue-500/20", border: "border-blue-400/60", text: "text-blue-300", label: "Essentiel majeur" },
  trace: { bg: "bg-emerald-500/20", border: "border-emerald-400/60", text: "text-emerald-300", label: "Oligo-élément" },
  toxic: { bg: "bg-red-500/20", border: "border-red-400/60", text: "text-red-300", label: "Élément toxique" },
  other: { bg: "bg-muted/40", border: "border-border", text: "text-muted-foreground", label: "" },
};

function ElementCell({ el, onClick, isSelected }: { el: Element; onClick: () => void; isSelected: boolean }) {
  const style = CATEGORY_STYLES[el.category];
  const hasMedical = !!el.medical;

  return (
    <button
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center rounded-md border transition-all duration-200
        ${style.bg} ${style.border}
        ${hasMedical ? "cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg" : "cursor-default opacity-50"}
        ${isSelected ? "ring-2 ring-primary scale-110 z-10" : ""}
      `}
      style={{ width: "100%", aspectRatio: "1", minWidth: 0, padding: "1px" }}
      disabled={!hasMedical}
    >
      <span className="text-[7px] leading-none text-muted-foreground">{el.number}</span>
      <span className={`text-xs sm:text-sm font-bold leading-none ${hasMedical ? style.text : "text-muted-foreground/60"}`}>
        {el.symbol}
      </span>
    </button>
  );
}

function MedicalCard({ el, onClose }: { el: Element; onClose: () => void }) {
  const style = CATEGORY_STYLES[el.category];
  const info = el.medical!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-xl max-w-lg w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-xl ${style.bg} ${style.border} border-2 flex flex-col items-center justify-center`}>
            <span className="text-[10px] text-muted-foreground">{el.number}</span>
            <span className={`text-xl font-black ${style.text}`}>{el.symbol}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{el.name}</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} font-medium`}>
                {style.label}
              </span>
              <span className="text-xs text-muted-foreground">{el.mass} u</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <Heart className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rôle biologique</p>
            <p className="text-sm text-foreground">{info.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Carence</p>
            <p className="text-sm text-foreground">{info.deficiency}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Excès</p>
            <p className="text-sm text-foreground">{info.excess}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sources alimentaires</p>
            <p className="text-sm text-foreground">{info.sources}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function PeriodicTableViewer() {
  const [selected, setSelected] = useState<Element | null>(null);

  // Build grid: 7 rows × 18 cols
  const grid: (Element | null)[][] = Array.from({ length: 7 }, () => Array(18).fill(null));
  ELEMENTS.forEach(el => {
    grid[el.row - 1][el.col - 1] = el;
  });

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {(["essential", "trace", "toxic", "other"] as const).map(cat => {
          const s = CATEGORY_STYLES[cat];
          const labels: Record<string, string> = { essential: "Essentiels majeurs", trace: "Oligo-éléments", toxic: "Toxiques", other: "Autres" };
          const icons: Record<string, string> = { essential: "🔵", trace: "🟢", toxic: "🔴", other: "⚪" };
          return (
            <span key={cat} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${s.bg} ${s.text} font-medium`}>
              {icons[cat]} {labels[cat]}
            </span>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto pb-2">
        <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: "repeat(18, minmax(28px, 44px))" }}>
          {grid.map((row, ri) =>
            row.map((el, ci) =>
              el ? (
                <ElementCell
                  key={el.symbol}
                  el={el}
                  isSelected={selected?.symbol === el.symbol}
                  onClick={() => el.medical && setSelected(el)}
                />
              ) : (
                <div key={`empty-${ri}-${ci}`} />
              )
            )
          )}
        </div>
      </div>

      {/* Medical Card */}
      <AnimatePresence>
        {selected && selected.medical && (
          <MedicalCard el={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
