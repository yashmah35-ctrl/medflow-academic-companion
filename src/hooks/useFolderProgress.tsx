import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FolderProgressData {
  [folderId: string]: number; // 0-100
}

export function useFolderProgress(folderIds: string[], totalCoursesPerFolder: Record<string, number>) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<FolderProgressData>({});

  useEffect(() => {
    if (!user || folderIds.length === 0) return;

    const calculate = async () => {
      const result: FolderProgressData = {};

      // 1. Get all opened courses for this user across these folders
      const { data: courseProgress } = await supabase
        .from("user_course_progress")
        .select("folder_id, course_id")
        .eq("user_id", user.id)
        .in("folder_id", folderIds);

      // Count opened courses per folder
      const openedPerFolder: Record<string, number> = {};
      (courseProgress || []).forEach((cp: any) => {
        openedPerFolder[cp.folder_id] = (openedPerFolder[cp.folder_id] || 0) + 1;
      });

      // 2. Get all revision scores for this user across these folders
      const { data: revisionScores } = await supabase
        .from("user_revision_scores")
        .select("folder_id, correct_count, total_count")
        .eq("user_id", user.id)
        .in("folder_id", folderIds);

      // Sum correct/total per folder
      const revCorrectPerFolder: Record<string, number> = {};
      const revTotalPerFolder: Record<string, number> = {};
      (revisionScores || []).forEach((rs: any) => {
        revCorrectPerFolder[rs.folder_id] = (revCorrectPerFolder[rs.folder_id] || 0) + rs.correct_count;
        revTotalPerFolder[rs.folder_id] = (revTotalPerFolder[rs.folder_id] || 0) + rs.total_count;
      });

      // 3. Calculate progression for each folder
      for (const folderId of folderIds) {
        const totalCourses = totalCoursesPerFolder[folderId] || 0;
        const openedCourses = openedPerFolder[folderId] || 0;

        // Course part (50%)
        const coursePct = totalCourses > 0 ? (openedCourses / totalCourses) : 0;

        // Revision part (50%) - Option B: per question
        const totalRevQuestions = revTotalPerFolder[folderId] || 0;
        const correctRevQuestions = revCorrectPerFolder[folderId] || 0;
        const revisionPct = totalRevQuestions > 0 ? (correctRevQuestions / totalRevQuestions) : 0;

        // If no revisions exist yet, course part takes 100%
        // If no courses exist yet, revision part takes 100%
        let finalPct: number;
        if (totalCourses === 0 && totalRevQuestions === 0) {
          finalPct = 0;
        } else if (totalRevQuestions === 0) {
          finalPct = coursePct * 100;
        } else if (totalCourses === 0) {
          finalPct = revisionPct * 100;
        } else {
          finalPct = (coursePct * 50) + (revisionPct * 50);
        }

        result[folderId] = Math.min(100, Math.round(finalPct));
      }

      setProgress(result);
    };

    calculate();
  }, [user, folderIds.join(","), JSON.stringify(totalCoursesPerFolder)]);

  return progress;
}
