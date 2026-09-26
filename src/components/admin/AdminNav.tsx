"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/app/admin/login/actions";
import { editorMay, type StaffRole } from "@/lib/roles";
import Crest from "./Crest";

export type Icon = keyof typeof icons;
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
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-4.3-4.3",
  collapse: "M11 17l-5-5 5-5M18 17l-5-5 5-5",
  expand: "M13 17l5-5-5-5M6 17l5-5-5-5",
  chevron: "M6 9l6 6 6-6",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z",
  plus: "M12 5v14M5 12h14",
  bot: "M12 3v3M6 8h12a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM9 13h.01M15 13h.01M9 16h6",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
};

export function Svg({ name, className = "size-[18px]" }: { name: Icon; className?: string }) {
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

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-3" title="14-maktab — Admin panel">
      <Crest className="size-11" />
      {!compact && (
        <span className="min-w-0 leading-tight">
          <b className="block truncate text-[17px] tracking-tight text-white">14-maktab</b>
          <small className="block text-[12.5px] text-[#9aa7cc]">Admin panel</small>
        </span>
      )}
    </Link>
  );
}

/** The grouped menu — the desktop sidebar and the phone drawer share it. Collapsed: icons only. */
function Menu({
  pathname,
  badges,
  role,
  compact = false,
  onNavigate,
}: {
  pathname: string;
  badges: Record<string, number>;
  role: StaffRole;
  compact?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-5" aria-label="Admin menyusi">
      {groupsFor(role).map((g) => (
        <div key={g.title ?? "main"}>
          {g.title &&
            (compact ? (
              <hr className="mx-3 mb-2 border-white/8" />
            ) : (
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-[#6f7ca3]">{g.title}</p>
            ))}
          <ul className="space-y-1">
            {g.items.map((item) => {
              const active = isActive(pathname, item.href);
              const n = badges[item.href] ?? 0;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    title={compact ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-xl py-2.5 text-[14px] font-medium transition-colors ${compact ? "justify-center px-0" : "px-3.5"} ${
                      active
                        ? "bg-gradient-to-r from-[#2c5ce0] to-[#3a6cf0] text-white shadow-[0_8px_20px_-10px_rgb(44_92_224/0.9)]"
                        : "text-[#c2cbe4] hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    <Svg name={item.icon} className="size-[19px]" />
                    <span className={compact ? "sr-only" : "flex-1 truncate"}>{item.label}</span>
                    {n > 0 && (compact ? <span className="absolute right-2.5 top-2 size-2 rounded-full bg-gold" /> : <Badge n={n} />)}
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

/** The sidebar's foot: the motto and the public site. */
function SidebarFoot({ compact }: { compact: boolean }) {
  return (
    <div className="border-t border-white/8 pt-4">
      <a
        href="/uz"
        target="_blank"
        rel="noopener noreferrer"
        title="Saytni ko‘rish"
        className={`flex items-center gap-3 rounded-xl py-2.5 text-[14px] text-[#c2cbe4] hover:bg-white/6 hover:text-white ${compact ? "justify-center" : "px-3.5"}`}
      >
        <Svg name="external" />
        {!compact && "Saytni ko‘rish"}
      </a>
      {!compact && (
        <p className="mt-3 flex items-center gap-2.5 px-3.5 text-[13px] text-[#8f9bbd]">
          <Svg name="cap" className="size-5 text-[#6f84c9]" />
          Bilim — kelajak kaliti
        </p>
      )}
    </div>
  );
}

// The sidebar's collapsed state, kept in this browser.
const collapsedKey = "adminSidebar";
const subscribeCollapsed = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("admin-sidebar", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("admin-sidebar", cb);
  };
};
const readCollapsed = () => {
  try {
    return localStorage.getItem(collapsedKey) === "1";
  } catch {
    return false;
  }
};
function setCollapsed(value: boolean) {
  try {
    localStorage.setItem(collapsedKey, value ? "1" : "0");
  } catch {}
  window.dispatchEvent(new Event("admin-sidebar"));
}

/** Closes a popup on a click outside it or on Esc. */
function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, close]);
}

// Quick commands the search also finds.
const commands: Item[] = [
  { href: "/admin/news/new", label: "Yangi yangilik qo‘shish", icon: "plus" },
  { href: "/admin/events/new", label: "Yangi tadbir qo‘shish", icon: "plus" },
  { href: "/admin/gallery/new", label: "Yangi albom", icon: "plus" },
  { href: "/admin/tests/new", label: "Yangi test", icon: "plus" },
  { href: "/admin/staff/new", label: "Yangi xodim", icon: "plus" },
];
const fold = (s: string) => s.toLowerCase().replace(/[‘’ʻ'`]/g, "");

/** "Bo‘lim yoki buyruq qidirish": the menu and quick commands, filtered as you type; Enter opens the first. */
function Search({ role }: { role: StaffRole }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useDismiss(box, open, () => setOpen(false));
  const pool = [...groupsFor(role).flatMap((g) => g.items), ...commands.filter((c) => role === "admin" || editorMay(c.href))];
  const words = fold(q).split(/\s+/).filter(Boolean);
  const results = words.length ? pool.filter((i) => words.every((w) => fold(i.label).includes(w))).slice(0, 8) : [];

  // "/" or Ctrl+K focuses the search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "/" && !typing) || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setQ("");
    setOpen(false);
    (document.activeElement as HTMLElement | null)?.blur();
    router.push(href);
  };

  return (
    <div ref={box} className="relative w-full max-w-md">
      <label className="flex items-center gap-2.5 rounded-xl border border-[var(--bar-edge)] bg-[var(--bar-field)] px-3.5 py-2.5 text-slate-500 focus-within:border-brand">
        <Svg name="search" className="size-[18px]" />
        <span className="sr-only">Qidirish</span>
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPick(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setPick((p) => Math.min(p + 1, results.length - 1));
            else if (e.key === "ArrowUp") setPick((p) => Math.max(p - 1, 0));
            else if (e.key === "Enter" && results[pick]) go(results[pick].href);
            else return;
            e.preventDefault();
          }}
          placeholder="Bo‘lim yoki buyruq qidirish…"
          className="w-full min-w-0 bg-transparent text-[14px] text-slate-900 placeholder:text-slate-500 focus:outline-none"
          style={{ background: "transparent" }}
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="admin-search-results"
        />
        <kbd className="hidden rounded-md border border-[var(--bar-edge)] px-1.5 text-[11px] text-slate-500 lg:block">/</kbd>
      </label>
      {open && q.trim() && (
        <ul id="admin-search-results" role="listbox" className="admin-pop absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-xl p-1.5">
          {results.length ? (
            results.map((r, i) => (
              <li key={r.href} role="option" aria-selected={i === pick}>
                <button
                  type="button"
                  onMouseEnter={() => setPick(i)}
                  onClick={() => go(r.href)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] ${i === pick ? "bg-brand text-white" : "text-slate-700"}`}
                >
                  <Svg name={r.icon} />
                  {r.label}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-[14px] text-slate-500">Hech narsa topilmadi</li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Sun/moon: switches the admin panel between the dark (default) and the light theme, remembered in a cookie. */
function ThemeToggle({ initialLight }: { initialLight: boolean }) {
  const [light, setLight] = useState(initialLight);
  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle("admin-dark", !next);
    document.cookie = `admin_theme=${next ? "light" : "dark"}; path=/admin; max-age=31536000; samesite=lax`;
  };
  return (
    <button
      type="button"
      onClick={toggle}
      title={light ? "Tungi rejim" : "Kunduzgi rejim"}
      aria-label={light ? "Tungi rejimga o‘tish" : "Kunduzgi rejimga o‘tish"}
      className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-[var(--bar-field)] hover:text-slate-900"
    >
      <Svg name={light ? "moon" : "sun"} className="size-[20px]" />
    </button>
  );
}

/** The bell: new messages, trust-box notes and applications, each a link. */
function Bell({ badges }: { badges: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, () => setOpen(false));
  const rows = [
    { href: "/admin/messages", label: "Yangi xabarlar", icon: "mail" as Icon },
    { href: "/admin/trust", label: "Ishonch qutisi", icon: "lock" as Icon },
    { href: "/admin/applications", label: "Qabul arizalari", icon: "form" as Icon },
  ].map((r) => ({ ...r, n: badges[r.href] ?? 0 }));
  const total = rows.reduce((a, r) => a + r.n, 0);
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={total ? `Bildirishnomalar: ${total} ta yangi` : "Bildirishnomalar"}
        className="relative grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-[var(--bar-field)] hover:text-slate-900"
      >
        <Svg name="bell" className="size-[21px]" />
        {total > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-[#ef4444] px-1 text-[10.5px] font-bold leading-[18px] text-white ring-2 ring-[var(--bar-ring)]">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </button>
      {open && (
        <div className="admin-pop absolute right-0 top-full z-40 mt-2 w-72 rounded-xl p-2">
          <p className="px-2.5 pb-1.5 pt-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">Murojaatlar</p>
          {rows.map((r) => (
            <Link key={r.href} href={r.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-slate-700 hover:bg-[var(--bar-field)]">
              <Svg name={r.icon} className="size-[18px] text-slate-500" />
              <span className="flex-1">{r.label}</span>
              {r.n > 0 ? <Badge n={r.n} /> : <span className="text-[12px] text-slate-400">0</span>}
            </Link>
          ))}
          {!total && <p className="px-2.5 pb-1 pt-2 text-[13px] text-slate-500">Yangi murojaat yo‘q ✓</p>}
        </div>
      )}
    </div>
  );
}

/** The signed-in account: avatar, email and role; the menu has the account's settings and sign-out. */
function UserMenu({ email, role }: { email: string; role: StaffRole }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(box, open, () => setOpen(false));
  const roleLabel = role === "admin" ? "Administrator" : "Muharrir";
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-3 rounded-xl py-1.5 pl-1.5 pr-2.5 hover:bg-[var(--bar-field)]">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#4f7dff] to-[#2c5ce0] text-[15px] font-bold uppercase text-white">
          {email.slice(0, 1)}
        </span>
        <span className="hidden text-left leading-tight lg:block">
          <b className="block max-w-44 truncate text-[14px] text-slate-900">{email.split("@")[0]}</b>
          <small className="block text-[12px] text-slate-500">{roleLabel}</small>
        </span>
        <Svg name="chevron" className="size-4 text-slate-500" />
      </button>
      {open && (
        <div className="admin-pop absolute right-0 top-full z-40 mt-2 w-64 rounded-xl p-2">
          <p className="truncate px-2.5 pb-2 pt-1 text-[13px] text-slate-500">{email}</p>
          <Link href="/admin/security" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-slate-700 hover:bg-[var(--bar-field)]">
            <Svg name="shield" className="size-[18px] text-slate-500" /> Ikki bosqichli kirish
          </Link>
          {role === "admin" && (
            <Link href="/admin/team" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-slate-700 hover:bg-[var(--bar-field)]">
              <Svg name="people" className="size-[18px] text-slate-500" /> Jamoa va ruxsatlar
            </Link>
          )}
          <a href="/uz" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] text-slate-700 hover:bg-[var(--bar-field)]">
            <Svg name="external" className="size-[18px] text-slate-500" /> Saytni ko‘rish
          </a>
          <form action={signOut} className="mt-1 border-t border-[var(--bar-edge)] pt-1">
            <button className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[14px] text-[#f06b5b] hover:bg-[var(--bar-field)]">
              <Svg name="logout" className="size-[18px]" /> Chiqish
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * The admin panel's frame. Wide screens: a navy sidebar with the grouped menu (collapsible to icons) and a top bar
 * with search, theme, the bell and the account. Phones: a top bar with the page name and a menu button (a
 * full-height drawer), and a bottom bar with the most-used sections.
 */
export default function AdminNav({
  email,
  badges,
  role,
  light,
  children,
}: {
  email: string;
  badges: Record<string, number>;
  role: StaffRole;
  light: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const compact = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
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
      <aside
        className={`admin-sidebar sticky top-0 hidden h-screen shrink-0 flex-col px-3 py-5 transition-[width] duration-200 md:flex ${compact ? "w-[78px]" : "w-[268px]"}`}
      >
        <div className={`flex items-center pb-6 ${compact ? "justify-center" : "justify-between gap-2 px-1.5"}`}>
          <Brand compact={compact} />
        </div>
        <div className="-mx-1 flex-1 overflow-y-auto px-1 [scrollbar-width:thin]">
          <Menu pathname={pathname} badges={badges} role={role} compact={compact} />
        </div>
        <div className="pt-4">
          <SidebarFoot compact={compact} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (tablet and up). */}
        <header className="admin-topbar sticky top-0 z-30 hidden items-center gap-3 px-5 py-3 md:flex lg:px-8">
          <button
            type="button"
            onClick={() => setCollapsed(!compact)}
            title={compact ? "Menyuni kengaytirish" : "Menyuni yig‘ish"}
            aria-label={compact ? "Menyuni kengaytirish" : "Menyuni yig‘ish"}
            className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-[var(--bar-field)] hover:text-slate-900"
          >
            <Svg name={compact ? "expand" : "collapse"} className="size-[18px]" />
          </button>
          <Search role={role} />
          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle initialLight={light} />
            {role === "admin" && <Bell badges={badges} />}
            <span className="mx-1.5 h-8 w-px bg-[var(--bar-edge)]" />
            <UserMenu email={email} role={role} />
          </div>
        </header>

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
            <div className="admin-sidebar absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] animate-[drawer_.22s_ease-out] flex-col px-3 pb-5 pt-4 shadow-2xl">
              <div className="flex items-center justify-between px-2 pb-5">
                <Brand />
                <button type="button" onClick={() => setOpen(false)} aria-label="Yopish" className="grid size-10 place-items-center rounded-xl text-white hover:bg-white/10">
                  <Svg name="close" className="size-6" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <Menu pathname={pathname} badges={badges} role={role} onNavigate={() => setOpen(false)} />
              </div>
              <div className="space-y-1 border-t border-white/10 pt-3">
                <ThemeRow initialLight={light} />
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
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 pb-28 pt-5 sm:px-6 md:px-8 md:pb-10 md:pt-7">
          <div className={`mx-auto ${pathname === "/admin" ? "max-w-[1400px]" : "max-w-5xl"}`}>{children}</div>
        </main>
      </div>

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

/** The theme switch as a row of the phone drawer. */
function ThemeRow({ initialLight }: { initialLight: boolean }) {
  const [light, setLight] = useState(initialLight);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !light;
        setLight(next);
        document.documentElement.classList.toggle("admin-dark", !next);
        document.cookie = `admin_theme=${next ? "light" : "dark"}; path=/admin; max-age=31536000; samesite=lax`;
      }}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[14px] text-[#c2cbe4] hover:bg-white/6 hover:text-white"
    >
      <Svg name={light ? "moon" : "sun"} /> {light ? "Tungi rejim" : "Kunduzgi rejim"}
    </button>
  );
}
