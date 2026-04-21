import { motion } from 'framer-motion';
import { Lock, Star, BookOpen, ChevronDown } from 'lucide-react';
import type { Exercise } from '@/components/mentor/types';

interface DuolingoPathProps {
  exercises: Exercise[];
  currentExerciseId: string | null;
  onSelectExercise: (exercise: Exercise) => void;
  onSelectQCMFinal: () => void;
  qcmFinalUnlocked: boolean;
  qcmFinalCompleted: boolean;
}

/* ================================================================
   PARCOURS DUOLINGO — Design EXACT comme Duolingo
   Cercles dores glossy, coffre, mascotte, trophee
   ================================================================ */

function GoldCircle({
  children,
  onClick,
  disabled = false,
  delay = 0,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  delay?: number;
}) {
  return (
    <motion.button
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 64,
        height: 64,
        background:
          'radial-gradient(ellipse 130% 130% at 40% 30%, #FFF7BC 0%, #FDE047 18%, #FACC15 42%, #EAB308 68%, #CA8A04 100%)',
        boxShadow: `
          0 8px 0 #A16207,
          0 12px 24px rgba(202,138,4,0.35),
          inset 0 -6px 10px rgba(161,97,7,0.25),
          inset 0 6px 10px rgba(255,247,188,0.6)
        `,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={onClick}
      whileHover={!disabled ? { y: -3, scale: 1.05 } : {}}
      whileTap={!disabled ? { y: 2, scale: 0.97 } : {}}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: disabled ? 0.5 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay }}
    >
      {/* Reflet brillant en haut a gauche */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '10%',
          left: '16%',
          width: '48%',
          height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.6) 0%, transparent 70%)',
          transform: 'rotate(-22deg)',
        }}
      />
      {/* Petit reflet secondaire */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '20%',
          right: '22%',
          width: '18%',
          height: '12%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, transparent 70%)',
        }}
      />
      {/* Contenu */}
      <div className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]">
        {children}
      </div>
    </motion.button>
  );
}

function GrayCircle({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 56,
        height: 56,
        background: 'linear-gradient(145deg, #F3F4F6, #D1D5DB)',
        boxShadow: '0 5px 0 #9CA3AF, inset 0 2px 4px rgba(255,255,255,0.4)',
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 0.5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15, delay }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: '12%',
          left: '18%',
          width: '44%',
          height: '26%',
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
          transform: 'rotate(-20deg)',
        }}
      />
      <Lock size={20} className="text-gray-400" />
    </motion.div>
  );
}

function TreasureChest({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 15, delay }}
    >
      <div
        className="relative w-[60px] h-[44px] rounded-xl flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
          boxShadow: '0 6px 0 #92400E, 0 8px 16px rgba(217,119,6,0.25)',
          border: '2px solid #FBBF24',
        }}
      >
        <div className="absolute top-1/2 left-1 right-1 h-0.5 bg-amber-800/15 -translate-y-1/2" />
        <div className="absolute left-1/4 top-1 bottom-1 w-px bg-amber-800/10" />
        <div className="absolute right-1/4 top-1 bottom-1 w-px bg-amber-800/10" />
        <div
          className="relative w-[18px] h-[22px] rounded-full z-10"
          style={{
            background: 'radial-gradient(circle at 40% 35%, #FFFBEB, #FDE68A 60%, #F59E0B)',
            boxShadow: '0 2px 0 #B45309, inset 0 1px 2px rgba(255,255,255,0.5)',
            border: '1px solid #F59E0B',
          }}
        >
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[5px] h-[6px] bg-amber-800/50 rounded-sm" />
        </div>
      </div>
      {/* Reflet */}
      <div
        className="absolute top-1 left-3 w-5 h-3 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 70%)',
          transform: 'rotate(-15deg)',
        }}
      />
    </motion.div>
  );
}

function LevelTrophy({ level = 1 }: { level?: number }) {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
    >
      <div
        className="relative w-[60px] h-[60px] rounded-2xl flex items-center justify-center"
        style={{
          background: 'radial-gradient(ellipse 130% 130% at 40% 30%, #FFF7BC 0%, #FDE047 20%, #FACC15 45%, #EAB308 70%, #CA8A04 100%)',
          boxShadow: `
            0 8px 0 #A16207,
            0 12px 24px rgba(202,138,4,0.3),
            inset 0 -5px 8px rgba(161,97,7,0.2),
            inset 0 5px 8px rgba(255,247,188,0.5)
          `,
          border: '3px solid #FACC15',
        }}
      >
        {/* Reflet */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '10%',
            left: '16%',
            width: '48%',
            height: '30%',
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 70%)',
            transform: 'rotate(-22deg)',
          }}
        />
        <span
          className="text-2xl font-black text-amber-900 z-10 relative"
          style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}
        >
          {level}
        </span>
      </div>
      {/* Base */}
      <div
        className="mt-1 rounded-full"
        style={{
          width: 48,
          height: 12,
          background: 'radial-gradient(ellipse 130% 130% at 40% 30%, #FDE047, #EAB308 60%, #CA8A04)',
          boxShadow: '0 4px 0 #A16207',
        }}
      />
    </motion.div>
  );
}

function Mascotte() {
  return (
    <motion.div
      className="absolute z-20"
      style={{ right: '6%', top: '18%' }}
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
    >
      <img
        src="/mentor-avatar.png"
        alt="MENTOR"
        className="w-[88px] h-[88px] object-contain"
        style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}
      />
      <motion.div
        className="absolute -top-2 -right-1 text-base"
        animate={{ y: [0, -5, 0], rotate: [0, 15, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        ✨
      </motion.div>
      <motion.div
        className="absolute top-0 -left-3 text-xs"
        animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut', delay: 0.4 }}
      >
        ⭐
      </motion.div>
    </motion.div>
  );
}

function ProgressStars() {
  return (
    <div className="flex gap-2 justify-center mt-3">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ delay: 0.7 + i * 0.12 }}
        >
          <Star size={20} fill="#9CA3AF" stroke="#9CA3AF" />
        </motion.div>
      ))}
    </div>
  );
}

/* Sinusoide douce */
function getCurvePosition(index: number, total: number): { xPct: number; yPct: number } {
  const progress = index / Math.max(total - 1, 1);
  const xOffset = Math.sin(progress * Math.PI * 3) * 28;
  return { xPct: 50 + xOffset, yPct: progress * 92 + 4 };
}

export function DuolingoPath({
  exercises,
  onSelectExercise,
}: DuolingoPathProps) {
  const items: Array<
    | { type: 'exercise'; exercise: Exercise; realIndex: number }
    | { type: 'chest'; afterIndex: number }
  > = [];
  exercises.forEach((ex, i) => {
    items.push({ type: 'exercise', exercise: ex, realIndex: i });
    if (i === 2 || i === 5) items.push({ type: 'chest', afterIndex: i });
  });

  const positions = items.map((_, i) => getCurvePosition(i, items.length));

  const renderContent = (ex: Exercise) => {
    if (ex.status === 'available') {
      return <BookOpen size={26} strokeWidth={2.5} className="text-white" />;
    }
    return <Star size={28} fill="#B45309" stroke="none" />;
  };

  return (
    <div className="relative w-full" style={{ height: `${Math.max(items.length * 88, 420)}px` }}>
      {/* Mascotte */}
      <Mascotte />

      {/* Lignes SVG */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {positions.map((pos, i) => {
          if (i === 0) return null;
          const prev = positions[i - 1];
          let completed = false;
          const prevItem = items[i - 1];
          if (prevItem.type === 'exercise') {
            completed = prevItem.exercise.status === 'perfect' || prevItem.exercise.status === 'passed';
          }
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${prev.xPct}%`}
              y1={`${prev.yPct}%`}
              x2={`${pos.xPct}%`}
              y2={`${pos.yPct}%`}
              stroke={completed ? '#10B981' : '#E5E7EB'}
              strokeWidth="5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4 }}
            />
          );
        })}
      </svg>

      {/* Noeuds */}
      {items.map((item, i) => {
        const pos = positions[i];
        if (item.type === 'chest') {
          return (
            <div
              key={`chest-${i}`}
              className="absolute z-10"
              style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%`, transform: 'translate(-50%, -50%)' }}
            >
              <TreasureChest delay={i * 0.06} />
            </div>
          );
        }
        const ex = item.exercise;
        const isClickable = ex.status !== 'locked';
        return (
          <div
            key={ex.id}
            className="absolute z-10 flex flex-col items-center"
            style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%`, transform: 'translate(-50%, -50%)' }}
          >
            {ex.status === 'locked' ? (
              <GrayCircle delay={i * 0.06} />
            ) : (
              <GoldCircle
                onClick={() => isClickable && onSelectExercise(ex)}
                disabled={!isClickable}
                delay={i * 0.06}
              >
                {renderContent(ex)}
              </GoldCircle>
            )}
            {/* Etoiles */}
            {(ex.status === 'perfect' || ex.status === 'passed' || ex.status === 'failed') && (
              <div className="flex gap-[2px] mt-1.5">
                {[1, 2, 3].map((s) => (
                  <Star key={s} size={10} fill={s <= ex.stars ? '#FBBF24' : '#E5E7EB'} stroke="none" />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Bas */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10" style={{ bottom: 4 }}>
        <ProgressStars />
        <div className="mt-2">
          <LevelTrophy level={1} />
        </div>
        <motion.button
          className="mt-2 p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm"
          animate={{ y: [0, 4, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.button>
      </div>
    </div>
  );
}
