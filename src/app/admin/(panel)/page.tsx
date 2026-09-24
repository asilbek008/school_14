import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { allLessons } from "@/lib/all-lessons";
import { formatDate, formatDateFull, formatDateTime } from "@/lib/format";
import { normalizeName } from "@/lib/staff-import";
import { positionGroup } from "@/lib/positions";

export const metadata: Metadata = { title: "Bosh sahifa" };

type Supabase = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Everything the dashboard shows, read at request time (the admin panel is never cached). */
async function load(supabase: Supabase) {
  const now = new Date().toISOString();
  const head = (table: string) => supabase.from(table).select("*", { count: "exact", head: true });
  const [
    { count: unreadCount },
    { count: unreadTrustCount },
    { count: newApplicationCount },
    { count: newsCount },
    { count: hiddenCount },
    { count: upcomingCount },
    { count: clubsCount },
    { count: albumsCount },
    { data: staff },
    { data: classes },
    lessons,
    { data: subjects },
    { data: pages },
    { data: telegram },
    { data: nextEvents },
    { data: messages },
    { data: latestNews },
    { data: clubRows },
    { data: albumRows },
  ] = await Promise.all([
    head("contact_messages").eq("is_read", false),
    head("trust_messages").eq("is_read", false),
    head("admission_applications").eq("status", "new"),
    head("news"),
    head("news").eq("is_published", false),
    head("events").eq("is_published", true).gte("starts_at", now),
    head("clubs"),
    head("gallery_albums"),
    supabase.from("staff").select("short_name, position_uz, photo"),
    supabase.from("school_classes").select("homeroom_teacher_id"),
    allLessons<{ teacher: string | null; alt_teacher: string | null }>(supabase, "teacher, alt_teacher"),
    supabase.from("subjects").select("name_ru, name_en"),
    supabase.from("pages").select("slug, title_uz, body_uz, body_ru, body_en"),
    supabase.from("telegram_settings").select("enabled, channel, last_synced_at, last_status").eq("id", 1).maybeSingle(),
    supabase.from("events").select("id, title_uz, starts_at, all_day, is_published").gte("starts_at", now).order("starts_at").limit(5),
    supabase.from("contact_messages").select("id, name, message, is_read, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("news").select("id, title_uz, is_published, published_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("clubs").select("days, start_time, leader, leader_id"),
    supabase.from("gallery_albums").select("id, gallery_photos(count), gallery_videos(count)"),
  ]);

  const [unread, unreadTrust, newApplications, news, hiddenNews, upcoming, clubs, albums] = [
    unreadCount,
    unreadTrustCount,
    newApplicationCount,
    newsCount,
    hiddenCount,
    upcomingCount,
    clubsCount,
    albumsCount,
  ].map((n) => n ?? 0);

  // Missing data across the sections (the same checks as their "Kamchiliklar" filters).
  const known = new Set((staff ?? []).flatMap((s) => (s.short_name ? [normalizeName(s.short_name)] : [])));
  const unlinked = new Set(
    lessons.flatMap((l) => [l.teacher, l.alt_teacher]).filter((t): t is string => !!t && !known.has(normalizeName(t))),
  );
  const teachers = (staff ?? []).filter((s) => positionGroup(s.position_uz) === "teachers");
  const attention = [
    { n: unread, text: "ta o‘qilmagan xabar", href: "/admin/messages" },
    { n: unreadTrust, text: "ta o‘qilmagan maxfiy murojaat (ishonch qutisi)", href: "/admin/trust" },
    { n: newApplications, text: "ta yangi qabul arizasi — ota-ona bilan bog‘laning", href: "/admin/applications" },
    { n: hiddenNews, text: "ta yashirin yangilik (Telegram’dan kelgan bo‘lsa — tekshirib yoqing)", href: "/admin/news" },
    { n: unlinked.size, text: "ta o‘qituvchi ismi dars jadvalida profilga bog‘lanmagan", href: "/admin/classes" },
    { n: (classes ?? []).filter((c) => !c.homeroom_teacher_id).length, text: "ta sinfda sinf rahbari tanlanmagan", href: "/admin/classes" },
    { n: teachers.filter((s) => !s.short_name).length, text: "ta o‘qituvchining eMaktab nomi yo‘q", href: "/admin/staff" },
    { n: (staff ?? []).filter((s) => !s.photo).length, text: "ta xodimning rasmi yo‘q", href: "/admin/staff" },
    { n: (subjects ?? []).filter((s) => !s.name_ru || !s.name_en).length, text: "ta fanning tarjimasi to‘liq emas", href: "/admin/subjects" },
    {
      n: (pages ?? []).filter((p) => !p.body_uz || !p.body_ru || !p.body_en).length,
      text: "ta sahifada ba’zi tillarda matn yo‘q",
      href: "/admin/pages",
    },
    { n: (clubRows ?? []).filter((c) => !c.start_time && !c.leader && !c.leader_id).length, text: "ta to‘garakning vaqti va rahbari kiritilmagan", href: "/admin/clubs" },
    {
      n: (albumRows ?? []).filter((a) => !a.gallery_photos[0]?.count && !a.gallery_videos[0]?.count).length,
      text: "ta albom bo‘sh",
      href: "/admin/gallery",
    },
    ...(telegram?.last_status?.startsWith("Xato") ? [{ n: 1, text: `Telegram: ${telegram.last_status}`, href: "/admin/telegram" }] : []),
  ].filter((a) => a.n > 0);

  return {
    stats: [
      { href: "/admin/messages", label: "Yangi xabarlar", value: unread, highlight: unread > 0 },
      { href: "/admin/news", label: "Yangiliklar", value: news, sub: hiddenNews ? `${hiddenNews} tasi yashirin` : null },
      { href: "/admin/events", label: "Yaqin tadbirlar", value: upcoming },
      { href: "/admin/staff", label: "Xodimlar", value: staff?.length ?? 0, sub: `${teachers.length} o‘qituvchi` },
      { href: "/admin/classes", label: "Sinflar", value: classes?.length ?? 0, sub: `${lessons.length} ta dars` },
      { href: "/admin/clubs", label: "To‘garaklar", value: clubs },
      { href: "/admin/gallery", label: "Albomlar", value: albums },
      {
        href: "/admin/telegram",
        label: "Telegram",
        value: telegram?.enabled && telegram.channel ? "Yoqilgan" : "O‘chiq",
        sub: telegram?.last_synced_at ? `Tekshiruv: ${formatDateTime(telegram.last_synced_at, "uz")}` : null,
      },
    ],
    attention,
    nextEvents: nextEvents ?? [],
    messages: messages ?? [],
    latestNews: latestNews ?? [],
  };
}

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const { stats, attention, nextEvents, messages, latestNews } = await load(supabase);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xush kelibsiz!</h1>
          <p className="mt-1 text-sm text-slate-500">{formatDateFull(new Date().toISOString(), "uz")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/news/new" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
            + Yangilik
          </Link>
          <Link href="/admin/events/new" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-slate-50">
            + Tadbir
          </Link>
          <Link href="/admin/gallery/new" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-slate-50">
            + Albom
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ href, label, value, highlight, sub }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-xl p-4 shadow-sm transition hover:shadow-md ${highlight ? "bg-blue-700 text-white" : "bg-white"}`}
          >
            <p className={`text-sm ${highlight ? "text-blue-100" : "text-slate-500"}`}>{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {sub && <p className={`mt-0.5 truncate text-xs ${highlight ? "text-blue-100" : "text-slate-500"}`}>{sub}</p>}
          </Link>
        ))}
      </div>

      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-bold">E’tibor talab qiladi</h2>
        {attention.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {attention.map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="group flex items-center gap-3 py-2.5 text-sm">
                  <span className="grid min-w-8 place-items-center rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">{a.n}</span>
                  <span className="flex-1 text-slate-700 group-hover:text-blue-700">{a.text}</span>
                  <span aria-hidden className="text-slate-400 group-hover:text-blue-700">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-green-700">Hammasi joyida ✓</p>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Panel title="Yaqin tadbirlar" href="/admin/events">
          {nextEvents.map((e) => (
            <Row key={e.id} href={`/admin/events/${e.id}`} title={e.title_uz} meta={e.all_day ? formatDate(e.starts_at, "uz") : formatDateTime(e.starts_at, "uz")} hidden={!e.is_published} />
          ))}
          {!nextEvents.length && <Empty>Yaqin tadbir yo‘q.</Empty>}
        </Panel>
        <Panel title="So‘nggi xabarlar" href="/admin/messages">
          {messages.map((m) => (
            <Row key={m.id} href="/admin/messages" title={m.name} meta={m.message.slice(0, 70)} badge={m.is_read ? undefined : "Yangi"} />
          ))}
          {!messages.length && <Empty>Hali xabar kelmagan.</Empty>}
        </Panel>
        <Panel title="So‘nggi yangiliklar" href="/admin/news">
          {latestNews.map((n) => (
            <Row
              key={n.id}
              href={`/admin/news/${n.id}`}
              title={n.title_uz}
              meta={n.published_at ? formatDate(n.published_at, "uz") : "Sana yo‘q"}
              hidden={!n.is_published}
            />
          ))}
          {!latestNews.length && <Empty>Hali yangilik yo‘q.</Empty>}
        </Panel>
      </div>
    </>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-bold">{title}</h2>
        <Link href={href} className="text-sm text-blue-700 hover:underline">
          Barchasi →
        </Link>
      </div>
      <ul className="divide-y divide-slate-100">{children}</ul>
    </section>
  );
}

function Row({ href, title, meta, hidden, badge }: { href: string; title: string; meta: string; hidden?: boolean; badge?: string }) {
  return (
    <li>
      <Link href={href} className="group block py-2.5 text-sm">
        <p className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900 group-hover:text-blue-700">{title}</span>
          {badge && <span className="shrink-0 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{badge}</span>}
          {hidden && <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
        </p>
        <p className="truncate text-slate-500">{meta}</p>
      </Link>
    </li>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="py-2.5 text-sm text-slate-500">{children}</li>;
}
