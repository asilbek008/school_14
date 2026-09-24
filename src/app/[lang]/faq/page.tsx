import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import CategoryFilter from "@/components/CategoryFilter";
import { tileColors } from "@/components/StatTiles";

export async function generateMetadata({ params }: PageProps<"/[lang]/faq">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.faq.title };
}

/** Questions and answers as in the design mockup: an accordion, with a "didn't find it?" contact card beside it. */
export default async function FaqPage({ params }: PageProps<"/[lang]/faq">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.faq;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={t.title} intro={t.intro} kicker={dict.nav.faq} />
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-10 sm:py-12 lg:grid-cols-[1fr_320px]">
        <section>
          {/* Search in questions and answers; the page stays static. */}
          <CategoryFilter allLabel={dict.common.all} searchLabel={t.search} emptyLabel={t.notFound} options={[]}>
            <div className="space-y-2.5">
              {t.items.map((item, i) => (
                <details
                  key={item.q}
                  data-q={`${item.q} ${item.a}`.toLowerCase()}
                  style={{ animationDelay: `${i * 50}ms` }}
                  className="acc reveal group rounded-[14px] border border-slate-200 bg-white transition-[border-color,box-shadow] duration-200 hover:border-slate-300 open:border-brand open:shadow-[0_12px_24px_-12px_rgb(19_26_46/0.18)]"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3.5 rounded-[14px] px-[18px] py-[15px] [&::-webkit-details-marker]:hidden">
                    <span className="font-display text-base font-bold leading-snug text-slate-900">{item.q}</span>
                    <svg viewBox="0 0 24 24" className="ml-auto size-[18px] shrink-0 text-slate-400 transition-transform duration-300 ease-(--ease-spring) group-open:rotate-180 group-open:text-brand" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="px-[18px] pb-[18px] text-[14.5px] leading-relaxed text-slate-600">
                    <p className="whitespace-pre-line">{item.a}</p>
                    {"link" in item && item.link && (
                      <Link href={`/${lang}${item.link}`} className="mt-2.5 inline-flex items-center gap-1 text-sm font-bold text-brand link-grow">
                        {t.open} →
                      </Link>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </CategoryFilter>
        </section>

        {/* A colored tile, as the number tiles on the other pages. */}
        <aside className={`reveal relative overflow-hidden rounded-[14px] bg-gradient-to-br p-6 text-white after:pointer-events-none after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 lg:sticky lg:top-24 ${tileColors[0]}`}>
          <h2 className="font-display text-lg font-bold">{t.moreTitle}</h2>
          <p className="mt-1.5 text-sm opacity-90">{t.moreText}</p>
          <div className="mt-4 grid gap-2.5">
            <Link
              href={`/${lang}/contact`}
              className="press rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-navy transition-colors hover:bg-brand-soft"
            >
              {dict.admissions.write}
            </Link>
            {school.phone && (
              <a
                href={telHref(school.phone)}
                className="press rounded-full border-[1.5px] border-white/50 px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10"
              >
                {school.phone}
              </a>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
