import { useState, useEffect, useCallback, useRef } from "react";
import { getCoursePublicUrl, uploadCourseFile, deleteCourseFile } from "@/lib/externalStorage";
import { motion } from "framer-motion";
import {
  FolderOpen, FolderPlus, ChevronRight, BookOpen, Pencil, Check, X,
  Trash2, Upload, Loader2, Plus, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SecurePdfViewer } from "@/components/SecurePdfViewer";

interface PersonalFolder {
  id: string;
  name: string;
  created_by: string;
}

interface PersonalCourse {
  id: string;
  title: string;
  file_url: string | null;
  created_at: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function PersonalCoursesSection({ userId }: { userId: string }) {
  const [folders, setFolders] = useState<PersonalFolder[]>([]);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [folderCourses, setFolderCourses] = useState<Record<string, PersonalCourse[]>>({});

  // New folder
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Rename folder
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");

  // Upload
  const [uploading, setUploading] = useState(false);
  const [uploadingFolderId, setUploadingFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF viewer
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string | null>(null);
  const [pdfTitle, setPdfTitle] = useState("");

  const fetchFolders = useCallback(async () => {
    const { data } = await supabase
      .from("folders")
      .select("id, name, created_by")
      .is("subject_id", null)
      .eq("created_by", userId)
      .order("name");
    if (data) setFolders(data as PersonalFolder[]);
  }, [userId]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const fetchCoursesForFolder = useCallback(async (folderId: string) => {
    const { data } = await supabase
      .from("courses")
      .select("id, title, file_url, created_at")
      .eq("folder_id", folderId)
      .order("title");
    if (data) setFolderCourses((prev) => ({ ...prev, [folderId]: data }));
  }, []);

  const handleToggleFolder = (folderId: string) => {
    if (expandedFolder === folderId) {
      setExpandedFolder(null);
    } else {
      setExpandedFolder(folderId);
      if (!folderCourses[folderId]) fetchCoursesForFolder(folderId);
    }
  };

  // Create folder
  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    const { data, error } = await supabase
      .from("folders")
      .insert({ name, created_by: userId, is_public: false, course_count: 0, exercise_count: 0 })
      .select("id, name, created_by")
      .single();
    if (error) { toast.error("Erreur lors de la création"); return; }
    if (data) {
      setFolders((prev) => [...prev, data as PersonalFolder].sort((a, b) => a.name.localeCompare(b.name)));
      setShowNewFolder(false);
      setNewFolderName("");
      toast.success(`Dossier "${name}" créé !`);
    }
  };

  // Rename folder
  const handleRenameFolder = async (folderId: string) => {
    const newName = renameFolderValue.trim();
    if (!newName) { setRenamingFolder(null); return; }
    const { error } = await supabase.from("folders").update({ name: newName }).eq("id", folderId);
    if (error) { toast.error("Erreur"); return; }
    setFolders((prev) => prev.map((f) => f.id === folderId ? { ...f, name: newName } : f));
    setRenamingFolder(null);
    setRenameFolderValue("");
    toast.success("Dossier renommé !");
  };

  // Delete folder
  const handleDeleteFolder = async (folder: PersonalFolder) => {
    if (!confirm(`Supprimer le dossier "${folder.name}" et tous ses cours ?`)) return;
    await supabase.from("courses").delete().eq("folder_id", folder.id);
    const { error } = await supabase.from("folders").delete().eq("id", folder.id);
    if (error) { toast.error("Erreur"); return; }
    setFolders((prev) => prev.filter((f) => f.id !== folder.id));
    if (expandedFolder === folder.id) setExpandedFolder(null);
    toast.success("Dossier supprimé !");
  };

  // Delete course
  const handleDeleteCourse = async (course: PersonalCourse, folderId: string) => {
    if (!confirm(`Supprimer "${course.title}" ?`)) return;
    if (course.file_url) {
      await deleteCourseFile(course.file_url);
    }
    const { error } = await supabase.from("courses").delete().eq("id", course.id);
    if (error) { toast.error("Erreur"); return; }
    setFolderCourses((prev) => ({ ...prev, [folderId]: (prev[folderId] || []).filter((c) => c.id !== course.id) }));
    toast.success("Cours supprimé !");
  };

  // Upload file
  const handleUploadClick = (folderId: string) => {
    setUploadingFolderId(folderId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingFolderId) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${userId}/${uploadingFolderId}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("course-files")
        .upload(filePath, file);
      if (uploadError) { toast.error(`Erreur upload: ${file.name}`); continue; }

      const { data: course, error: insertError } = await supabase
        .from("courses")
        .insert({
          folder_id: uploadingFolderId,
          title: file.name.replace(/\.(pdf|docx?|txt)$/i, ""),
          source: "fac",
          file_url: filePath,
        })
        .select("id, title, file_url, created_at")
        .single();

      if (insertError) { toast.error(`Erreur: ${file.name}`); continue; }
      if (course) {
        setFolderCourses((prev) => ({
          ...prev,
          [uploadingFolderId]: [...(prev[uploadingFolderId] || []), course],
        }));
      }
    }

    toast.success("Fichier(s) importé(s) !");
    setUploading(false);
    setUploadingFolderId(null);
    e.target.value = "";
  };

  // Open PDF
  const handleOpenFile = async (course: PersonalCourse) => {
    if (!course.file_url) return;
    const { data } = await supabase.storage
      .from("course-files")
      .createSignedUrl(course.file_url, 3600);
    if (data?.signedUrl) {
      setPdfSignedUrl(data.signedUrl);
      setPdfTitle(course.title);
      setPdfViewerOpen(true);
    } else {
      toast.error("Impossible d'ouvrir le fichier");
    }
  };

  return (
    <div className="space-y-3">
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple className="hidden" onChange={handleFileChange} />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Mes cours</h2>
          <p className="text-sm text-muted-foreground">Tes dossiers et documents personnels</p>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => setShowNewFolder(true)}>
          <FolderPlus className="h-4 w-4" />
          Nouveau dossier
        </Button>
      </div>

      {folders.length === 0 && !showNewFolder && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
          <FolderPlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Aucun dossier</p>
          <p className="text-xs text-muted-foreground mt-1">Crée un dossier pour organiser tes cours.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> Créer un dossier
          </Button>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {folders.map((folder) => {
          const courses = folderCourses[folder.id] || [];
          const isExpanded = expandedFolder === folder.id;

          return (
            <motion.div
              key={folder.id}
              variants={item}
              className="group rounded-2xl border border-border bg-card p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              onClick={() => handleToggleFolder(folder.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  {renamingFolder === folder.id ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={renameFolderValue}
                        onChange={(e) => setRenameFolderValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleRenameFolder(folder.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRenamingFolder(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-foreground text-sm truncate">{folder.name}</h3>
                      <p className="text-xs text-muted-foreground">{courses.length} cours</p>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100" title="Renommer"
                    onClick={() => { setRenamingFolder(folder.id); setRenameFolderValue(folder.name); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-destructive" title="Supprimer"
                    onClick={() => handleDeleteFolder(folder)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-90")} />
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-1 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                  {/* Upload button */}
                  <button
                    className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors"
                    onClick={() => handleUploadClick(folder.id)}
                    disabled={uploading}
                  >
                    {uploading && uploadingFolderId === folder.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    <span>Importer un fichier</span>
                  </button>

                  {courses.length === 0 && (
                    <p className="text-xs text-muted-foreground italic px-2">Aucun cours</p>
                  )}
                  {courses.map((c) => (
                    <div key={c.id} className="group/course flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate flex-1 cursor-pointer hover:underline" onClick={() => handleOpenFile(c)}>{c.title}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/course:opacity-100 transition-opacity shrink-0">
                        {c.file_url && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" title="Consulter" onClick={() => handleOpenFile(c)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" title="Supprimer"
                          onClick={() => handleDeleteCourse(c, folder.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
            <DialogDescription>Crée un dossier pour organiser tes cours.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <Input
              placeholder="Nom du dossier"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <Button onClick={handleCreateFolder} className="w-full" disabled={!newFolderName.trim()}>
              Créer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SecurePdfViewer
        open={pdfViewerOpen}
        onOpenChange={setPdfViewerOpen}
        signedUrl={pdfSignedUrl}
        title={pdfTitle}
        fileName=""
      />
    </div>
  );
}
