// eMaktab's pupil list ("Список учеников": Учебный год, Классы школы, ФИО ученика, Дата рождения, Пол, …).
// Read in the browser (preview) and again in the Server Action on the same file (the client is not trusted).

import readXlsxFile from "read-excel-file/universal";

export type PupilRow = {
  line: number;
  /** "5-A". */
  cls: string;
  full_name: string;
  /** What the site shows: "Aliyev A." (surname and the first name's initial). */
  display_name: string;
  gender: "m" | "f" | null;
  birth_date: string | null;
};

export type ParsedPupils = { rows: PupilRow[]; errors: string[] };

const low = (v: unknown) => String(v ?? "").toLowerCase().replace(/\s+/g, " ").trim();

/** One word in title case, with the Uzbek o‘/g‘ letter and the ’ sign (eMaktab writes ` ' ʻ ’ for both). */
function word(w: string): string {
  const s = w
    .toLocaleLowerCase("uz")
    .replace(/([og])[`'ʻ’‘]/g, "$1‘")
    .replace(/[`'ʻ]/g, "’");
  return s
    .split("-")
    .map((p) => p.charAt(0).toLocaleUpperCase("uz") + p.slice(1))
    .join("-");
}

/** "ALIYEV ANVAR KARIMOVICH" → "Aliyev A."; "TOSHEV SHAHZOD" → "Toshev Sh." */
export function pupilDisplayName(full: string): string {
  const [surname, name] = full.split(/\s+/).filter(Boolean);
  // Uzbek digraphs stay whole: "Sh.", "Ch.", "O‘.", "G‘."
  const first = name ? (/^(Sh|Ch|[OG]‘|.)/u.exec(word(name))?.[0] ?? "") : "";
  return `${word(surname ?? "")}${first ? ` ${first}.` : ""}`.slice(0, 60);
}

/** "5-a", "5 A", "5A" → "5-A"; null if it is not a class. */
export function classKey(value: string): string | null {
  const m = /^(\d{1,2})\s*[-–\s]?\s*([\p{L}]{1,8})$/u.exec(value.trim());
  if (!m || Number(m[1]) < 1 || Number(m[1]) > 11) return null;
  return `${Number(m[1])}-${m[2].toUpperCase()}`;
}

function dateText(v: unknown): string | null {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(String(v ?? "").trim());
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : null;
}

function findHeader(data: unknown[][]): number {
  return data.slice(0, 15).findIndex((row) => row.some((c) => low(c).startsWith("фио")) && row.some((c) => low(c).startsWith("класс")));
}

export function parsePupilSheet(data: unknown[][]): ParsedPupils {
  const h = findHeader(data);
  if (h < 0) return { rows: [], errors: ["«Классы школы» va «ФИО ученика» ustunlari topilmadi. eMaktab'dagi «Список учеников» faylini yuklang."] };
  const col = (test: (s: string) => boolean) => data[h].findIndex((c) => test(low(c)));
  const cCls = col((s) => s.startsWith("класс"));
  const cName = col((s) => s.startsWith("фио"));
  const cBirth = col((s) => s.startsWith("дата рожд"));
  const cGender = col((s) => s === "пол");
  const cLeft = col((s) => s.startsWith("тип отчисл"));
  const cEnd = col((s) => s.startsWith("дата конец") || s.startsWith("дата оконч"));

  const rows: PupilRow[] = [];
  const errors: string[] = [];
  data.slice(h + 1).forEach((row, i) => {
    const line = h + i + 2;
    const full_name = String(row[cName] ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!full_name) return;
    // Pupils who have left the school (a reason or an end date) are not on the list.
    if ((cLeft >= 0 && String(row[cLeft] ?? "").trim()) || (cEnd >= 0 && row[cEnd])) return;
    const cls = classKey(String(row[cCls] ?? ""));
    if (!cls) {
      errors.push(`${line}-qator: sinf «${String(row[cCls] ?? "")}» tushunarsiz`);
      return;
    }
    const g = cGender >= 0 ? low(row[cGender]) : "";
    rows.push({
      line,
      cls,
      full_name,
      display_name: pupilDisplayName(full_name),
      gender: g.startsWith("муж") || g.startsWith("o‘g") || g.startsWith("erk") ? "m" : g.startsWith("жен") || g.startsWith("qiz") || g.startsWith("ayol") ? "f" : null,
      birth_date: cBirth >= 0 ? dateText(row[cBirth]) : null,
    });
  });
  if (!rows.length && !errors.length) errors.push("Faylda o‘quvchi topilmadi.");
  return { rows, errors };
}

export async function readPupilFile(file: Blob): Promise<ParsedPupils> {
  let sheets: { data: unknown[][] }[];
  try {
    sheets = await readXlsxFile(file);
  } catch {
    return { rows: [], errors: ["Faylni o‘qib bo‘lmadi. Uni Excel'da .xlsx formatida saqlang."] };
  }
  const sheet = sheets.find((s) => findHeader(s.data) >= 0) ?? sheets[0];
  return sheet ? parsePupilSheet(sheet.data) : { rows: [], errors: ["Fayl bo‘sh."] };
}
