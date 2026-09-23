import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "To‘garaklar" };

export default async function AdminClubsPage() {
  const { supabase } = await requireAdmin();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name_uz, schedule_uz, grade_from, grade_to, is_published")
    .order("sort_order")
    .order("id");

  return (
    <>
      <AdminHeader title="To‘garaklar" action={{ href: "/admin/clubs/new", label: "+ Qo‘shish" }} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {clubs?.length ? (
          <ul className="divide-y divide-slate-100">
            {clubs.map((club) => (
              <li key={club.id}>
                <Link href={`/admin/clubs/${club.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{club.name_uz}</p>
                    <p className="text-sm text-slate-500">
                      {club.grade_from && club.grade_to ? `${club.grade_from}–${club.grade_to}-sinflar` : "Sinflar ko‘rsatilmagan"}
                      {club.schedule_uz && ` · ${club.schedule_uz}`}
                    </p>
                  </div>
                  <Status published={club.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali to‘garak qo‘shilmagan.</p>
        )}
      </div>
    </>
  );
}
