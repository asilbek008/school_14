import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "O‘qituvchilar" };

export default async function AdminStaffPage() {
  const { supabase } = await requireAdmin();
  const { data: staff } = await supabase
    .from("staff")
    .select("id, full_name, position_uz, subject_uz, sort_order, is_published")
    .order("sort_order")
    .order("full_name");

  return (
    <>
      <AdminHeader title="O‘qituvchilar" action={{ href: "/admin/staff/new", label: "+ Qo‘shish" }} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {staff?.length ? (
          <ul className="divide-y divide-slate-100">
            {staff.map((person) => (
              <li key={person.id}>
                <Link href={`/admin/staff/${person.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{person.full_name}</p>
                    <p className="text-sm text-slate-500">
                      {person.position_uz}
                      {person.subject_uz && ` · ${person.subject_uz}`} · #{person.sort_order}
                    </p>
                  </div>
                  <Status published={person.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali hech kim qo‘shilmagan.</p>
        )}
      </div>
    </>
  );
}
