import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Folder, ArrowLeft, Check } from "lucide-react";

export interface SubjectSelection {
  subjectId: string | null;
  subjectName: string;
  source: "prepa" | "perso";
}

interface Props {
  value: SubjectSelection | null;
  onChange: (selection: SubjectSelection) => void;
}

interface SubjectItem {
  id: string | null;
  name: string;
  source: "prepa" | "perso";
}

export function SubjectSourceSelector({ value, onChange }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<"source" | "subject">("source");
  const [source, setSource] = useState<"prepa" | "perso" | null>(null);
  const [items, setItems] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset to source step if value cleared externally
  useEffect(() => {
    if (!value) {
      setStep("source");
      setSource(null);
    }
  }, [value]);

  const loadSubjects = async (src: "prepa" | "perso") => {
    setLoading(true);
    if (src === "prepa") {
      const { data } = await supabase.from("subjects").select("id, name").order("name");
      setItems(((data as any[]) || []).map((s) => ({ id: s.id, name: s.name, source: "prepa" })));
    } else {
      if (!user) {
        setItems([]);
      } else {
        const { data } = await supabase
          .from("folders")
          .select("name")
          .eq("created_by", user.id)
          .order("name");
        const names = Array.from(
          new Set(((data as any[]) || []).map((f) => f.name).filter(Boolean))
        );
        setItems(names.map((n) => ({ id: null, name: n as string, source: "perso" })));
      }
    }
    setLoading(false);
  };

  const handlePickSource = (src: "prepa" | "perso") => {
    setSource(src);
    setStep("subject");
    loadSubjects(src);
  };

  // --- Already selected: show summary with change button ---
  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            {value.source === "prepa" ? <GraduationCap className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{value.subjectName}</p>
            <Badge variant="outline" className="text-[10px] mt-0.5">
              {value.source === "prepa" ? "Prépa du Peuple" : "Mes matières"}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep("source");
            setSource(null);
            (onChange as any)(null);
          }}
        >
          Changer
        </Button>
      </div>
    );
  }

  // --- Step 1: source ---
  if (step === "source") {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">D'où vient cette matière ?</p>
        <button
          type="button"
          onClick={() => handlePickSource("prepa")}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary hover:bg-accent/30 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Prépa du Peuple</p>
            <p className="text-xs text-muted-foreground">Matières officielles de la prépa</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => handlePickSource("perso")}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary hover:bg-accent/30 transition-all text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Folder className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Mes matières</p>
            <p className="text-xs text-muted-foreground">Vos dossiers ajoutés dans Cours</p>
          </div>
        </button>
      </div>
    );
  }

  // --- Step 2: subject list ---
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep("source");
            setSource(null);
          }}
          className="h-7 px-2 text-xs"
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Retour
        </Button>
        <Badge variant="outline" className="text-[10px]">
          {source === "prepa" ? "Prépa du Peuple" : "Mes matières"}
        </Badge>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground py-4 text-center">Chargement…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          {source === "perso"
            ? "Aucun dossier perso. Crées-en dans la section Cours."
            : "Aucune matière disponible."}
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {items.map((it, i) => (
            <button
              key={`${it.source}-${it.id ?? it.name}-${i}`}
              type="button"
              onClick={() =>
                onChange({
                  subjectId: it.id,
                  subjectName: it.name,
                  source: it.source,
                })
              }
              className="w-full flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 hover:border-primary hover:bg-accent/30 transition-all text-left"
            >
              <span className="text-sm text-foreground truncate">{it.name}</span>
              <Check className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
