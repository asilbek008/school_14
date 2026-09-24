import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLang } from "@/i18n/server";
import { plural } from "@/i18n/fill";
import { getAchievements, localized, mediaUrl } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { schoolYearOf } from "@/lib/school-years";
import { achievementFields, achievementLevels, type AchievementField, type AchievementLevel } from "@/lib/categories";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatTiles from "@/components/StatTiles";
import CategoryFilter from "@/components/CategoryFilter";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/achievements">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.achievements.title };
}

// Medal colors for 1st–3rd place; results without a place get the plain star.
const medals: Record<number, string> = {
  1: "from-[#f3c14b] to-[#c98a12] text-[#3b2604]",
  2: "from-[#dfe4ec] to-[#9aa6b8] text-[#1f2937]",
  3: "from-[#e3a372] to-[#a45a2a] text-white",
};
const levelTint: Record<AchievementLevel, string> = {
  maktab: "bg-slate-100 text-slate-600",
  tuman: "bg-teal-soft text-[#0c6d62]",
  viloyat: "bg-brand-soft text-brand-deep",
  respublika: "bg-gold-soft text-gold-deep",
  xalqaro: "bg-[#fae7e2] text-[#c9553f]",
};
const high = new Set(["viloyat", "respublika", "xalqaro"]);
const fieldOf = (v: string): AchievementField => ((achievementFields as readonly string[]).includes(v) ? (v as AchievementField) : "boshqa");
const levelOf = (v: string): AchievementLevel => ((achievementLevels as readonly string[]).includes(v) ? (v as AchievementLevel) : "maktab");

/** Results as cards: a medal for the place, the stage, who won (class or team; names only with consent) and the coaching teacher. */
export default async function AchievementsPage({ params }: PageProps<"/[lang]/achievements">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.achievements;
  const items = await getAchievements();

  const prizes = items.filter((a) => a.place).length;
  const regional = items.filter((a) => high.has(a.level)).length;
  const teachers = new Set(items.map((a) => a.staff?.id).filter(Boolean)).size;
  const stats = [
    { value: items.length, label: plural(t.statAll, items.length, lang) },
    { value: prizes, label: plural(t.statPrizes, prizes, lang) },
    { value: regional, label: plural(t.statHigh, regional, lang) },
    { value: teachers, label: plural(t.statTeachers, teachers, lang) },
  ].filter((s, i) => i < 3 || s.value > 0);
  const options = achievementFields
    .map((f) => ({ value: f, label: `${t.fields[f]} · ${items.filter((a) => fieldOf(a.field) === f).length}` }))
    .filter((_, i) => items.some((a) => fieldOf(a.field) === achievementFields[i]));

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="year-scope mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {items.length ? (
          <>
            <StatTiles stats={stats} />
            <CategoryFilter allLabel={`${dict.common.all} · ${items.length}`} searchLabel={t.search} emptyLabel={t.notFound} options={options}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((a, i) => {
                  const title = localized(a, "title", lang);
                  const result = localized(a, "result", lang);
                  const level = levelOf(a.level);
                  const field = fieldOf(a.field);
                  const photo = mediaUrl(a.photo);
                  const placeLabel = a.place ? t.place[String(a.place) as "1" | "2" | "3"] : null;
                  const q = [title, result, a.winner, a.names, a.staff?.full_name].filter(Boolean).join(" ").toLowerCase();
                  return (
                    <li
                      key={a.id}
                      data-cat={field}
                      data-q={q}
                      data-year={schoolYearOf(`${a.achieved_on}T12:00:00+05:00`)}
                      style={{ animationDelay: `${(i % 6) * 60}ms` }}
                      className="reveal lift group flex flex-col overflow-hidden rounded-[14px] border border-slate-200 bg-white hover:border-slate-300"
                    >
                      {photo && (
                        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                          <Image src={photo} alt="" fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start gap-3.5">
                          <span
                            aria-hidden
                            className={`grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br text-lg font-extrabold shadow-[inset_0_-3px_0_rgb(0_0_0/0.12)] ${
                              a.place ? medals[a.place] : "from-[#3e72e8] to-brand-deep text-white"
                            }`}
                          >
                            {a.place ?? "★"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${levelTint[level]}`}>{t.levels[level]}</span>
                              <span className="text-[12px] font-medium text-slate-500">{t.fields[field]}</span>
                            </div>
                            <b className="font-display mt-1.5 block text-[16px] leading-snug tracking-tight text-slate-900">{title}</b>
                            {(placeLabel || result) && (
                              <p className="mt-0.5 text-[13.5px] font-semibold text-gold-deep">{[placeLabel, result].filter(Boolean).join(" · ")}</p>
                            )}
                          </div>
                        </div>
                        <dl className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-[13.5px]">
                          {(a.winner || a.names) && (
                            <div className="flex gap-2">
                              <dt className="shrink-0 text-slate-500">{t.winner}:</dt>
                              <dd className="font-semibold text-slate-900">{[a.winner, a.names].filter(Boolean).join(" — ")}</dd>
                            </div>
                          )}
                          {a.staff && (
                            <div className="flex gap-2">
                              <dt className="shrink-0 text-slate-500">{t.teacher}:</dt>
                              <dd>
                                <Link href={`/${lang}/staff/${a.staff.id}`} className="font-semibold text-brand link-grow">
                                  {a.staff.full_name}
                                </Link>
                              </dd>
                            </div>
                          )}
                        </dl>
                        <p className="mt-auto pt-3 text-[12.5px] text-slate-400">{formatDate(`${a.achieved_on}T12:00:00+05:00`, lang)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CategoryFilter>
            <p className="mt-6 text-center text-[12.5px] text-slate-500">{t.privacy}</p>
          </>
        ) : (
          <EmptyState>{t.empty}</EmptyState>
        )}
      </div>
    </>
  );
}
