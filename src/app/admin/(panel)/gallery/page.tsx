import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "Galereya" };

export default async function AdminGalleryPage() {
  const { supabase } = await requireAdmin();
  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("id, title_uz, event_date, is_published, gallery_photos(count)")
    .order("event_date", { ascending: false, nullsFirst: true })
    .order("id", { ascending: false });

  return (
    <>
      <AdminHeader title="Galereya" action={{ href: "/admin/gallery/new", label: "+ Yangi albom" }} />
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {albums?.length ? (
          <ul className="divide-y divide-slate-100">
            {albums.map((album) => (
              <li key={album.id}>
                <Link href={`/admin/gallery/${album.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{album.title_uz}</p>
                    <p className="text-sm text-slate-500">
                      {album.gallery_photos[0]?.count ?? 0} ta rasm
                      {album.event_date && ` · ${formatDate(album.event_date, "uz")}`}
                    </p>
                  </div>
                  <Status published={album.is_published} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-8 text-center text-slate-500">Hali albom yo‘q.</p>
        )}
      </div>
    </>
  );
}
