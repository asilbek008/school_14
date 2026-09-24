import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { currentSchoolYear } from "@/lib/school";
import { yearLabel, yearRange, type SchoolYearRow } from "@/lib/school-years";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "O‘quv yillari" };

export default async function AdminYearsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("school_years").select("*").order("start_year", { ascending: false });
  const years = (data ?? []) as SchoolYearRow[];
  const current = currentSchoolYear().from;
  // How much each year already has on the site (news, events, albums dated in it).
  const counts = await Promise.all(
    years.map(async (y) => {
      const { from, to } = yearRange(y.start_year);
      const head = (table: string, column: string) =>
        supabase.from(table).select("*", { count: "exact", head: true }).gte(column, from).lt(column, to);
      const [news, events, albums] = await Promise.all([
        head("news", "published_at"),
        head("events", "starts_at"),
        head("gallery_albums", "event_date"),
      ]);
      return { news: news.count ?? 0, events: events.count ?? 0, albums: albums.count ?? 0 };
    }),
  );

  return (
    <>
      <AdminHeader title="O‘quv yillari" action={{ href: "/admin/years/new", label: "+ O‘quv yili" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytning yuqorisidagi «o‘quv yili» tugmasi shu yillarni ko‘rsatadi. Yil tanlansa, o‘sha yilning sahifasi ochiladi: raqamlar, yil
        yakuni matni va o‘sha yil sanasidagi yangiliklar, tadbirlar, albomlar (1-sentabrdan 31-avgustgacha). Eski yangilikni o‘tgan yilga
        qo‘shish uchun uni yangiliklar bo‘limida o‘sha sana bilan kiriting.
      </p>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {years.map((y, i) => {
          const c = counts[i];
          const filled = [y.students, y.staff, y.classes, y.graduates].filter((n) => n != null).length;
          return (
            <li key={y.start_year}>
              <Link href={`/admin/years/${y.start_year}`} className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300">
                <p className="flex items-center gap-2 text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                  {yearLabel(y.start_year)}
                  {y.start_year === current && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">Joriy</span>}
                  {!y.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {c.news} ta yangilik · {c.events} ta tadbir · {c.albums} ta albom
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  <span className={`rounded-full px-2.5 py-0.5 ${filled ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    Raqamlar: {filled}/4
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 ${y.summary_uz ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                    Yil yakuni: {y.summary_uz ? "bor" : "yo‘q"}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
