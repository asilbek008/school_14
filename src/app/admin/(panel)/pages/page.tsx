import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { pageInfo, translationStatus } from "./info";

export const metadata: Metadata = { title: "Sahifalar" };

export default async function AdminPagesPage() {
  const { supabase } = await requireAdmin();
  const { data: pages } = await supabase.from("pages").select("*").order("slug");

  return (
    <>
      <AdminHeader title="Sahifalar" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi doimiy sahifalarning matni. Tilda matn bo‘sh bo‘lsa, saytning o‘sha tilida o‘zbekchasi ko‘rsatiladi.
      </p>
      <ul className="grid gap-4 md:grid-cols-2">
        {pages?.map((page) => {
          const info = pageInfo[page.slug];
          const status = translationStatus(page);
          return (
            <li key={page.slug}>
              <Link
                href={`/admin/pages/${page.slug}`}
                className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
              >
                <p className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">{page.title_uz}</p>
                <p className="text-sm text-slate-500">/{page.slug}</p>
                {info && <p className="mt-2 text-sm text-slate-600">{info.where}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {status.map((s) => (
                    <span
                      key={s.code}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.body ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}
                    >
                      {s.label}: {s.body ? "matn bor" : "matn yo‘q"}
                    </span>
                  ))}
                </div>
                <p className="mt-auto pt-4 text-xs text-slate-400">Oxirgi tahrir: {formatDateTime(page.updated_at, "uz")}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
