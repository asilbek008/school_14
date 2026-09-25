// Test questions from pasted text (the usual Word layout) or an Excel sheet. Used in the browser for the
// preview and again in the Server Action (the client is not trusted), so both always agree.
//
// Text:                               Excel (first row — headers, any order):
//   1. Savol matni                      Savol | A | B | C | D | (E | F) | Javob | Izoh
//   A) variant                          Rows starting "Namuna:" are skipped.
//   B) variant
//   *C) to‘g‘ri variant   ← or "Javob: C" under the options, or a key at the end: "Javoblar: 1-C, 2-A …"
//   D) variant
//   Izoh: tushuntirish (ixtiyoriy)

import readXlsxFile from "read-excel-file/universal";

export type ParsedQuestion = {
  /** Where it came from (text line or Excel row), for messages. */
  line: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
};

export type ParsedQuestions = { questions: ParsedQuestion[]; errors: string[] };

const LATIN = "ABCDEF";
const CYRILLIC = "АБВГДЕ";

/** "B" / "b" / "Б" → 1; anything else → -1. */
export function letterIndex(letter: string): number {
  const l = letter.trim().toUpperCase();
  const i = LATIN.indexOf(l);
  return i >= 0 ? i : CYRILLIC.indexOf(l);
}

const clean = (s: string) => s.replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();

const OPTION = /^([*+])?\s*([A-Fa-fА-Еа-е])\s*[).:]\s*(.*?)\s*([*+])?$/u;
const NUMBERED = /^(\d{1,4})\s*[.)]\s*(.+)$/;
const ANSWER = /^(?:to['‘’`ʻ]?g['‘’`ʻ]?ri\s+javob|javob|answer|correct|правильный\s+ответ|ответ)\s*[:\-–—]\s*([A-Fa-fА-Еа-е])\b/iu;
const EXPLAIN = /^(?:izoh|tushuntirish|explanation|пояснение|объяснение)\s*[:\-–—]\s*(.*)$/iu;
const KEY = /^(?:javoblar|kalit|to['‘’`ʻ]?g['‘’`ʻ]?ri\s+javoblar|answers|ответы|ключ)\s*[:\-–—]\s*(.*)$/iu;

type Draft = {
  line: number;
  num: number | null;
  text: string[];
  options: string[];
  correct: number | null;
  explanation: string[] | null;
  /** A blank line ends the explanation. */
  closed?: boolean;
};

/** Parses pasted text; the answer key may be marked per question or listed at the end. */
export function parseQuestionText(input: string): ParsedQuestions {
  const drafts: Draft[] = [];
  const key = new Map<number, number>();
  let cur: Draft | null = null;
  let inKey = false;
  const begin = (line: number, num: number | null, text: string) => {
    cur = { line, num, text: text ? [text] : [], options: [], correct: null, explanation: null };
    drafts.push(cur);
  };

  input.split(/\r?\n/).forEach((raw, i) => {
    const line = i + 1;
    const s = clean(raw);
    if (!s) {
      if (cur?.explanation) cur.closed = true;
      return;
    }
    const k = KEY.exec(s);
    if (k && !OPTION.test(s)) {
      inKey = true;
      cur = null;
      readKey(k[1], key);
      return;
    }
    if (inKey) {
      readKey(s, key);
      return;
    }
    const c = cur as Draft | null;
    const answer = ANSWER.exec(s);
    if (answer && c) {
      c.correct = letterIndex(answer[1]);
      return;
    }
    const explain = EXPLAIN.exec(s);
    if (explain && c) {
      c.explanation = [explain[1]];
      return;
    }
    const option = OPTION.exec(s);
    if (option && c && c.text.length && letterIndex(option[2]) === c.options.length && !c.explanation) {
      if (option[1] || option[4]) c.correct = c.options.length;
      c.options.push(option[3]);
      return;
    }
    const numbered = NUMBERED.exec(s);
    if (numbered && (!c || c.options.length)) {
      begin(line, Number(numbered[1]), numbered[2]);
      return;
    }
    if (c?.explanation && !c.closed) {
      c.explanation.push(s);
    } else if (!c || c.options.length) {
      // Unnumbered layout: a plain line after the options starts the next question.
      begin(line, null, s);
    } else {
      c.text.push(s);
    }
  });

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  drafts.forEach((d, i) => {
    const n = d.num ?? i + 1;
    const correct = d.correct ?? key.get(n) ?? null;
    const question = d.text.join("\n").trim();
    const where = `${n}-savol (${d.line}-qator)`;
    if (d.options.length < 2) errors.push(`${where}: kamida 2 ta javob varianti kerak (A) … B) …).`);
    else if (correct == null || correct < 0) errors.push(`${where}: to‘g‘ri javob belgilanmagan — variant oldiga * qo‘ying yoki «Javob: B» deb yozing.`);
    else if (correct >= d.options.length) errors.push(`${where}: to‘g‘ri javob — ${LATIN[correct]}, lekin bunday variant yo‘q.`);
    else if (d.options.some((o) => !o)) errors.push(`${where}: bo‘sh variant bor.`);
    else if (question.length > 4000) errors.push(`${where}: savol juda uzun.`);
    else {
      questions.push({
        line: d.line,
        question,
        options: d.options.map((o) => o.slice(0, 1000)),
        correct,
        explanation: d.explanation?.join("\n").trim().slice(0, 4000) || null,
      });
    }
  });
  if (!drafts.length) errors.push("Savol topilmadi. Namunadagi ko‘rinishda yozing.");
  return { questions, errors };
}

/** "1-B, 2 a; 3)C" → key entries. */
function readKey(s: string, key: Map<number, number>) {
  for (const m of s.matchAll(/(\d{1,4})\s*[-.)–:]?\s*([A-Fa-fА-Еа-е])(?![\p{L}])/gu)) key.set(Number(m[1]), letterIndex(m[2]));
}

const header = (v: unknown) =>
  String(v ?? "")
    .toLowerCase()
    .replace(/[‘’`ʻʼ]/g, "'")
    .replace(/\*/g, "")
    .replace(/\(.*\)/g, "")
    .trim();

const cell = (v: unknown) => (v == null ? "" : clean(v instanceof Date ? v.toISOString().slice(0, 10) : String(v)).replace(/\\n/g, "\n"));

/** Parses sheet rows: a header row with «Savol» and «Javob», options in columns A…F. */
export function parseQuestionRows(data: unknown[][]): ParsedQuestions {
  const headerIndex = data.slice(0, 10).findIndex((row) => {
    const h = row.map(header);
    return h.includes("savol") && (h.includes("javob") || h.includes("to'g'ri javob"));
  });
  if (headerIndex < 0) return { questions: [], errors: ["«Savol» va «Javob» ustunlari topilmadi. Namuna fayldagi sarlavhalarni o‘zgartirmang."] };
  const h = data[headerIndex].map(header);
  const col = (...names: string[]) => h.findIndex((x) => names.includes(x));
  const qCol = col("savol");
  const aCol = col("javob", "to'g'ri javob");
  const eCol = col("izoh", "tushuntirish");
  const optCols = [...LATIN].map((l) => col(l.toLowerCase())).filter((i) => i >= 0);

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  data.slice(headerIndex + 1).forEach((row, i) => {
    const line = headerIndex + i + 2;
    const question = cell(row[qCol]);
    if (!question || /^namuna\s*:/i.test(question)) return;
    const options = optCols.map((c) => cell(row[c])).filter(Boolean);
    const answer = cell(row[aCol]);
    const correct = /^\d$/.test(answer) ? Number(answer) - 1 : letterIndex(answer);
    const where = `${line}-qator`;
    if (options.length < 2) errors.push(`${where}: kamida 2 ta variant kerak.`);
    else if (correct < 0) errors.push(`${where}: «Javob» ustuniga to‘g‘ri variant harfini yozing (A, B, C yoki D).`);
    else if (correct >= options.length) errors.push(`${where}: to‘g‘ri javob — ${answer}, lekin bunday variant yo‘q.`);
    else if (question.length > 4000) errors.push(`${where}: savol juda uzun.`);
    else questions.push({ line, question, options: options.map((o) => o.slice(0, 1000)), correct, explanation: (eCol >= 0 && cell(row[eCol]).slice(0, 4000)) || null });
  });
  if (!questions.length && !errors.length) errors.push("Faylda savol topilmadi.");
  return { questions, errors };
}

/** Reads an .xlsx file: the first sheet with «Savol» and «Javob» columns. */
export async function readQuestionFile(file: Blob): Promise<ParsedQuestions> {
  let sheets: { data: unknown[][] }[];
  try {
    sheets = await readXlsxFile(file);
  } catch {
    return { questions: [], errors: ["Faylni o‘qib bo‘lmadi. Uni Excel'da .xlsx formatida saqlang."] };
  }
  const found = sheets.map((s) => parseQuestionRows(s.data));
  return found.find((p) => p.questions.length) ?? found[0] ?? { questions: [], errors: ["Fayl bo‘sh."] };
}
