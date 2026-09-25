import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import { fieldLabels, levelLabels } from "./AchievementForm";

export const metadata: Metadata = { title: "Yutuqlar" };

const medal: Record<number, string> = { 1: "bg-amber-400 text-amber-950", 2: "bg-slate-300 text-slate-900", 3: "bg-orange-400 text-white" };

export default async function AdminAchievementsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("achievements")
    .select("id, title_uz, title_ru, title_en, field, level, place, winner, names, achieved_on, photo, is_published, staff(full_name)")
    .order("achieved_on", { ascending: false })
    .order("id", { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Yutuqlar" action={{ href: "/admin/achievements/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Yutuqlar devori»: olimpiada, sport va tanlov natijalari. G‘olib sifatida sinf yoki jamoani yozing; o‘quvchi ismi faqat
        ota-onasining roziligi belgilanganda saqlanadi.
      </p>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((r) => {
            // Untyped client: the to-one embed comes typed as a list.
            const teacher = (r.staff as unknown as { full_name: string } | null)?.full_name;
            return (
              <li key={r.id}>
                <Link href={`/admin/achievements/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${r.place ? medal[r.place] : "bg-blue-100 text-blue-800"}`}>
                    {r.place ?? "★"}
                  </span>
                  {r.photo && (
                    // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                    <img src={`${mediaBaseUrl}/${r.photo}`} alt="" className="hidden size-10 shrink-0 rounded-lg object-cover sm:block" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">{r.title_uz}</p>
                    <p className="text-sm text-slate-500">
                      {[levelLabels[r.level], fieldLabels[r.field], r.winner, r.names && "👤 ism bor", teacher && `👩‍🏫 ${teacher}`, formatDate(`${r.achieved_on}T12:00:00+05:00`, "uz")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {!r.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
                  {(!r.title_ru || !r.title_en) && <span className="hidden text-xs font-medium text-amber-700 md:inline">Tarjimasi yo‘q</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali yutuq qo‘shilmagan.</p>
      )}
    </>
  );
}
