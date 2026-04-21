import { motion } from 'framer-motion';
import { X, BookOpen, Star, TrendingUp, Calendar, FlaskConical, Heart, Dna, Activity, Bug, Pill } from 'lucide-react';
import type { Subject } from '@/components/mentor/types';

interface ProgressionViewProps {
  subjects: Subject[];
  examType: string | null;
  examDate: string | null;
  onClose: () => void;
  onSelectSubject: (subjectId: string) => void;
}

const subjectIcons: Record<string, React.ElementType> = {
  'chimie-orga': FlaskConical,
  'anatomie': Heart,
  'biochem': Dna,
  'physio': Activity,
  'microbio': Bug,
  'pharma': Pill,
};

export function ProgressionView({ subjects, examType, examDate, onClose, onSelectSubject }: ProgressionViewProps) {
  const daysUntilExam = examDate ? Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Calculer les stats par matière
  const getSubjectStats = (subject: Subject) => {
    const totalChapters = subject.chapters.length;
    const completedChapters = subject.chapters.filter(c => c.status === 'completed').length;
    const totalExercises = subject.chapters.reduce((acc, c) => acc + c.exercises.length, 0);
    const completedExercises = subject.chapters.reduce((acc, c) => 
      acc + c.exercises.filter(e => e.status === 'perfect' || e.status === 'passed').length, 0);
    const perfectExercises = subject.chapters.reduce((acc, c) => 
      acc + c.exercises.filter(e => e.status === 'perfect').length, 0);
    const avgScore = completedExercises > 0 
      ? Math.round(subject.chapters.reduce((acc, c) => 
          acc + c.exercises.reduce((sum, e) => sum + (e.score || 0), 0), 0) / completedExercises * 10) / 10
      : 0;
    
    return { totalChapters, completedChapters, totalExercises, completedExercises, perfectExercises, avgScore };
  };

  const totalStats = subjects.reduce((acc, s) => {
    const stats = getSubjectStats(s);
    return {
      totalChapters: acc.totalChapters + stats.totalChapters,
      completedChapters: acc.completedChapters + stats.completedChapters,
      totalExercises: acc.totalExercises + stats.totalExercises,
      completedExercises: acc.completedExercises + stats.completedExercises,
      perfectExercises: acc.perfectExercises + stats.perfectExercises,
    };
  }, { totalChapters: 0, completedChapters: 0, totalExercises: 0, completedExercises: 0, perfectExercises: 0 });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={24} className="text-blue-500" />
              <h2 className="text-xl font-bold text-gray-900">Ma Progression</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats globales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <BookOpen size={24} className="text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">{totalStats.completedChapters}/{totalStats.totalChapters}</p>
              <p className="text-xs text-blue-600">Chapitres complétés</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl text-center">
              <CheckBadge size={24} className="text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-700">{totalStats.completedExercises}</p>
              <p className="text-xs text-green-600">Exercices faits</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <Star size={24} className="text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-700">{totalStats.perfectExercises}</p>
              <p className="text-xs text-amber-600">Sans faute</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl text-center">
              <Calendar size={24} className="text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">{daysUntilExam ?? '—'}</p>
              <p className="text-xs text-purple-600">Jours restants</p>
            </div>
          </div>

          {/* Compte à rebours */}
          {examType && examDate && (
            <div className="mb-8 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-center">
              <p className="text-lg font-bold">🏆 {examType} — {daysUntilExam && daysUntilExam > 0 ? `J-${daysUntilExam}` : 'Jour J'}</p>
              <div className="w-full h-3 bg-white/30 rounded-full mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, (daysUntilExam || 0) / 90 * 100))}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          )}

          {/* Cartes par matière */}
          <h3 className="text-lg font-bold text-gray-900 mb-4">Par matière</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject, i) => {
              const stats = getSubjectStats(subject);
              const Icon = subjectIcons[subject.id] || BookOpen;
              const progress = stats.totalChapters > 0 ? (stats.completedChapters / stats.totalChapters) * 100 : 0;

              return (
                <motion.button
                  key={subject.id}
                  className="p-4 border-2 border-gray-100 rounded-xl text-left hover:border-gray-200 transition-all"
                  onClick={() => onSelectSubject(subject.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: subject.color + '20' }}
                    >
                      <Icon size={20} style={{ color: subject.color }} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{subject.name}</h4>
                      <p className="text-xs text-gray-500">{stats.completedChapters}/{stats.totalChapters} chapitres</p>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{stats.completedExercises} ex. faits</span>
                    <span>{stats.avgScore > 0 ? `${stats.avgScore}/10 moy.` : '—'}</span>
                  </div>

                  {/* Mini parcours */}
                  {subject.chapters.length > 0 && (
                    <div className="flex gap-1 mt-3">
                      {subject.chapters.slice(0, 5).map((ch) => (
                        <div
                          key={ch.id}
                          className="w-4 h-4 rounded-full"
                          style={{
                            backgroundColor: ch.status === 'completed' ? '#10B981' : ch.status === 'in_progress' ? '#3B82F6' : '#E5E7EB',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Composant CheckBadge pour l'icône de validation
function CheckBadge({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.78 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.78 4 4 0 0 1 0-6.75Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
