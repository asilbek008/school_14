export const locales = ["uz", "ru", "en"] as const;
export const defaultLocale = "uz";

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
