import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { byGrade, classLabel } from "@/lib/timetable";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

type ClassListRow = {
  id: number;
  grade: number;
  letter: string;
  is_published: boolean;
  staff: { full_name: string } | null;
  lessons: { count: number }[];
};

export const metadata: Metadata = { title: "Sinflar va dars jadvali" };

export default async function AdminClassesPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("school_classes")
    .select("id, grade, letter, is_published, staff(full_name), lessons(count)")
    .order("grade")
    .order("letter");
  // Without generated DB types supabase-js types the to-one `staff` embed as an array.
  const classes = data as unknown as ClassListRow[] | null;

  return (
    <>
      <AdminHeader title="Sinflar va dars jadvali" action={{ href: "/admin/classes/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 text-sm text-slate-600">
        Sinfni oching — dars jadvali o‘sha yerda to‘ldiriladi. Fanlar ro‘yxati:{" "}
        <Link href="/admin/subjects" className="text-blue-700 hover:underline">Fanlar</Link>.
      </p>
      {classes?.length ? (
        <div className="space-y-6">
          {byGrade(classes).map(([grade, list]) => (
            <section key={grade}>
              <h2 className="mb-2 text-sm font-bold text-slate-600">{grade}-sinflar</h2>
              <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
                {list.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/classes/${c.id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-slate-50">
                      <div className="min-w-0">
                        <p className="font-medium">{classLabel(c)}</p>
                        <p className="truncate text-sm text-slate-500">
                          {c.staff?.full_name ?? "Sinf rahbari tanlanmagan"} · {c.lessons[0]?.count ?? 0} ta dars
                        </p>
                      </div>
                      <Status published={c.is_published} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali sinf qo‘shilmagan.</p>
      )}
    </>
  );
}
