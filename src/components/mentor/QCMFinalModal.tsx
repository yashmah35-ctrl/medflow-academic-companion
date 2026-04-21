import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, ChevronRight, Pause, Play } from 'lucide-react';
import type { Question, AnswerResult } from '@/components/mentor/types';
import { useSound } from '@/hooks/mentor/useSound';
import { useConfetti } from '@/hooks/mentor/useConfetti';

interface QCMFinalModalProps {
  questions: Question[];
  onClose: () => void;
  onComplete: (results: AnswerResult[], score: number, stars: number, timeSeconds: number) => void;
}

export function QCMFinalModal({ questions, onClose, onComplete }: QCMFinalModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const { playCorrect, playWrong, playComplete } = useSound();
  const { fireConfetti } = useConfetti();

  // Chronomètre
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        setTimeSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = useCallback((index: number) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  }, [showFeedback]);

  const handleValidate = useCallback(() => {
    if (selectedAnswer === null) return;
    
    const question = questions[currentQuestion];
    const correct = selectedAnswer === question.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
    
    if (correct) {
      playCorrect();
      setScore(s => s + 1);
    } else {
      playWrong();
    }
  }, [selectedAnswer, questions, currentQuestion, playCorrect, playWrong]);

  const handleContinue = useCallback(() => {
    const question = questions[currentQuestion];
    const correct = selectedAnswer === question.correctAnswer;
    
    const result: AnswerResult = {
      questionId: question.id,
      selectedAnswer: selectedAnswer!,
      isCorrect: correct,
      certaintyLevel: 5,
      hesitationReason: '',
      timeSpent: 0,
    };
    
    const newResults = [...results, result];
    setResults(newResults);
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(c => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      const finalScore = newResults.filter(r => r.isCorrect).length;
      const stars = finalScore >= 27 ? 3 : finalScore >= 24 ? 2 : finalScore >= 21 ? 1 : 0;
      playComplete();
      if (stars >= 2) fireConfetti();
      onComplete(newResults, finalScore, stars, timeSeconds);
    }
  }, [currentQuestion, questions, selectedAnswer, results, timeSeconds, onComplete, playComplete, fireConfetti]);

  const question = questions[currentQuestion];
  if (!question) return null;

  const progress = ((currentQuestion + (showFeedback ? 1 : 0)) / questions.length) * 100;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        {/* Header avec chronomètre */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                QCM FINAL
              </span>
              <span className="text-sm text-gray-500">
                {currentQuestion + 1}/{questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Chronomètre */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Clock size={16} className="text-gray-600" />
                <span className="font-mono text-lg font-bold text-gray-800">
                  {formatTime(timeSeconds)}
                </span>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isPaused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#F59E0B' }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pause overlay */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center"
            >
              <div className="text-center">
                <Pause size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quiz en pause</h3>
                <p className="text-gray-500 mb-6">Le chronomètre est arrêté.</p>
                <button
                  onClick={() => setIsPaused(false)}
                  className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 mx-auto"
                >
                  <Play size={18} />
                  Reprendre
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6 leading-relaxed">
              {question.statement}
            </h3>

            <div className="space-y-3">
              {question.options.map((option, i) => {
                let borderColor = '#E5E7EB';
                let bgColor = 'white';

                if (!showFeedback) {
                  if (selectedAnswer === i) {
                    borderColor = '#3B82F6';
                    bgColor = '#EFF6FF';
                  }
                } else {
                  if (i === question.correctAnswer) {
                    borderColor = '#10B981';
                    bgColor = '#ECFDF5';
                  } else if (i === selectedAnswer && i !== question.correctAnswer) {
                    borderColor = '#EF4444';
                    bgColor = '#FEF2F2';
                  }
                }

                return (
                  <motion.button
                    key={i}
                    className="w-full p-4 rounded-xl text-left transition-all border-2"
                    style={{ borderColor, backgroundColor: bgColor }}
                    onClick={() => handleSelectAnswer(i)}
                    whileHover={!showFeedback ? { y: -2 } : {}}
                    disabled={showFeedback}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="text-gray-800">{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl"
              >
                <p className="text-sm text-amber-800">
                  {isCorrect ? '✅ ' : '❌ '}
                  {question.explanation}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Score : {score}/{currentQuestion + (showFeedback ? 1 : 0)}
          </span>
          
          {!showFeedback ? (
            <button
              onClick={handleValidate}
              disabled={selectedAnswer === null}
              className="px-6 py-2.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
              style={{ backgroundColor: selectedAnswer !== null ? '#F59E0B' : '#D1D5DB' }}
            >
              Valider
            </button>
          ) : (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleContinue}
              className="px-6 py-2.5 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all flex items-center gap-2"
            >
              {currentQuestion < questions.length - 1 ? 'Continuer' : 'Voir le résultat'}
              <ChevronRight size={18} />
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
