import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Pencil, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canAccessTC } from "@/hooks/useAuth";
import { subjectColorMap, type SubjectColor } from "@/data/mockData";
import PersonalCoursesSection from "@/components/dashboard/PersonalCoursesSection";
import anatomieOsImg from "@/assets/subjects/anatomie-os.png";
import anatomieTcImg from "@/assets/subjects/anatomie-tc.png";
import shsImg from "@/assets/subjects/shs.png";
import santePubliqueImg from "@/assets/subjects/sante-publique.png";

const subjectImageMap: Record<string, string> = {
  "Anatomie OS": anatomieOsImg,
  "Anatomie TC": anatomieTcImg,
  "SHS TC": shsImg,
  "SHS OS": shsImg,
  "Santé Publique OS": santePubliqueImg,
  "Santé Publique TC": santePubliqueImg,
};

interface DBSubject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Cours() {
  const navigate = useNavigate();
  const { role, user, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const [search, setSearch] = useState("");
  const [renamingSubject, setRenamingSubject] = useState<string | null>(null);
  const [renameSubjectValue, setRenameSubjectValue] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      const all: DBSubject[] = [];
      let offset = 0;
      const batch = 1000;
      let more = true;
      while (more) {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, name, icon, color")
          .range(offset, offset + batch - 1);
        if (error || !data || data.length === 0) {
          more = false;
        } else {
          all.push(...data);
          offset += batch;
          more = data.length === batch;
        }
      }
      setSubjects(all);
    };
    fetchSubjects();
  }, []);

  const handleRenameSubject = async (subjectId: string) => {
    if (!renameSubjectValue.trim()) return;
    const { error } = await supabase
      .from("subjects")
      .update({ name: renameSubjectValue.trim() })
      .eq("id", subjectId);
    if (error) {
      toast.error("Erreur lors du renommage");
      return;
    }
    setSubjects((prev) =>
      prev.map((s) => (s.id === subjectId ? { ...s, name: renameSubjectValue.trim() } : s))
    );
    setRenamingSubject(null);
    setRenameSubjectValue("");
    toast.success("Matière renommée !");
  };

  const filteredSubjects = subjects.filter((s) => {
    if (!canAccessTC(role) && s.name.includes(" TC")) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Cours</h1>
            <p className="text-sm text-muted-foreground">
              Tes cours personnels et ceux de la Prépa du Peuple.
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une matière..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-muted border border-border pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Mes cours personnels */}
      {!isAdmin && user && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-3">Mes cours personnels</h2>
          <PersonalCoursesSection userId={user.id} />
        </section>
      )}

      {/* Cours La Prépa du Peuple */}
      <section>
        <h2 className="text-lg font-bold text-foreground mb-3">Cours La Prépa du Peuple</h2>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {filteredSubjects.map((s) => {
            const colors =
              subjectColorMap[s.color as SubjectColor] ?? subjectColorMap.chemistry;
            return (
              <motion.div
                key={s.id}
                variants={item}
                className={`group relative overflow-hidden rounded-2xl border border-border ${colors.light} p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
                onClick={() => navigate(`/subject/${s.id}`)}
              >
                {isAdmin && (
                  <div
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      title="Renommer"
                      onClick={() => {
                        setRenamingSubject(s.id);
                        setRenameSubjectValue(s.name);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  {subjectImageMap[s.name] ? (
                    <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm">
                      <img
                        src={subjectImageMap[s.name]}
                        alt={s.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card/80 text-2xl shadow-sm">
                      {s.icon}
                    </div>
                  )}
                </div>
                {renamingSubject === s.id ? (
                  <div
                    className="flex items-center gap-2 mb-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={renameSubjectValue}
                      onChange={(e) => setRenameSubjectValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameSubject(s.id)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" onClick={() => handleRenameSubject(s.id)}>
                      OK
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRenamingSubject(null)}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <h3 className="font-bold text-foreground text-sm leading-tight mb-2">
                    {s.name}
                  </h3>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
}
