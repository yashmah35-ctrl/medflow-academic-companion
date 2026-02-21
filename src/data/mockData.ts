export type SubjectColor = 
  | 'chemistry' | 'cellbio' | 'biophysics' | 'anatomy' | 'histology' 
  | 'physiology' | 'pharmacology' | 'embryology' | 'biomolgen' 
  | 'shs' | 'biostatistique' | 'medicament' | 'santepublique' 
  | 'microbiologie' | 'specialite';

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: SubjectColor;
  courseCount: number;
  exerciseCount: number;
  progress: number;
}

export interface Folder {
  id: string;
  subjectId: string;
  name: string;
  courseCount: number;
  exerciseCount: number;
  progress: number;
}

export interface Course {
  id: string;
  folderId: string;
  title: string;
  source: 'fac' | 'bonus';
  addedDate: string;
  readingTime: string;
  chapters: string[];
}

export interface ScheduleBlock {
  id: string;
  subjectColor: SubjectColor;
  title: string;
  duration: string;
  type: 'Découverte' | 'Révision' | 'Flashcards' | 'Erreurs à revoir';
  day: number;
  hour: number;
}

export interface ErrorEntry {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: SubjectColor;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  date: string;
  occurrenceCount: number;
}

export const subjects: Subject[] = [
  { id: '1', name: 'Chimie / Biochimie OS', icon: '🧪', color: 'chemistry', courseCount: 21, exerciseCount: 603, progress: 95 },
  { id: '2', name: 'Biologie Cellulaire OS', icon: '🔬', color: 'cellbio', courseCount: 37, exerciseCount: 367, progress: 49 },
  { id: '3', name: 'Biophysique OS', icon: '⚛️', color: 'biophysics', courseCount: 17, exerciseCount: 388, progress: 59 },
  { id: '4', name: 'Anatomie OS', icon: '🦴', color: 'anatomy', courseCount: 18, exerciseCount: 677, progress: 100 },
  { id: '5', name: 'Biologie Moléculaire Génétique TC', icon: '🧬', color: 'biomolgen', courseCount: 17, exerciseCount: 371, progress: 35 },
  { id: '6', name: 'Histologie - Embryologie TC', icon: '🔎', color: 'histology', courseCount: 11, exerciseCount: 596, progress: 64 },
  { id: '7', name: 'Physiologie TC', icon: '❤️', color: 'physiology', courseCount: 9, exerciseCount: 564, progress: 67 },
  { id: '8', name: 'Anatomie TC', icon: '✋', color: 'anatomy', courseCount: 12, exerciseCount: 494, progress: 67 },
  { id: '9', name: 'SHS TC', icon: '📚', color: 'shs', courseCount: 12, exerciseCount: 377, progress: 92 },
  { id: '10', name: 'Biostatistique OS', icon: '📊', color: 'biostatistique', courseCount: 15, exerciseCount: 198, progress: 0 },
  { id: '11', name: 'Histologie - Embryologie OS', icon: '🔎', color: 'histology', courseCount: 16, exerciseCount: 594, progress: 6 },
  { id: '12', name: 'Médicament OS', icon: '💊', color: 'medicament', courseCount: 16, exerciseCount: 396, progress: 0 },
  { id: '13', name: 'SHS OS', icon: '♿', color: 'shs', courseCount: 4, exerciseCount: 119, progress: 25 },
  { id: '14', name: 'Santé Publique OS', icon: '📈', color: 'santepublique', courseCount: 12, exerciseCount: 454, progress: 50 },
  { id: '15', name: 'Biophysique TC', icon: '⚛️', color: 'biophysics', courseCount: 19, exerciseCount: 266, progress: 21 },
  { id: '16', name: 'Biostatistique TC', icon: '📊', color: 'biostatistique', courseCount: 17, exerciseCount: 190, progress: 6 },
  { id: '17', name: 'Santé Publique TC', icon: '📈', color: 'santepublique', courseCount: 12, exerciseCount: 344, progress: 0 },
  { id: '18', name: 'Médicament TC', icon: '💊', color: 'medicament', courseCount: 16, exerciseCount: 496, progress: 0 },
  { id: '19', name: 'Microbiologie TC', icon: '🦠', color: 'microbiologie', courseCount: 17, exerciseCount: 476, progress: 0 },
  { id: '20', name: 'Physiologie OS', icon: '❤️', color: 'physiology', courseCount: 13, exerciseCount: 414, progress: 8 },
  { id: '21', name: 'Spécialité Médecine', icon: '🩺', color: 'specialite', courseCount: 60, exerciseCount: 622, progress: 10 },
  { id: '22', name: 'Spécialité Dentaire', icon: '🦷', color: 'specialite', courseCount: 85, exerciseCount: 652, progress: 2 },
  { id: '23', name: 'Spécialité Pharmacie', icon: '💉', color: 'specialite', courseCount: 55, exerciseCount: 322, progress: 13 },
  { id: '24', name: 'Spécialité Maïeutique', icon: '👶', color: 'specialite', courseCount: 47, exerciseCount: 554, progress: 2 },
];

export const foldersBySubject: Record<string, Folder[]> = {
  '1': [
    { id: 'f1', subjectId: '1', name: 'Chimie Organique', courseCount: 4, exerciseCount: 155, progress: 100 },
    { id: 'f2', subjectId: '1', name: 'Chimie Générale', courseCount: 5, exerciseCount: 169, progress: 100 },
    { id: 'f3', subjectId: '1', name: 'Biochimie', courseCount: 10, exerciseCount: 280, progress: 100 },
  ],
  '2': [
    { id: 'f4', subjectId: '2', name: 'Membrane & Transport', courseCount: 4, exerciseCount: 95, progress: 70 },
    { id: 'f5', subjectId: '2', name: 'Cycle Cellulaire', courseCount: 5, exerciseCount: 130, progress: 55 },
    { id: 'f6', subjectId: '2', name: 'Organites', courseCount: 5, exerciseCount: 155, progress: 60 },
  ],
  '3': [
    { id: 'f7', subjectId: '3', name: 'Optique', courseCount: 3, exerciseCount: 80, progress: 45 },
    { id: 'f8', subjectId: '3', name: 'Radioactivité', courseCount: 4, exerciseCount: 100, progress: 25 },
    { id: 'f9', subjectId: '3', name: 'Mécanique des fluides', courseCount: 5, exerciseCount: 110, progress: 20 },
  ],
};

export const coursesByFolder: Record<string, Course[]> = {
  f1: [
    { id: 'c1', folderId: 'f1', title: 'Les alcools et phénols', source: 'fac', addedDate: '12 Jan 2025', readingTime: '25 min', chapters: ['Introduction', 'Nomenclature', 'Réactions', 'Exercices'] },
    { id: 'c2', folderId: 'f1', title: 'Les amines', source: 'fac', addedDate: '15 Jan 2025', readingTime: '30 min', chapters: ['Structure', 'Basicité', 'Réactions'] },
    { id: 'c3', folderId: 'f1', title: 'Synthèse organique - Méthodes', source: 'bonus', addedDate: '18 Jan 2025', readingTime: '20 min', chapters: ['Stratégies', 'Exemples'] },
    { id: 'c4', folderId: 'f1', title: 'Les acides carboxyliques', source: 'fac', addedDate: '20 Jan 2025', readingTime: '35 min', chapters: ['Définition', 'Propriétés', 'Dérivés', 'Exercices'] },
  ],
  f2: [
    { id: 'c5', folderId: 'f2', title: 'Atomistique', source: 'fac', addedDate: '10 Jan 2025', readingTime: '40 min', chapters: ['Modèle atomique', 'Configuration électronique'] },
    { id: 'c6', folderId: 'f2', title: 'Thermodynamique chimique', source: 'fac', addedDate: '14 Jan 2025', readingTime: '35 min', chapters: ['Enthalpie', 'Entropie', 'Énergie libre'] },
  ],
};

export const scheduleBlocks: ScheduleBlock[] = [
  { id: 's1', subjectColor: 'chemistry', title: 'Chimie Organique - Chap 1', duration: '1h30', type: 'Découverte', day: 0, hour: 8 },
  { id: 's2', subjectColor: 'anatomy', title: 'Anatomie - Membre sup.', duration: '2h', type: 'Révision', day: 0, hour: 14 },
  { id: 's3', subjectColor: 'cellbio', title: 'Bio Cell - Flashcards', duration: '30min', type: 'Flashcards', day: 1, hour: 9 },
  { id: 's4', subjectColor: 'biophysics', title: 'Biophysique - Optique', duration: '1h', type: 'Erreurs à revoir', day: 1, hour: 15 },
  { id: 's5', subjectColor: 'physiology', title: 'Physiologie cardiaque', duration: '1h30', type: 'Découverte', day: 2, hour: 10 },
  { id: 's6', subjectColor: 'histology', title: 'Histo - Tissu épithélial', duration: '1h', type: 'Révision', day: 2, hour: 16 },
  { id: 's7', subjectColor: 'chemistry', title: 'Biochimie - Enzymes', duration: '2h', type: 'Découverte', day: 3, hour: 8 },
  { id: 's8', subjectColor: 'medicament', title: 'Médicament - Introduction', duration: '1h', type: 'Découverte', day: 3, hour: 14 },
  { id: 's9', subjectColor: 'biomolgen', title: 'Bio Mol - Réplication ADN', duration: '1h30', type: 'Révision', day: 4, hour: 9 },
  { id: 's10', subjectColor: 'anatomy', title: 'Anatomie - Erreurs', duration: '45min', type: 'Erreurs à revoir', day: 4, hour: 16 },
  { id: 's11', subjectColor: 'santepublique', title: 'Santé Publique - Épidémio', duration: '1h', type: 'Découverte', day: 5, hour: 20 },
];

export const errors: ErrorEntry[] = [
  { id: 'e1', subjectId: '1', subjectName: 'Chimie', subjectColor: 'chemistry', question: 'Quelle est la configuration absolue du L-alanine ?', wrongAnswer: 'R', correctAnswer: 'S', date: '15 Jan 2025', occurrenceCount: 4 },
  { id: 'e2', subjectId: '4', subjectName: 'Anatomie', subjectColor: 'anatomy', question: 'Quel muscle est innervé par le nerf médian ?', wrongAnswer: 'Biceps brachial', correctAnswer: 'Fléchisseur radial du carpe', date: '18 Jan 2025', occurrenceCount: 2 },
  { id: 'e3', subjectId: '2', subjectName: 'Bio Cellulaire', subjectColor: 'cellbio', question: 'Quelle protéine assure le transport actif du Na+ ?', wrongAnswer: 'Aquaporine', correctAnswer: 'Na+/K+ ATPase', date: '20 Jan 2025', occurrenceCount: 5 },
  { id: 'e4', subjectId: '3', subjectName: 'Biophysique', subjectColor: 'biophysics', question: 'Formule de la loi de Beer-Lambert ?', wrongAnswer: 'A = ε × l × c²', correctAnswer: 'A = ε × l × c', date: '22 Jan 2025', occurrenceCount: 1 },
  { id: 'e5', subjectId: '7', subjectName: 'Physiologie', subjectColor: 'physiology', question: 'Quel est le potentiel de repos d\'un neurone ?', wrongAnswer: '-50 mV', correctAnswer: '-70 mV', date: '25 Jan 2025', occurrenceCount: 3 },
];

export const notifications = [
  { id: 'n1', type: 'course', message: 'Nouveau cours disponible : Biochimie - Enzymologie', read: false, date: 'Il y a 2h' },
  { id: 'n2', type: 'error', message: 'Tu as 3 erreurs fréquentes à revoir en Chimie', read: false, date: 'Il y a 5h' },
  { id: 'n3', type: 'revision', message: 'Révision recommandée : Biochimie Chapitre 2', read: true, date: 'Hier' },
  { id: 'n4', type: 'schedule', message: 'Emploi du temps mis à jour pour cette semaine', read: true, date: 'Il y a 2j' },
];

export const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const subjectColorMap: Record<SubjectColor, { bg: string; text: string; light: string }> = {
  chemistry: { bg: 'bg-subject-chemistry', text: 'text-subject-chemistry', light: 'bg-subject-chemistry-light' },
  cellbio: { bg: 'bg-subject-cellbio', text: 'text-subject-cellbio', light: 'bg-subject-cellbio-light' },
  biophysics: { bg: 'bg-subject-biophysics', text: 'text-subject-biophysics', light: 'bg-subject-biophysics-light' },
  anatomy: { bg: 'bg-subject-anatomy', text: 'text-subject-anatomy', light: 'bg-subject-anatomy-light' },
  histology: { bg: 'bg-subject-histology', text: 'text-subject-histology', light: 'bg-subject-histology-light' },
  physiology: { bg: 'bg-subject-physiology', text: 'text-subject-physiology', light: 'bg-subject-physiology-light' },
  pharmacology: { bg: 'bg-subject-pharmacology', text: 'text-subject-pharmacology', light: 'bg-subject-pharmacology-light' },
  embryology: { bg: 'bg-subject-embryology', text: 'text-subject-embryology', light: 'bg-subject-embryology-light' },
  biomolgen: { bg: 'bg-subject-biomolgen', text: 'text-subject-biomolgen', light: 'bg-subject-biomolgen-light' },
  shs: { bg: 'bg-subject-shs', text: 'text-subject-shs', light: 'bg-subject-shs-light' },
  biostatistique: { bg: 'bg-subject-biostatistique', text: 'text-subject-biostatistique', light: 'bg-subject-biostatistique-light' },
  medicament: { bg: 'bg-subject-medicament', text: 'text-subject-medicament', light: 'bg-subject-medicament-light' },
  santepublique: { bg: 'bg-subject-santepublique', text: 'text-subject-santepublique', light: 'bg-subject-santepublique-light' },
  microbiologie: { bg: 'bg-subject-microbiologie', text: 'text-subject-microbiologie', light: 'bg-subject-microbiologie-light' },
  specialite: { bg: 'bg-subject-specialite', text: 'text-subject-specialite', light: 'bg-subject-specialite-light' },
};
