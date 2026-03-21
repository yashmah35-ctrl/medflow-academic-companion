import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Pencil, Trash2, Play, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import SchemaCreator from "./SchemaCreator";
import SchemaQuiz from "./SchemaQuiz";

interface Marker {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface Schema {
  id: string;
  user_id: string;
  title: string;
  subject_id: string | null;
  image_url: string;
  markers_json: Marker[];
  is_public: boolean;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

type View = "list" | "create" | "edit" | "quiz";

interface SchemaModuleProps {
  onBack: () => void;
}

export default function SchemaModule({ onBack }: SchemaModuleProps) {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<View>("list");
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchema, setSelectedSchema] = useState<Schema | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [schemasRes, subjectsRes] = await Promise.all([
      supabase.from("schemas").select("*").order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, name").order("name"),
    ]);
    if (schemasRes.data) setSchemas(schemasRes.data as unknown as Schema[]);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce schéma ?")) return;
    const { error } = await supabase.from("schemas").delete().eq("id", id);
    if (error) { toast.error("Erreur suppression"); return; }
    toast.success("Schéma supprimé");
    fetchData();
  };

  const publicSchemas = schemas.filter(s => s.is_public);
  const mySchemas = schemas.filter(s => s.user_id === user?.id && !s.is_public);

  if (view === "create") {
    return (
      <SchemaCreator
        onBack={() => setView("list")}
        onSaved={() => { setView("list"); fetchData(); }}
        subjects={subjects}
        isAdmin={isAdmin}
      />
    );
  }

  if (view === "edit" && selectedSchema) {
    return (
      <SchemaCreator
        onBack={() => { setView("list"); setSelectedSchema(null); }}
        onSaved={() => { setView("list"); setSelectedSchema(null); fetchData(); }}
        subjects={subjects}
        isAdmin={isAdmin}
        editSchema={selectedSchema}
      />
    );
  }

  if (view === "quiz" && selectedSchema) {
    return (
      <SchemaQuiz
        schema={selectedSchema}
        onBack={() => { setView("list"); setSelectedSchema(null); }}
      />
    );
  }

  const getSubjectName = (id: string | null) => subjects.find(s => s.id === id)?.name || "";

  const SchemaCard = ({ schema, canEdit }: { schema: Schema; canEdit: boolean }) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-36 bg-muted/30 overflow-hidden">
        <img src={schema.image_url} alt={schema.title} className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px]">
            {schema.markers_json.length} repères
          </Badge>
        </div>
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{schema.title}</h3>
        {schema.subject_id && (
          <p className="text-xs text-muted-foreground">{getSubjectName(schema.subject_id)}</p>
        )}
        <div className="flex gap-1.5">
          <Button size="sm" className="flex-1 h-8 text-xs" onClick={() => { setSelectedSchema(schema); setView("quiz"); }}>
            <Play className="h-3 w-3 mr-1" /> Quiz
          </Button>
          {canEdit && (
            <>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => { setSelectedSchema(schema); setView("edit"); }}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(schema.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Schémas à Compléter</h1>
          <p className="text-xs text-muted-foreground">Teste ta mémoire visuelle sur des schémas annotés</p>
        </div>
        <Button size="sm" onClick={() => setView("create")}>
          <Plus className="h-4 w-4 mr-1" /> Nouveau
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Admin schemas */}
          {publicSchemas.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                🏛️ Schémas La Prépa du Peuple
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {publicSchemas.map(s => (
                  <SchemaCard key={s.id} schema={s} canEdit={isAdmin} />
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Personal schemas */}
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              📝 Mes Schémas
            </h2>
            {mySchemas.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mySchemas.map(s => (
                  <SchemaCard key={s.id} schema={s} canEdit={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-sm">Aucun schéma personnel</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setView("create")}>
                  <Plus className="h-4 w-4 mr-1" /> Créer mon premier schéma
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
