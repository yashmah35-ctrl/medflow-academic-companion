import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell, FolderPlus, Eye, Lock, Plus, Pencil, Trash2, Crown } from "lucide-react";
import { getCoursePublicUrl, uploadCourseFile, deleteCourseFile } from "@/lib/externalStorage";
import { SecurePdfViewer } from "@/components/SecurePdfViewer";
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
import { useAuth, canAccessExamsKhollesAnnales } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { PremiumModal } from "@/components/PremiumPaywall";

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
  const { isSubscribed } = useSubscription();

  const isMedicalStudent = role === "medical_student";
  const isCollegeOrLycee = role === "college" || role === "lycee";
  const canCreateFolder = !isCollegeOrLycee;

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
      // Fetch all folders without default 1000-row limit
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

  // Fetch DB courses for this folder
  useEffect(() => {
    if (!folderId) return;
    const fetchCourses = async () => {
      // Fetch all courses without default 1000-row limit
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

  const handleRenameFolder = async (folderId: string) => {
    if (!renameFolderValue.trim()) return;
    const { error } = await supabase
      .from("folders")
      .update({ name: renameFolderValue.trim() })
      .eq("id", folderId);
    if (error) {
      toast.error("Erreur lors du renommage");
      return;
    }
    setDbFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name: renameFolderValue.trim() } : f));
    setRenamingFolder(null);
    setRenameFolderValue("");
    toast.success("Dossier renommé !");
  };

  const handleDeleteFolder = async (folder: DBFolder) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" et tous ses cours ?`)) return;
    // Delete courses in this folder first
    await supabase.from("courses").delete().eq("folder_id", folder.id);
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
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
        
        if (sizeMB > 500) {
          toast.error(`"${file.name}" est trop volumineux (${Math.round(sizeMB)}MB, max 500MB)`);
          continue;
        }

        const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${folderId}/${Date.now()}-${safeName}`;
        
        // Use chunked upload for large files (> 6MB)
        const uploadOptions: any = {};
        if (sizeMB > 6) {
          uploadOptions.duplex = 'half';
        }
        
        const { error: uploadErrorMsg } = await uploadCourseFile(filePath, file);

        if (uploadErrorMsg) {
          toast.error(`Erreur upload "${file.name}": ${uploadErrorMsg}`);
          continue;
        }

        const estimatedMinutes = Math.max(5, Math.round(sizeMB * 15));

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
      } catch (err: any) {
        toast.error(`Erreur "${file.name}": ${err?.message || "Erreur inconnue"}`);
      }
      
      // Yield to UI thread
      await new Promise((r) => setTimeout(r, 50));
    }

    if (imported > 0) {
      toast.success(`${imported} cours importé(s) avec succès !`);
    }
    setUploading(false);
    setUploadProgress(null);
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
      await deleteCourseFile(course.file_url);
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
          {!folderId && canCreateFolder && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" /> Nouveau dossier {isAdmin && "(public)"}
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
      </div>

      {/* Folders or Courses */}
      {!folderId ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {dbFolders.map((folder) => {
            const isOwner = folder.created_by === user?.id;
            return (
            <motion.div
              key={folder.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all cursor-pointer relative group"
              onClick={() => navigate(`/subject/${subjectId}/folder/${folder.id}`)}
            >
              <div className={`h-1.5 w-12 rounded-full ${colors.bg} mb-4`} />
              {/* Public/Private badge */}
              <Badge variant={folder.is_public ? "secondary" : "outline"} className="absolute top-3 left-3 text-[10px]">
                {folder.is_public ? "📢 Public" : "🔒 Privé"}
              </Badge>
              {renamingFolder === folder.id ? (
                <div className="flex items-center gap-2 mb-2 mt-4" onClick={(e) => e.stopPropagation()}>
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
                <h3 className="font-semibold text-foreground mb-2 mt-4">{folder.name}</h3>
              )}
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {folder.course_count} Cours</span>
                <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {folder.exercise_count} Exercices</span>
              </div>
              {isOwner && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => { setRenamingFolder(folder.id); setRenameFolderValue(folder.name); }}
                  title="Renommer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteFolder(folder)}
                  title="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              )}
            </motion.div>
            );
          })}

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
          {/* Nouveau cours button - only for folder owner */}
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
                        // Block Prépa courses for non-subscribers
                        if (course.source === "bonus" && !isSubscribed && !isAdmin) {
                          setPremiumModalOpen(true);
                          return;
                        }
                        const { data, error } = await supabase.storage
                          .from("course-files")
                          .createSignedUrl(course.file_url!, 3600);
                        if (data?.signedUrl) {
                          // Verify the file actually exists by doing a HEAD request
                          try {
                            const headRes = await fetch(data.signedUrl, { method: "HEAD" });
                            if (!headRes.ok) {
                              toast.error("Le fichier de ce cours est introuvable. Veuillez le réimporter.");
                              return;
                            }
                          } catch {
                            // If HEAD fails, still try to open — some CORS configs block HEAD
                          }
                          setPdfSignedUrl(data.signedUrl);
                          setPdfTitle(course.title);
                          setPdfFileName(course.file_url || "");
                          setPdfCourseId(course.id);
                          setPdfViewerOpen(true);
                        } else {
                          console.error("createSignedUrl error:", error);
                          toast.error("Le fichier de ce cours est introuvable. Veuillez le réimporter.");
                        }
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
                  </>
                  )}
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
      />
      <PremiumModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} />
    </div>
  );
}
