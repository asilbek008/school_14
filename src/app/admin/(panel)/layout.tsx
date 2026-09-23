import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { signOut } from "../login/actions";

const nav = [
  { href: "/admin", label: "Bosh sahifa" },
  { href: "/admin/news", label: "Yangiliklar" },
  { href: "/admin/events", label: "Tadbirlar" },
  { href: "/admin/staff", label: "O‘qituvchilar" },
  { href: "/admin/classes", label: "Dars jadvali" },
  { href: "/admin/subjects", label: "Fanlar" },
  { href: "/admin/clubs", label: "To‘garaklar" },
  { href: "/admin/gallery", label: "Galereya" },
  { href: "/admin/pages", label: "Sahifalar" },
  { href: "/admin/messages", label: "Xabarlar" },
];

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { email } = await requireAdmin();

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-slate-200 bg-white md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between p-4 md:block">
          <Link href="/admin" className="font-bold text-blue-800">
            14-maktab admin
          </Link>
          <Link href="/uz" className="text-sm text-slate-500 hover:text-blue-700 md:mt-1 md:block">
            Saytni ko‘rish ↗
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {nav.map(({ href, label }) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
              {label}
            </Link>
          ))}
        </nav>
        <form action={signOut} className="hidden p-4 md:block">
          <p className="truncate text-xs text-slate-500">{email}</p>
          <button className="mt-1 text-sm text-red-700 hover:underline">Chiqish</button>
        </form>
      </aside>
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl">{children}</div>
        <form action={signOut} className="mt-8 md:hidden">
          <button className="text-sm text-red-700 hover:underline">Chiqish ({email})</button>
        </form>
      </main>
    </div>
  );
}
