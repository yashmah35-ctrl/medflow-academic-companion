import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, TrendingUp, Award, BookOpen, Sparkles } from 'lucide-react';
import type { Subject, Exercise, StudentProfile, Badge, AnswerResult } from '@/components/mentor/types';
import { DuolingoPath } from './DuolingoPath';
import { QuizModal } from './QuizModal';
import { QuizResult } from './QuizResult';
import { DiagnosticModal } from './DiagnosticModal';
import { QCMFinalModal } from './QCMFinalModal';
import { QCMResult } from './QCMResult';
import { ProgressionView } from './ProgressionView';
import { BadgesView } from './BadgesView';
import { useSound } from '@/hooks/mentor/useSound';

interface MentorSidebarProps {
  subjects: Subject[];
  profile: StudentProfile;
  badges: Badge[];
  currentSubjectId: string;
  currentChapterId: string;
  onUpdateProfile: (profile: Partial<StudentProfile>) => void;
  onUpdateExercise: (subjectId: string, chapterId: string, exerciseId: string, updates: any) => void;
  onSelectSubject: (subjectId: string) => void;
}

export function MentorSidebar({
  subjects,
  profile,
  badges,
  currentSubjectId,
  currentChapterId,
  onUpdateProfile,
  onSelectSubject,
}: MentorSidebarProps) {
  const [showDiagnostic, setShowDiagnostic] = useState(!profile.completedDiagnostic);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [showQCMFinal, setShowQCMFinal] = useState(false);
  const [showQCMResult, setShowQCMResult] = useState(false);
  const [showProgression, setShowProgression] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [lastResults, setLastResults] = useState<AnswerResult[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [lastStars, setLastStars] = useState(0);
  const [qcmScore, setQcmScore] = useState(0);
  const [qcmStars, setQcmStars] = useState(0);
  const [qcmTime, setQcmTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { toggleSound } = useSound();

  const currentSubject = subjects.find((s) => s.id === currentSubjectId);
  const currentChapter = currentSubject?.chapters.find((c) => c.id === currentChapterId);

  const completedExercises =
    currentChapter?.exercises.filter((e) => e.status === 'perfect' || e.status === 'passed') || [];
  const qcmFinalUnlocked = completedExercises.length >= 3;

  const handleSelectExercise = useCallback((exercise: Exercise) => {
    if (exercise.status === 'locked') return;
    setCurrentExercise(exercise);
    setShowQuiz(true);
    setShowQuizResult(false);
  }, []);

  const handleQuizComplete = useCallback((results: AnswerResult[], score: number, stars: number) => {
    setLastResults(results);
    setLastScore(score);
    setLastStars(stars);
    setShowQuiz(false);
    setShowQuizResult(true);
  }, []);

  const handleQuizRetry = useCallback(() => {
    if (currentExercise) {
      setShowQuizResult(false);
      setShowQuiz(true);
    }
  }, [currentExercise]);

  const handleQuizContinue = useCallback(() => {
    setShowQuizResult(false);
  }, []);

  const handleSelectQCMFinal = useCallback(() => {
    if (!qcmFinalUnlocked) return;
    setShowQCMFinal(true);
  }, [qcmFinalUnlocked]);

  const handleQCMComplete = useCallback(
    (_results: AnswerResult[], score: number, stars: number, timeSeconds: number) => {
      setQcmScore(score);
      setQcmStars(stars);
      setQcmTime(timeSeconds);
      setShowQCMFinal(false);
      setShowQCMResult(true);
    },
    []
  );

  const handleDiagnosticComplete = useCallback(
    (updates: Partial<StudentProfile>) => {
      onUpdateProfile(updates);
      setShowDiagnostic(false);
    },
    [onUpdateProfile]
  );

  const toggleSoundSetting = () => {
    const newState = toggleSound();
    setSoundEnabled(newState);
  };

  if (!currentSubject || !currentChapter) return null;

  const nextAvailable = currentChapter.exercises.find((e) => e.status === 'available');
  const coachMessage =
    completedExercises.length === 0
      ? "Pret pour commencer ? Exercice 1 t'attend !"
      : qcmFinalUnlocked && !currentChapter.qcmFinal?.completed
        ? 'Bravo ! Le QCM Final est debloque !'
        : nextAvailable
          ? `Continue comme ca ! Exercice ${nextAvailable.number} t'attend !`
          : 'Tous les exercices sont faits !';

  return (
    <>
      <div className="w-full max-w-[440px] h-screen flex flex-col bg-gray-50">
        {/* ===== HEADER MENTOR ===== */}
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/mentor-avatar.png" alt="MENTOR" className="w-10 h-10 rounded-full" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">MENTOR</h3>
                <p className="text-xs text-gray-400">Coach de revision IA</p>
              </div>
            </div>
            <button
              onClick={toggleSoundSetting}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400"
            >
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>

        {/* ===== BOUTONS PROGRESSION / BADGES (couleurs) ===== */}
        <div className="px-5 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setShowProgression(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-all"
            >
              <TrendingUp size={14} />
              Progression
            </button>
            <button
              onClick={() => setShowBadges(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-xs font-semibold hover:bg-amber-100 transition-all"
            >
              <Award size={14} />
              Badges
            </button>
          </div>
        </div>

        {/* ===== INFO CHAPITRE ===== */}
        <div className="px-5 py-2">
          <div className="bg-white rounded-xl border border-gray-100 p-3">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: currentSubject.color + '20' }}
                >
                  <BookOpen size={14} style={{ color: currentSubject.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 leading-tight">{currentSubject.name}</p>
                  <p className="text-sm font-semibold text-gray-800 leading-tight truncate">{currentChapter.title}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnostic(true)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-purple-400"
              >
                <Sparkles size={15} />
              </button>
            </div>

            {profile.completedDiagnostic && (
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>
                  Mode :{' '}
                  <span className="font-semibold text-gray-700">
                    {profile.learningMode === 'foundations'
                      ? 'Fondations'
                      : profile.learningMode === 'connections'
                        ? 'Connexions'
                        : 'Expert'}
                  </span>
                </span>
                <span className="text-gray-300">|</span>
                <span>
                  {profile.sessionType === 'quick'
                    ? '20min'
                    : profile.sessionType === 'deep'
                      ? '1h'
                      : 'Concours'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===== PARCOURS D'EXERCICES ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentSubject.color }} />
              <span className="text-sm font-semibold text-gray-700">{currentChapter.title}</span>
            </div>
            <span className="text-xs text-gray-400">
              {completedExercises.length}/{currentChapter.exercises.length} ex.
            </span>
          </div>

          <DuolingoPath
            exercises={currentChapter.exercises}
            currentExerciseId={currentExercise?.id || null}
            onSelectExercise={handleSelectExercise}
            onSelectQCMFinal={handleSelectQCMFinal}
            qcmFinalUnlocked={qcmFinalUnlocked}
            qcmFinalCompleted={currentChapter.qcmFinal?.completed || false}
          />
        </div>

        {/* ===== CHAT MENTOR EN BAS ===== */}
        <div className="px-5 py-3 bg-white border-t border-gray-100">
          <div className="flex items-start gap-2.5">
            <img src="/mentor-avatar.png" alt="MENTOR" className="w-8 h-8 rounded-full shrink-0" />
            <div className="flex-1 bg-blue-50 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
              <p className="text-sm text-gray-700 leading-relaxed">{coachMessage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showDiagnostic && (
          <DiagnosticModal chapterTitle={currentChapter.title} onComplete={handleDiagnosticComplete} />
        )}

        {showQuiz && currentExercise && (
          <QuizModal exercise={currentExercise} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
        )}

        {showQuizResult && (
          <QuizResult
            score={lastScore}
            total={lastResults.length || 10}
            stars={lastStars}
            exerciseTitle={currentExercise?.title || 'Exercice'}
            onRetry={handleQuizRetry}
            onContinue={handleQuizContinue}
          />
        )}

        {showQCMFinal && currentChapter.qcmFinal && (
          <QCMFinalModal
            questions={
              currentChapter.qcmFinal.questions.length > 0
                ? currentChapter.qcmFinal.questions
                : (generateDemoQuestions() as any)
            }
            onClose={() => setShowQCMFinal(false)}
            onComplete={handleQCMComplete}
          />
        )}

        {showQCMResult && (
          <QCMResult
            score={qcmScore}
            total={30}
            stars={qcmStars}
            timeSeconds={qcmTime}
            chapterTitle={currentChapter.title}
            onRetry={() => {
              setShowQCMResult(false);
              setShowQCMFinal(true);
            }}
            onHome={() => setShowQCMResult(false)}
          />
        )}

        {showProgression && (
          <ProgressionView
            subjects={subjects}
            examType={profile.examType}
            examDate={profile.examDate}
            onClose={() => setShowProgression(false)}
            onSelectSubject={(id) => {
              setShowProgression(false);
              onSelectSubject(id);
            }}
          />
        )}

        {showBadges && <BadgesView badges={badges} onClose={() => setShowBadges(false)} />}
      </AnimatePresence>
    </>
  );
}

function generateDemoQuestions() {
  const topics = [
    { q: 'Le carbone stereogenique doit etre lie a :', options: ['2 substituants', '3 substituants', '4 substituants differents', '5 substituants'], correct: 2 },
    { q: 'La projection de Fischer montre :', options: ['Les liaisons en perspective', 'Les liaisons verticales en arriere', 'Un modele 3D', 'Un spectrogramme'], correct: 1 },
    { q: 'Un enantiomere est :', options: ['Superposable a son miroir', 'Non superposable a son miroir', 'Identique a sa diastereoisomere', 'Toujours mesocompound'], correct: 1 },
    { q: 'Les regles CIP servent a :', options: ['Nommer les alcanes', 'Determiner R/S', 'Mesurer le pH', 'Calculer la masse molaire'], correct: 1 },
    { q: 'Un mesocompose possede :', options: ['Un plan de symetrie', 'Aucune stereochimie', 'Toujours 3 carbones', 'Une chiralite optique'], correct: 0 },
    { q: 'La polarimetrie mesure :', options: ['La temperature', 'Le pouvoir rotatoire', 'La conductivite', 'La viscosite'], correct: 1 },
    { q: 'La SN2 donne :', options: ['Retention', 'Inversion de Walden', 'Racemisation', 'Elimination'], correct: 1 },
    { q: 'Un diastereoisomere differe par :', options: ['Tous les centres', 'Au moins un centre mais pas tous', 'La masse', 'La formule brute'], correct: 1 },
    { q: 'Le (R)-thalidomide est :', options: ['Sedative', 'Teratogene', 'Un antibiotique', 'Un analgesique'], correct: 0 },
    { q: "L'isomerie E/Z concerne :", options: ['Les alcanes', 'Les alcenes', 'Les alcynes', 'Les aromatiques'], correct: 1 },
  ];
  const questions = [];
  for (let i = 0; i < 30; i++) {
    const t = topics[i % topics.length];
    questions.push({
      id: `qcm-q-${i}`,
      type: 'qcm' as const,
      bloomLevel: (Math.floor(i / 6) + 1) as 1 | 2 | 3 | 4 | 5,
      statement: t.q,
      options: t.options,
      correctAnswer: t.correct,
      hint: 'Reflechis aux definitions du cours.',
      explanation: 'La bonne reponse est basee sur les principes fondamentaux de la stereochimie.',
      bridge: 'Cette notion est essentielle pour comprendre les proprietes des medicaments chiraux.',
    });
  }
  return questions;
}
