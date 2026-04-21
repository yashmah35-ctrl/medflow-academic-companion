import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, GraduationCap, Clock, Target, BookOpen } from 'lucide-react';
import type { StudentProfile, SessionType, ExamType } from '@/components/mentor/types';

interface DiagnosticModalProps {
  chapterTitle: string;
  onComplete: (profile: Partial<StudentProfile>) => void;
}

export function DiagnosticModal({ chapterTitle, onComplete }: DiagnosticModalProps) {
  const [step, setStep] = useState(0);
  const [confidence, setConfidence] = useState(5);
  const [chapterStatus, setChapterStatus] = useState<'never_seen' | 'skimmed' | 'understood' | 'ready'>('skimmed');
  const [sessionType, setSessionType] = useState<SessionType>('deep');
  const [examType, setExamType] = useState<ExamType>(null);
  const [examDate, setExamDate] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      const learningMode = confidence <= 4 ? 'foundations' : confidence <= 7 ? 'connections' : 'expert';
      onComplete({
        confidenceLevel: confidence,
        chapterStatus,
        sessionType,
        learningMode,
        examType: sessionType === 'exam' ? examType : null,
        examDate: sessionType === 'exam' ? examDate : null,
        completedDiagnostic: true,
      });
    }
  };

  const steps = [
    {
      title: 'Ton niveau de confiance',
      subtitle: chapterTitle,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <GraduationCap size={48} className="text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              Sur une échelle de 1 à 10, comment te sens-tu avec ce chapitre ?
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 h-3 bg-blue-100 rounded-full appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-sm text-gray-500">10</span>
          </div>
          
          <motion.div
            key={confidence}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-center"
          >
            <span className="text-4xl font-bold text-blue-600">{confidence}</span>
            <p className="text-sm text-gray-500 mt-1">
              {confidence <= 3 ? 'Besoin de renforcer les bases' : confidence <= 6 ? 'Niveau intermédiaire' : confidence <= 8 ? 'Bon niveau' : 'Expert !'}
            </p>
          </motion.div>

          <div className="flex justify-center gap-2">
            {['never_seen', 'skimmed', 'understood', 'ready'].map((status) => (
              <button
                key={status}
                onClick={() => setChapterStatus(status as typeof chapterStatus)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  chapterStatus === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status === 'never_seen' ? 'Jamais vu' : status === 'skimmed' ? 'Survolé' : status === 'understood' ? 'Compris' : 'Prêt'}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Ton objectif',
      subtitle: 'Quelle session veux-tu ?',
      content: (
        <div className="space-y-4">
          <div className="text-center">
            <Target size={48} className="text-green-500 mx-auto mb-4" />
          </div>
          
          {[
            { type: 'quick' as SessionType, label: '20 min rapide', desc: 'Questions essentielles uniquement', icon: Clock, color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
            { type: 'deep' as SessionType, label: '1h approfondie', desc: 'Toutes les questions + feedback détaillé', icon: BookOpen, color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
            { type: 'exam' as SessionType, label: 'Préparation concours', desc: 'Questions fréquentes à l\'examen', icon: GraduationCap, color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
          ].map(({ type, label, desc, icon: Icon, color }) => (
            <motion.button
              key={type}
              onClick={() => setSessionType(type)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                sessionType === type
                  ? 'border-blue-500 bg-blue-50'
                  : `border-gray-200 ${color}`
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Icon size={24} className={sessionType === type ? 'text-blue-500' : 'text-gray-500'} />
                <div>
                  <p className="font-semibold text-gray-900">{label}</p>
                  <p className="text-sm text-gray-500">{desc}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      title: 'Préparation concours',
      subtitle: 'Informations complémentaires',
      content: sessionType === 'exam' ? (
        <div className="space-y-6">
          <div className="text-center">
            <GraduationCap size={48} className="text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Préparons ton planning de révision !</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quel concours ?</label>
            <div className="flex gap-3">
              {(['PASS', 'LASS', 'PACES'] as ExamType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setExamType(type)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    examType === type
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date du concours</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <BookOpen size={32} className="text-green-500" />
          </div>
          <p className="text-gray-600">Mode {sessionType === 'quick' ? 'rapide' : 'approfondi'} sélectionné.</p>
          <p className="text-sm text-gray-500">MENTOR va adapter les questions à ton profil.</p>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-blue-500 rounded-full"
            animate={{ width: `${((step + 1) / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{steps[step]?.title}</h2>
            <p className="text-gray-500 mb-6">{steps[step]?.subtitle}</p>
            
            {steps[step]?.content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Retour
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={sessionType === 'exam' && step === 2 && (!examType || !examDate)}
            className="ml-auto px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {step === 2 ? 'Commencer !' : 'Suivant'}
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
