import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { getTests } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import DtmPlayer from "@/components/DtmPlayer";
import OfficialSamples from "@/components/OfficialSamples";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/tests/dtm">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.tests.dtm.title, description: dict.tests.dtm.intro };
}

/** The DTM mock exam. The page only knows how many questions each subject's bank has; the draw happens in the browser. */
export default async function DtmPage({ params }: PageProps<"/[lang]/tests/dtm">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.tests;
  const pools: Record<string, number> = {};
  for (const x of await getTests()) if (x.kind === "dtm") pools[x.subject] = (pools[x.subject] ?? 0) + x.questions;

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/tests`, label: dict.nav.tests },
        ]}
        kicker={t.dtm.kicker}
        title={t.dtm.title}
        intro={t.dtm.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        {Object.keys(pools).length ? (
          <DtmPlayer pools={pools} t={t} href={`/${lang}/tests/dtm`} backHref={`/${lang}/tests`} />
        ) : (
          <EmptyState>{t.dtm.empty}</EmptyState>
        )}
        <OfficialSamples t={t} />
        <p className="mt-8 text-center text-[12.5px] text-slate-500">🔒 {t.privacy}</p>
      </div>
    </>
  );
}
