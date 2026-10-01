import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { buildSearchIndex } from "@/lib/search-index";

/** Rebuilt at the same pace as the pages it describes. */
export const revalidate = 300;

/**
 * The searchable list, in one language, for the search box in the header.
 *
 * It is fetched once, the first time a visitor opens the box, and then the filtering happens in
 * their browser -- so typing costs nothing and no page carries the index it may never need. The
 * texts are the short ones (`brief`), which is what a one-line result needs.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!hasLocale(lang)) return new Response(null, { status: 404 });

  const items = await buildSearchIndex(lang, await getDictionary(lang), { brief: true });
  return Response.json(items, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400" },
  });
}
