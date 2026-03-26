import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell, FolderPlus, Eye, Lock, Plus, Pencil, Trash2, Crown, Play, Upload, ChevronRight } from "lucide-react";
import { resolveCourseUrl, uploadCourseFile, deleteCourseFile } from "@/lib/externalStorage";
import { SecurePdfViewer } from "@/components/SecurePdfViewer";
import { Button } from "@/components/ui/button";
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
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumModal } from "@/components/PremiumPaywall";
import { useFolderProgress } from "@/hooks/useFolderProgress";

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
  created_by: string | null;
  is_public: boolean;
}

interface DBCourse {
  id: string;
  title: string;
  source: string;
  reading_time: string | null;
  created_at: string;
  file_url: string | null;
}

interface AdminExercise {
  id: string;
  title: string;
  subject_id: string;
  questions_json: any[] | null;
  format: string;
  created_by: string;
  created_at: string;
  source_label: string | null;
  score_label: string | null;
}

export default function SubjectDetail() {
  const { subjectId, folderId } = useParams();
  const navigate = useNavigate();
  const { user, role, isAdmin } = useAuth();
  const [subject, setSubject] = useState<{ id: string; name: string; icon: string; color: string } | null>(null);
  const [dbFolders, setDbFolders] = useState<DBFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [renamingCourse, setRenamingCourse] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfCourseId, setPdfCourseId] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [folderCourseCounts, setFolderCourseCounts] = useState<Record<string, number>>({});
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [exerciseScores, setExerciseScores] = useState<Record<string, { correct: number; total: number }>>({});
  const [newExDialogOpen, setNewExDialogOpen] = useState(false);
  const [newExTitle, setNewExTitle] = useState("");
  const [newExFormat, setNewExFormat] = useState<"QCM" | "QIM">("QCM");
  const { isSubscribed } = useSubscription();

  const folderIds = dbFolders.map(f => f.id);
  const folderProgress = useFolderProgress(folderIds, folderCourseCounts);

  const isMedicalStudent = role === "medical_student";
  const isCollegeOrLycee = role === "college" || role === "lycee";
  const canCreateFolder = !isCollegeOrLycee;

  // Fetch subject
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

  // Fetch folders
  useEffect(() => {
    if (!subjectId) return;
    const fetchFolders = async () => {
      const allFolders: DBFolder[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data } = await supabase
          .from("folders")
          .select("*")
          .eq("subject_id", subjectId)
          .order("created_at", { ascending: true })
          .range(offset, offset + batchSize - 1);
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allFolders.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
      }
      setDbFolders(allFolders);
    };
    fetchFolders();
  }, [subjectId]);

  // Dynamic course counts
  useEffect(() => {
    if (dbFolders.length === 0) return;
    const fetchCounts = async () => {
      const counts: Record<string, number> = {};
      for (const folder of dbFolders) {
        const { count } = await supabase
          .from("courses")
          .select("id", { count: "exact", head: true })
          .eq("folder_id", folder.id);
        counts[folder.id] = count || 0;
      }
      setFolderCourseCounts(counts);
    };
    fetchCounts();
  }, [dbFolders]);

  // Fetch exercises for this subject
  useEffect(() => {
    if (!subjectId || folderId) return;
    const fetchExercises = async () => {
      const { data } = await supabase
        .from("admin_exercises")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false });
      if (data) {
        setExercises(data as AdminExercise[]);
        // Fetch exercise scores
        if (user) {
          const exerciseIds = data.map((e: any) => e.id);
          if (exerciseIds.length > 0) {
            const { data: scores } = await supabase
              .from("user_exercise_scores" as any)
              .select("exercise_id, correct_count, total_count")
              .eq("user_id", user.id)
              .in("exercise_id", exerciseIds);
            if (scores) {
              const scoreMap: Record<string, { correct: number; total: number }> = {};
              (scores as any[]).forEach((s: any) => {
                if (!scoreMap[s.exercise_id]) scoreMap[s.exercise_id] = { correct: 0, total: 0 };
                scoreMap[s.exercise_id].correct += s.correct_count;
                scoreMap[s.exercise_id].total += s.total_count;
              });
              setExerciseScores(scoreMap);
            }
          }
        }
      }
    };
    fetchExercises();
  }, [subjectId, folderId, user]);

  // Fetch courses inside folder
  useEffect(() => {
    if (!folderId) return;
    const fetchCourses = async () => {
      const allCourses: DBCourse[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data } = await supabase
          .from("courses")
          .select("id, title, source, reading_time, created_at, file_url")
          .eq("folder_id", folderId)
          .order("created_at", { ascending: false })
          .range(offset, offset + batchSize - 1);
        if (!data || data.length === 0) {
          hasMore = false;
        } else {
          allCourses.push(...data);
          offset += batchSize;
          hasMore = data.length === batchSize;
        }
      }
      setDbCourses(allCourses);
    };
    fetchCourses();
  }, [folderId]);

  const currentFolder = dbFolders.find((f) => f.id === folderId);
  const isCurrentFolderOwner = currentFolder?.created_by === user?.id;

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
    if (!newFolderName.trim() || !user) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({
        subject_id: subjectId!,
        name: newFolderName.trim(),
        course_count: 0,
        exercise_count: 0,
        created_by: user.id,
        is_public: isAdmin,
      })
      .select()
      .single();
    if (error) { toast.error("Erreur lors de la création du dossier"); return; }
    if (data) {
      setDbFolders((prev) => [...prev, data]);
      setNewFolderName("");
      setDialogOpen(false);
      toast.success(`Dossier "${data.name}" créé !`);
    }
  };

  const handleRenameFolder = async (fId: string) => {
    if (!renameFolderValue.trim()) return;
    const { error } = await supabase.from("folders").update({ name: renameFolderValue.trim() }).eq("id", fId);
    if (error) { toast.error("Erreur lors du renommage"); return; }
    setDbFolders((prev) => prev.map((f) => f.id === fId ? { ...f, name: renameFolderValue.trim() } : f));
    setRenamingFolder(null);
    setRenameFolderValue("");
    toast.success("Dossier renommé !");
  };

  const handleDeleteFolder = async (folder: DBFolder) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" et tous ses cours ?`)) return;
    await supabase.from("courses").delete().eq("folder_id", folder.id);
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    setDbFolders((prev) => prev.filter((f) => f.id !== folder.id));
    toast.success("Dossier supprimé !");
  };

  const handleCourseImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !folderId || !user) return;
    const fileArray = Array.from(files);
    setUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });
    let imported = 0;
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress({ current: i, total: fileArray.length });
      try {
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 500) { toast.error(`"${file.name}" est trop volumineux (${Math.round(sizeMB)}MB, max 500MB)`); continue; }
        const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${folderId}/${Date.now()}-${safeName}`;
        const { error: uploadErrorMsg } = await uploadCourseFile(filePath, file);
        if (uploadErrorMsg) { toast.error(`Erreur upload "${file.name}": ${uploadErrorMsg}`); continue; }
        const estimatedMinutes = Math.max(5, Math.round(sizeMB * 15));
        const { data: course, error: insertError } = await supabase
          .from("courses")
          .insert({ folder_id: folderId, title: file.name.replace(/\.(pdf|docx?|txt)$/i, ""), source: "fac", reading_time: `${estimatedMinutes} min`, file_url: filePath })
          .select().single();
        if (insertError) { toast.error(`Erreur enregistrement: ${file.name}`); continue; }
        if (course) { setDbCourses((prev) => [course, ...prev]); imported++; }
      } catch (err: any) { toast.error(`Erreur "${file.name}": ${err?.message || "Erreur inconnue"}`); }
      await new Promise((r) => setTimeout(r, 50));
    }
    if (imported > 0) toast.success(`${imported} cours importé(s) avec succès !`);
    setUploading(false);
    setUploadProgress(null);
    e.target.value = "";
  };

  const handleRenameCourse = async (courseId: string) => {
    if (!renameValue.trim()) return;
    const { error } = await supabase.from("courses").update({ title: renameValue.trim() }).eq("id", courseId);
    if (error) { toast.error("Erreur lors du renommage"); return; }
    setDbCourses((prev) => prev.map((c) => c.id === courseId ? { ...c, title: renameValue.trim() } : c));
    setRenamingCourse(null);
    setRenameValue("");
    toast.success("Cours renommé !");
  };

  const handleDeleteCourse = async (course: DBCourse) => {
    if (!confirm(`Supprimer "${course.title}" ?`)) return;
    if (course.file_url) await deleteCourseFile(course.file_url);
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) { toast.error("Erreur lors de la suppression"); return; }
    setDbCourses((prev) => prev.filter((c) => c.id !== course.id));
    toast.success("Cours supprimé !");
  };

  const handleDeleteExercise = async (id: string) => {
    if (!confirm("Supprimer cet exercice ?")) return;
    const { error } = await supabase.from("admin_exercises").delete().eq("id", id);
    if (error) { toast.error("Erreur"); return; }
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
    toast.success("Exercice supprimé !");
  };

  const handleCreateExercise = async () => {
    if (!newExTitle.trim() || !user || !subjectId) return;
    const { data, error } = await supabase
      .from("admin_exercises")
      .insert({
        subject_id: subjectId,
        title: newExTitle.trim(),
        format: newExFormat,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) { toast.error("Erreur lors de la création"); return; }
    if (data) {
      setExercises((prev) => [data as AdminExercise, ...prev]);
      setNewExTitle("");
      setNewExFormat("QCM");
      setNewExDialogOpen(false);
      toast.success(`Exercice "${data.title}" créé !`);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
    } catch { return dateStr; }
  };

  // ────────────────── RENDER ──────────────────
  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,image/*" multiple className="hidden" onChange={handleCourseImport} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            if (folderId) navigate(`/subject/${subjectId}`);
            else navigate("/");
          }}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.light} text-xl shrink-0`}>
          {subject.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
            {currentFolder ? currentFolder.name : subject.name}
          </h1>
          {currentFolder && <p className="text-sm text-muted-foreground truncate">{subject.name}</p>}
        </div>
      </div>

      {/* ═══════════ FOLDER LIST VIEW (no folderId) ═══════════ */}
      {!folderId ? (
        <div className="space-y-8">
          {/* ── Dossiers de cours (Cards) ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5" /> Dossiers de cours
              </h2>
              {canCreateFolder && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <FolderPlus className="h-4 w-4 mr-1" /> Nouveau
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer un nouveau dossier {isAdmin ? "public" : "privé"}</DialogTitle>
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

            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbFolders.map((folder) => {
                const isOwner = folder.created_by === user?.id;
                const courseCount = folderCourseCounts[folder.id] ?? 0;
                return (
                  <motion.div
                    key={folder.id}
                    variants={item}
                    className="group relative rounded-2xl border border-border bg-accent/20 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                    onClick={() => navigate(`/subject/${subjectId}/folder/${folder.id}`)}
                  >
                    {/* Card content */}
                    <div className="p-5 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] bg-background/80">
                            Cours
                          </Badge>
                          {folder.is_public && (
                            <Badge variant="secondary" className="text-[10px]">Public</Badge>
                          )}
                        </div>
                        {/* Folder icon placeholder */}
                        <div className={`h-14 w-14 rounded-lg ${colors.light} flex items-center justify-center text-2xl opacity-60`}>
                          📄
                        </div>
                      </div>

                      {renamingFolder === folder.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            value={renameFolderValue}
                            onChange={(e) => setRenameFolderValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleRenameFolder(folder.id)}>OK</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRenamingFolder(null)}>✕</Button>
                        </div>
                      ) : (
                        <h3 className="font-bold text-foreground text-base mb-2 line-clamp-2">{folder.name}</h3>
                      )}

                      <p className="text-xs text-muted-foreground mb-3">
                        📂 {courseCount} Cours
                      </p>

                      {/* Progress bar */}
                      <div className="mb-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>Progression</span>
                          <span>{folderProgress[folder.id] || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${folderProgress[folder.id] || 0}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom action */}
                    <div className="flex items-center justify-between px-5 pb-4">
                      {isOwner && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setRenamingFolder(folder.id); setRenameFolderValue(folder.name); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteFolder(folder)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {!isOwner && <div />}
                      <Button size="sm" className="rounded-full px-5 bg-foreground text-background hover:bg-foreground/90">
                        Démarrer
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {dbFolders.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <FolderPlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Aucun dossier</p>
                <p className="text-xs mt-1">Crée un dossier pour organiser tes cours.</p>
              </div>
            )}
          </div>

          {/* ── Séries d'exercices (RIGHT) ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden h-fit">
            <div className="px-5 py-3 border-b border-border bg-accent/30">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Dumbbell className="h-5 w-5" /> Séries d'exercices
              </h2>
              {isAdmin && (
                <Dialog open={newExDialogOpen} onOpenChange={setNewExDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <Plus className="h-4 w-4 mr-1" /> Nouvel exercice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nouvel exercice</DialogTitle>
                      <DialogDescription>
                        Créer un exercice pour {subject.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Titre</label>
                        <Input
                          placeholder="Ex: 3ème Colle de Chimie"
                          value={newExTitle}
                          onChange={(e) => setNewExTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateExercise()}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Format</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="format" value="QCM" checked={newExFormat === "QCM"} onChange={() => setNewExFormat("QCM")} className="accent-primary" />
                            <span className="text-sm">QCM</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                            <input type="radio" name="format" value="QIM" checked={newExFormat === "QIM"} onChange={() => setNewExFormat("QIM")} className="accent-primary" />
                            <span className="text-sm">QIM</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setNewExDialogOpen(false)}>Annuler</Button>
                        <Button onClick={handleCreateExercise}>Créer</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-border">
              {exercises.map((ex) => {
                const qCount = Array.isArray(ex.questions_json) ? ex.questions_json.length : 0;
                const score = exerciseScores[ex.id];
                const scorePct = score && score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;
                return (
                  <motion.div key={ex.id} variants={item} className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-sm">{ex.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {ex.source_label && (
                            <Badge variant="outline" className="text-[10px] font-normal">{ex.source_label}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{qCount} Q</span>
                          {scorePct !== null && (
                            <Badge 
                              variant={scorePct >= 70 ? "default" : "secondary"} 
                              className={`text-[10px] ${scorePct >= 70 ? "bg-green-500/15 text-green-600 border-green-500/30" : scorePct >= 40 ? "bg-amber-500/15 text-amber-600 border-amber-500/30" : "bg-destructive/15 text-destructive border-destructive/30"}`}
                            >
                              {scorePct}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => navigate(`/active-learning?exerciseId=${ex.id}`)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" /> Démarrer
                      </Button>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate(`/active-learning?exerciseId=${ex.id}&addQuestion=1`)}>
                          <Plus className="h-3.5 w-3.5" /> Question
                        </button>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate(`/active-learning?exerciseId=${ex.id}&import=1`)}>
                          <Upload className="h-3.5 w-3.5" /> Import
                        </button>
                        <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => navigate(`/active-learning?exerciseId=${ex.id}&edit=1`)}>
                          <Pencil className="h-3.5 w-3.5" /> Modifier
                        </button>
                        <button className="flex items-center gap-1 text-destructive hover:text-destructive/80 transition-colors" onClick={() => handleDeleteExercise(ex.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}

              {exercises.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium">Aucun exercice</p>
                  <p className="text-xs mt-1">Les exercices apparaîtront ici.</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        /* ═══════════ COURSES INSIDE FOLDER ═══════════ */
        <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
          {isCurrentFolderOwner && (
            <motion.div
              variants={item}
              className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 p-4 hover:bg-card hover:shadow-sm transition-all cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </div>
              <span className="font-medium text-muted-foreground">
                {uploading
                  ? uploadProgress
                    ? `Import en cours... (${uploadProgress.current + 1}/${uploadProgress.total})`
                    : "Import en cours..."
                  : "Nouveau cours"}
              </span>
            </motion.div>
          )}

          {dbCourses
            .sort((a, b) => (a.source === "fac" ? -1 : 1))
            .map((course) => (
              <motion.div key={course.id} variants={item} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Badge variant={course.source === "fac" ? "default" : "secondary"} className="text-xs shrink-0 mt-0.5">
                      {course.source === "fac" ? "Cours de la Fac" : "Cours de la Prépa du Peuple"}
                    </Badge>
                    {course.source === "bonus" && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />}
                    <div className="min-w-0 flex-1">
                      {renamingCourse === course.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleRenameCourse(course.id)} className="h-7 text-sm" autoFocus />
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
                  <div className="flex gap-1 shrink-0 self-end sm:self-center">
                    {course.file_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (course.source === "bonus" && !isSubscribed && !isAdmin) { setPremiumModalOpen(true); return; }
                          const publicUrl = await resolveCourseUrl(course.file_url!);
                          setPdfSignedUrl(publicUrl);
                          setPdfTitle(course.title);
                          setPdfFileName(course.file_url || "");
                          setPdfCourseId(course.id);
                          setPdfViewerOpen(true);
                        }}
                      >
                        {course.source === "bonus" && !isSubscribed && !isAdmin ? (
                          <><Crown className="h-4 w-4 mr-1 text-amber-500" /> Premium</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-1" /> Consulter</>
                        )}
                      </Button>
                    )}
                    {isCurrentFolderOwner && (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => { setRenamingCourse(course.id); setRenameValue(course.title); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDeleteCourse(course)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
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

      <SecurePdfViewer
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        signedUrl={pdfSignedUrl}
        title={pdfTitle}
        fileName={pdfFileName}
        subjectId={subjectId}
        subjectName={subject?.name}
        courseId={pdfCourseId}
        folderId={folderId}
      />
      <PremiumModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} />
    </div>
  );
}
