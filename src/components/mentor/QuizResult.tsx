import { motion } from 'framer-motion';
import { Star, RotateCcw, ArrowRight, Trophy } from 'lucide-react';
import { useConfetti } from '@/hooks/mentor/useConfetti';
import { useEffect } from 'react';

interface QuizResultProps {
  score: number;
  total: number;
  stars: number;
  exerciseTitle: string;
  onRetry: () => void;
  onContinue: () => void;
}

export function QuizResult({ score, total, stars, exerciseTitle, onRetry, onContinue }: QuizResultProps) {
  const { fireConfetti } = useConfetti();
  const percentage = Math.round((score / total) * 100);
  const isPerfect = score === total;

  useEffect(() => {
    if (isPerfect || stars === 3) fireConfetti();
  }, [isPerfect, stars, fireConfetti]);

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
        {isPerfect ? (
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="inline-block mb-4"
          >
            <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <Trophy size={40} className="text-yellow-500" />
            </div>
          </motion.div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Star size={40} className="text-blue-500" />
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {isPerfect ? 'Sans faute ! Parfait !' : stars >= 2 ? 'Excellent travail !' : 'Continue tes efforts !'}
        </h2>
        <p className="text-gray-500 mb-6">{exerciseTitle}</p>

        <motion.div
          className="mb-4"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <span className="text-5xl font-bold text-amber-500">{score}</span>
          <span className="text-2xl text-gray-400">/{total}</span>
        </motion.div>

        <p className="text-gray-500 mb-6">{percentage}% de reussite</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map((s, i) => (
            <motion.div
              key={s}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4 + i * 0.15, type: 'spring', stiffness: 200 }}
            >
              <Star size={36} fill={s <= stars ? '#FBBF24' : '#E5E7EB'} stroke={s <= stars ? '#FBBF24' : '#E5E7EB'} />
            </motion.div>
          ))}
        </div>

        {isPerfect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-6"
          >
            <p className="text-sm text-amber-800 font-semibold">Badge debloque : Sans faute !</p>
          </motion.div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={18} />
            Recommencer
          </button>
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
          >
            Continuer
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
