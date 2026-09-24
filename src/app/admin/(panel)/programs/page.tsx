import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "Doimiy tadbirlar" };

export default async function AdminProgramsPage() {
  const { supabase } = await requireAdmin();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, slug, name_uz, schedule_uz, keyword, is_published")
    .order("sort_order")
    .order("id");

  return (
    <>
      <AdminHeader title="Doimiy tadbirlar" action={{ href: "/admin/programs/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Butun yil davomida muntazam o‘tadigan loyihalar (masalan, Zakovat). Har birining o‘z sahifasi bor; «kalit so‘z» kiritilsa,
        shu so‘z uchragan yangiliklar (Telegram&apos;dan kelganlari ham) o‘sha sahifada avtomatik chiqadi.
      </p>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {programs?.length ? (
          <ul className="divide-y divide-slate-100">
            {programs.map((program) => (
              <li key={program.id}>
                <Link href={`/admin/programs/${program.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{program.name_uz}</p>
                    <p className="text-sm text-slate-500">
                      /programs/{program.slug}
                      {program.keyword && ` · kalit so‘z: ${program.keyword}`}
                      {program.schedule_uz && ` · ${program.schedule_uz}`}
                    </p>
                  </div>
                  <Status published={program.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali doimiy tadbir qo‘shilmagan.</p>
        )}
      </div>
    </>
  );
}
