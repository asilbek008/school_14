// Staff Excel import: turns the rows of the "O‘qituvchilar" sheet into staff records.
// Used in the browser (preview) and again in the Server Action on the same file (the client is
// not trusted), so both sides always agree.

import readXlsxFile from "read-excel-file/universal";

export type StaffImportRow = {
  /** Excel row number, for messages. */
  line: number;
  short_name: string | null;
  full_name: string;
  position_uz: string | null;
  subject_uz: string | null;
  /** Classes like ["5-A", "5-B"]. */
  homeroom: string[];
  category_uz: string | null;
  education_uz: string | null;
  experience_years: number | null;
  phone: string | null;
  email: string | null;
  bio_uz: string | null;
  /** null = leave as is. */
  is_published: boolean | null;
};

export type ParsedStaffSheet = { rows: StaffImportRow[]; errors: string[] };

type Key = Exclude<keyof StaffImportRow, "line">;

/** Header text (normalized, without "*" and "(…)") → field. Column order does not matter. */
const HEADERS: Record<string, Key> = {
  "emaktab'dagi nomi": "short_name",
  "to'liq ism-familiya": "full_name",
  "lavozimi": "position_uz",
  "fani": "subject_uz",
  "sinf rahbari": "homeroom",
  "toifa": "category_uz",
  "ma'lumoti": "education_uz",
  "ish staji": "experience_years",
  "telefon": "phone",
  "email": "email",
  "qo'shimcha ma'lumot": "bio_uz",
  "saytda ko'rsatish": "is_published",
};

/** Lowercase, one kind of apostrophe, single spaces — for comparing names and headers. */
export function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[‘’`ʻʼ]/g, "'").replace(/\s+/g, " ").trim();
}

function header(value: unknown): string {
  return normalizeName(String(value ?? "")).replace(/\*/g, "").replace(/\(.*\)/g, "").trim();
}

function cellText(value: unknown, max: number): string | null {
  if (value == null) return null;
  const s = (value instanceof Date ? value.toISOString().slice(0, 10) : String(value)).replace(/\s+/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

/** "5-a, 5 B;6-D" → ["5-A", "5-B", "6-D"]; null if a part is not a class. */
function parseClasses(value: string): string[] | null {
  const parts = value.split(/[,;]+/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const part of parts) {
    const m = /^(\d{1,2})\s*[-–\s]?\s*[«"']?([\p{L}]{1,8})[»"']?$/u.exec(part);
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 11) return null;
    out.push(`${Number(m[1])}-${m[2].toUpperCase()}`);
  }
  return out;
}

/** The header row: the one with both «To‘liq ism-familiya» and «Lavozimi», within the first rows. */
function findHeader(data: unknown[][]): number {
  return data.slice(0, 10).findIndex((row) => {
    const keys = row.map((c) => HEADERS[header(c)]);
    return keys.includes("full_name") && keys.includes("position_uz");
  });
}

/** Reads every row under the header that has a full name. */
export function parseStaffSheet(data: unknown[][]): ParsedStaffSheet {
  const headerIndex = findHeader(data);
  if (headerIndex < 0) {
    return { rows: [], errors: ["«To‘liq ism-familiya» va «Lavozimi» ustunlari topilmadi. Namuna fayldagi sarlavhalarni o‘zgartirmang."] };
  }
  const columns = new Map<Key, number>();
  data[headerIndex].forEach((c, i) => {
    const key = HEADERS[header(c)];
    if (key && !columns.has(key)) columns.set(key, i);
  });
  const get = (row: unknown[], key: Key, max = 200) => {
    const i = columns.get(key);
    return i === undefined ? null : cellText(row[i], max);
  };

  const rows: StaffImportRow[] = [];
  const errors: string[] = [];
  const seen = new Map<string, number>();
  data.slice(headerIndex + 1).forEach((row, i) => {
    const line = headerIndex + i + 2;
    const full_name = get(row, "full_name", 120);
    if (!full_name) return; // empty or not yet filled in
    const problems: string[] = [];

    const key = normalizeName(full_name);
    if (seen.has(key)) problems.push(`${seen.get(key)}-qatorda ham bor`);
    seen.set(key, line);

    const homeroomText = get(row, "homeroom");
    const homeroom = homeroomText ? parseClasses(homeroomText) : [];
    if (!homeroom) problems.push(`sinf rahbari «${homeroomText}» — 5-A kabi yozing`);

    const experienceText = get(row, "experience_years");
    let experience_years: number | null = null;
    if (experienceText) {
      experience_years = Number(experienceText.replace(",", "."));
      if (!Number.isInteger(experience_years) || experience_years < 0 || experience_years > 70) {
        problems.push(`ish staji «${experienceText}» — 0 dan 70 gacha butun son bo‘lsin`);
      }
    }

    const email = get(row, "email", 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push(`email «${email}» noto‘g‘ri`);

    const published = get(row, "is_published");
    let is_published: boolean | null = null;
    if (published) {
      const p = normalizeName(published);
      if (["ha", "да", "yes", "1", "true"].includes(p)) is_published = true;
      else if (["yo'q", "yoq", "нет", "no", "0", "false"].includes(p)) is_published = false;
      else problems.push(`«Saytda ko‘rsatish» — «ha» yoki «yo‘q» bo‘lsin`);
    }

    if (problems.length) {
      errors.push(`${line}-qator (${full_name}): ${problems.join("; ")}`);
      return;
    }
    rows.push({
      line,
      short_name: get(row, "short_name", 80),
      full_name,
      position_uz: get(row, "position_uz"),
      subject_uz: get(row, "subject_uz"),
      homeroom: homeroom ?? [],
      category_uz: get(row, "category_uz"),
      education_uz: get(row, "education_uz"),
      experience_years,
      phone: get(row, "phone", 40),
      email,
      bio_uz: get(row, "bio_uz", 4000),
      is_published,
    });
  });
  return { rows, errors };
}

/** Reads an .xlsx file: the first sheet with a «To‘liq ism-familiya» column. */
export async function readStaffFile(file: Blob): Promise<ParsedStaffSheet> {
  let sheets: { data: unknown[][] }[];
  try {
    sheets = await readXlsxFile(file);
  } catch {
    return { rows: [], errors: ["Faylni o‘qib bo‘lmadi. Uni Excel'da .xlsx formatida saqlang."] };
  }
  const sheet = sheets.find((s) => findHeader(s.data) >= 0) ?? sheets[0];
  return sheet ? parseStaffSheet(sheet.data) : { rows: [], errors: ["Fayl bo‘sh."] };
}

/** Default list position for a new person: director first, deputies next, then everyone else. */
export function sortOrderFor(position: string): number {
  const p = normalizeName(position);
  if (p.includes("o'rinbosar")) return 1;
  if (p.includes("direktor")) return 0;
  return 100;
}
