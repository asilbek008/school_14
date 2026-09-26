import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Bitiruvchilar" };

/** Notable graduates for the site's "Bitiruvchilar" page; how many graduated each year is kept in "O‘quv yillari". */
export default async function AdminAlumniPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("alumni")
    .select("id, full_name, graduation_year, class_label, occupation_uz, photo, consent, is_published")
    .order("graduation_year", { ascending: false })
    .order("sort_order")
    .order("id");
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Bitiruvchilar" action={{ href: "/admin/alumni/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Bitiruvchilar» sahifasi: taniqli bitiruvchilar (faqat o‘z roziligi bilan). Har yili nechta o‘quvchi bitirgani{" "}
        <Link href="/admin/years" className="font-semibold text-blue-700 hover:underline">
          O‘quv yillari
        </Link>{" "}
        bo‘limidagi «Bitiruvchilar» sonidan olinadi. Har yil bitiruvchilari ro‘yxati (yil tugmasi bosilganda ochiladi):{" "}
        <Link href="/admin/alumni/graduates" className="font-semibold text-blue-700 hover:underline">
          Excel&apos;dan yuklash
        </Link>
        .
      </p>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/alumni/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                {r.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                  <img src={`${mediaBaseUrl}/${r.photo}`} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-blue-800">🎓</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{r.full_name}</p>
                  <p className="truncate text-sm text-slate-500">{[`${r.graduation_year}-yil`, r.class_label, r.occupation_uz].filter(Boolean).join(" · ")}</p>
                </div>
                {!r.consent && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Rozilik yo‘q</span>}
                {!r.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali bitiruvchi qo‘shilmagan.</p>
      )}
    </>
  );
}
