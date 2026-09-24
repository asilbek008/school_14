import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "../login/actions";

const nav = [
  { href: "/admin", label: "Bosh sahifa" },
  { href: "/admin/news", label: "Yangiliklar" },
  { href: "/admin/events", label: "Tadbirlar" },
  { href: "/admin/programs", label: "Doimiy tadbirlar" },
  { href: "/admin/telegram", label: "Telegram" },
  { href: "/admin/staff", label: "O‘qituvchilar" },
  { href: "/admin/classes", label: "Dars jadvali" },
  { href: "/admin/subjects", label: "Fanlar" },
  { href: "/admin/clubs", label: "To‘garaklar" },
  { href: "/admin/gallery", label: "Galereya" },
  { href: "/admin/pages", label: "Sahifalar" },
  { href: "/admin/messages", label: "Xabarlar" },
];

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { email, supabase } = await requireAdmin();
  // New contact messages, shown next to "Xabarlar" in the menu.
  const { count: unread } = await supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false);

  return (
    <div className="min-h-screen md:flex">
      {/* The menu stays in place while the page scrolls: a sticky bar on phones, a full-height column on wider screens. */}
      <aside className="sticky top-0 z-30 border-b border-slate-200 bg-white md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto md:border-r md:border-b-0">
        <div className="flex items-center justify-between px-4 py-3 md:block md:p-4">
          <Link href="/admin" className="font-bold text-blue-800">
            14-maktab admin
          </Link>
          <Link href="/uz" className="text-sm text-slate-500 hover:text-blue-700 md:mt-1 md:block">
            Saytni ko‘rish ↗
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              {label}
              {href === "/admin/messages" && !!unread && (
                <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white" aria-label={`${unread} ta yangi`}>
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="hidden p-4 md:block">
          <p className="truncate text-xs text-slate-500">{email}</p>
          <button className="mt-1 text-sm text-red-700 hover:underline">Chiqish</button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
        <form action={signOut} className="mt-8 md:hidden">
          <button className="text-sm text-red-700 hover:underline">Chiqish ({email})</button>
        </form>
      </main>
    </div>
  );
}
