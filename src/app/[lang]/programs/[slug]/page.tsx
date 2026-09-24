import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLang } from "@/i18n/server";
import { getNewsMentioning, getProgram, localized, mediaUrl } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import PhotoFrame from "@/components/PhotoFrame";
import RichText from "@/components/RichText";
import NewsCard from "@/components/NewsCard";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/programs/[slug]">): Promise<Metadata> {
  const { lang } = await resolveLang(params);
  const program = await getProgram((await params).slug);
  if (!program) return {};
  return { title: localized(program, "name", lang), description: localized(program, "summary", lang) };
}

export default async function ProgramPage({ params }: PageProps<"/[lang]/programs/[slug]">) {
  const { lang, dict } = await resolveLang(params);
  const program = await getProgram((await params).slug);
  if (!program) notFound();
  const t = dict.programs;
  const name = localized(program, "name", lang);
  const news = program.keyword ? await getNewsMentioning(program.keyword) : [];
  const cover = mediaUrl(program.cover ?? news.find((n) => n.cover_image)?.cover_image ?? null);
  const schedule = localized(program, "schedule", lang);
  const place = localized(program, "place", lang);

  return (
    <>
      <PageHeader
        crumbs={[
          { href: `/${lang}`, label: dict.nav.home },
          { href: `/${lang}/programs`, label: dict.nav.programs },
        ]}
        title={name}
        intro={localized(program, "summary", lang)}
        kicker={dict.nav.programs}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {cover && <PhotoFrame src={cover} alt={name} priority className="mb-8 aspect-video rounded-3xl shadow-xl shadow-navy/10" />}
            <div className="text-lg">
              <RichText text={localized(program, "description", lang)} />
            </div>
          </div>
          {(schedule || place) && (
            <aside className="self-start rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-28">
              <dl className="space-y-4">
                {schedule && (
                  <div>
                    <dt className="text-sm text-slate-500">{t.when}</dt>
                    <dd className="font-bold text-slate-900">{schedule}</dd>
                  </div>
                )}
                {place && (
                  <div>
                    <dt className="text-sm text-slate-500">{t.where}</dt>
                    <dd className="font-bold text-slate-900">{place}</dd>
                  </div>
                )}
              </dl>
            </aside>
          )}
        </div>

        <section className="mt-14">
          <h2 className="font-display mb-6 text-2xl font-bold tracking-tight text-slate-900">{t.related}</h2>
          {news.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} lang={lang} dict={dict} />
              ))}
            </div>
          ) : (
            <EmptyState>{t.noNews}</EmptyState>
          )}
        </section>
      </div>
    </>
  );
}
