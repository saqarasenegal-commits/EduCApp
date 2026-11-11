// Curriculum catalogue: levels, grades and suggested topics per subject.
// Topics are suggestions only — learners can always type a custom topic.

export const LEVELS = {
  primary: {
    label: { en: "Primary school", fr: "École primaire" },
    grades: [
      { id: "P1", en: "Grade 1", fr: "CP" },
      { id: "P2", en: "Grade 2", fr: "CE1" },
      { id: "P3", en: "Grade 3", fr: "CE2" },
      { id: "P4", en: "Grade 4", fr: "CM1" },
      { id: "P5", en: "Grade 5", fr: "CM2" },
      { id: "P6", en: "Grade 6", fr: "6e" },
    ],
  },
  secondary: {
    label: { en: "Secondary school", fr: "Collège / Lycée" },
    grades: [
      { id: "S1", en: "Grade 7", fr: "5e" },
      { id: "S2", en: "Grade 8", fr: "4e" },
      { id: "S3", en: "Grade 9", fr: "3e" },
      { id: "S4", en: "Grade 10", fr: "Seconde" },
      { id: "S5", en: "Grade 11", fr: "Première" },
      { id: "S6", en: "Grade 12", fr: "Terminale" },
    ],
  },
};

export const SUBJECTS = {
  math: {
    icon: "➗",
    label: { en: "Mathematics", fr: "Mathématiques" },
    topics: {
      primary: {
        en: ["Counting and place value", "Addition and subtraction", "Multiplication tables", "Division", "Fractions", "Decimals", "Measurement and units", "Shapes and geometry", "Word problems"],
        fr: ["Numération et valeur de position", "Addition et soustraction", "Tables de multiplication", "La division", "Les fractions", "Les nombres décimaux", "Mesures et unités", "Formes et géométrie", "Résolution de problèmes"],
      },
      secondary: {
        en: ["Linear equations", "Proportions and percentages", "Pythagorean theorem", "Functions and graphs", "Quadratic equations", "Trigonometry", "Probability and statistics", "Sequences", "Derivatives", "Vectors"],
        fr: ["Équations du premier degré", "Proportionnalité et pourcentages", "Théorème de Pythagore", "Fonctions et graphiques", "Équations du second degré", "Trigonométrie", "Probabilités et statistiques", "Suites numériques", "Dérivées", "Vecteurs"],
      },
    },
  },
  french: {
    icon: "📖",
    label: { en: "French language", fr: "Français" },
    topics: {
      primary: {
        en: ["The French alphabet and sounds", "Nouns and articles", "Present tense verbs", "Adjective agreement", "Reading comprehension", "Writing simple sentences"],
        fr: ["Les sons et l'alphabet", "Le nom et le déterminant", "Le présent de l'indicatif", "L'accord de l'adjectif", "Compréhension de texte", "Écrire des phrases simples"],
      },
      secondary: {
        en: ["Past tenses (passé composé, imparfait)", "Subjunctive mood", "Argumentative essay", "Figures of speech", "Poetry analysis", "Literary movements"],
        fr: ["Passé composé et imparfait", "Le subjonctif", "Le texte argumentatif", "Les figures de style", "Analyse de poème", "Les mouvements littéraires"],
      },
    },
  },
  english: {
    icon: "🔤",
    label: { en: "English language", fr: "Anglais" },
    topics: {
      primary: {
        en: ["Phonics and spelling", "Nouns, verbs and adjectives", "Simple present tense", "Punctuation", "Reading comprehension", "Everyday vocabulary"],
        fr: ["Phonétique et orthographe", "Noms, verbes et adjectifs", "Le présent simple", "La ponctuation", "Compréhension écrite", "Vocabulaire du quotidien"],
      },
      secondary: {
        en: ["Present perfect vs past simple", "Conditionals", "Passive voice", "Reported speech", "Essay writing", "Literary analysis"],
        fr: ["Present perfect et prétérit", "Les conditionnels", "La voix passive", "Le discours indirect", "Rédaction d'un essai", "Analyse littéraire"],
      },
    },
  },
  science: {
    icon: "🔬",
    label: { en: "Science", fr: "Sciences" },
    topics: {
      primary: {
        en: ["Living things and habitats", "The human body", "Plants and photosynthesis", "States of matter", "The water cycle", "The solar system", "Simple electricity"],
        fr: ["Les êtres vivants et leurs milieux", "Le corps humain", "Les plantes", "Les états de la matière", "Le cycle de l'eau", "Le système solaire", "L'électricité simple"],
      },
      secondary: {
        en: ["The cell", "Genetics and DNA", "Ecosystems", "Atoms and molecules", "Chemical reactions", "Forces and motion", "Energy", "Electricity and circuits", "Waves and light"],
        fr: ["La cellule", "Génétique et ADN", "Les écosystèmes", "Atomes et molécules", "Les réactions chimiques", "Forces et mouvement", "L'énergie", "Circuits électriques", "Ondes et lumière"],
      },
    },
  },
  history: {
    icon: "🌍",
    label: { en: "History & Geography", fr: "Histoire-Géographie" },
    topics: {
      primary: {
        en: ["Continents and oceans", "Reading a map", "Ancient Egypt", "Great African empires", "Daily life long ago", "My country"],
        fr: ["Continents et océans", "Lire une carte", "L'Égypte ancienne", "Les grands empires africains", "La vie d'autrefois", "Mon pays"],
      },
      secondary: {
        en: ["The Industrial Revolution", "World War I", "World War II", "Decolonisation in Africa", "The Cold War", "Globalisation", "Climate and population"],
        fr: ["La révolution industrielle", "La Première Guerre mondiale", "La Seconde Guerre mondiale", "La décolonisation en Afrique", "La guerre froide", "La mondialisation", "Climat et population"],
      },
    },
  },
  computing: {
    icon: "💻",
    label: { en: "Computer science", fr: "Informatique" },
    topics: {
      primary: {
        en: ["What is a computer?", "Algorithms in daily life", "Staying safe online", "Intro to block coding"],
        fr: ["Qu'est-ce qu'un ordinateur ?", "Les algorithmes du quotidien", "La sécurité en ligne", "Initiation au codage par blocs"],
      },
      secondary: {
        en: ["Variables and loops", "Conditions", "Functions", "Binary numbers", "How the internet works", "Intro to Python"],
        fr: ["Variables et boucles", "Les conditions", "Les fonctions", "Le binaire", "Le fonctionnement d'Internet", "Initiation à Python"],
      },
    },
  },
};

export function gradeLabel(levelId, gradeId, lang) {
  const g = LEVELS[levelId]?.grades.find((x) => x.id === gradeId);
  return g ? g[lang] : gradeId;
}
