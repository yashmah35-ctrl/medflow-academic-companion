import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { renderAsync } from "docx-preview";
import { getCoursePublicUrl } from "@/lib/externalStorage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Layers, PenLine, Upload, Image, Type, Eye, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/hooks/useAuth";

type Mode = "select" | "restitution";
type SubjectSource = "prepa";

interface SubjectOption {
  id: string;
  name: string;
  icon: string;
  source: SubjectSource;
}

interface CourseOption {
  id: string;
  title: string;
  file_url?: string | null;
}

export default function ActiveLearning() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("select");
  const [restitutionText, setRestitutionText] = useState("");
  const [selectedSubjectKey, setSelectedSubjectKey] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [showCoursePanel, setShowCoursePanel] = useState(false);
  const [courseSignedUrl, setCourseSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const [prepaSubjects, setPrepaSubjects] = useState<SubjectOption[]>([]);
  
  const [courses, setCourses] = useState<CourseOption[]>([]);

  // Parse selected subject key "source:id"
  const selectedSubject = useMemo(() => {
    if (!selectedSubjectKey) return null;
    const [source, ...rest] = selectedSubjectKey.split(":");
    return { source: source as SubjectSource, id: rest.join(":") };
  }, [selectedSubjectKey]);

  // Fetch prépa subjects
  useEffect(() => {
    supabase.from("subjects").select("id, name, icon").then(({ data }) => {
      if (data) setPrepaSubjects(data.map(s => ({ ...s, source: "prepa" as SubjectSource })));
    });
  }, []);


  // Fetch courses when subject changes
  useEffect(() => {
    if (!selectedSubject) { setCourses([]); return; }

    if (selectedSubject.source === "prepa") {
      const fetchPrepa = async () => {
        const { data: folders } = await supabase
          .from("folders").select("id").eq("subject_id", selectedSubject.id);
        if (folders && folders.length > 0) {
          const folderIds = folders.map(f => f.id);
          const { data } = await supabase
            .from("courses").select("id, title, file_url").in("folder_id", folderIds);
          setCourses((data || []).map(c => ({ id: c.id, title: c.title, file_url: c.file_url })));
        } else {
          setCourses([]);
        }
      };
      fetchPrepa();
    }
  }, [selectedSubject?.source, selectedSubject?.id]);

  // Detect file type from URL
  const getFileType = (url: string): "pdf" | "docx" => {
    try {
      const path = new URL(url).pathname;
      if (/\.pdf$/i.test(path)) return "pdf";
    } catch {}
    return "docx";
  };

  // Load signed URL for the selected course
  const handleShowCourse = async () => {
    if (!selectedCourse || !selectedSubject) return;
    setLoadingUrl(true);
    setCourseSignedUrl(null);

    const course = courses.find(c => c.id === selectedCourse);
    if (!course?.file_url) {
      setLoadingUrl(false);
      setShowCoursePanel(true);
      return;
    }

    const url = getCoursePublicUrl(course.file_url);
    setCourseSignedUrl(url);
    setShowCoursePanel(true);
    setLoadingUrl(false);

    // If docx, fetch and render
    if (url && getFileType(course.file_url) === "docx") {
      setTimeout(async () => {
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error("Fetch failed");
          const blob = await res.blob();
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = "";
            await renderAsync(blob, docxContainerRef.current, undefined, {
              className: "docx-preview-wrapper",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: true,
            });
          }
        } catch (err) {
          console.error("DOCX render error:", err);
        }
      }, 100);
    }
  };

  if (mode === "select") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Apprentissage Actif</h1>
          <p className="text-muted-foreground mt-1">Choisis un mode pour commencer à apprendre.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate("/flashcards")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
              <Layers className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Flashcards</h3>
            <p className="text-sm text-muted-foreground">
              Révise avec des flashcards style Anki. Importe des fichiers et l'IA génère automatiquement des flashcards pour toi.
            </p>
            <div className="flex gap-2 mt-3">
              <Badge variant="secondary" className="text-xs"><Type className="h-3 w-3 mr-1" />Texte</Badge>
              <Badge variant="secondary" className="text-xs"><Image className="h-3 w-3 mr-1" />Occlusion</Badge>
              <Badge variant="secondary" className="text-xs"><Upload className="h-3 w-3 mr-1" />Import IA</Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setMode("restitution")}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-warning/10 text-warning mb-4 group-hover:scale-110 transition-transform">
              <PenLine className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Restitution Libre</h3>
            <p className="text-sm text-muted-foreground">
              Choisis une matière et un cours, puis écris tout ce que tu as retenu. Consulte le cours en parallèle.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // Restitution mode with split layout
  const selectedCourseObj = courses.find(c => c.id === selectedCourse);

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => {
        setMode("select"); setRestitutionText(""); setSelectedSubjectKey(""); setSelectedCourse("");
        setShowCoursePanel(false); setCourseSignedUrl(null);
      }}>← Retour</Button>

      <div className="flex gap-4" style={{ height: "calc(100vh - 180px)" }}>
        {/* Left: Restitution */}
        <div className={`flex flex-col gap-4 ${showCoursePanel ? "w-[35%] min-w-[320px] shrink-0" : "w-full max-w-2xl mx-auto"} transition-all`}>
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 flex-1 flex flex-col">
            <h3 className="text-lg font-semibold text-foreground">Restitution Libre</h3>
            <p className="text-sm text-muted-foreground">
              Choisis ta matière et ton cours, puis écris tout ce que tu as retenu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Matière</label>
                <Select value={selectedSubjectKey} onValueChange={(v) => { setSelectedSubjectKey(v); setSelectedCourse(""); setShowCoursePanel(false); setCourseSignedUrl(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisis une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {prepaSubjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground font-semibold">📚 Cours Prépa</SelectLabel>
                        {prepaSubjects.map(s => (
                          <SelectItem key={`prepa:${s.id}`} value={`prepa:${s.id}`}>{s.icon} {s.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Cours</label>
                <Select value={selectedCourse} onValueChange={(v) => { setSelectedCourse(v); setShowCoursePanel(false); setCourseSignedUrl(null); }} disabled={!selectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisis un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Textarea
              placeholder="Écris tout ce que tu as retenu de ce cours..."
              className="min-h-[200px] flex-1"
              value={restitutionText}
              onChange={(e) => setRestitutionText(e.target.value)}
              disabled={!selectedCourse}
            />

            <Button onClick={handleShowCourse} disabled={!selectedCourse || loadingUrl} className="gap-2">
              {loadingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
              Afficher le cours
            </Button>
          </div>
        </div>

        {/* Right: Course viewer */}
        {showCoursePanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex-1 min-w-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-border/50 bg-muted/30 flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">{selectedCourseObj?.title}</h4>
                <p className="text-xs text-muted-foreground">Consultation du cours</p>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 h-7 text-xs" onClick={() => setShowCoursePanel(false)}>
                Fermer
              </Button>
            </div>
            <div className="flex-1 bg-muted/20 overflow-auto">
              {courseSignedUrl ? (
                (() => {
                  const course = courses.find(c => c.id === selectedCourse);
                  const type = course?.file_url ? getFileType(course.file_url) : "docx";
                  if (type === "pdf") {
                    return (
                      <iframe
                        src={courseSignedUrl}
                        className="w-full h-full border-0"
                        title={selectedCourseObj?.title || "Cours"}
                      />
                    );
                  }
                  return <div ref={docxContainerRef} className="p-4" />;
                })()
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Aucun fichier associé à ce cours.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
