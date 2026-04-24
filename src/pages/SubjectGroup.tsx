import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, canAccessTC } from "@/hooks/useAuth";
import { subjectColorMap, type SubjectColor } from "@/data/mockData";
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
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function SubjectGroup() {
  const navigate = useNavigate();
  const { groupName = "" } = useParams();
  const { role } = useAuth();
  const [subjects, setSubjects] = useState<DBSubject[]>([]);
  const decodedGroup = decodeURIComponent(groupName);

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

  const variants = subjects.filter((s) => {
    const m = s.name.match(/^(.+)\s+(TC|OS)$/);
    if (!m) return false;
    if (m[1].trim() !== decodedGroup) return false;
    if (!canAccessTC(role) && s.name.endsWith(" TC")) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/cours")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{decodedGroup}</h1>
          <p className="text-sm text-muted-foreground">
            Choisis la variante pour accéder aux cours.
          </p>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {variants.map((s) => {
          const colors =
            subjectColorMap[s.color as SubjectColor] ?? subjectColorMap.chemistry;
          return (
            <motion.div
              key={s.id}
              variants={item}
              className={`group relative overflow-hidden rounded-2xl border border-border ${colors.light} p-5 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col`}
              onClick={() => navigate(`/subject/${s.id}`)}
            >
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
              <h3 className="font-bold text-foreground text-sm leading-tight mb-1">
                {s.name}
              </h3>
              <p className="text-xs text-muted-foreground">
                {s.name.endsWith(" TC") ? "Tronc Commun" : "Option Santé"}
              </p>
            </motion.div>
          );
        })}

        {variants.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">
            Aucune variante disponible.
          </p>
        )}
      </motion.div>
    </div>
  );
}
