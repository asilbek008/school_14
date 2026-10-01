import type { Metadata } from "next";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { school, telHref } from "@/lib/school";
import PageHeader from "@/components/PageHeader";
import { tileColors } from "@/components/StatTiles";

export async function generateMetadata({ params }: PageProps<"/[lang]/privacy">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.privacy.title, description: dict.privacy.lead };
}

/**
 * What the site and the app collect, in plain words. Play Store requires such a page for the app, but
 * parents are the real readers, so the text names the forms and sections they actually use.
 */
export default async function PrivacyPage({ params }: PageProps<"/[lang]/privacy">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.privacy;
  // "1. Who collects the data" -> "1" -> #s1: a short, stable anchor that survives translation.
  const anchor = (title: string, i: number) => `s${title.match(/^\d+/)?.[0] ?? i + 1}`;

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.lead} />
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-10 sm:py-12 lg:grid-cols-[240px_1fr]">
        {/* The policy is long, so the sections stay in view on a computer. */}
        <nav aria-label={t.title} className="reveal hidden lg:sticky lg:top-24 lg:block">
          <ul className="space-y-1.5 border-l-2 border-slate-200 text-[13px] leading-snug">
            {t.sections.map((section, i) => (
              <li key={section.title}>
                <a
                  href={`#${anchor(section.title, i)}`}
                  className="-ml-0.5 block border-l-2 border-transparent py-1 pl-3.5 text-slate-500 transition-colors hover:border-brand hover:text-brand-deep"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <p className="reveal rounded-full bg-slate-100 px-4 py-1.5 text-[12.5px] font-semibold text-slate-600 sm:inline-block">{t.updated}</p>
          <p className="reveal mt-5 text-[15.5px] leading-relaxed text-slate-700">{t.intro}</p>

          <div className="mt-8 space-y-7">
            {t.sections.map((section, i) => (
              <section key={section.title} id={anchor(section.title, i)} className="reveal scroll-mt-24">
                <h2 className="font-display text-[17px] font-bold leading-snug text-slate-900">{section.title}</h2>
                <p className="mt-2 whitespace-pre-line text-[14.5px] leading-relaxed text-slate-600">{section.body}</p>
                {section.items && (
                  <ul className="mt-3 space-y-1.5 text-[14.5px] leading-relaxed text-slate-600">
                    {section.items.map((item) => (
                      <li key={item} className="relative pl-5 before:absolute before:left-0 before:top-[9px] before:size-1.5 before:rounded-full before:bg-gold">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.after && <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">{section.after}</p>}
              </section>
            ))}
          </div>

          <aside className={`reveal relative mt-10 overflow-hidden rounded-[14px] bg-gradient-to-br p-6 text-white after:pointer-events-none after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 ${tileColors[0]}`}>
            <h2 className="font-display text-lg font-bold">{t.contactTitle}</h2>
            <p className="mt-1.5 text-sm opacity-90">{t.contactBody}</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {school.phone && (
                <a href={telHref(school.phone)} className="press rounded-full bg-white px-5 py-3 text-sm font-bold text-navy transition-colors hover:bg-brand-soft">
                  ☎ {school.phone}
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}`} className="press rounded-full border-[1.5px] border-white/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10">
                  {school.email}
                </a>
              )}
              <Link href={`/${lang}/contact`} className="press rounded-full border-[1.5px] border-white/50 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10">
                {dict.admissions.write}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
