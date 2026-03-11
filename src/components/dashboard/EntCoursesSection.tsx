import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, FolderOpen, FolderPlus, Pencil, ArrowRightLeft, Check, X, FileText, Loader2, Upload, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { entSupabase } from "@/lib/entSupabaseClient";
import { supabase } from "@/integrations/supabase/client";
import { EntCoursePanel } from "./EntCoursePanel";
import { useAuth } from "@/hooks/useAuth";

interface EntCourse {
  id: string;
  title: string;
}

interface EntGroup {
  subjectName: string;
  courses: EntCourse[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function EntCoursesSection({ userId }: { userId: string }) {
  const { user } = useAuth();
  const [entGroups, setEntGroups] = useState<EntGroup[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Rename folder state
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");

  // Rename course state
  const [renamingCourse, setRenamingCourse] = useState<string | null>(null);
  const [renameCourseValue, setRenameCourseValue] = useState("");

  // Move course dialog state
  const [movingCourse, setMovingCourse] = useState<{ id: string; currentSubject: string } | null>(null);
  const [moveTarget, setMoveTarget] = useState("");

  // New folder dialog state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Course detail dialog state
  const [selectedCourse, setSelectedCourse] = useState<{ id: string; title: string; url: string | null; subject: string | null; content: string | null } | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCourses = useCallback(async () => {
    const { data: courses, error } = await entSupabase
      .from("courses")
      .select("id, title, subject")
      .eq("source", "fac")
      .eq("user_id", userId);

    if (error || !courses || courses.length === 0) {
      setEntGroups([]);
      return;
    }

    const subjectMap = new Map<string, EntCourse[]>();
    for (const c of courses) {
      const subjectName = (c as any).subject ?? "Autre";
      if (!subjectMap.has(subjectName)) subjectMap.set(subjectName, []);
      subjectMap.get(subjectName)!.push({ id: c.id, title: c.title });
    }

    const groups = Array.from(subjectMap.entries()).map(([name, courseList]) => ({
      subjectName: name,
      courses: courseList.sort((a, b) => a.title.localeCompare(b.title)),
    }));
    groups.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
    setEntGroups(groups);
  }, [userId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // ─── Load persisted PDF when course opens ────────
  const loadPersistedPdf = useCallback(async (courseId: string) => {
    const storagePath = `ent-pdfs/${courseId}.pdf`;
    const { data } = await entSupabase.storage
      .from("courses")
      .createSignedUrl(storagePath, 3600);
    if (data?.signedUrl) {
      setPdfUrl(data.signedUrl);
    }
  }, []);

  // Rename folder = update subject field on all courses in that group
  const handleRenameFolder = async (oldName: string) => {
    const newName = renameFolderValue.trim();
    if (!newName || newName === oldName) {
      setRenamingFolder(null);
      return;
    }
    const courseIds = entGroups.find((g) => g.subjectName === oldName)?.courses.map((c) => c.id) ?? [];
    if (courseIds.length === 0) return;

    const { error } = await entSupabase
      .from("courses")
      .update({ subject: newName })
      .in("id", courseIds);

    if (error) {
      toast.error("Erreur lors du renommage du dossier");
      return;
    }
    toast.success("Dossier renommé !");
    setRenamingFolder(null);
    setRenameFolderValue("");
    fetchCourses();
  };

  // Rename course title
  const handleRenameCourse = async (courseId: string) => {
    const newTitle = renameCourseValue.trim();
    if (!newTitle) {
      setRenamingCourse(null);
      return;
    }
    const { error } = await entSupabase
      .from("courses")
      .update({ title: newTitle })
      .eq("id", courseId);

    if (error) {
      toast.error("Erreur lors du renommage du cours");
      return;
    }
    toast.success("Cours renommé !");
    setRenamingCourse(null);
    setRenameCourseValue("");
    fetchCourses();
  };

  // Move course to another subject folder
  const handleMoveCourse = async () => {
    if (!movingCourse || !moveTarget.trim()) return;
    const { error } = await entSupabase
      .from("courses")
      .update({ subject: moveTarget.trim() })
      .eq("id", movingCourse.id);

    if (error) {
      toast.error("Erreur lors du déplacement");
      return;
    }
    toast.success("Cours déplacé !");
    setMovingCourse(null);
    setMoveTarget("");
    fetchCourses();
  };

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (entGroups.some((g) => g.subjectName === name)) {
      toast.error("Ce dossier existe déjà");
      return;
    }
    setEntGroups((prev) => [...prev, { subjectName: name, courses: [] }].sort((a, b) => a.subjectName.localeCompare(b.subjectName)));
    setShowNewFolder(false);
    setNewFolderName("");
    toast.success("Dossier créé ! Déplacez-y des cours.");
  };

  // Open course detail
  const handleOpenCourse = async (courseId: string) => {
    const { data, error } = await entSupabase
      .from("courses")
      .select("id, title, url, subject, content")
      .eq("id", courseId)
      .single();

    if (error || !data) {
      toast.error("Impossible de charger le cours");
      return;
    }
    setSelectedCourse(data as any);
    setPdfUrl(null);
    // Try to load persisted PDF
    loadPersistedPdf(courseId);
  };

  const handleCloseDetail = () => {
    setSelectedCourse(null);
    setPdfUrl(null);
  };

  const handlePdfUpload = async (file: File) => {
    if (!file || !file.type.includes("pdf") || !selectedCourse) {
      toast.error("Veuillez sélectionner un fichier PDF");
      return;
    }
    setUploading(true);
    try {
      // 1. Upload to Supabase storage for persistence
      const storagePath = `ent-pdfs/${selectedCourse.id}.pdf`;
      const { error: uploadError } = await entSupabase.storage
        .from("courses")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        toast.error("Erreur lors de la sauvegarde du PDF");
        setUploading(false);
        return;
      }

      // 2. Get signed URL for display
      const { data: signedData } = await entSupabase.storage
        .from("courses")
        .createSignedUrl(storagePath, 3600);

      if (signedData?.signedUrl) {
        setPdfUrl(signedData.signedUrl);
      } else {
        // Fallback to blob URL
        setPdfUrl(URL.createObjectURL(file));
      }
      toast.success("PDF sauvegardé !");

      // 3. Generate flashcards from PDF using edge function
      if (user) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            toast.info("Génération des flashcards en cours...");
            const { data, error } = await supabase.functions.invoke("generate-flashcards", {
              body: {
                fileBase64: base64,
                fileMimeType: file.type,
                subject: selectedCourse.subject ?? "Médecine",
                cardCount: 10,
              },
            });
            if (error) throw error;
            if (data?.error) { toast.error(data.error); return; }
            const cards = data?.flashcards || [];
            if (cards.length === 0) { toast.info("Aucune flashcard générée."); return; }

            // Always create a new dedicated deck named after the course
            const deckName = selectedCourse.title || selectedCourse.subject || "Cours ENT";
            const { data: newDeck, error: deckError } = await supabase
              .from("flashcard_decks")
              .insert({ user_id: user.id, name: deckName })
              .select("id")
              .single();
            if (deckError) { toast.error("Erreur création du deck"); return; }
            const deckId = newDeck.id;

            // Insert flashcards
            const inserts = cards.map((c: any) => ({
              deck_id: deckId!,
              user_id: user.id,
              card_type: "qr",
              front: c.front,
              back: c.back,
              explanation: c.explanation || null,
            }));
            const { error: insertError } = await supabase.from("flashcards").insert(inserts);
            if (insertError) { toast.error("Erreur lors de l'import des flashcards"); return; }
            toast.success(`${cards.length} flashcards générées et sauvegardées dans "${deckName}" !`);
          } catch (err) {
            console.error("Flashcard generation error:", err);
            toast.error("Erreur lors de la génération des flashcards");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      toast.error("Erreur lors du chargement du PDF");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePdfUpload(file);
  };

  if (entGroups.length === 0 && !showNewFolder) return null;

  const allFolderNames = entGroups.map((g) => g.subjectName);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Mes cours ENT</h2>
        <Button size="sm" variant="outline" className="gap-1.5 rounded-lg" onClick={() => setShowNewFolder(true)}>
          <FolderPlus className="h-4 w-4" />
          Nouveau dossier
        </Button>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {entGroups.map((group) => (
          <motion.div
            key={group.subjectName}
            variants={item}
            className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            onClick={() => setExpandedGroup(expandedGroup === group.subjectName ? null : group.subjectName)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {renamingFolder === group.subjectName ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      value={renameFolderValue}
                      onChange={(e) => setRenameFolderValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(group.subjectName)}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleRenameFolder(group.subjectName)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setRenamingFolder(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-bold text-foreground text-sm truncate">{group.subjectName}</h3>
                    <p className="text-xs text-muted-foreground">{group.courses.length} cours</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
                  title="Renommer le dossier"
                  onClick={() => {
                    setRenamingFolder(group.subjectName);
                    setRenameFolderValue(group.subjectName);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ChevronRight
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                  expandedGroup === group.subjectName && "rotate-90"
                )}
              />
            </div>

            {expandedGroup === group.subjectName && (
              <div className="mt-3 space-y-1 border-t border-border pt-3">
                {group.courses.length === 0 && (
                  <p className="text-xs text-muted-foreground italic px-2">Aucun cours — déplacez-en ici</p>
                )}
                {group.courses.map((c) => (
                  <div
                    key={c.id}
                    className="group/course flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {renamingCourse === c.id ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          value={renameCourseValue}
                          onChange={(e) => setRenameCourseValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRenameCourse(c.id)}
                          className="h-6 text-xs flex-1"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleRenameCourse(c.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setRenamingCourse(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="truncate flex-1 cursor-pointer hover:underline" onClick={() => handleOpenCourse(c.id)}>{c.title}</span>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover/course:opacity-100 transition-opacity shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Renommer"
                            onClick={() => {
                              setRenamingCourse(c.id);
                              setRenameCourseValue(c.title);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Déplacer vers..."
                            onClick={() => {
                              setMovingCourse({ id: c.id, currentSubject: group.subjectName });
                              setMoveTarget("");
                            }}
                          >
                            <ArrowRightLeft className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Move course dialog */}
      <Dialog open={!!movingCourse} onOpenChange={(open) => !open && setMovingCourse(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Déplacer le cours</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choisissez le dossier de destination :</p>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un dossier" />
              </SelectTrigger>
              <SelectContent>
                {allFolderNames
                  .filter((n) => n !== movingCourse?.currentSubject)
                  .map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Ou tapez un nouveau nom de dossier :</p>
            <Input
              placeholder="Nouveau dossier..."
              value={moveTarget}
              onChange={(e) => setMoveTarget(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovingCourse(null)}>Annuler</Button>
            <Button onClick={handleMoveCourse} disabled={!moveTarget.trim()}>Déplacer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nom du dossier..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolder(false)}>Annuler</Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course detail - Split-screen viewer */}
      <Dialog open={!!selectedCourse} onOpenChange={(v) => { if (!v) handleCloseDetail(); }}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] h-[92vh] p-0 gap-0 overflow-hidden border-border/50 bg-card shadow-2xl"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-gradient-to-r from-card via-card to-muted/30">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground truncate">{selectedCourse?.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedCourse?.subject ?? "Matière non définie"} · Consultation en lecture seule
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={handleCloseDetail}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content: left panel + side panel */}
          <div className="flex flex-1" style={{ height: "calc(92vh - 60px)" }}>
            {/* Left: Document area */}
            <div className="relative flex-1 flex flex-col bg-muted/20 overflow-hidden">
              {/* Top bar: Madoc button */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/30 bg-card/50 shrink-0">
                {selectedCourse?.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(selectedCourse.url!, "_blank")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir sur Madoc
                  </Button>
                )}
              </div>

              {/* PDF viewer or upload zone */}
              <div className="flex-1 overflow-hidden">
                {pdfUrl ? (
                  /* Embedded PDF viewer */
                  <div className="h-full flex flex-col">
                    <iframe
                      src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                      className="w-full flex-1 border-0"
                      title={selectedCourse?.title ?? "PDF"}
                    />
                    <div className="flex items-center justify-between px-4 py-2 border-t border-border/30 bg-card/50 shrink-0">
                      <p className="text-xs text-muted-foreground">PDF chargé</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={async () => {
                          // Remove from storage too
                          if (selectedCourse) {
                            await entSupabase.storage
                              .from("courses")
                              .remove([`ent-pdfs/${selectedCourse.id}.pdf`]);
                          }
                          setPdfUrl(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="h-3 w-3" /> Retirer le PDF
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Upload zone + content fallback */
                  <div className="h-full overflow-y-auto p-6 space-y-6">
                    {/* Upload zone */}
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                      )}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePdfUpload(file);
                        }}
                      />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Sauvegarde et génération en cours...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Glissez un PDF ici ou cliquez pour sélectionner
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Le PDF sera sauvegardé et les flashcards générées automatiquement
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Text content fallback */}
                    {selectedCourse?.content && (
                      <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-foreground">
                        {selectedCourse.content}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Side panel */}
            <div className="w-[380px] shrink-0 border-l border-border/50 bg-card overflow-hidden">
              <EntCoursePanel
                courseId={selectedCourse?.id ?? ""}
                courseTitle={selectedCourse?.title ?? ""}
                courseUrl={selectedCourse?.url ?? null}
                courseContent={selectedCourse?.content ?? null}
                courseSubject={selectedCourse?.subject ?? null}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
