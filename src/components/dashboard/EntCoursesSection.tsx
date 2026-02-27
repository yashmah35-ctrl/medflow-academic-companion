import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, FolderOpen, FolderPlus, Pencil, ArrowRightLeft, Check, X, ExternalLink, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { entSupabase } from "@/lib/entSupabaseClient";
import { supabase } from "@/integrations/supabase/client";

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
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);

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

  // Create new empty folder (we don't create a DB entry — we just show it when a course is moved there)
  // But to satisfy the user we can show a prompt and the folder appears once a course is moved.
  // Alternative: create a placeholder course. Better: just let user type a new name when moving.
  // For UX, let's create the folder name and let users move courses into it via the move dialog.
  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    if (entGroups.some((g) => g.subjectName === name)) {
      toast.error("Ce dossier existe déjà");
      return;
    }
    // Add an empty group locally
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
  };

  // Generate flashcards from course
  const handleGenerateFlashcards = async () => {
    if (!selectedCourse) return;
    setGeneratingFlashcards(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-flashcards", {
        body: {
          content: `Cours : ${selectedCourse.title}\nMatière : ${selectedCourse.subject ?? "Inconnue"}\nURL du document : ${selectedCourse.url ?? "non disponible"}`,
          subject: selectedCourse.subject ?? "Médecine",
          cardCount: 10,
        },
      });

      if (error) throw error;
      if (data?.flashcards?.length > 0) {
        toast.success(`${data.flashcards.length} flashcards générées ! Rendez-vous dans la section Flashcards.`);
      } else {
        toast.info("Aucune flashcard générée. Essayez avec un cours contenant plus de contenu.");
      }
    } catch (err: any) {
      console.error("Flashcard generation error:", err);
      toast.error("Erreur lors de la génération des flashcards");
    } finally {
      setGeneratingFlashcards(false);
    }
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

      {/* Course detail dialog */}
      <Dialog open={!!selectedCourse} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>
              Matière : {selectedCourse?.subject ?? "Non définie"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCourse?.url ? (
              <a
                href={selectedCourse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-primary hover:bg-muted transition-colors"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">{selectedCourse.url}</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">Aucun lien disponible</p>
            )}

            {!selectedCourse?.content && (
              <p className="text-sm text-muted-foreground italic bg-muted/30 rounded-lg px-4 py-3">
                Contenu non disponible - consultez le lien original
              </p>
            )}

            {selectedCourse?.url && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open(selectedCourse.url!, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir sur Madoc
              </Button>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleGenerateFlashcards}
              disabled={generatingFlashcards}
            >
              {generatingFlashcards ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generatingFlashcards ? "Génération en cours..." : "Générer les flashcards"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
