import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { getHomerooms, getStaff, localized, mediaUrl } from "@/lib/content";
import { findPosition, positionGroup, positionKey, positionLabel, staffGroups, staffPositions, subjectFilters } from "@/lib/positions";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StaffDirectory from "@/components/StaffDirectory";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/staff">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.staff.title };
}

export default async function StaffPage({ params }: PageProps<"/[lang]/staff">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.staff;
  const [staff, homerooms] = await Promise.all([getStaff(), getHomerooms()]);
  const rows = staff.map((p) => ({
    id: p.id,
    name: p.full_name,
    position: positionLabel(p, lang),
    positionKey: positionKey(p.position_uz),
    subjectKey: positionKey(p.subject_uz ?? ""),
    group: positionGroup(p.position_uz),
    subject: localized(p, "subject", lang) || null,
    homeroom: homerooms[p.id] ?? null,
    photo: mediaUrl(p.photo),
  }));
  // Filter choices per group: the owner's positions (and subject filters for teachers), then
  // any other position someone has.
  const extra = new Map(staff.filter((p) => !findPosition(p.position_uz)).map((p) => [positionKey(p.position_uz), p]));
  const filters = staffGroups.map((group) => ({
    group,
    items: [
      ...staffPositions.filter((p) => p.group === group).map((p) => ({ value: `p:${positionKey(p.uz)}`, label: p[lang] })),
      ...(group === "teachers" ? subjectFilters.map((f) => ({ value: `s:${f.match}`, label: f[lang] })) : []),
      ...[...extra]
        .filter(([, p]) => positionGroup(p.position_uz) === group)
        .map(([key, p]) => ({ value: `p:${key}`, label: positionLabel(p, lang) })),
    ],
  }));

  return (
    <>
      <PageHeader
        crumbs={[{ href: `/${lang}`, label: dict.nav.home }]}
        kicker={t.kicker}
        title={t.title}
        intro={staff.length ? fill(t.countIntro, { n: staff.length }) : t.intro}
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {rows.length ? <StaffDirectory rows={rows} filters={filters} lang={lang} t={t} /> : <EmptyState>{t.empty}</EmptyState>}
      </div>
    </>
  );
}
