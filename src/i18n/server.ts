import "server-only";
import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

/** Validates the `[lang]` param (404 on unknown locale) and loads its dictionary. */
export async function resolveLang(
  params: Promise<{ lang: string }>,
): Promise<{ lang: Locale; dict: Dictionary }> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { lang, dict: await getDictionary(lang) };
}
