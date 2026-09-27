import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import { fill } from "@/i18n/fill";
import { formatDate } from "@/lib/format";
import type { Dictionary } from "@/i18n/dictionaries";
import { getOpenness, localized, mediaUrl, type OpennessItem } from "@/lib/content";
import PageHeader from "@/components/PageHeader";

export const revalidate = 300;

type Category = keyof Dictionary["openness"]["cats"];

const order: Category[] = ["byudjet", "homiylik", "xarid", "hisobot", "boshqa"];
const tint: Record<string, string> = {
  byudjet: "bg-brand-soft text-brand-deep",
  homiylik: "bg-teal-soft text-teal",
  xarid: "bg-gold-soft text-gold-deep",
  hisobot: "bg-slate-100 text-slate-700",
  boshqa: "bg-slate-100 text-slate-700",
};

/** "12 500 000" — grouped by thousands, with a non-breaking space, in every language. */
const money = (amount: number) => new Intl.NumberFormat("ru-RU").format(amount).replace(/ /g, " ");

const linkOf = (item: OpennessItem) =>
  item.document ? (item.document.kind === "link" ? item.document.url : mediaUrl(item.document.path)) : item.url;

export async function generateMetadata({ params }: PageProps<"/[lang]/openness">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.openness.title, description: dict.openness.intro };
}

/** Openness: what the school spends and receives, with the document behind each figure. */
export default async function OpennessPage({ params }: PageProps<"/[lang]/openness">) {
  const { lang, dict } = await resolveLang(params);
  const t = dict.openness;
  const items = await getOpenness();
  const groups = order.map((category) => ({ category, rows: items.filter((i) => i.category === category) })).filter((g) => g.rows.length);

  return (
    <>
      <PageHeader crumbs={[{ href: `/${lang}`, label: dict.nav.home }]} kicker={t.kicker} title={t.title} intro={t.intro} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {groups.length ? (
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.category} className="reveal">
                <h2 className="font-display mb-4 text-xl font-extrabold text-slate-900 sm:text-2xl">{t.cats[g.category]}</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {g.rows.map((item) => {
                    const href = linkOf(item);
                    return (
                      <li key={item.id} className="rounded-[14px] border border-slate-200 bg-white p-5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${tint[item.category]}`}>{t.cats[item.category as Category]}</span>
                          {item.period && <span className="text-[12.5px] text-slate-500">{item.period}</span>}
                          {item.happened_on && <span className="text-[12.5px] text-slate-500">{formatDate(item.happened_on, lang)}</span>}
                        </div>
                        <h3 className="mt-2 text-[16px] font-bold text-slate-900">{localized(item, "title", lang)}</h3>
                        {item.amount !== null && (
                          <p className="font-display mt-1 text-[22px] font-extrabold text-brand-deep">{fill(t.amount, { n: money(Number(item.amount)) })}</p>
                        )}
                        {localized(item, "note", lang) && <p className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{localized(item, "note", lang)}</p>}
                        {href && (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-[13.5px] font-bold text-brand-deep link-grow"
                          >
                            {item.document ? t.openDoc : t.openLink} ↗
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="rounded-[14px] border border-slate-200 bg-white p-8 text-center text-slate-500">{t.empty}</p>
        )}

        <div className="reveal mt-8 rounded-[14px] bg-teal-soft px-5 py-4 text-[13.5px] leading-relaxed text-slate-800 shadow-[inset_4px_0_0_var(--color-teal)]">
          {t.note}{" "}
          <a href="https://openbudget.uz" target="_blank" rel="noopener noreferrer" className="font-bold text-teal link-grow">
            {t.official} ↗
          </a>
        </div>
      </div>
    </>
  );
}
