import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { fmtMinutes, lessons, shifts } from "@/lib/bells";
import PageHeader from "@/components/PageHeader";
import LiveCard from "@/components/LiveCard";

export async function generateMetadata({ params }: PageProps<"/[lang]/schedule">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.schedule };
}

export default async function SchedulePage({ params }: PageProps<"/[lang]/schedule">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.schedule;

  return (
    <>
      <PageHeader title={dict.nav.schedule} intro={t.intro} kicker={dict.nav.school} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[1fr_1fr_0.9fr]">
        {shifts.map((shift) => (
          <section key={shift.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-bold">
              {fill(t.shift, { n: shift.id })}
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  shift.id === 1 ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"
                }`}
              >
                {fill(t.from, { time: shift.start })}
              </span>
            </h2>
            <p className="mb-4 mt-1 text-sm text-slate-500">{fill(t.grades, { list: shift.grades.join(", ") })}</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 text-left text-xs text-slate-500">
                  <th className="py-2 font-bold">{t.lesson}</th>
                  <th className="py-2 text-right font-bold">{t.time}</th>
                </tr>
              </thead>
              <tbody>
                {lessons(shift).map((l) => (
                  <tr key={l.n} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5">{fill(t.nth, { n: l.n })}</td>
                    <td className="py-2.5 text-right font-bold tabular-nums">
                      {fmtMinutes(l.start)} – {fmtMinutes(l.end)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
        <div>
          <LiveCard t={dict.live} scheduleHref={`/${lang}/schedule`} />
        </div>
      </div>
    </>
  );
}
