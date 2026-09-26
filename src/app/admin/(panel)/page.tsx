import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { allLessons } from "@/lib/all-lessons";
import { formatDate, formatDateFull, formatDateTime, formatTime } from "@/lib/format";
import { normalizeName } from "@/lib/staff-import";
import { positionGroup } from "@/lib/positions";
import { parentBotStatus } from "@/lib/parent-bot";
import { Svg, type Icon } from "@/components/admin/AdminNav";
import Crest from "@/components/admin/Crest";
import { BotPreview, BotStatusCard } from "@/components/admin/dashboard/BotCards";
import VisitsChart, { type Day } from "@/components/admin/dashboard/VisitsChart";

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
    { data: documents },
    { count: failedLoginsCount },
    { data: telegram },
    { data: nextEvents },
    { data: messages },
    { data: latestNews },
    { data: clubRows },
    { data: albumRows },
    { count: newsWeekCount },
    { count: testsCount },
    { count: questionsCount },
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
    supabase.from("documents").select("title_ru, title_en"),
    head("admin_logins").eq("event", "failed").gte("at", new Date(Date.now() - 86_400_000).toISOString()),
    supabase.from("telegram_settings").select("enabled, channel, last_synced_at, last_status").eq("id", 1).maybeSingle(),
    supabase.from("events").select("id, title_uz, starts_at, all_day, is_published").gte("starts_at", now).order("starts_at").limit(5),
    supabase.from("contact_messages").select("id, name, message, is_read, created_at").order("created_at", { ascending: false }).limit(4),
    supabase.from("news").select("id, title_uz, is_published, published_at").order("created_at", { ascending: false }).limit(5),
    supabase.from("clubs").select("days, start_time, leader, leader_id"),
    supabase.from("gallery_albums").select("id, gallery_photos(count), gallery_videos(count)"),
    head("news").gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
    head("tests"),
    head("test_questions"),
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
    { n: failedLoginsCount ?? 0, text: "ta noto‘g‘ri parol bilan kirish urinishi (24 soat)", href: "/admin/logins" },
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
    { n: (documents ?? []).filter((d) => !d.title_ru || !d.title_en).length, text: "ta hujjatning tarjimasi to‘liq emas", href: "/admin/documents" },
    { n: (clubRows ?? []).filter((c) => !c.start_time && !c.leader && !c.leader_id).length, text: "ta to‘garakning vaqti va rahbari kiritilmagan", href: "/admin/clubs" },
    {
      n: (albumRows ?? []).filter((a) => !a.gallery_photos[0]?.count && !a.gallery_videos[0]?.count).length,
      text: "ta albom bo‘sh",
      href: "/admin/gallery",
    },
    ...(telegram?.last_status?.startsWith("Xato") ? [{ n: 1, text: `Telegram: ${telegram.last_status}`, href: "/admin/telegram" }] : []),
  ].filter((a) => a.n > 0);

  return {
    counts: {
      unread,
      unreadTrust,
      newApplications,
      news,
      hiddenNews,
      newsWeek: newsWeekCount ?? 0,
      upcoming,
      nextEventAt: nextEvents?.[0]?.starts_at ?? null,
    },
    school: [
      { href: "/admin/staff", icon: "people" as Icon, label: "Xodimlar", value: staff?.length ?? 0, sub: `${teachers.length} o‘qituvchi` },
      { href: "/admin/classes", icon: "grid" as Icon, label: "Sinflar", value: classes?.length ?? 0, sub: `${lessons.length} ta dars` },
      { href: "/admin/tests", icon: "test" as Icon, label: "Testlar", value: testsCount ?? 0, sub: `${questionsCount ?? 0} ta savol` },
      { href: "/admin/clubs", icon: "star" as Icon, label: "To‘garaklar", value: clubs, sub: null },
      { href: "/admin/gallery", icon: "photo" as Icon, label: "Albomlar", value: albums, sub: null },
      {
        href: "/admin/telegram",
        icon: "send" as Icon,
        label: "Telegram kanal",
        value: telegram?.enabled && telegram.channel ? "Yoqilgan" : "O‘chiq",
        sub: telegram?.last_synced_at ? formatDateTime(telegram.last_synced_at, "uz") : null,
      },
    ],
    attention,
    nextEvents: nextEvents ?? [],
    messages: messages ?? [],
    latestNews: latestNews ?? [],
  };
}

const greeting = () => {
  const h = (new Date().getUTCHours() + 5) % 24;
  return h < 5 ? "Xayrli tun" : h < 11 ? "Xayrli tong" : h < 17 ? "Xayrli kun" : "Xayrli kech";
};

/** The light banner at the top of the dashboard (light in both themes, like the owner's mockup). */
function Hero({ sub, children }: { sub: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#eef4ff_0%,#dfe9ff_55%,#f3f7ff_100%)] p-5 text-[#0f1f4d] shadow-[0_20px_50px_-30px_rgb(44_92_224/0.7)] sm:p-7">
      <svg aria-hidden className="pointer-events-none absolute -right-10 -top-16 size-72 text-[#2c5ce0]/10" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="18" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="10" />
      </svg>
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <Crest className="size-20 drop-shadow-[0_10px_20px_rgb(15_31_77/0.25)] sm:size-28" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#2c5ce0]">{greeting()}!</p>
          <h1 className="mt-0.5 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">14-maktab admin paneli</h1>
          <p className="mt-1 text-[15px] text-[#34406a]">Qiziriq tumani 14-sonli umumta’lim maktabi rasmiy sayti</p>
          <div className="mt-3 text-[13.5px] leading-relaxed text-[#4a5680]">{sub}</div>
          {children}
        </div>
        <div className="relative hidden shrink-0 flex-col items-center lg:flex">
          <span className="grid size-16 place-items-center rounded-full bg-[#2c5ce0] text-white shadow-[0_14px_30px_-12px_rgb(44_92_224/0.9)]">
            <Svg name="cap" className="size-8" />
          </span>
          <p className="mt-4 -rotate-6 font-[family-name:var(--font-script)] text-[30px] leading-none text-[#1c3faf]">Bilim — kelajak kaliti!</p>
          <svg aria-hidden viewBox="0 0 200 20" className="mt-1 w-48 -rotate-6 text-[#1c3faf]">
            <path d="M4 14c50-10 120-12 192-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </section>
  );
}

const tones = {
  blue: "bg-[#3b82f6] shadow-[0_10px_24px_-10px_#3b82f6]",
  green: "bg-[#22c55e] shadow-[0_10px_24px_-10px_#22c55e]",
  violet: "bg-[#8b5cf6] shadow-[0_10px_24px_-10px_#8b5cf6]",
  orange: "bg-[#f59e0b] shadow-[0_10px_24px_-10px_#f59e0b]",
} as const;

function StatCard({ href, icon, tone, label, value, note, up }: { href: string; icon: Icon; tone: keyof typeof tones; label: string; value: string | number; note?: string | null; up?: boolean | null }) {
  return (
    <Link href={href} className="group flex h-full min-w-0 flex-col rounded-2xl bg-white p-4 transition-transform hover:-translate-y-0.5 sm:p-5">
      <span className={`grid size-11 place-items-center rounded-full text-white sm:size-12 ${tones[tone]}`}>
        <Svg name={icon} className="size-[22px]" />
      </span>
      <p className="mt-3 truncate text-[13.5px] text-slate-600 sm:text-[14.5px]">{label}</p>
      <p className="mt-0.5 truncate text-[26px] font-extrabold tabular-nums tracking-tight text-slate-900 sm:text-[30px]">{value}</p>
      {note && (
        <p className={`line-clamp-2 text-[12.5px] leading-snug ${up === true ? "text-green-700" : up === false ? "text-red-700" : "text-slate-500"}`}>
          {up === true ? "↑ " : up === false ? "↓ " : ""}
          {note}
        </p>
      )}
    </Link>
  );
}

const quickActions: { href: string; label: string; icon: Icon; editor: boolean }[] = [
  { href: "/admin/news/new", label: "Yangi yangilik", icon: "news", editor: true },
  { href: "/admin/events/new", label: "Yangi tadbir", icon: "calendar", editor: true },
  { href: "/admin/gallery/new", label: "Albom qo‘shish", icon: "photo", editor: true },
  { href: "/admin/tests/new", label: "Test qo‘shish", icon: "test", editor: true },
  { href: "/admin/visits", label: "Statistikani ko‘rish", icon: "chart", editor: false },
  { href: "/admin/activity", label: "Jurnalni ko‘rish", icon: "list", editor: false },
];

function QuickActions({ editor = false }: { editor?: boolean }) {
  return (
    <section className="rounded-2xl bg-white p-5">
      <h2 className="text-[17px] font-bold text-slate-900">Tezkor amallar</h2>
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {quickActions
          .filter((a) => !editor || a.editor)
          .map((a) => (
            <Link key={a.href} href={a.href} className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-3 text-[13.5px] font-medium text-slate-800 ring-1 ring-slate-200 transition-colors hover:ring-blue-400">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#2c5ce0]/15 text-[#2c5ce0] [html.admin-dark_&]:text-[#8fb0ff]">
                <Svg name={a.icon} className="size-[18px]" />
              </span>
              <span className="min-w-0 leading-snug">{a.label}</span>
            </Link>
          ))}
      </div>
    </section>
  );
}

const avatarColors = ["bg-[#3b82f6]", "bg-[#8b5cf6]", "bg-[#22a06b]", "bg-[#e0782b]", "bg-[#0ea5b7]"];
const today = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/** An editor's start page: the banner, what they can add, and the latest news and events. */
async function EditorHome({ supabase, denied }: { supabase: Supabase; denied: boolean }) {
  const [{ data: news }, { data: events }] = await Promise.all([
    supabase.from("news").select("id, title_uz, published_at, is_published").order("created_at", { ascending: false }).limit(6),
    supabase.from("events").select("id, title_uz, starts_at, all_day, is_published").gte("starts_at", new Date().toISOString()).order("starts_at").limit(5),
  ]);
  return (
    <div className="space-y-5">
      <Hero sub={<>Bugun {formatDateFull(new Date().toISOString(), "uz")} · siz muharrirsiz: yangiliklar, tadbirlar, galereya, yutuqlar, testlar va kutubxona.</>} />
      {denied && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Bu bo‘lim faqat admin uchun. Kerak bo‘lsa, maktab adminiga murojaat qiling.</p>}
      <div className="grid gap-5 lg:grid-cols-3">
        <QuickActions editor />
        <Panel title="So‘nggi yangiliklar" href="/admin/news">
          {(news ?? []).map((n) => (
            <Row key={n.id} href={`/admin/news/${n.id}`} title={n.title_uz} meta={n.published_at ? formatDate(n.published_at, "uz") : "Sana yo‘q"} hidden={!n.is_published} />
          ))}
          {!news?.length && <Empty>Hali yangilik yo‘q.</Empty>}
        </Panel>
        <Panel title="Yaqin tadbirlar" href="/admin/events">
          {(events ?? []).map((e) => (
            <Row key={e.id} href={`/admin/events/${e.id}`} title={e.title_uz} meta={e.all_day ? formatDate(e.starts_at, "uz") : formatDateTime(e.starts_at, "uz")} hidden={!e.is_published} />
          ))}
          {!events?.length && <Empty>Yaqin tadbir yo‘q.</Empty>}
        </Panel>
      </div>
    </div>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const { supabase, email, role } = await requireAdmin();
  if (role === "editor") return <EditorHome supabase={supabase} denied={(await searchParams).denied === "1"} />;
  const [{ counts, school, attention, nextEvents, messages, latestNews }, { data: myLogins }, { data: visits }, bot] = await Promise.all([
    load(supabase),
    // This admin's sign-ins: [0] is the current one, [1] the one before it.
    supabase.from("admin_logins").select("at, city, country, device").eq("event", "login").eq("email", email).order("at", { ascending: false }).limit(2),
    supabase.rpc("visit_stats", { p_days: 90 }),
    parentBotStatus(supabase),
  ]);
  const stats = visits as { online: number; daily: Day[] } | null;
  const daily = stats?.daily ?? [];
  const [yesterday, now] = [daily.at(-2), daily.at(-1)];
  const change = yesterday?.visitors ? Math.round(((now?.visitors ?? 0) / yesterday.visitors - 1) * 100) : null;
  const inbox = counts.unread + counts.unreadTrust + counts.newApplications;
  const previous = myLogins?.[1];

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <Hero
          sub={
            <>
              Bugun {formatDateFull(new Date().toISOString(), "uz")}.{" "}
              {stats && (
                <Link href="/admin/visits" className="font-semibold text-[#1c3faf] underline-offset-2 hover:underline">
                  Hozir saytda: {stats.online} kishi
                </Link>
              )}
              {previous && (
                <span className="block text-[12.5px] text-[#6b7699]">
                  Oldingi kirishingiz: {formatDateTime(previous.at, "uz")}
                  {previous.city ? `, ${previous.city}` : ""}
                  {previous.device ? ` · ${previous.device}` : ""}
                </span>
              )}
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            href="/admin/visits"
            icon="people"
            tone="blue"
            label="Bugun saytda"
            value={(now?.visitors ?? 0).toLocaleString("ru-RU")}
            note={change === null ? `${(now?.views ?? 0).toLocaleString("ru-RU")} sahifa ko‘rildi` : `${change > 0 ? "+" : ""}${change}% kechagidan`}
            up={change === null || change === 0 ? null : change > 0}
          />
          <StatCard
            href="/admin/messages"
            icon="mail"
            tone="green"
            label="Yangi murojaatlar"
            value={inbox}
            note={`${counts.unread} xabar · ${counts.unreadTrust} ishonch · ${counts.newApplications} ariza`}
          />
          <StatCard
            href="/admin/news"
            icon="news"
            tone="violet"
            label="Yangiliklar"
            value={counts.news}
            note={counts.newsWeek ? `+${counts.newsWeek} shu hafta` : counts.hiddenNews ? `${counts.hiddenNews} tasi yashirin` : null}
            up={counts.newsWeek ? true : null}
          />
          <StatCard
            href="/admin/events"
            icon="calendar"
            tone="orange"
            label="Yaqin tadbirlar"
            value={counts.upcoming}
            note={counts.nextEventAt ? `Eng yaqini: ${formatDate(counts.nextEventAt, "uz")}` : null}
          />
        </div>

        <VisitsChart days={daily} />

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="min-w-0 rounded-2xl bg-white p-5">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-bold text-slate-900">So‘nggi xabarlar</h2>
              <Link href="/admin/messages" className="text-[13px] font-semibold text-blue-700 underline-offset-2 hover:underline">
                Barchasi
              </Link>
            </div>
            <ul className="mt-3 space-y-1">
              {messages.map((m, i) => (
                <li key={m.id}>
                  <Link href="/admin/messages" className="flex items-center gap-3 rounded-xl px-1.5 py-2 hover:bg-slate-50">
                    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-bold uppercase text-white ${avatarColors[i % avatarColors.length]}`}>
                      {m.name.trim().slice(0, 1) || "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-[14px] text-slate-900">{m.name}</b>
                      <span className="block truncate text-[13px] text-slate-500">{m.message}</span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[12px] tabular-nums text-slate-500">{today(m.created_at) ? formatTime(m.created_at, "uz") : formatDate(m.created_at, "uz")}</span>
                      {!m.is_read && <span className="rounded-full bg-brand px-2 text-[11px] font-bold leading-5 text-white">Yangi</span>}
                    </span>
                  </Link>
                </li>
              ))}
              {!messages.length && <li className="py-2 text-[14px] text-slate-500">Hali xabar kelmagan.</li>}
            </ul>
          </section>
          <QuickActions />
        </div>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-[17px] font-bold text-slate-900">E’tibor talab qiladi</h2>
          {attention.length ? (
            <ul className="mt-3 divide-y divide-slate-200">
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

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title="Yaqin tadbirlar" href="/admin/events">
            {nextEvents.map((e) => (
              <Row key={e.id} href={`/admin/events/${e.id}`} title={e.title_uz} meta={e.all_day ? formatDate(e.starts_at, "uz") : formatDateTime(e.starts_at, "uz")} hidden={!e.is_published} />
            ))}
            {!nextEvents.length && <Empty>Yaqin tadbir yo‘q.</Empty>}
          </Panel>
          <Panel title="So‘nggi yangiliklar" href="/admin/news">
            {latestNews.map((n) => (
              <Row key={n.id} href={`/admin/news/${n.id}`} title={n.title_uz} meta={n.published_at ? formatDate(n.published_at, "uz") : "Sana yo‘q"} hidden={!n.is_published} />
            ))}
            {!latestNews.length && <Empty>Hali yangilik yo‘q.</Empty>}
          </Panel>
        </div>
      </div>

      <aside className="min-w-0 space-y-5">
        <BotStatusCard bot={bot} />
        <BotPreview username={bot.username} />
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-[17px] font-bold text-slate-900">Maktab raqamlarda</h2>
          <ul className="mt-3 space-y-1">
            {school.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="flex items-center gap-3 rounded-xl px-1.5 py-2 hover:bg-slate-50">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                    <Svg name={r.icon} className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] text-slate-700">{r.label}</span>
                    {r.sub && <span className="block truncate text-[12px] text-slate-500">{r.sub}</span>}
                  </span>
                  <b className="text-[16px] tabular-nums text-slate-900">{r.value}</b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function Panel({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white p-5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold text-slate-900">{title}</h2>
        <Link href={href} className="text-[13px] font-semibold text-blue-700 underline-offset-2 hover:underline">
          Barchasi
        </Link>
      </div>
      <ul className="divide-y divide-slate-200">{children}</ul>
    </section>
  );
}

function Row({ href, title, meta, hidden }: { href: string; title: string; meta: string; hidden?: boolean }) {
  return (
    <li>
      <Link href={href} className="group block py-2.5 text-sm">
        <p className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900 group-hover:text-blue-700">{title}</span>
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
