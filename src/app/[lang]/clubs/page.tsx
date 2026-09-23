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
  return { title: dict.nav.clubs };
}

const accents = ["bg-brand", "bg-teal", "bg-gold", "bg-[#c9553f]"];

export default async function ClubsPage({ params }: PageProps<"/[lang]/clubs">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.clubs;
  const clubs = await getClubs();

  return (
    <>
      <PageHeader title={dict.nav.clubs} intro={t.intro} kicker={dict.nav.school} />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {clubs.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club, i) => {
              const photo = mediaUrl(club.photo);
              const schedule = localized(club, "schedule", lang);
              const place = localized(club, "place", lang);
              return (
                <article key={club.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {photo ? (
                    <div className="relative aspect-[16/9]">
                      <Image src={photo} alt="" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                    </div>
                  ) : (
                    <span className={`h-1.5 ${accents[i % accents.length]}`} />
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    {club.grade_from && club.grade_to && (
                      <span className="mb-2 self-start rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand-deep">
                        {fill(t.grades, { from: club.grade_from, to: club.grade_to })}
                      </span>
                    )}
                    <h2 className="text-lg font-bold">{localized(club, "name", lang)}</h2>
                    <p className="mt-2 flex-1 text-sm text-slate-600">{localized(club, "description", lang)}</p>
                    <dl className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
                      {schedule && (
                        <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">{t.when}</dt><dd className="font-medium">{schedule}</dd></div>
                      )}
                      {place && (
                        <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">{t.where}</dt><dd className="font-medium">{place}</dd></div>
                      )}
                      {club.leader && (
                        <div className="flex gap-2"><dt className="w-24 shrink-0 text-slate-500">{t.leader}</dt><dd className="font-medium">{club.leader}</dd></div>
                      )}
                    </dl>
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
