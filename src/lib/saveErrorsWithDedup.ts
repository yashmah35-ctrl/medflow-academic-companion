import { supabase } from "@/integrations/supabase/client";

interface ErrorToSave {
  user_id: string;
  question: string;
  wrong_answer: string;
  correct_answer: string;
  subject_name: string;
  error_type: string;
  source: string;
  propositions_json: any;
}

/**
 * Saves errors with deduplication: if a question already exists for the user,
 * increments occurrence_count instead of creating a duplicate.
 */
export async function saveErrorsWithDedup(errors: ErrorToSave[]): Promise<{ inserted: number; updated: number }> {
  if (errors.length === 0) return { inserted: 0, updated: 0 };

  const userId = errors[0].user_id;

  // Fetch existing errors for this user to check for duplicates
  const { data: existingErrors } = await supabase
    .from("errors")
    .select("id, question, occurrence_count")
    .eq("user_id", userId);

  const existingMap = new Map<string, { id: string; occurrence_count: number }>();
  if (existingErrors) {
    existingErrors.forEach((e) => {
      existingMap.set(e.question.trim().toLowerCase(), {
        id: e.id,
        occurrence_count: e.occurrence_count,
      });
    });
  }

  const toInsert: (ErrorToSave & { occurrence_count: number })[] = [];
  const toUpdate: { id: string; occurrence_count: number; wrong_answer: string; last_seen: string; propositions_json: any; consecutive_wrong: number }[] = [];

  for (const err of errors) {
    const key = err.question.trim().toLowerCase();
    const existing = existingMap.get(key);

    if (existing) {
      toUpdate.push({
        id: existing.id,
        occurrence_count: existing.occurrence_count + 1,
        wrong_answer: err.wrong_answer,
        last_seen: new Date().toISOString(),
        propositions_json: err.propositions_json,
        consecutive_wrong: (existing.occurrence_count + 1),
      });
    } else {
      toInsert.push({ ...err, occurrence_count: 1 });
      // Add to map to handle duplicates within the same batch
      existingMap.set(key, { id: "pending", occurrence_count: 1 });
    }
  }

  // Insert new errors
  if (toInsert.length > 0) {
    await supabase.from("errors").insert(toInsert);
  }

  // Update existing errors one by one (increment occurrence_count)
  for (const upd of toUpdate) {
    await supabase
      .from("errors")
      .update({
        occurrence_count: upd.occurrence_count,
        wrong_answer: upd.wrong_answer,
        last_seen: upd.last_seen,
        propositions_json: upd.propositions_json,
        consecutive_wrong: upd.consecutive_wrong,
        mastered: false,
        mastery_score: 0,
      })
      .eq("id", upd.id);
  }

  return { inserted: toInsert.length, updated: toUpdate.length };
}
