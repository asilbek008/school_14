import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata: Metadata = { title: "Sahifalar" };

export default async function AdminPagesPage() {
  const { supabase } = await requireAdmin();
  const { data: pages } = await supabase.from("pages").select("slug, title_uz, body_uz, updated_at").order("slug");

  return (
    <>
      <AdminHeader title="Sahifalar" />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <ul className="divide-y divide-slate-100">
          {pages?.map((page) => (
            <li key={page.slug}>
              <Link href={`/admin/pages/${page.slug}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                <div>
                  <p className="font-medium">{page.title_uz}</p>
                  <p className="text-sm text-slate-500">/{page.slug}</p>
                </div>
                {!page.body_uz && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Matn yo‘q</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
