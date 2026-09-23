import "server-only";
import type { Locale } from "./config";

const dictionaries = {
  uz: () => import("./dictionaries/uz.json").then((m) => m.default),
  ru: () => import("./dictionaries/ru.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["uz"]>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]();
