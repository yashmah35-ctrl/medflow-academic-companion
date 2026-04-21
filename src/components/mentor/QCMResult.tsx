import { motion } from 'framer-motion';
import { Star, Trophy, Clock, RotateCcw, Home } from 'lucide-react';
import { useConfetti } from '@/hooks/mentor/useConfetti';
import { useEffect } from 'react';

interface QCMResultProps {
  score: number;
  total: number;
  stars: number;
  timeSeconds: number;
  chapterTitle: string;
  onRetry: () => void;
  onHome: () => void;
}

export function QCMResult({ score, total, stars, timeSeconds, chapterTitle, onRetry, onHome }: QCMResultProps) {
  const { fireConfetti } = useConfetti();
  const percentage = Math.round((score / total) * 100);
  const isExcellent = stars >= 2;

  useEffect(() => {
    if (isExcellent) {
      fireConfetti();
    }
  }, [isExcellent, fireConfetti]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}min ${s}s`;
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 text-center"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="inline-block mb-4"
        >
          <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
            <Trophy size={48} className="text-amber-500" />
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">QCM Final terminé !</h2>
        <p className="text-gray-500 mb-6">{chapterTitle}</p>

        {/* Score */}
        <motion.div
          className="mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <span className="text-6xl font-bold text-amber-500">{score}</span>
          <span className="text-2xl text-gray-400">/{total}</span>
        </motion.div>

        <p className="text-gray-500 mb-6">{percentage}% de réussite</p>

        {/* Étoiles */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3].map((s, i) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.5 + i * 0.2, type: 'spring' }}
            >
              <Star
                size={40}
                fill={s <= stars ? '#FBBF24' : '#E5E7EB'}
                stroke={s <= stars ? '#FBBF24' : '#E5E7EB'}
              />
            </motion.div>
          ))}
        </div>

        {/* Temps */}
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-8">
          <Clock size={18} />
          <span>Temps : {formatTime(timeSeconds)}</span>
        </div>

        {/* Badges */}
        {stars >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6"
          >
            <p className="text-sm text-amber-800 font-semibold">
              {stars === 3 ? '🏆 Badge débloqué : Expert du chapitre !' : '⭐ Très bon résultat !'}
            </p>
            {timeSeconds < 900 && (
              <p className="text-xs text-amber-600 mt-1">⏱️ Badge Chronomane débloqué !</p>
            )}
          </motion.div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Recommencer
          </button>
          <button
            onClick={onHome}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
          >
            <Home size={18} />
            Retour
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
