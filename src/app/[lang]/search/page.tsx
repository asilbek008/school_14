import type { Metadata } from "next";
import { Suspense } from "react";
import { resolveLang } from "@/i18n/server";
import { buildSearchIndex } from "@/lib/search-index";
import PageHeader from "@/components/PageHeader";
import SiteSearch from "@/components/SiteSearch";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.search.title };
}

/**
 * Site search. The page is static like the others: everything searchable is gathered here (cached for
 * 5 minutes) and the browser filters it as the visitor types. The header's own box searches the same
 * list, fetched from /api/search/<lang>; both are built by buildSearchIndex so they never drift.
 */
export default async function SearchPage({ params }: PageProps<"/[lang]/search">) {
  const { lang, dict } = await resolveLang(params);
  const items = await buildSearchIndex(lang, dict);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={dict.search.kicker} title={dict.search.title} intro={dict.search.intro} />
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* The query comes from the address (?q=), which only the browser knows on a static page. */}
        <Suspense>
          <SiteSearch items={items} lang={lang} t={dict.search} />
        </Suspense>
      </div>
    </>
  );
}
