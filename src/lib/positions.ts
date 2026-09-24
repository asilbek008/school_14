import type { Locale } from "@/i18n/config";

export const staffGroups = ["leaders", "teachers", "others"] as const;
export type StaffGroup = (typeof staffGroups)[number];

type Labels = Record<Locale, string>;

/**
 * Staff positions as the owner listed them, grouped (leadership, teachers, other staff); the
 * staff page filter shows all of them. A person's position_uz is matched here, so the ru/en name
 * comes from this list when the person's own translation is empty.
 */
export const staffPositions: (Labels & { group: StaffGroup })[] = [
  { group: "leaders", uz: "Maktab direktori", ru: "Директор школы", en: "School principal" },
  { group: "leaders", uz: "O‘quv ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по учебной работе", en: "Deputy principal for academic affairs" },
  { group: "leaders", uz: "Tarbiya ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по воспитательной работе", en: "Deputy principal for pastoral care" },
  { group: "leaders", uz: "Xo‘jalik ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по хозяйственной части", en: "Deputy principal for facilities" },
  { group: "teachers", uz: "Boshlang‘ich sinf o‘qituvchisi", ru: "Учитель начальных классов", en: "Primary school teacher" },
  { group: "teachers", uz: "Fan o‘qituvchisi", ru: "Учитель-предметник", en: "Subject teacher" },
  { group: "others", uz: "Maktab maslahatchisi", ru: "Школьный консультант", en: "School counsellor" },
  { group: "others", uz: "Psixolog", ru: "Психолог", en: "Psychologist" },
  { group: "others", uz: "Kutubxonachi", ru: "Библиотекарь", en: "Librarian" },
  { group: "others", uz: "Bosh hisobchi", ru: "Главный бухгалтер", en: "Chief accountant" },
  { group: "others", uz: "Hisobchi", ru: "Бухгалтер", en: "Accountant" },
  { group: "others", uz: "Maktab kotibasi", ru: "Секретарь школы", en: "School secretary" },
  { group: "others", uz: "Kadrlar bo‘yicha mas’ul", ru: "Ответственный по кадрам", en: "HR officer" },
  { group: "others", uz: "Tibbiyot xodimi", ru: "Медицинский работник", en: "School nurse" },
  { group: "others", uz: "Informatika sinfi laboranti", ru: "Лаборант кабинета информатики", en: "Computer lab assistant" },
];

/**
 * Teacher filters by subject (the owner asked for these): a person matches when their Uzbek
 * subject contains `match` (subject_uz can list several, e.g. "Ona tili va adabiyot, Rus tili").
 */
export const subjectFilters: (Labels & { match: string })[] = [
  { match: "ona tili", uz: "Ona tili o‘qituvchilari", ru: "Учителя родного языка", en: "Native language teachers" },
  { match: "rus tili", uz: "Rus tili o‘qituvchilari", ru: "Учителя русского языка", en: "Russian teachers" },
  { match: "ingliz tili", uz: "Ingliz tili o‘qituvchilari", ru: "Учителя английского языка", en: "English teachers" },
  { match: "informatika", uz: "Informatika o‘qituvchilari", ru: "Учителя информатики", en: "Computer science teachers" },
  { match: "jismoniy tarbiya", uz: "Jismoniy tarbiya o‘qituvchilari", ru: "Учителя физкультуры", en: "PE teachers" },
];

/** Compares texts ignoring case and the apostrophe variant (‘ ’ ' ` ʻ). */
export const positionKey = (value: string) =>
  value.toLowerCase().replace(/[‘’`ʻʼ']/g, "'").replace(/\s+/g, " ").trim();

const byKey = new Map(staffPositions.map((p) => [positionKey(p.uz), p]));

/** The listed position for a position_uz value, if it is one of the owner's list. */
export const findPosition = (uz: string) => byKey.get(positionKey(uz)) ?? null;

/** Group of any position: from the list, else guessed from the words (director / teacher). */
export function positionGroup(uz: string): StaffGroup {
  const listed = findPosition(uz);
  if (listed) return listed.group;
  const k = positionKey(uz);
  if (k.includes("direktor")) return "leaders";
  if (k.includes("o'qituvchi")) return "teachers";
  return "others";
}

/** A person's position in the page language: own translation, else the list's, else Uzbek. */
export function positionLabel(row: { position_uz: string; position_ru?: string | null; position_en?: string | null }, lang: Locale) {
  const own = lang === "uz" ? row.position_uz : row[`position_${lang}`];
  return own?.trim() || findPosition(row.position_uz)?.[lang] || row.position_uz;
}

/** Position badge colors by group: leadership blue, teachers teal, other staff gold. */
export const groupBadge: Record<StaffGroup, string> = {
  leaders: "bg-brand-soft text-brand-deep",
  teachers: "bg-teal-soft text-[#0c6d62]",
  others: "bg-gold-soft text-gold-deep",
};

/** Initials avatar gradient, fixed per person (so the list and the profile agree, whatever the filter). */
export const avatarGradient = (id: number) => ["from-brand to-brand-deep", "from-teal to-[#0c6d62]", "from-gold to-gold-deep"][id % 3];

/** Up to two initials of a name ("Karimov Anvar" → "KA"). */
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join("")
    .toUpperCase();
