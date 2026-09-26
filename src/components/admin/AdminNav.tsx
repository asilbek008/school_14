"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/admin/login/actions";
import { editorMay, type StaffRole } from "@/lib/roles";

type Icon = keyof typeof icons;
type Item = { href: string; label: string; icon: Icon };

// The menu in groups, so 21 sections read as a few short lists.
const groups: { title: string | null; items: Item[] }[] = [
  {
    title: null,
    items: [
      { href: "/admin", label: "Bosh sahifa", icon: "home" },
      { href: "/admin/visits", label: "Tashriflar", icon: "chart" },
    ],
  },
  {
    title: "Kontent",
    items: [
      { href: "/admin/news", label: "Yangiliklar", icon: "news" },
      { href: "/admin/events", label: "Tadbirlar", icon: "calendar" },
      { href: "/admin/programs", label: "Doimiy tadbirlar", icon: "repeat" },
      { href: "/admin/achievements", label: "Yutuqlar", icon: "trophy" },
      { href: "/admin/gallery", label: "Galereya", icon: "photo" },
      { href: "/admin/documents", label: "Hujjatlar", icon: "doc" },
      { href: "/admin/pages", label: "Sahifalar", icon: "page" },
    ],
  },
  {
    title: "Maktab",
    items: [
      { href: "/admin/staff", label: "O‘qituvchilar", icon: "people" },
      { href: "/admin/classes", label: "Dars jadvali", icon: "grid" },
      { href: "/admin/subjects", label: "Fanlar", icon: "book" },
      { href: "/admin/clubs", label: "To‘garaklar", icon: "star" },
      { href: "/admin/tests", label: "Testlar", icon: "test" },
      { href: "/admin/library", label: "Kutubxona", icon: "book" },
      { href: "/admin/calendar", label: "O‘quv taqvimi", icon: "calendar" },
      { href: "/admin/years", label: "O‘quv yillari", icon: "history" },
      { href: "/admin/alumni", label: "Bitiruvchilar", icon: "cap" },
    ],
  },
  {
    title: "Murojaatlar",
    items: [
      { href: "/admin/messages", label: "Xabarlar", icon: "mail" },
      { href: "/admin/trust", label: "Ishonch qutisi", icon: "lock" },
      { href: "/admin/applications", label: "Qabul arizalari", icon: "form" },
    ],
  },
  {
    title: "Tizim",
    items: [
      { href: "/admin/telegram", label: "Telegram", icon: "send" },
      { href: "/admin/push", label: "Bildirishnomalar", icon: "bell" },
      { href: "/admin/parent-bot", label: "Ota-onalar boti", icon: "send" },
      { href: "/admin/activity", label: "Faoliyat jurnali", icon: "list" },
      { href: "/admin/logins", label: "Kirishlar jurnali", icon: "key" },
      { href: "/admin/backups", label: "Zaxira nusxalar", icon: "archive" },
      { href: "/admin/team", label: "Jamoa va ruxsatlar", icon: "people" },
      { href: "/admin/security", label: "Ikki bosqichli kirish", icon: "lock" },
    ],
  },
];
const allItems = groups.flatMap((g) => g.items);

// An editor sees only the sections open to them.
const groupsFor = (role: StaffRole) =>
  role === "admin" ? groups : groups.map((g) => ({ ...g, items: g.items.filter((i) => editorMay(i.href)) })).filter((g) => g.items.length);

// The phone's bottom bar for an editor: content sections.
const editorTabs: Item[] = [
  { href: "/admin", label: "Asosiy", icon: "home" },
  { href: "/admin/news", label: "Yangiliklar", icon: "news" },
  { href: "/admin/events", label: "Tadbirlar", icon: "calendar" },
  { href: "/admin/gallery", label: "Galereya", icon: "photo" },
];

// The phone's bottom bar: the sections used most, plus the full menu.
const tabs: Item[] = [
  { href: "/admin", label: "Asosiy", icon: "home" },
  { href: "/admin/news", label: "Yangiliklar", icon: "news" },
  { href: "/admin/messages", label: "Murojaatlar", icon: "mail" },
  { href: "/admin/visits", label: "Tashriflar", icon: "chart" },
];

const icons = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  news: "M5 4h11a2 2 0 0 1 2 2v13a1 1 0 0 0 2 0V8M5 4a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14M8 8h6M8 12h6M8 16h4",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  repeat: "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3",
  trophy: "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 13v4M8 21h8M10 17h4v4h-4z",
  photo: "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M8.5 9.5h.01",
  doc: "M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h4",
  page: "M4 4h16v16H4zM4 9h16M9 9v11",
  people: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M17 3.5a4 4 0 0 1 0 7.5M22 21a7 7 0 0 0-4-6.3",
  grid: "M4 4h16v16H4zM4 10h16M4 15h16M10 4v16M15 4v16",
  test: "M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8l1.5 1.5L12 7M8 14l1.5 1.5L12 13M14.5 8.5H17M14.5 14.5H17",
  book: "M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 19V5M20 19v2H6",
  star: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
  history: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2",
  mail: "M3 5h18v14H3zM3 7l9 6 9-6",
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4M12 15v2",
  form: "M6 3h12v18H6zM9 7h6M9 11h6M9 15h3",
  send: "M22 2L11 13M22 2l-7 20-4-9-9-4z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  cap: "M2 9l10-5 10 5-10 5zM6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6",
  archive: "M3 4h18v5H3zM5 9v11h14V9M10 13h4",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4",
  key: "M15 7a4 4 0 1 1-3.9 5H3v4h3v-2h2v2h3.1A4 4 0 0 1 15 7zM16 11h.01",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  external: "M14 4h6v6M20 4l-9 9M18 14v6H4V6h6",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
};

function Svg({ name, className = "size-[18px]" }: { name: Icon; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={icons[name]} />
    </svg>
  );
}

const isActive = (pathname: string, href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`));

function Badge({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span className={`grid min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[11px] font-bold leading-5 text-[#241703] ${className}`} aria-label={`${n} ta yangi`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-white text-[15px] font-extrabold text-navy shadow-[inset_0_-3px_0_var(--color-gold)]">14</span>
      <span className="leading-tight">
        <b className="block text-[15px] text-white">14-maktab</b>
        <small className="block text-[11px] font-semibold uppercase tracking-wider text-[#8f9bbd]">Admin panel</small>
      </span>
    </Link>
  );
}

/** The grouped menu — the desktop sidebar and the phone drawer share it. */
function Menu({ pathname, badges, role, onNavigate }: { pathname: string; badges: Record<string, number>; role: StaffRole; onNavigate?: () => void }) {
  return (
    <nav className="space-y-5" aria-label="Admin menyusi">
      {groupsFor(role).map((g) => (
        <div key={g.title ?? "main"}>
          {g.title && <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#6f7ca3]">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);
              const n = badges[item.href] ?? 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors ${
                      active ? "bg-white/12 text-white before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-full before:bg-gold" : "text-[#c2cbe4] hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <Svg name={item.icon} className={`size-[18px] ${active ? "text-gold" : ""}`} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {n > 0 && <Badge n={n} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Account({ email }: { email: string }) {
  return (
    <div className="space-y-1 border-t border-white/10 pt-4">
      <a href="/uz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] text-[#c2cbe4] hover:bg-white/6 hover:text-white">
        <Svg name="external" /> Saytni ko‘rish
      </a>
      <form action={signOut}>
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] text-[#f3a99a] hover:bg-white/6">
          <Svg name="logout" />
          <span className="min-w-0 flex-1">
            Chiqish
            <small className="block truncate text-[11.5px] text-[#8f9bbd]">{email}</small>
          </span>
        </button>
      </form>
    </div>
  );
}

/**
 * The admin panel's frame. Wide screens: a navy sidebar with the grouped menu. Phones: a top bar with
 * the page name and a menu button (a full-height drawer), and a bottom bar with the most-used sections.
 */
export default function AdminNav({
  email,
  badges,
  role,
  children,
}: {
  email: string;
  badges: Record<string, number>;
  role: StaffRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // The drawer remembers the page it was opened on, so moving to another page closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);
  const current = [...allItems].sort((a, b) => b.href.length - a.href.length).find((i) => isActive(pathname, i.href));
  const inbox = (badges["/admin/messages"] ?? 0) + (badges["/admin/trust"] ?? 0) + (badges["/admin/applications"] ?? 0);

  // Esc closes the drawer, and the page behind it does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (tablet and up), fixed while the page scrolls. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy px-3 py-5 md:flex">
        <div className="px-2 pb-6">
          <Brand />
        </div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
          <Menu pathname={pathname} badges={badges} role={role} />
        </div>
        <div className="pt-4">
          <Account email={email} />
        </div>
      </aside>

      {/* Phone: top bar. */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-3 md:hidden">
        <Brand />
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-[#c2cbe4]">{current?.label}</span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Menyuni ochish"
          aria-expanded={open}
          className="relative grid size-10 place-items-center rounded-xl text-white hover:bg-white/10"
        >
          <Svg name="menu" className="size-6" />
          {inbox > 0 && <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-gold ring-2 ring-navy" />}
        </button>
      </header>

      {/* Phone: drawer with the whole menu. */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menyusi">
          <button type="button" aria-label="Yopish" onClick={() => setOpen(false)} className="absolute inset-0 bg-navy/60 backdrop-blur-[2px]" />
          <div className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] animate-[drawer_.22s_ease-out] flex-col bg-navy px-3 pb-5 pt-4 shadow-2xl">
            <div className="flex items-center justify-between px-2 pb-5">
              <Brand />
              <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/10">
                <Svg name="close" className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <Menu pathname={pathname} badges={badges} role={role} onNavigate={() => setOpen(false)} />
            </div>
            <div className="pt-4">
              <Account email={email} />
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Phone: bottom bar. */}
      <nav
        aria-label="Tezkor bo‘limlar"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {(role === "admin" ? tabs : editorTabs).map((t) => {
          const active = t.href === "/admin/messages" ? ["/admin/messages", "/admin/trust", "/admin/applications"].some((h) => isActive(pathname, h)) : isActive(pathname, t.href);
          const n = t.href === "/admin/messages" ? inbox : 0;
          return (
            <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={`relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-brand" : "text-slate-500"}`}>
              <Svg name={t.icon} className="size-[22px]" />
              {t.label}
              {n > 0 && <Badge n={n} className="absolute left-1/2 top-1 ml-2" />}
            </Link>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-slate-500">
          <Svg name="menu" className="size-[22px]" />
          Menyu
        </button>
      </nav>
    </div>
  );
}
