import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell, Upload, FolderPlus, Eye, Lock } from "lucide-react";
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
  subjects,
  foldersBySubject,
  coursesByFolder,
  subjectColorMap,
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
  const subject = subjects.find((s) => s.id === subjectId);
  const [localFolders, setLocalFolders] = useState(foldersBySubject[subjectId || ""] || []);
  const mockCourses = folderId ? coursesByFolder[folderId] || [] : [];
  const currentFolder = localFolders.find((f) => f.id === folderId);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewingCourse, setViewingCourse] = useState<DBCourse | null>(null);

  const isMedicalStudent = role === "medical_student";

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

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Matière introuvable.</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-2">Retour</Button>
      </div>
    );
  }

  const colors = subjectColorMap[subject.color];

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: `f-new-${Date.now()}`,
      subjectId: subjectId!,
      name: newFolderName.trim(),
      courseCount: 0,
      exerciseCount: 0,
      progress: 0,
    };
    setLocalFolders((prev) => [...prev, newFolder]);
    setNewFolderName("");
    setDialogOpen(false);
    toast.success(`Dossier "${newFolder.name}" créé !`);
  };

  const handleCourseImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !folderId || !user) return;

    setUploading(true);
    let imported = 0;

    for (const file of Array.from(files)) {
      try {
        // Upload to storage
        const filePath = `${user.id}/${folderId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("course-files")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Erreur upload: ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("course-files")
          .getPublicUrl(filePath);

        // Estimate reading time
        const sizeMB = file.size / (1024 * 1024);
        const estimatedMinutes = Math.max(5, Math.round(sizeMB * 15));

        // Insert course in DB
        const { data: course, error: insertError } = await supabase
          .from("courses")
          .insert({
            folder_id: folderId,
            title: file.name.replace(/\.(pdf|docx?|txt)$/i, ""),
            source: "fac",
            reading_time: `${estimatedMinutes} min`,
            file_url: urlData.publicUrl,
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

  // Merge mock + DB courses
  const allCourses = [
    ...mockCourses.map((c) => ({
      id: c.id,
      title: c.title,
      source: c.source,
      reading_time: c.readingTime,
      created_at: c.addedDate,
      file_url: null as string | null,
    })),
    ...dbCourses.filter((dc) => !mockCourses.some((mc) => mc.id === dc.id)),
  ];

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
          {folderId && isMedicalStudent && (
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" /> {uploading ? "Import en cours..." : "Importer un cours"}
            </Button>
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
          {localFolders.map((folder) => (
            <motion.div
              key={folder.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/subject/${subjectId}/folder/${folder.id}`)}
            >
              <div className={`h-1.5 w-12 rounded-full ${colors.bg} mb-4`} />
              <h3 className="font-semibold text-foreground mb-2">{folder.name}</h3>
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {folder.courseCount} Cours</span>
                <span className="flex items-center gap-1"><Dumbbell className="h-3 w-3" /> {folder.exerciseCount} Exercices</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{folder.progress}%</span>
                </div>
                <Progress value={folder.progress} className="h-1.5" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
          {allCourses
            .sort((a, b) => (a.source === "fac" ? -1 : 1))
            .map((course) => (
              <motion.div
                key={course.id}
                variants={item}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <Badge variant={course.source === "fac" ? "default" : "secondary"} className="text-xs shrink-0">
                    {course.source === "fac" ? "Cours de la Fac" : "Cours Bonus"}
                  </Badge>
                  {course.source === "bonus" && (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <h4 className="font-medium text-foreground">{course.title}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{formatDate(course.created_at)}</span>
                      <span>•</span>
                      <span>{course.reading_time || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {course.file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingCourse(course)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Consulter
                    </Button>
                  )}
                  <Button size="sm" variant="outline">Étudier</Button>
                </div>
              </motion.div>
            ))}

          {allCourses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun cours disponible</p>
              <p className="text-sm mt-1">Importe des cours pour commencer.</p>
              {isMedicalStudent && (
                <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Importer un cours
                </Button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Course viewer dialog - no download, protected */}
      <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{viewingCourse?.title}</DialogTitle>
            <DialogDescription className="sr-only">Visualisation du cours</DialogDescription>
          </DialogHeader>
          {viewingCourse?.file_url && (
            <div
              className="relative w-full h-[70vh] select-none"
              onContextMenu={(e) => e.preventDefault()}
              style={{ userSelect: "none" }}
            >
              {viewingCourse.file_url.match(/\.(pdf)$/i) || viewingCourse.file_url.includes(".pdf") ? (
                <iframe
                  src={`${viewingCourse.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                  className="w-full h-full rounded-lg border border-border"
                  title={viewingCourse.title}
                />
              ) : viewingCourse.file_url.match(/\.(jpe?g|png|gif|webp)$/i) ? (
                <img
                  src={viewingCourse.file_url}
                  alt={viewingCourse.title}
                  className="w-full h-full object-contain rounded-lg pointer-events-none"
                  draggable={false}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Aperçu non disponible pour ce type de fichier. Utilisez le bouton Étudier.</p>
                </div>
              )}
              {/* Overlay to prevent right-click save on bonus courses */}
              {viewingCourse.source === "bonus" && (
                <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
