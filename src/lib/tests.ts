// Tests for pupils: subjects (match the tests.subject check; names in the dictionaries, tests.subjects)
// and the DTM mock-exam format. Safe to import in client components.

export const testSubjects = [
  "ona_tili",
  "matematika",
  "tarix",
  "fizika",
  "kimyo",
  "biologiya",
  "geografiya",
  "ingliz",
  "rus",
  "informatika",
  "huquq",
  "boshqa",
] as const;
export type TestSubject = (typeof testSubjects)[number];

export const isTestSubject = (v: string): v is TestSubject => (testSubjects as readonly string[]).includes(v);

/** Subject colors: a gradient for tiles and covers, a soft badge. */
export const subjectColors: Record<TestSubject, { tile: string; badge: string }> = {
  ona_tili: { tile: "from-[#3e72e8] to-brand-deep", badge: "bg-brand-soft text-brand-deep" },
  matematika: { tile: "from-[#17a090] to-[#0c6d62]", badge: "bg-teal-soft text-[#0c6d62]" },
  tarix: { tile: "from-[#e0a33e] to-gold-deep", badge: "bg-gold-soft text-gold-deep" },
  fizika: { tile: "from-[#6b5bd6] to-[#4636a8]", badge: "bg-[#ece9fb] text-[#4636a8]" },
  kimyo: { tile: "from-[#d2664e] to-[#a63b28]", badge: "bg-[#fae7e2] text-[#c9553f]" },
  biologiya: { tile: "from-[#4caf50] to-[#2e7d32]", badge: "bg-[#e3f3e4] text-[#2e7d32]" },
  geografiya: { tile: "from-[#1e9bd7] to-[#0f6e9e]", badge: "bg-[#e0f1fa] text-[#0f6e9e]" },
  ingliz: { tile: "from-[#d94f86] to-[#a3295c]", badge: "bg-[#fbe5ee] text-[#a3295c]" },
  rus: { tile: "from-[#5c7cfa] to-[#3b5bdb]", badge: "bg-[#e7ecff] text-[#3b5bdb]" },
  informatika: { tile: "from-[#334155] to-[#0f172a]", badge: "bg-slate-100 text-slate-700" },
  huquq: { tile: "from-[#a0703e] to-[#6f4a22]", badge: "bg-[#f4eadf] text-[#6f4a22]" },
  boshqa: { tile: "from-[#64748b] to-[#475569]", badge: "bg-slate-100 text-slate-600" },
};

/**
 * The DTM (university entrance) test: three compulsory subjects of 10 questions (1.1 points each),
 * the first main subject — 30 questions × 3.1, the second — 30 × 2.1; 189 points in 3 hours.
 */
export const dtm = {
  compulsory: ["ona_tili", "matematika", "tarix"] as TestSubject[],
  compulsoryCount: 10,
  compulsoryPoints: 1.1,
  mainCount: 30,
  firstPoints: 3.1,
  secondPoints: 2.1,
  minutes: 180,
  maxScore: 189,
};

/** Subjects a pupil can pick as the main pair (DTM has no "other"). */
export const dtmMainSubjects = testSubjects.filter((s) => s !== "boshqa");

/** Popular pairs offered as one-tap choices (first main subject, second). */
export const dtmPresets: [TestSubject, TestSubject][] = [
  ["kimyo", "biologiya"],
  ["biologiya", "kimyo"],
  ["matematika", "fizika"],
  ["fizika", "matematika"],
  ["ona_tili", "ingliz"],
  ["ingliz", "ona_tili"],
  ["matematika", "ingliz"],
];

/** A question as visitors get it: no answer, no explanation. */
export type PublicQuestion = { id: number; question: string; options: string[]; image: string | null };

/** A block of questions scored the same way (a DTM subject, or the whole of an ordinary test). */
export type TestSection = { label: string; subject?: TestSubject; points: number; questions: PublicQuestion[] };

/** The question bank's difficulty levels (test_questions.difficulty), for the admin panel. */
export const difficultyLabels: Record<number, string> = { 1: "Oson", 2: "O‘rta", 3: "Qiyin" };

/** Letters for the options. */
export const optionLetters = ["A", "B", "C", "D", "E", "F"];

/** A finished attempt, kept in the pupil's browser only (localStorage.testResults, newest first). */
export type TestResult = {
  key: string;
  title: string;
  href: string;
  correct: number;
  total: number;
  score: number;
  max: number;
  at: string;
};
