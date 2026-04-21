import { motion } from 'framer-motion';
import { X, Award, Lock } from 'lucide-react';
import type { Badge } from '@/components/mentor/types';

interface BadgesViewProps {
  badges: Badge[];
  onClose: () => void;
}

export function BadgesView({ badges, onClose }: BadgesViewProps) {
  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={24} className="text-amber-500" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Mes Badges</h2>
                <p className="text-sm text-gray-500">{unlockedCount}/{badges.length} débloqués</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Liste des badges */}
        <div className="p-6 space-y-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                badge.unlocked
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-gray-50 border-gray-100 opacity-60'
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    badge.unlocked ? 'bg-amber-100' : 'bg-gray-200'
                  }`}
                >
                  {badge.unlocked ? badge.icon : <Lock size={20} className="text-gray-400" />}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${badge.unlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                    {badge.name}
                  </h4>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                  {badge.unlocked && badge.unlockedAt && (
                    <p className="text-xs text-amber-600 mt-1">
                      Débloqué le {new Date(badge.unlockedAt).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                {badge.unlocked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 + i * 0.05 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckIcon size={16} className="text-green-600" />
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CheckIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
