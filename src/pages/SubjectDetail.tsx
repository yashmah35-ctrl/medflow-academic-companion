import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell, Plus, Upload, FolderPlus } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  subjects,
  foldersBySubject,
  coursesByFolder,
  subjectColorMap,
} from "@/data/mockData";
import { useState, useRef } from "react";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SubjectDetail() {
  const { subjectId, folderId } = useParams();
  const navigate = useNavigate();
  const subject = subjects.find((s) => s.id === subjectId);
  const [localFolders, setLocalFolders] = useState(foldersBySubject[subjectId || ""] || []);
  const courses = folderId ? coursesByFolder[folderId] || [] : [];
  const currentFolder = localFolders.find((f) => f.id === folderId);
  const [newFolderName, setNewFolderName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleCourseImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success(`${files.length} cours importé(s) avec succès !`);
    }
    e.target.value = "";
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
          {folderId && (
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" /> Importer un cours
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
          {courses
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
                  <div>
                    <h4 className="font-medium text-foreground">{course.title}</h4>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{course.addedDate}</span>
                      <span>•</span>
                      <span>{course.readingTime}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">Étudier</Button>
              </motion.div>
            ))}

          {courses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun cours disponible</p>
              <p className="text-sm mt-1">Importe des cours pour commencer.</p>
              <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" /> Importer un cours
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
