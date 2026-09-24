import type { Metadata } from "next";
import Image from "next/image";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getClubs, localized, mediaUrl } from "@/lib/content";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/clubs">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.clubs.title };
}

// Left edge color, in turn (as in the design mockup).
const accents = ["before:bg-brand", "before:bg-teal", "before:bg-gold"];

/** Clubs as in the design mockup: a colored left edge, name with the grades, description, then leader / time / place. */
export default async function ClubsPage({ params }: PageProps<"/[lang]/clubs">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.clubs;
  const clubs = await getClubs();

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} title={t.title} intro={t.intro} kicker={t.kicker} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {clubs.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const photo = mediaUrl(club.photo);
              const meta = [
                { label: t.leader, value: club.leader },
                { label: t.when, value: localized(club, "schedule", lang) },
                { label: t.where, value: localized(club, "place", lang) },
              ].filter((m) => m.value);
              return (
                <article
                  key={club.id}
                  style={{ animationDelay: `${(i % 6) * 60}ms` }}
                  className={`reveal lift group relative flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-[3px] hover:border-slate-300 ${accents[i % accents.length]}`}
                >
                  {photo && (
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image src={photo} alt="" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 ease-(--ease-spring) group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col px-[22px] pb-5 pt-[22px]">
                    <div className="mb-2.5 flex items-start justify-between gap-3">
                      <h2 className="font-display text-lg font-bold leading-snug tracking-tight text-slate-900">{localized(club, "name", lang)}</h2>
                      {club.grade_from && club.grade_to && (
                        <span className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-bold text-slate-700">
                          {fill(t.grades, { from: club.grade_from, to: club.grade_to })}
                        </span>
                      )}
                    </div>
                    <p className="mb-3.5 flex-1 text-sm leading-relaxed text-slate-600">{localized(club, "description", lang)}</p>
                    {meta.length > 0 && (
                      // Labels in a column as wide as the longest one ("Руководитель" is wider than "Rahbari").
                      <dl className="grid grid-cols-[minmax(74px,auto)_1fr] gap-x-2 gap-y-[7px] border-t border-slate-200 pt-[13px] text-[13px]">
                        {meta.map(({ label, value }) => (
                          <div key={label} className="contents">
                            <dt className="text-slate-500">{label}</dt>
                            <dd className="font-semibold text-slate-700">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
