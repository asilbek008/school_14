import type { Locale } from "@/i18n/config";
import type { Quote } from "@/components/HeroQuote";
import rows from "./quotes.json";

type Row = { uz: string; ru: string; en: string; author: string; source: string };

/** How many quotes the hero holds at once. At ten minutes each, that is two hours before one repeats. */
const HELD = 12;

/**
 * The quotes the hero cycles through, in one language.
 *
 * `quotes.json` is the cleared list from the school's own attribution research: 200 entries, each
 * traceable either to a named work or to a recorded proverb collection. Two were deliberately left
 * out -- the Avloniy line that no primary text confirmed, and the Mandela line whose sources
 * disagree on where it was said -- and the research's rule is why: a quotation that cannot name its
 * source does not go on the site, because that is exactly how a sentence from Qodiriy ended up
 * published as Avloniy's on a state company's site.
 *
 * A language only gets the entries that actually have text in it; nothing is machine-translated
 * into place. That leaves Uzbek with fewer than English, which is honest -- most of the corpus is
 * classical and its published Uzbek translations do not exist.
 *
 * The school's motto always leads, so the server renders it as the h1 and a crawler never sees a
 * heading that moves. The rest is a window that walks the corpus a day at a time, so a visitor who
 * comes back tomorrow meets different ones rather than the same twelve forever.
 */
export function heroQuotes(lang: Locale, motto: string): Quote[] {
  const all = (rows as Row[])
    .filter((row) => row[lang])
    .map((row) => ({
      text: row[lang],
      author: row.author || undefined,
      // A proverb's "author" already says it is one; naming the collection as well reads as clutter.
      source: row.author.toLowerCase().includes("maqol") ? undefined : row.source || undefined,
    }));

  if (!all.length) return [{ text: motto }];

  const day = Math.floor(Date.now() / 86_400_000);
  const step = HELD - 1;
  const from = (day * step) % all.length;

  return [{ text: motto }, ...Array.from({ length: Math.min(step, all.length) }, (_, i) => all[(from + i) % all.length])];
}
