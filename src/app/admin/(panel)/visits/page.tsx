import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatTime } from "@/lib/format";
import { flagOf, placeName } from "@/lib/geo";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Tashriflar" };

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];
type Stats = {
  views: number;
  visitors: number;
  sessions: number;
  new_visitors: number;
  mobile_share: number | null;
  online: number;
  daily: { day: string; views: number; visitors: number }[];
  pages: { path: string; views: number }[];
  places: { city: string | null; region: string | null; country: string | null; views: number; visitors: number }[];
  devices: { device: string; visitors: number }[];
  referrers: { referrer: string; sessions: number }[];
  langs: { lang: string; views: number }[];
};

const periods = [
  { days: 1, label: "Bugun" },
  { days: 7, label: "7 kun" },
  { days: 30, label: "30 kun" },
  { days: 90, label: "90 kun" },
];

// Page paths shown as the section names the admin knows ("/uz/news/…" → "Yangiliklar › …").
const sections: Record<string, string> = {
  "": "Bosh sahifa", news: "Yangiliklar", events: "Tadbirlar", about: "Maktab haqida", staff: "Xodimlar", admissions: "Qabul",
  contact: "Aloqa", schedule: "Qo‘ng‘iroqlar", faq: "Savol-javob", clubs: "To‘garaklar", gallery: "Galereya", timetable: "Dars jadvali",
  programs: "Doimiy tadbirlar", documents: "Hujjatlar", calendar: "Taqvim", achievements: "Yutuqlar", trust: "Ishonch qutisi",
  search: "Qidiruv", year: "O‘quv yili",
};
function pageName(path: string) {
  const [, lang = "", section = "", ...rest] = path.split("/");
  const name = sections[section] ?? section;
  let tail = "";
  try {
    tail = rest.length ? ` › ${decodeURIComponent(rest.join("/"))}` : "";
  } catch {
    tail = ` › ${rest.join("/")}`;
  }
  // The same page in Russian or English is counted apart, so it is marked.
  return `${name}${tail}${lang && lang !== "uz" ? ` (${lang})` : ""}`;
}
const referrerName = (host: string) =>
  /(^|\.)t\.me$|telegram/.test(host) ? "Telegram" : /google\./.test(host) ? "Google" : /yandex\./.test(host) ? "Yandex" : /instagram/.test(host) ? "Instagram" : /facebook|fb\.com/.test(host) ? "Facebook" : host;
const dayLabel = (day: string) => new Intl.DateTimeFormat("uz-UZ", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(day));

async function load(supabase: Supabase, days: number) {
  const [{ data: stats }, { data: recent }] = await Promise.all([
    supabase.rpc("visit_stats", { p_days: days }),
    supabase.from("site_visits").select("id, at, path, visitor, city, region, country, device, referrer").order("at", { ascending: false }).limit(60),
  ]);
  return { stats: stats as Stats | null, recent: recent ?? [] };
}

export default async function VisitsPage({ searchParams }: PageProps<"/admin/visits">) {
  const { supabase } = await requireAdmin();
  const q = await searchParams;
  const days = periods.find((p) => String(p.days) === q.d)?.days ?? 7;
  const { stats, recent } = await load(supabase, days);

  if (!stats) {
    return (
      <>
        <AdminHeader title="Tashriflar" />
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Statistikani o‘qib bo‘lmadi.</p>
      </>
    );
  }

  const max = Math.max(1, ...stats.daily.map((d) => d.views));
  const cards = [
    { label: "Hozir saytda", value: stats.online, sub: "oxirgi 5 daqiqada", live: true },
    { label: "Tashrifchilar", value: stats.visitors, sub: `${stats.new_visitors} tasi yangi` },
    { label: "Tashriflar", value: stats.sessions, sub: "saytga kirishlar soni" },
    { label: "Sahifa ko‘rishlar", value: stats.views, sub: stats.mobile_share != null ? `${stats.mobile_share}% telefondan` : null },
  ];

  return (
    <>
      <AdminHeader title="Tashriflar" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytga kim qachon va qayerdan kirgani. Tashrifchi anonim: ism, IP yoki telefon raqami saqlanmaydi — faqat qaysi sahifa, taxminiy joy
        (shahar/viloyat), qurilma turi va qaysi saytdan kelgani. «Kuzatmang» sozlamasi yoqilgan brauzerlar hisoblanmaydi.
      </p>

      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Davr">
        {periods.map((p) => (
          <Link
            key={p.days}
            href={`/admin/visits?d=${p.days}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              p.days === days ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-blue-400"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </nav>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl bg-white p-4 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-slate-500">
              {c.live && <span className="size-2 animate-pulse rounded-full bg-green-500" aria-hidden />}
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{c.value.toLocaleString("uz-UZ")}</p>
            {c.sub && <p className="mt-0.5 text-xs text-slate-500">{c.sub}</p>}
          </div>
        ))}
      </div>

      {days > 1 && (
        <section className="mb-4 rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-bold text-slate-900">Kunlik sahifa ko‘rishlar</h2>
            <span className="text-xs text-slate-500">eng ko‘pi: {max}</span>
          </div>
          <ol className="flex h-40 items-end gap-[2px] border-b border-slate-200" aria-label="Kunlik sahifa ko‘rishlar">
            {stats.daily.map((d) => (
              <li key={d.day} className="group relative flex h-full flex-1 items-end">
                <span
                  className="mx-auto block w-full max-w-12 rounded-t-[4px] bg-blue-600 transition-colors group-hover:bg-blue-800"
                  style={{ height: d.views ? `${Math.max(2, (d.views / max) * 100)}%` : "0" }}
                />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow group-hover:block">
                  {dayLabel(d.day)}: {d.views} ko‘rish · {d.visitors} kishi
                </span>
                <span className="sr-only">
                  {dayLabel(d.day)}: {d.views} ko‘rish, {d.visitors} tashrifchi
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-1.5 flex justify-between text-xs text-slate-500">
            <span>{dayLabel(stats.daily[0].day)}</span>
            <span>{dayLabel(stats.daily[stats.daily.length - 1].day)}</span>
          </div>
        </section>
      )}

      <div className="mb-4 grid gap-4 lg:grid-cols-2">
        <Ranked
          title="Eng ko‘p ko‘rilgan sahifalar"
          rows={stats.pages.map((p) => ({ key: p.path, label: pageName(p.path), sub: p.path, value: p.views, unit: "ko‘rish" }))}
        />
        <Ranked
          title="Qayerdan"
          rows={stats.places.map((p) => ({
            key: `${p.city}|${p.region}|${p.country}`,
            label: `${flagOf(p.country)} ${placeName(p.city, p.region, p.country) ?? "Aniqlanmadi"}`,
            value: p.visitors,
            unit: "kishi",
          }))}
        />
        <Ranked
          title="Qaysi saytdan kelishgan"
          empty="Hammasi to‘g‘ridan-to‘g‘ri (manzilni yozib yoki saqlangan havoladan)."
          rows={stats.referrers.map((r) => ({ key: r.referrer, label: referrerName(r.referrer), sub: r.referrer, value: r.sessions, unit: "tashrif" }))}
        />
        <Ranked title="Qurilmalar" rows={stats.devices.map((d) => ({ key: d.device, label: d.device, value: d.visitors, unit: "kishi" }))} />
      </div>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="px-5 pt-5 font-bold text-slate-900">So‘nggi tashriflar</h2>
        {recent.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-2.5 text-sm">
                <span className="w-12 shrink-0 font-mono text-xs text-slate-500">{formatTime(r.at, "uz")}</span>
                <span className="font-medium text-slate-900">
                  {flagOf(r.country)} {placeName(r.city, r.region, r.country) ?? "Joy aniqlanmadi"}
                </span>
                <a href={r.path} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  {pageName(r.path)}
                </a>
                <span className="text-xs text-slate-500">
                  {[r.device, r.referrer && `${referrerName(r.referrer)} orqali`, `mehmon #${r.visitor.slice(0, 4)}`].filter(Boolean).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-sm text-slate-500">Hali tashrif yozilmagan.</p>
        )}
      </section>
    </>
  );
}

function Ranked({ title, rows, empty = "Ma’lumot yo‘q." }: { title: string; rows: { key: string; label: string; sub?: string; value: number; unit: string }[]; empty?: string }) {
  const top = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-bold text-slate-900">{title}</h2>
      {rows.length ? (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.key} title={r.sub}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-800">{r.label}</span>
                <span className="shrink-0 text-slate-600">
                  <b className="text-slate-900">{r.value}</b> {r.unit}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${(r.value / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}
