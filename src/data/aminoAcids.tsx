import React from "react";

export interface AminoAcid {
  name: string;
  code3: string;
  code1: string;
  category: "nonpolaire" | "polaire" | "acide" | "basique";
  categoryLabel: string;
  mw: number;
  pI: number;
  properties: string;
  structure: React.ReactNode;
}

// Helper: backbone shared by all amino acids
const Backbone = ({ children }: { children?: React.ReactNode }) => (
  <svg viewBox="0 0 220 180" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Backbone: NH2 - Cα - COOH */}
    <text x="10" y="105" fontSize="13" fontWeight="bold" fill="#2563eb">H₂N</text>
    <line x1="45" y1="100" x2="75" y2="100" stroke="#334155" strokeWidth="1.5" />
    <circle cx="85" cy="100" r="10" fill="#e0f2fe" stroke="#2563eb" strokeWidth="1.5" />
    <text x="79" y="104" fontSize="11" fontWeight="bold" fill="#1e40af">Cα</text>
    <line x1="95" y1="100" x2="125" y2="100" stroke="#334155" strokeWidth="1.5" />
    <text x="128" y="105" fontSize="13" fontWeight="bold" fill="#dc2626">COOH</text>
    {/* H on Cα */}
    <line x1="85" y1="90" x2="85" y2="70" stroke="#334155" strokeWidth="1.5" />
    <text x="80" y="65" fontSize="11" fill="#64748b">H</text>
    {/* R group branch */}
    <line x1="85" y1="110" x2="85" y2="135" stroke="#334155" strokeWidth="1.5" />
    {/* R group content */}
    {children}
  </svg>
);

const RLabel = ({ label, x = 75, y = 155 }: { label: string; x?: number; y?: number }) => (
  <text x={x} y={y} fontSize="13" fontWeight="bold" fill="#7c3aed">{label}</text>
);

// Small molecule drawings for R-groups
const makeStructure = (rGroup: React.ReactNode) => <Backbone>{rGroup}</Backbone>;

export const AMINO_ACIDS: AminoAcid[] = [
  {
    name: "Glycine",
    code3: "Gly",
    code1: "G",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 75.03,
    pI: 5.97,
    properties: "Le plus petit acide aminé. Pas de carbone asymétrique. Grande flexibilité conformationnelle.",
    structure: makeStructure(<RLabel label="H" x={82} y={152} />),
  },
  {
    name: "Alanine",
    code3: "Ala",
    code1: "A",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 89.09,
    pI: 6.00,
    properties: "Chaîne latérale méthyle simple. Référence pour l'hydrophobicité.",
    structure: makeStructure(<RLabel label="CH₃" />),
  },
  {
    name: "Valine",
    code3: "Val",
    code1: "V",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 117.15,
    pI: 5.96,
    properties: "Acide aminé ramifié (BCAA). Hydrophobe. Essentiel.",
    structure: makeStructure(
      <g>
        <text x="72" y="152" fontSize="11" fill="#7c3aed" fontWeight="bold">CH</text>
        <line x1="72" y1="155" x2="55" y2="170" stroke="#334155" strokeWidth="1.5" />
        <text x="38" y="178" fontSize="10" fill="#7c3aed">CH₃</text>
        <line x1="92" y1="155" x2="109" y2="170" stroke="#334155" strokeWidth="1.5" />
        <text x="102" y="178" fontSize="10" fill="#7c3aed">CH₃</text>
      </g>
    ),
  },
  {
    name: "Leucine",
    code3: "Leu",
    code1: "L",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 131.17,
    pI: 5.98,
    properties: "BCAA. Très hydrophobe. Essentiel. Fréquent dans les hélices α.",
    structure: makeStructure(
      <g>
        <text x="72" y="150" fontSize="10" fill="#7c3aed" fontWeight="bold">CH₂</text>
        <line x1="85" y1="153" x2="85" y2="162" stroke="#334155" strokeWidth="1.5" />
        <text x="75" y="172" fontSize="10" fill="#7c3aed" fontWeight="bold">CH</text>
        <line x1="73" y1="174" x2="58" y2="180" stroke="#334155" strokeWidth="1.2" />
        <text x="38" y="180" fontSize="9" fill="#7c3aed">CH₃</text>
        <line x1="92" y1="174" x2="107" y2="180" stroke="#334155" strokeWidth="1.2" />
        <text x="107" y="180" fontSize="9" fill="#7c3aed">CH₃</text>
      </g>
    ),
  },
  {
    name: "Isoleucine",
    code3: "Ile",
    code1: "I",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 131.17,
    pI: 6.02,
    properties: "BCAA. Hydrophobe. Essentiel. Deux centres chiraux.",
    structure: makeStructure(
      <g>
        <text x="68" y="150" fontSize="10" fill="#7c3aed" fontWeight="bold">CH—CH₃</text>
        <line x1="85" y1="153" x2="85" y2="165" stroke="#334155" strokeWidth="1.5" />
        <text x="72" y="175" fontSize="10" fill="#7c3aed">CH₂CH₃</text>
      </g>
    ),
  },
  {
    name: "Proline",
    code3: "Pro",
    code1: "P",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 115.13,
    pI: 6.30,
    properties: "Iminoacide (amine secondaire). Rigide. Briseur d'hélice α. Cycle pyrrolidine.",
    structure: (
      <svg viewBox="0 0 220 180" className="w-full h-full">
        {/* Proline ring structure */}
        <polygon points="85,70 55,95 65,130 105,130 115,95" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
        <text x="79" y="67" fontSize="10" fill="#1e40af" fontWeight="bold">N</text>
        <text x="40" y="93" fontSize="9" fill="#64748b">H</text>
        <text x="79" y="145" fontSize="10" fill="#7c3aed">Cα</text>
        <text x="118" y="100" fontSize="12" fontWeight="bold" fill="#dc2626">COOH</text>
        <line x1="115" y1="95" x2="118" y2="95" stroke="#334155" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    name: "Phénylalanine",
    code3: "Phe",
    code1: "F",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 165.19,
    pI: 5.48,
    properties: "Noyau benzène. Très hydrophobe. Essentiel. Absorbe UV (faiblement).",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="158" stroke="#334155" strokeWidth="1.5" />
        {/* Benzene ring */}
        <polygon points="85,160 75,167 75,178 85,185 95,178 95,167" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
        <circle cx="85" cy="173" r="5" fill="none" stroke="#7c3aed" strokeWidth="1" />
      </g>
    ),
  },
  {
    name: "Tryptophane",
    code3: "Trp",
    code1: "W",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 204.23,
    pI: 5.89,
    properties: "Noyau indole. Le plus gros AA. Essentiel. Absorbe UV à 280 nm. Précurseur sérotonine.",
    structure: makeStructure(
      <g>
        <text x="68" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="82" y1="150" x2="82" y2="157" stroke="#334155" strokeWidth="1.5" />
        {/* Indole ring system */}
        <polygon points="82,158 72,165 72,176 82,182 92,176 92,165" fill="none" stroke="#7c3aed" strokeWidth="1.3" />
        <polygon points="92,165 92,176 105,178 110,168 102,160" fill="none" stroke="#7c3aed" strokeWidth="1.3" />
        <text x="95" y="172" fontSize="8" fill="#1e40af">NH</text>
      </g>
    ),
  },
  {
    name: "Méthionine",
    code3: "Met",
    code1: "M",
    category: "nonpolaire",
    categoryLabel: "Non polaire",
    mw: 149.21,
    pI: 5.74,
    properties: "Contient du soufre (thioéther). Codon d'initiation (AUG). Essentiel.",
    structure: makeStructure(
      <g>
        <text x="62" y="148" fontSize="9" fill="#7c3aed">CH₂CH₂</text>
        <line x1="85" y1="150" x2="85" y2="160" stroke="#334155" strokeWidth="1.5" />
        <text x="78" y="170" fontSize="11" fill="#eab308" fontWeight="bold">S</text>
        <line x1="85" y1="172" x2="85" y2="180" stroke="#334155" strokeWidth="1.5" />
        <text x="75" y="180" fontSize="9" fill="#7c3aed">CH₃</text>
      </g>
    ),
  },
  {
    name: "Sérine",
    code3: "Ser",
    code1: "S",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 105.09,
    pI: 5.68,
    properties: "Hydroxyle (–OH). Site de phosphorylation. Impliquée dans les sites actifs enzymatiques.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="162" stroke="#334155" strokeWidth="1.5" />
        <text x="76" y="172" fontSize="11" fill="#059669" fontWeight="bold">OH</text>
      </g>
    ),
  },
  {
    name: "Thréonine",
    code3: "Thr",
    code1: "T",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 119.12,
    pI: 5.60,
    properties: "Hydroxyle + méthyle. Essentiel. Deux centres chiraux. Site de phosphorylation.",
    structure: makeStructure(
      <g>
        <text x="64" y="148" fontSize="9" fill="#7c3aed">CH—OH</text>
        <line x1="85" y1="152" x2="85" y2="163" stroke="#334155" strokeWidth="1.5" />
        <text x="75" y="174" fontSize="10" fill="#7c3aed">CH₃</text>
      </g>
    ),
  },
  {
    name: "Cystéine",
    code3: "Cys",
    code1: "C",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 121.16,
    pI: 5.07,
    properties: "Thiol (–SH). Forme des ponts disulfures. Important pour la structure 3D des protéines.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="162" stroke="#334155" strokeWidth="1.5" />
        <text x="78" y="172" fontSize="11" fill="#eab308" fontWeight="bold">SH</text>
      </g>
    ),
  },
  {
    name: "Tyrosine",
    code3: "Tyr",
    code1: "Y",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 181.19,
    pI: 5.66,
    properties: "Phénol (benzène + OH). Absorbe UV à 280 nm. Site de phosphorylation.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="157" stroke="#334155" strokeWidth="1.5" />
        <polygon points="85,158 75,165 75,176 85,183 95,176 95,165" fill="none" stroke="#7c3aed" strokeWidth="1.3" />
        <circle cx="85" cy="171" r="5" fill="none" stroke="#7c3aed" strokeWidth="1" />
        <line x1="85" y1="183" x2="85" y2="180" stroke="#334155" strokeWidth="1" />
        <text x="78" y="180" fontSize="9" fill="#059669" fontWeight="bold">OH</text>
      </g>
    ),
  },
  {
    name: "Asparagine",
    code3: "Asn",
    code1: "N",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 132.12,
    pI: 5.41,
    properties: "Amide de l'aspartate. Site de N-glycosylation. Fréquente en surface des protéines.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="160" stroke="#334155" strokeWidth="1.5" />
        <text x="60" y="172" fontSize="10" fill="#7c3aed">C(=O)NH₂</text>
      </g>
    ),
  },
  {
    name: "Glutamine",
    code3: "Gln",
    code1: "Q",
    category: "polaire",
    categoryLabel: "Polaire non chargé",
    mw: 146.15,
    pI: 5.65,
    properties: "Amide du glutamate. Donneur d'azote pour la biosynthèse. Transport d'ammoniac.",
    structure: makeStructure(
      <g>
        <text x="58" y="148" fontSize="9" fill="#7c3aed">CH₂CH₂</text>
        <line x1="85" y1="150" x2="85" y2="160" stroke="#334155" strokeWidth="1.5" />
        <text x="60" y="172" fontSize="10" fill="#7c3aed">C(=O)NH₂</text>
      </g>
    ),
  },
  {
    name: "Acide aspartique",
    code3: "Asp",
    code1: "D",
    category: "acide",
    categoryLabel: "Acide (chargé −)",
    mw: 133.10,
    pI: 2.77,
    properties: "Chargé négativement à pH physiologique. Impliqué dans les sites actifs et liaisons ioniques.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="160" stroke="#334155" strokeWidth="1.5" />
        <text x="68" y="172" fontSize="10" fill="#dc2626" fontWeight="bold">COO⁻</text>
      </g>
    ),
  },
  {
    name: "Acide glutamique",
    code3: "Glu",
    code1: "E",
    category: "acide",
    categoryLabel: "Acide (chargé −)",
    mw: 147.13,
    pI: 3.22,
    properties: "Chargé négativement. Neurotransmetteur excitateur principal du SNC. Goût umami.",
    structure: makeStructure(
      <g>
        <text x="58" y="148" fontSize="9" fill="#7c3aed">CH₂CH₂</text>
        <line x1="85" y1="150" x2="85" y2="160" stroke="#334155" strokeWidth="1.5" />
        <text x="68" y="172" fontSize="10" fill="#dc2626" fontWeight="bold">COO⁻</text>
      </g>
    ),
  },
  {
    name: "Lysine",
    code3: "Lys",
    code1: "K",
    category: "basique",
    categoryLabel: "Basique (chargé +)",
    mw: 146.19,
    pI: 9.74,
    properties: "Chargée positivement. Essentiel. Liaison avec l'ADN. Site d'ubiquitination et acétylation.",
    structure: makeStructure(
      <g>
        <text x="52" y="148" fontSize="8" fill="#7c3aed">(CH₂)₄</text>
        <line x1="85" y1="150" x2="85" y2="162" stroke="#334155" strokeWidth="1.5" />
        <text x="72" y="174" fontSize="10" fill="#2563eb" fontWeight="bold">NH₃⁺</text>
      </g>
    ),
  },
  {
    name: "Arginine",
    code3: "Arg",
    code1: "R",
    category: "basique",
    categoryLabel: "Basique (chargé +)",
    mw: 174.20,
    pI: 10.76,
    properties: "Guanidinium (charge + délocalisée). Très basique. Précurseur du NO. Histone-binding.",
    structure: makeStructure(
      <g>
        <text x="52" y="148" fontSize="8" fill="#7c3aed">(CH₂)₃</text>
        <line x1="85" y1="150" x2="85" y2="158" stroke="#334155" strokeWidth="1.5" />
        <text x="72" y="168" fontSize="9" fill="#7c3aed">NH</text>
        <line x1="85" y1="170" x2="85" y2="176" stroke="#334155" strokeWidth="1.2" />
        <text x="60" y="180" fontSize="8" fill="#2563eb" fontWeight="bold">C(=NH)NH₂</text>
      </g>
    ),
  },
  {
    name: "Histidine",
    code3: "His",
    code1: "H",
    category: "basique",
    categoryLabel: "Basique (chargé +)",
    mw: 155.16,
    pI: 7.59,
    properties: "Noyau imidazole (pKa ≈ 6). Tampon physiologique. Catalyse acide-base. Essentiel.",
    structure: makeStructure(
      <g>
        <text x="72" y="148" fontSize="9" fill="#7c3aed">CH₂</text>
        <line x1="85" y1="150" x2="85" y2="158" stroke="#334155" strokeWidth="1.5" />
        {/* Imidazole ring */}
        <polygon points="85,160 75,170 80,180 90,180 95,170" fill="none" stroke="#2563eb" strokeWidth="1.5" />
        <text x="76" y="175" fontSize="7" fill="#1e40af">N</text>
        <text x="89" y="168" fontSize="7" fill="#1e40af">NH</text>
      </g>
    ),
  },
];

export const CATEGORY_COLORS: Record<AminoAcid["category"], string> = {
  nonpolaire: "#3b82f6",
  polaire: "#10b981",
  acide: "#ef4444",
  basique: "#8b5cf6",
};
