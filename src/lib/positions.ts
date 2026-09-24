import type { Locale } from "@/i18n/config";

/**
 * Staff positions as the owner listed them, in this order (the staff page filter shows all of
 * them). A person's position_uz is matched here, so the ru/en name comes from this list when the
 * person's own translation is empty.
 */
export const staffPositions: Record<Locale, string>[] = [
  { uz: "Boshlang‘ich sinf o‘qituvchisi", ru: "Учитель начальных классов", en: "Primary school teacher" },
  { uz: "Maktab direktori", ru: "Директор школы", en: "School principal" },
  { uz: "O‘quv ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по учебной работе", en: "Deputy principal for academic affairs" },
  { uz: "Tarbiya ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по воспитательной работе", en: "Deputy principal for pastoral care" },
  { uz: "Xo‘jalik ishlari bo‘yicha direktor o‘rinbosari", ru: "Заместитель директора по хозяйственной части", en: "Deputy principal for facilities" },
  { uz: "Bosh hisobchi", ru: "Главный бухгалтер", en: "Chief accountant" },
  { uz: "Hisobchi", ru: "Бухгалтер", en: "Accountant" },
  { uz: "Maktab kotibasi", ru: "Секретарь школы", en: "School secretary" },
  { uz: "Kadrlar bo‘yicha mas’ul", ru: "Ответственный по кадрам", en: "HR officer" },
  { uz: "Psixolog", ru: "Психолог", en: "Psychologist" },
  { uz: "Kutubxonachi", ru: "Библиотекарь", en: "Librarian" },
  { uz: "Tibbiyot xodimi", ru: "Медицинский работник", en: "School nurse" },
  { uz: "Informatika sinfi laboranti", ru: "Лаборант кабинета информатики", en: "Computer lab assistant" },
  { uz: "Fan o‘qituvchisi", ru: "Учитель-предметник", en: "Subject teacher" },
];

/** Compares positions ignoring case and the apostrophe variant (‘ ’ ' ` ʻ). */
export const positionKey = (value: string) =>
  value.toLowerCase().replace(/[‘’`ʻʼ']/g, "'").replace(/\s+/g, " ").trim();

const byKey = new Map(staffPositions.map((p) => [positionKey(p.uz), p]));

/** The listed position for a position_uz value, if it is one of the owner's list. */
export const findPosition = (uz: string) => byKey.get(positionKey(uz)) ?? null;

/** A person's position in the page language: own translation, else the list's, else Uzbek. */
export function positionLabel(row: { position_uz: string; position_ru?: string | null; position_en?: string | null }, lang: Locale) {
  const own = lang === "uz" ? row.position_uz : row[`position_${lang}`];
  return own?.trim() || findPosition(row.position_uz)?.[lang] || row.position_uz;
}
