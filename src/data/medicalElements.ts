export interface MedicalInfo {
  role: string;
  deficiency: string;
  excess: string;
  sources: string;
}

export interface Element {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  row: number;
  col: number;
  category: "essential" | "trace" | "toxic" | "other";
  medical?: MedicalInfo;
}

// Standard periodic table layout (row, col) — 1-indexed
export const ELEMENTS: Element[] = [
  // Row 1
  { number: 1, symbol: "H", name: "Hydrogène", mass: "1.008", row: 1, col: 1, category: "essential", medical: { role: "Composant fondamental de l'eau et de toutes les molécules organiques. Essentiel au maintien du pH sanguin.", deficiency: "Déshydratation sévère, acidose métabolique.", excess: "Alcalose, perturbation de l'équilibre acido-basique.", sources: "Eau, tous les aliments contenant de l'eau." } },
  { number: 2, symbol: "He", name: "Hélium", mass: "4.003", row: 1, col: 18, category: "other" },
  // Row 2
  { number: 3, symbol: "Li", name: "Lithium", mass: "6.941", row: 2, col: 1, category: "other" },
  { number: 4, symbol: "Be", name: "Béryllium", mass: "9.012", row: 2, col: 2, category: "other" },
  { number: 5, symbol: "B", name: "Bore", mass: "10.81", row: 2, col: 13, category: "other" },
  { number: 6, symbol: "C", name: "Carbone", mass: "12.01", row: 2, col: 14, category: "essential", medical: { role: "Squelette de toutes les molécules organiques : protéines, lipides, glucides, ADN.", deficiency: "Incompatible avec la vie — base de la chimie organique.", excess: "Intoxication au CO ou CO₂ en cas d'excès gazeux.", sources: "Tous les aliments organiques." } },
  { number: 7, symbol: "N", name: "Azote", mass: "14.01", row: 2, col: 15, category: "essential", medical: { role: "Composant des acides aminés, protéines, bases nucléiques (ADN/ARN) et de l'urée.", deficiency: "Malnutrition protéique (kwashiorkor), fonte musculaire.", excess: "Hyperazotémie, insuffisance rénale.", sources: "Viandes, légumineuses, œufs, produits laitiers." } },
  { number: 8, symbol: "O", name: "Oxygène", mass: "16.00", row: 2, col: 16, category: "essential", medical: { role: "Respiration cellulaire, production d'ATP par la chaîne respiratoire mitochondriale.", deficiency: "Hypoxie, cyanose, défaillance multi-organes.", excess: "Toxicité de l'O₂ (stress oxydatif), rétinopathie chez le prématuré.", sources: "Air inspiré, eau." } },
  { number: 9, symbol: "F", name: "Fluor", mass: "19.00", row: 2, col: 17, category: "trace", medical: { role: "Renforcement de l'émail dentaire (fluoroapatite), prévention des caries.", deficiency: "Caries dentaires fréquentes.", excess: "Fluorose dentaire et osseuse.", sources: "Eau fluorée, thé, poissons de mer." } },
  { number: 10, symbol: "Ne", name: "Néon", mass: "20.18", row: 2, col: 18, category: "other" },
  // Row 3
  { number: 11, symbol: "Na", name: "Sodium", mass: "22.99", row: 3, col: 1, category: "essential", medical: { role: "Régulation de la pression osmotique, transmission nerveuse, équilibre hydro-électrolytique.", deficiency: "Hyponatrémie : nausées, confusion, convulsions.", excess: "Hypernatrémie, hypertension artérielle, AVC.", sources: "Sel de table, aliments transformés, fromages." } },
  { number: 12, symbol: "Mg", name: "Magnésium", mass: "24.31", row: 3, col: 2, category: "essential", medical: { role: "Cofacteur de >300 enzymes, synthèse d'ATP, contraction musculaire, transmission nerveuse.", deficiency: "Crampes, tétanie, arythmies cardiaques, fatigue chronique.", excess: "Hypotension, bradycardie, dépression respiratoire.", sources: "Chocolat noir, noix, épinards, légumineuses." } },
  { number: 13, symbol: "Al", name: "Aluminium", mass: "26.98", row: 3, col: 13, category: "other" },
  { number: 14, symbol: "Si", name: "Silicium", mass: "28.09", row: 3, col: 14, category: "other" },
  { number: 15, symbol: "P", name: "Phosphore", mass: "30.97", row: 3, col: 15, category: "essential", medical: { role: "Composant de l'ATP, ADN, ARN, phospholipides membranaires et hydroxyapatite osseuse.", deficiency: "Faiblesse musculaire, rachitisme, ostéomalacie.", excess: "Hyperphosphatémie, calcifications extra-osseuses.", sources: "Produits laitiers, viandes, poissons, légumineuses." } },
  { number: 16, symbol: "S", name: "Soufre", mass: "32.07", row: 3, col: 16, category: "essential", medical: { role: "Composant des acides aminés soufrés (cystéine, méthionine), ponts disulfures des protéines.", deficiency: "Rare — retard de croissance, fragilité des phanères.", excess: "Troubles digestifs.", sources: "Œufs, ail, oignon, crucifères, viandes." } },
  { number: 17, symbol: "Cl", name: "Chlore", mass: "35.45", row: 3, col: 17, category: "essential", medical: { role: "Composant du HCl gastrique, équilibre acido-basique, pression osmotique.", deficiency: "Alcalose hypochlorémique, troubles digestifs.", excess: "Acidose hyperchlorémique.", sources: "Sel de table, aliments salés." } },
  { number: 18, symbol: "Ar", name: "Argon", mass: "39.95", row: 3, col: 18, category: "other" },
  // Row 4
  { number: 19, symbol: "K", name: "Potassium", mass: "39.10", row: 4, col: 1, category: "essential", medical: { role: "Potentiel de membrane, contraction musculaire et cardiaque, transmission nerveuse.", deficiency: "Hypokaliémie : faiblesse, arythmies, iléus paralytique.", excess: "Hyperkaliémie : arythmies mortelles, arrêt cardiaque.", sources: "Bananes, pommes de terre, épinards, avocats." } },
  { number: 20, symbol: "Ca", name: "Calcium", mass: "40.08", row: 4, col: 2, category: "essential", medical: { role: "Structure osseuse, contraction musculaire, coagulation sanguine, signalisation cellulaire.", deficiency: "Ostéoporose, tétanie, rachitisme chez l'enfant.", excess: "Hypercalcémie : lithiase rénale, calcifications vasculaires.", sources: "Produits laitiers, brocoli, amandes, eaux minérales." } },
  { number: 21, symbol: "Sc", name: "Scandium", mass: "44.96", row: 4, col: 3, category: "other" },
  { number: 22, symbol: "Ti", name: "Titane", mass: "47.87", row: 4, col: 4, category: "other" },
  { number: 23, symbol: "V", name: "Vanadium", mass: "50.94", row: 4, col: 5, category: "other" },
  { number: 24, symbol: "Cr", name: "Chrome", mass: "52.00", row: 4, col: 6, category: "trace", medical: { role: "Potentialise l'action de l'insuline, métabolisme du glucose.", deficiency: "Intolérance au glucose, résistance à l'insuline.", excess: "Toxicité rénale et hépatique (Cr VI).", sources: "Levure de bière, brocoli, viande, céréales complètes." } },
  { number: 25, symbol: "Mn", name: "Manganèse", mass: "54.94", row: 4, col: 7, category: "trace", medical: { role: "Cofacteur de la superoxyde dismutase (SOD), métabolisme osseux et glucidique.", deficiency: "Troubles de la croissance osseuse, dermatite.", excess: "Manganisme (syndrome parkinsonien).", sources: "Noix, céréales complètes, thé, ananas." } },
  { number: 26, symbol: "Fe", name: "Fer", mass: "55.85", row: 4, col: 8, category: "trace", medical: { role: "Transport de l'O₂ (hémoglobine), stockage (ferritine), chaîne respiratoire (cytochromes).", deficiency: "Anémie ferriprive : pâleur, fatigue, tachycardie, dyspnée.", excess: "Hémochromatose : cirrhose, diabète bronzé, cardiomyopathie.", sources: "Viande rouge, boudin noir, lentilles, épinards." } },
  { number: 27, symbol: "Co", name: "Cobalt", mass: "58.93", row: 4, col: 9, category: "trace", medical: { role: "Centre de la vitamine B12 (cobalamine), synthèse des globules rouges.", deficiency: "Anémie mégaloblastique (par carence en B12).", excess: "Cardiomyopathie, polycythémie.", sources: "Foie, viandes, poissons, produits laitiers (via B12)." } },
  { number: 28, symbol: "Ni", name: "Nickel", mass: "58.69", row: 4, col: 10, category: "other" },
  { number: 29, symbol: "Cu", name: "Cuivre", mass: "63.55", row: 4, col: 11, category: "trace", medical: { role: "Cofacteur d'enzymes (cytochrome c oxydase, SOD), absorption du fer, synthèse de mélanine.", deficiency: "Anémie, neutropénie, maladie de Menkes.", excess: "Maladie de Wilson : cirrhose, atteinte neurologique.", sources: "Foie, fruits de mer, noix, chocolat noir." } },
  { number: 30, symbol: "Zn", name: "Zinc", mass: "65.38", row: 4, col: 12, category: "trace", medical: { role: "Cofacteur de >200 enzymes, immunité, cicatrisation, synthèse d'ADN, goût et odorat.", deficiency: "Retard de croissance, alopécie, troubles immunitaires, agueusie.", excess: "Nausées, vomissements, carence en cuivre induite.", sources: "Huîtres, viande rouge, graines de courge, fromage." } },
  { number: 31, symbol: "Ga", name: "Gallium", mass: "69.72", row: 4, col: 13, category: "other" },
  { number: 32, symbol: "Ge", name: "Germanium", mass: "72.63", row: 4, col: 14, category: "other" },
  { number: 33, symbol: "As", name: "Arsenic", mass: "74.92", row: 4, col: 15, category: "toxic", medical: { role: "Toxique — inhibe les enzymes mitochondriales (pyruvate déshydrogénase). Utilisé en thérapie (trisenox) contre la leucémie promyélocytaire.", deficiency: "Non applicable.", excess: "Intoxication : douleurs abdominales, neuropathie, cancers (peau, poumon, vessie).", sources: "Eau contaminée, riz, fruits de mer." } },
  { number: 34, symbol: "Se", name: "Sélénium", mass: "78.97", row: 4, col: 16, category: "trace", medical: { role: "Cofacteur de la glutathion peroxydase (antioxydant), métabolisme thyroïdien.", deficiency: "Maladie de Keshan (cardiomyopathie), maladie de Kashin-Beck.", excess: "Sélénose : alopécie, ongles cassants, neuropathie.", sources: "Noix du Brésil, poissons, viandes, œufs." } },
  { number: 35, symbol: "Br", name: "Brome", mass: "79.90", row: 4, col: 17, category: "other" },
  { number: 36, symbol: "Kr", name: "Krypton", mass: "83.80", row: 4, col: 18, category: "other" },
  // Row 5
  { number: 37, symbol: "Rb", name: "Rubidium", mass: "85.47", row: 5, col: 1, category: "other" },
  { number: 38, symbol: "Sr", name: "Strontium", mass: "87.62", row: 5, col: 2, category: "other" },
  { number: 39, symbol: "Y", name: "Yttrium", mass: "88.91", row: 5, col: 3, category: "other" },
  { number: 40, symbol: "Zr", name: "Zirconium", mass: "91.22", row: 5, col: 4, category: "other" },
  { number: 41, symbol: "Nb", name: "Niobium", mass: "92.91", row: 5, col: 5, category: "other" },
  { number: 42, symbol: "Mo", name: "Molybdène", mass: "95.95", row: 5, col: 6, category: "trace", medical: { role: "Cofacteur de la xanthine oxydase et sulfite oxydase.", deficiency: "Très rare — tachycardie, troubles visuels.", excess: "Diarrhée, anémie, hyperuricémie.", sources: "Légumineuses, céréales, abats." } },
  { number: 43, symbol: "Tc", name: "Technétium", mass: "(98)", row: 5, col: 7, category: "other" },
  { number: 44, symbol: "Ru", name: "Ruthénium", mass: "101.1", row: 5, col: 8, category: "other" },
  { number: 45, symbol: "Rh", name: "Rhodium", mass: "102.9", row: 5, col: 9, category: "other" },
  { number: 46, symbol: "Pd", name: "Palladium", mass: "106.4", row: 5, col: 10, category: "other" },
  { number: 47, symbol: "Ag", name: "Argent", mass: "107.9", row: 5, col: 11, category: "other" },
  { number: 48, symbol: "Cd", name: "Cadmium", mass: "112.4", row: 5, col: 12, category: "toxic", medical: { role: "Toxique — accumulation rénale et osseuse. Aucun rôle biologique.", deficiency: "Non applicable.", excess: "Maladie d'Itai-Itai (ostéomalacie), insuffisance rénale, cancer du poumon.", sources: "Tabac, riz contaminé, crustacés, piles." } },
  { number: 49, symbol: "In", name: "Indium", mass: "114.8", row: 5, col: 13, category: "other" },
  { number: 50, symbol: "Sn", name: "Étain", mass: "118.7", row: 5, col: 14, category: "other" },
  { number: 51, symbol: "Sb", name: "Antimoine", mass: "121.8", row: 5, col: 15, category: "other" },
  { number: 52, symbol: "Te", name: "Tellure", mass: "127.6", row: 5, col: 16, category: "other" },
  { number: 53, symbol: "I", name: "Iode", mass: "126.9", row: 5, col: 17, category: "trace", medical: { role: "Synthèse des hormones thyroïdiennes (T3, T4), régulation du métabolisme basal.", deficiency: "Goitre, hypothyroïdie, crétinisme chez le nouveau-né.", excess: "Hyperthyroïdie, thyroïdite.", sources: "Algues, poissons de mer, sel iodé, produits laitiers." } },
  { number: 54, symbol: "Xe", name: "Xénon", mass: "131.3", row: 5, col: 18, category: "other" },
  // Row 6
  { number: 55, symbol: "Cs", name: "Césium", mass: "132.9", row: 6, col: 1, category: "other" },
  { number: 56, symbol: "Ba", name: "Baryum", mass: "137.3", row: 6, col: 2, category: "other" },
  // La-Lu lanthanides skipped in main grid (col 3 placeholder)
  { number: 57, symbol: "La", name: "Lanthane", mass: "138.9", row: 6, col: 3, category: "other" },
  { number: 72, symbol: "Hf", name: "Hafnium", mass: "178.5", row: 6, col: 4, category: "other" },
  { number: 73, symbol: "Ta", name: "Tantale", mass: "180.9", row: 6, col: 5, category: "other" },
  { number: 74, symbol: "W", name: "Tungstène", mass: "183.8", row: 6, col: 6, category: "other" },
  { number: 75, symbol: "Re", name: "Rhénium", mass: "186.2", row: 6, col: 7, category: "other" },
  { number: 76, symbol: "Os", name: "Osmium", mass: "190.2", row: 6, col: 8, category: "other" },
  { number: 77, symbol: "Ir", name: "Iridium", mass: "192.2", row: 6, col: 9, category: "other" },
  { number: 78, symbol: "Pt", name: "Platine", mass: "195.1", row: 6, col: 10, category: "other" },
  { number: 79, symbol: "Au", name: "Or", mass: "197.0", row: 6, col: 11, category: "other" },
  { number: 80, symbol: "Hg", name: "Mercure", mass: "200.6", row: 6, col: 12, category: "toxic", medical: { role: "Toxique — neurotoxique puissant. Inhibe les enzymes à groupement thiol.", deficiency: "Non applicable.", excess: "Maladie de Minamata : ataxie, troubles visuels, surdité, paralysie. Néphrotoxicité.", sources: "Poissons prédateurs (thon, espadon), amalgames dentaires." } },
  { number: 81, symbol: "Tl", name: "Thallium", mass: "204.4", row: 6, col: 13, category: "other" },
  { number: 82, symbol: "Pb", name: "Plomb", mass: "207.2", row: 6, col: 14, category: "toxic", medical: { role: "Toxique — inhibe la synthèse de l'hème (δ-ALA déshydratase), neurotoxique.", deficiency: "Non applicable.", excess: "Saturnisme : coliques, encéphalopathie, anémie, neuropathie périphérique, retard mental chez l'enfant.", sources: "Vieilles peintures, canalisations anciennes, batteries." } },
  { number: 83, symbol: "Bi", name: "Bismuth", mass: "209.0", row: 6, col: 15, category: "other" },
  { number: 84, symbol: "Po", name: "Polonium", mass: "(209)", row: 6, col: 16, category: "other" },
  { number: 85, symbol: "At", name: "Astate", mass: "(210)", row: 6, col: 17, category: "other" },
  { number: 86, symbol: "Rn", name: "Radon", mass: "(222)", row: 6, col: 18, category: "other" },
  // Row 7 (partial)
  { number: 87, symbol: "Fr", name: "Francium", mass: "(223)", row: 7, col: 1, category: "other" },
  { number: 88, symbol: "Ra", name: "Radium", mass: "(226)", row: 7, col: 2, category: "other" },
  { number: 89, symbol: "Ac", name: "Actinium", mass: "(227)", row: 7, col: 3, category: "other" },
  { number: 104, symbol: "Rf", name: "Rutherfordium", mass: "(267)", row: 7, col: 4, category: "other" },
  { number: 105, symbol: "Db", name: "Dubnium", mass: "(268)", row: 7, col: 5, category: "other" },
  { number: 106, symbol: "Sg", name: "Seaborgium", mass: "(269)", row: 7, col: 6, category: "other" },
  { number: 107, symbol: "Bh", name: "Bohrium", mass: "(270)", row: 7, col: 7, category: "other" },
  { number: 108, symbol: "Hs", name: "Hassium", mass: "(277)", row: 7, col: 8, category: "other" },
  { number: 109, symbol: "Mt", name: "Meitnerium", mass: "(278)", row: 7, col: 9, category: "other" },
  { number: 110, symbol: "Ds", name: "Darmstadtium", mass: "(281)", row: 7, col: 10, category: "other" },
  { number: 111, symbol: "Rg", name: "Roentgenium", mass: "(282)", row: 7, col: 11, category: "other" },
  { number: 112, symbol: "Cn", name: "Copernicium", mass: "(285)", row: 7, col: 12, category: "other" },
  { number: 113, symbol: "Nh", name: "Nihonium", mass: "(286)", row: 7, col: 13, category: "other" },
  { number: 114, symbol: "Fl", name: "Flérovium", mass: "(289)", row: 7, col: 14, category: "other" },
  { number: 115, symbol: "Mc", name: "Moscovium", mass: "(290)", row: 7, col: 15, category: "other" },
  { number: 116, symbol: "Lv", name: "Livermorium", mass: "(293)", row: 7, col: 16, category: "other" },
  { number: 117, symbol: "Ts", name: "Tennesse", mass: "(294)", row: 7, col: 17, category: "other" },
  { number: 118, symbol: "Og", name: "Oganesson", mass: "(294)", row: 7, col: 18, category: "other" },
];

// Quiz data for medical elements
export interface MedicalQuizQuestion {
  type: "symbol2role" | "pathology2element";
  prompt: string;
  correctAnswer: string;
  choices: string[];
}

const MEDICAL_ELEMENTS = ELEMENTS.filter(e => e.medical);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateMedicalQuiz(): MedicalQuizQuestion[] {
  const pool = shuffle(MEDICAL_ELEMENTS);
  const questions: MedicalQuizQuestion[] = [];

  for (let i = 0; i < 20; i++) {
    const el = pool[i % pool.length];
    const others = shuffle(MEDICAL_ELEMENTS.filter(e => e.symbol !== el.symbol)).slice(0, 3);
    const type = i % 2 === 0 ? "symbol2role" : "pathology2element";

    if (type === "symbol2role") {
      const roleSummary = el.medical!.role.split(".")[0] + ".";
      questions.push({
        type,
        prompt: `Quel est le rôle médical de ${el.name} (${el.symbol}) ?`,
        correctAnswer: roleSummary,
        choices: shuffle([
          roleSummary,
          ...others.map(o => o.medical!.role.split(".")[0] + ".")
        ]),
      });
    } else {
      const pathology = el.medical!.deficiency !== "Non applicable."
        ? el.medical!.deficiency.split(",")[0]
        : el.medical!.excess.split(",")[0];
      questions.push({
        type,
        prompt: `Quelle carence/excès est associée à : "${pathology}" ?`,
        correctAnswer: `${el.name} (${el.symbol})`,
        choices: shuffle([
          `${el.name} (${el.symbol})`,
          ...others.map(o => `${o.name} (${o.symbol})`)
        ]),
      });
    }
  }
  return questions;
}
