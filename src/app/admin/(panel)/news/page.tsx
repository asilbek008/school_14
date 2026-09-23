import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "Yangiliklar" };

export default async function AdminNewsPage() {
  const { supabase } = await requireAdmin();
  const { data: news } = await supabase
    .from("news")
    .select("id, slug, title_uz, is_published, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminHeader title="Yangiliklar" action={{ href: "/admin/news/new", label: "+ Yangi yangilik" }} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {news?.length ? (
          <ul className="divide-y divide-slate-100">
            {news.map((item) => (
              <li key={item.id}>
                <Link href={`/admin/news/${item.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title_uz}</p>
                    <p className="text-sm text-slate-500">
                      {item.published_at ? formatDate(item.published_at, "uz") : "Sana yo‘q"} · /{item.slug}
                    </p>
                  </div>
                  <Status published={item.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali yangilik yo‘q.</p>
        )}
      </div>
    </>
  );
}

