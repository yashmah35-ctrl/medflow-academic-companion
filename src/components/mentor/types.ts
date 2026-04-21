// Types MENTOR (copiés depuis le projet MENTOR original)
export type BloomLevel = 1 | 2 | 3 | 4 | 5;
export type LearningMode = 'foundations' | 'connections' | 'expert';
export type SessionType = 'quick' | 'deep' | 'exam';
export type ExamType = 'PASS' | 'LASS' | 'PACES' | null;

export interface StudentProfile {
  confidenceLevel: number;
  chapterStatus: 'never_seen' | 'skimmed' | 'understood' | 'ready';
  sessionType: SessionType;
  learningMode: LearningMode;
  examType: ExamType;
  examDate: string | null;
  completedDiagnostic: boolean;
}

export type ExerciseStatus = 'locked' | 'available' | 'perfect' | 'passed' | 'failed';
export type QuestionType = 'qcm' | 'open' | 'association' | 'true_false' | 'case_study';

export interface Question {
  id: string;
  type: QuestionType;
  bloomLevel: BloomLevel;
  statement: string;
  image?: string;
  options: string[];
  correctAnswer: number;
  hint: string;
  explanation: string;
  bridge: string;
  simplifiedVersion?: Question;
}

export interface Exercise {
  id: string;
  number: number;
  title: string;
  chapterId: string;
  subjectId: string;
  status: ExerciseStatus;
  score: number | null;
  stars: number;
  attempts: number;
  bestScore: number | null;
  questions: Question[];
  bloomTarget: BloomLevel;
}

export interface AnswerResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  certaintyLevel: number;
  hesitationReason: string;
  timeSpent: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface QCMFinal {
  id: string;
  title: string;
  questions: Question[];
  bestScore: number | null;
  bestTime: number | null;
  completed: boolean;
  stars: number;
}

export interface Chapter {
  id: string;
  subjectId: string;
  title: string;
  number: number;
  exercises: Exercise[];
  qcmFinal: QCMFinal | null;
  status: 'not_started' | 'in_progress' | 'completed';
  completedAt: string | null;
}

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  chapters: Chapter[];
}
