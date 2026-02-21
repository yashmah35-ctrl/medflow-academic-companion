import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  subjects,
  foldersBySubject,
  coursesByFolder,
  subjectColorMap,
} from "@/data/mockData";
import { useState } from "react";

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
  const folders = foldersBySubject[subjectId || ""] || [];
  const courses = folderId ? coursesByFolder[folderId] || [] : [];
  const currentFolder = folders.find((f) => f.id === folderId);

  if (!subject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Matière introuvable.</p>
        <Button variant="ghost" onClick={() => navigate("/")} className="mt-2">
          Retour
        </Button>
      </div>
    );
  }

  const colors = subjectColorMap[subject.color];

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {currentFolder && (
            <p className="text-sm text-muted-foreground">{subject.name}</p>
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
          {folders.map((folder) => (
            <motion.div
              key={folder.id}
              variants={item}
              className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/subject/${subjectId}/folder/${folder.id}`)}
            >
              <div className={`h-1.5 w-12 rounded-full ${colors.bg} mb-4`} />
              <h3 className="font-semibold text-foreground mb-2">{folder.name}</h3>
              <div className="flex gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" /> {folder.courseCount} Cours
                </span>
                <span className="flex items-center gap-1">
                  <Dumbbell className="h-3 w-3" /> {folder.exerciseCount} Exercices
                </span>
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
        <motion.div
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {courses
            .sort((a, b) => (a.source === "fac" ? -1 : 1))
            .map((course) => (
              <motion.div
                key={course.id}
                variants={item}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-4">
                  <Badge
                    variant={course.source === "fac" ? "default" : "secondary"}
                    className="text-xs shrink-0"
                  >
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
                <Button size="sm" variant="outline">
                  Étudier
                </Button>
              </motion.div>
            ))}

          {courses.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun cours disponible</p>
              <p className="text-sm mt-1">Les cours apparaîtront ici une fois ajoutés.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
