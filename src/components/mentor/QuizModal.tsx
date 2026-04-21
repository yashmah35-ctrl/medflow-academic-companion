import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Exercise, AnswerResult } from '@/components/mentor/types';
import { useSound } from '@/hooks/mentor/useSound';
import { useConfetti } from '@/hooks/mentor/useConfetti';

interface QuizModalProps {
  exercise: Exercise;
  onClose: () => void;
  onComplete: (results: AnswerResult[], score: number, stars: number) => void;
}

const bloomLabels: Record<number, string> = {
  1: 'Rappel',
  2: 'Comprehension',
  3: 'Application',
  4: 'Analyse',
  5: 'Synthese',
};

export function QuizModal({ exercise, onClose, onComplete }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [certaintyLevel, setCertaintyLevel] = useState(5);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [score, setScore] = useState(0);

  const { playCorrect, playWrong, playComplete, playClick } = useSound();
  const { fireSmall } = useConfetti();

  const questions = exercise.questions;
  const question = questions[currentQuestion];

  const handleSelectAnswer = useCallback(
    (index: number) => {
      if (showFeedback) return;
      playClick();
      setSelectedAnswer(index);
    },
    [showFeedback, playClick]
  );

  const handleValidate = useCallback(() => {
    if (selectedAnswer === null) return;
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    if (correct) {
      playCorrect();
      setScore((s) => s + 1);
      if (score + 1 >= 8) fireSmall();
    } else {
      playWrong();
    }
  }, [selectedAnswer, question, playCorrect, playWrong, score, fireSmall]);

  const handleContinue = useCallback(() => {
    const result: AnswerResult = {
      questionId: question.id,
      selectedAnswer: selectedAnswer!,
      isCorrect,
      certaintyLevel,
      hesitationReason: '',
      timeSpent: 0,
    };
    const newResults = [...results, result];
    setResults(newResults);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setShowHint(false);
      setCertaintyLevel(5);
    } else {
      const finalScore = newResults.filter((r) => r.isCorrect).length;
      const stars = finalScore === 10 ? 3 : finalScore >= 8 ? 2 : finalScore >= 6 ? 1 : 0;
      playComplete();
      onComplete(newResults, finalScore, stars);
    }
  }, [currentQuestion, questions.length, question, selectedAnswer, isCorrect, certaintyLevel, results, onComplete, playComplete]);

  if (!question) return null;

  const progress = ((currentQuestion + (showFeedback ? 1 : 0)) / questions.length) * 100;
  const letters = ['A', 'B', 'C', 'D'];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl mx-4 overflow-hidden flex flex-col max-h-[90vh]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      >
        {/* ===== HEADER SOBERE ===== */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Badge niveau Bloom — gris comme sur la photo */}
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: '#9CA3AF' }}
              >
                Niveau {question.bloomLevel} — {bloomLabels[question.bloomLevel]}
              </span>
              <span className="text-sm text-gray-400">
                Question {currentQuestion + 1}/{questions.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">
              &#10005;
            </button>
          </div>

          {/* Barre de progression fine */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gray-300"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* ===== QUESTION (scrollable) ===== */}
        <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="px-6 py-5"
          >
            {/* Enonce */}
            <h3 className="text-base font-medium text-gray-900 mb-5 leading-relaxed">
              {question.statement}
            </h3>

            {/* Indice */}
            {showHint && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <p className="text-sm text-amber-700">{question.hint}</p>
              </motion.div>
            )}

            {/* Options — style EXACT de la photo */}
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const letter = letters[i] || String.fromCharCode(65 + i);
                let borderColor = '#E5E7EB';
                let bgColor = '#FFFFFF';
                let letterBg = '#F3F4F6';
                let letterColor = '#6B7280';

                if (!showFeedback) {
                  if (selectedAnswer === i) {
                    borderColor = '#3B82F6';
                    bgColor = '#EFF6FF';
                    letterBg = '#3B82F6';
                    letterColor = '#FFFFFF';
                  }
                } else {
                  if (i === question.correctAnswer) {
                    borderColor = '#10B981';
                    bgColor = '#ECFDF5';
                    letterBg = '#10B981';
                    letterColor = '#FFFFFF';
                  } else if (i === selectedAnswer && i !== question.correctAnswer) {
                    borderColor = '#EF4444';
                    bgColor = '#FEF2F2';
                    letterBg = '#EF4444';
                    letterColor = '#FFFFFF';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all border-2"
                    style={{
                      borderColor,
                      backgroundColor: bgColor,
                    }}
                    onClick={() => handleSelectAnswer(i)}
                    whileHover={!showFeedback ? { borderColor: '#D1D5DB' } : {}}
                    disabled={showFeedback}
                  >
                    {/* Lettre A/B/C/D dans cercle gris */}
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 transition-all"
                      style={{
                        backgroundColor: letterBg,
                        color: letterColor,
                      }}
                    >
                      {letter}
                    </span>
                    <span className="text-gray-800 text-[15px]">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback ABC */}
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-5 space-y-3"
                >
                  {/* A — Analyse */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-emerald-800 mb-1">
                      {isCorrect ? 'Bonne reponse !' : 'Analyse'}
                    </h4>
                    <p className="text-sm text-emerald-700 leading-relaxed">{question.explanation}</p>
                    {!isCorrect && (
                      <p className="text-sm text-amber-700 mt-1.5">
                        Bonne reponse : <strong>{question.options[question.correctAnswer]}</strong>
                      </p>
                    )}
                  </div>

                  {/* B — Bridge */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Pour aller plus loin</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">{question.bridge}</p>
                  </div>

                  {/* C — Check metacognitif */}
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">Check metacognitif</h4>
                    <p className="text-sm text-purple-600 mb-2">Niveau de certitude (0-10) ?</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={certaintyLevel}
                        onChange={(e) => setCertaintyLevel(Number(e.target.value))}
                        className="flex-1 h-1.5 bg-purple-200 rounded-full appearance-none cursor-pointer accent-purple-600"
                      />
                      <span className="text-base font-bold text-purple-800 w-7 text-center">{certaintyLevel}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
        </div>

        {/* ===== FOOTER (sticky) ===== */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-white shrink-0">
          <span className="text-sm text-gray-400">Score actuel : {score}/{currentQuestion + (showFeedback ? 1 : 0)}</span>

          {!showFeedback ? (
            <button
              onClick={handleValidate}
              disabled={selectedAnswer === null}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: selectedAnswer !== null ? '#10B981' : '#E5E7EB' }}
            >
              Valider
            </button>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all"
            >
              {currentQuestion < questions.length - 1 ? 'Continuer' : 'Voir le resultat'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
