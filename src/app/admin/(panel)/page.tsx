import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Bosh sahifa" };

export default async function AdminHome() {
  const { supabase } = await requireAdmin();
  const count = (table: string, filter?: [string, boolean]) => {
    const query = supabase.from(table).select("*", { count: "exact", head: true });
    return (filter ? query.eq(filter[0], filter[1]) : query).then((r) => r.count ?? 0);
  };
  const [news, events, staff, unread] = await Promise.all([
    count("news"),
    count("events"),
    count("staff"),
    count("contact_messages", ["is_read", false]),
  ]);

  const cards = [
    { href: "/admin/messages", label: "Yangi xabarlar", value: unread, highlight: unread > 0 },
    { href: "/admin/news", label: "Yangiliklar", value: news },
    { href: "/admin/events", label: "Tadbirlar", value: events },
    { href: "/admin/staff", label: "O‘qituvchilar", value: staff },
  ];

  return (
    <>
      <h1 className="mb-6 text-2xl font-bold">Xush kelibsiz!</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ href, label, value, highlight }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-xl p-5 shadow-sm hover:shadow-md ${highlight ? "bg-blue-700 text-white" : "bg-white"}`}
          >
            <p className={`text-sm ${highlight ? "text-blue-100" : "text-slate-500"}`}>{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/news/new" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          + Yangilik yozish
        </Link>
        <Link href="/admin/events/new" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 shadow-sm hover:bg-slate-50">
          + Tadbir qo‘shish
        </Link>
      </div>
    </>
  );
}
