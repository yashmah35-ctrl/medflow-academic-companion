import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell, FolderPlus, Eye, Lock, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  subjectColorMap,
  type SubjectColor,
} from "@/data/mockData";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface DBFolder {
  id: string;
  subject_id: string;
  name: string;
  course_count: number;
  exercise_count: number;
  created_at: string;
}

interface DBCourse {
  id: string;
  title: string;
  source: string;
  reading_time: string | null;
  created_at: string;
  file_url: string | null;
}

export default function SubjectDetail() {
  const { subjectId, folderId } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [subject, setSubject] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);
  const [dbFolders, setDbFolders] = useState<DBFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [renamingCourse, setRenamingCourse] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const isMedicalStudent = role === "medical_student";

  // Fetch subject from DB
  useEffect(() => {
    if (!subjectId) return;
    const fetchSubject = async () => {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, icon, color")
        .eq("id", subjectId)
        .single();
      if (data) setSubject(data);
    };
    fetchSubject();
  }, [subjectId]);

  // Fetch folders from DB
  useEffect(() => {
    if (!subjectId) return;
    const fetchFolders = async () => {
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: true });
      if (data) setDbFolders(data);
    };
    fetchFolders();
  }, [subjectId]);

  // Fetch DB courses for this folder
  useEffect(() => {
    if (!folderId) return;
    const fetchCourses = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, source, reading_time, created_at, file_url")
        .eq("folder_id", folderId)
        .order("created_at", { ascending: false });
      if (data) setDbCourses(data);
    };
    fetchCourses();
  }, [folderId]);

  const currentFolder = dbFolders.find((f) => f.id === folderId);

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Chargement...</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-2">Retour</Button>
      </div>
    );
  }

  const colors = subjectColorMap[subject.color as SubjectColor] ?? subjectColorMap.chemistry;

  const handleAddFolder = async () => {
    if (!newFolderName.trim()) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({
        subject_id: subjectId!,
        name: newFolderName.trim(),
        course_count: 0,
        exercise_count: 0,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création du dossier");
      return;
    }
    if (data) {
      setDbFolders((prev) => [...prev, data]);
      setNewFolderName("");
      setDialogOpen(false);
      toast.success(`Dossier "${data.name}" créé !`);
    }
  };

  const handleCourseImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !folderId || !user) return;

    setUploading(true);
    let imported = 0;

    for (const file of Array.from(files)) {
      try {
        const filePath = `${user.id}/${folderId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("course-files")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Erreur upload: ${file.name}`);
          continue;
        }

        const sizeMB = file.size / (1024 * 1024);
        const estimatedMinutes = Math.max(5, Math.round(sizeMB * 15));

        // Store the storage path, not the public URL
        const { data: course, error: insertError } = await supabase
          .from("courses")
          .insert({
            folder_id: folderId,
            title: file.name.replace(/\.(pdf|docx?|txt)$/i, ""),
            source: "fac",
            reading_time: `${estimatedMinutes} min`,
            file_url: filePath,
          })
          .select()
          .single();

        if (insertError) {
          toast.error(`Erreur enregistrement: ${file.name}`);
          continue;
        }

        if (course) {
          setDbCourses((prev) => [course, ...prev]);
          imported++;
        }
      } catch {
        toast.error(`Erreur: ${file.name}`);
      }
    }

    if (imported > 0) {
      toast.success(`${imported} cours importé(s) avec succès !`);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleRenameCourse = async (courseId: string) => {
    if (!renameValue.trim()) return;
    const { error } = await supabase
      .from("courses")
      .update({ title: renameValue.trim() })
      .eq("id", courseId);
    if (error) {
      toast.error("Erreur lors du renommage");
      return;
    }
    setDbCourses((prev) => prev.map((c) => c.id === courseId ? { ...c, title: renameValue.trim() } : c));
    setRenamingCourse(null);
    setRenameValue("");
    toast.success("Cours renommé !");
  };

  const handleDeleteCourse = async (course: DBCourse) => {
    if (!confirm(`Supprimer "${course.title}" ?`)) return;
    // Delete file from storage if exists
    if (course.file_url) {
      await supabase.storage.from("course-files").remove([course.file_url]);
    }
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    setDbCourses((prev) => prev.filter((c) => c.id !== course.id));
    toast.success("Cours supprimé !");
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" multiple className="hidden" onChange={handleCourseImport} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (folderId) navigate(`/subject/${subjectId}`);
              else navigate("/");
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.light} text-xl`}>
            {subject.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {currentFolder ? currentFolder.name : subject.name}
            </h1>
            {currentFolder && <p className="text-sm text-muted-foreground">{subject.name}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!folderId && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" /> Nouveau dossier
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau dossier</DialogTitle>
                  <DialogDescription className="sr-only">Formulaire de création de dossier</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <Input
                    placeholder="Nom du dossier"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  />
                  <Button onClick={handleAddFolder} className="w-full">Créer</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Folders or Courses */}
      {!folderId ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {dbFolders.map((folder) => (
            <motion.div
              key={folder.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/subject/${subjectId}/folder/${folder.id}`)}
            >
              <div className={`h-1.5 w-12 rounded-full ${colors.bg} mb-4`} />
              <h3 className="font-semibold text-foreground mb-2">{folder.name}</h3>
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {folder.course_count} Cours</span>
                <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {folder.exercise_count} Exercices</span>
              </div>
            </motion.div>
          ))}

          {dbFolders.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <FolderPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun dossier</p>
              <p className="text-sm mt-1">Crée un dossier pour commencer à organiser tes cours.</p>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
          {/* Nouveau cours button */}
          <motion.div
            variants={item}
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4 hover:bg-card hover:shadow-sm transition-all cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
            <span className="font-medium text-muted-foreground">
              {uploading ? "Import en cours..." : "Nouveau cours"}
            </span>
          </motion.div>

          {dbCourses
            .sort((a, b) => (a.source === "fac" ? -1 : 1))
            .map((course) => (
              <motion.div
                key={course.id}
                variants={item}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <Badge variant={course.source === "fac" ? "default" : "secondary"} className="text-xs shrink-0">
                    {course.source === "fac" ? "Cours de la Fac" : "Cours de la Prépa du Peuple"}
                  </Badge>
                  {course.source === "bonus" && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0">
                    {renamingCourse === course.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRenameCourse(course.id)}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleRenameCourse(course.id)}>OK</Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenamingCourse(null)}>✕</Button>
                      </div>
                    ) : (
                      <h4 className="font-medium text-foreground truncate">{course.title}</h4>
                    )}
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{formatDate(course.created_at)}</span>
                      <span>•</span>
                      <span>{course.reading_time || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {course.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const { data } = await supabase.storage
                          .from("course-files")
                          .createSignedUrl(course.file_url!, 3600);
                        if (data?.signedUrl) {
                          window.open(data.signedUrl, '_blank');
                        } else {
                          toast.error("Impossible d'ouvrir le fichier");
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Consulter
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRenamingCourse(course.id); setRenameValue(course.title); }}
                    title="Renommer"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteCourse(course)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}

          {dbCourses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun cours disponible</p>
              <p className="text-sm mt-1">Importe des cours pour commencer.</p>
            </div>
          )}
        </motion.div>
      )}


    </div>
  );
}
