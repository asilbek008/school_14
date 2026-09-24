import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import Status from "@/components/admin/Status";

export const metadata: Metadata = { title: "Galereya" };

export default async function AdminGalleryPage() {
  const { supabase } = await requireAdmin();
  const { data: albums } = await supabase
    .from("gallery_albums")
    .select("id, title_uz, event_date, cover_photo, is_published, photos:gallery_photos(count), first:gallery_photos(path), videos:gallery_videos(count)")
    .order("event_date", { ascending: false, nullsFirst: true })
    .order("id", { ascending: false })
    .order("sort_order", { referencedTable: "first" })
    .order("id", { referencedTable: "first" })
    .limit(1, { referencedTable: "first" });

  return (
    <>
      <AdminHeader title="Galereya" action={{ href: "/admin/gallery/new", label: "+ Yangi albom" }} />
      {albums?.length ? (
        <>
          <p className="mb-3 text-sm text-slate-500">Saytdagi tartibda: sanasi eng yangi albom birinchi. Sanasiz albomlar shu yerda yuqorida turadi.</p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => {
              const cover = album.cover_photo ?? album.first[0]?.path;
              const photos = album.photos[0]?.count ?? 0;
              const videos = album.videos[0]?.count ?? 0;
              return (
                <li key={album.id}>
                  <Link href={`/admin/gallery/${album.id}`} className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">
                    <div className="relative aspect-[16/9] bg-slate-100">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail
                        <img src={`${mediaBaseUrl}/${cover}`} alt="" loading="lazy" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-4xl text-slate-300" aria-hidden>
                          🖼
                        </span>
                      )}
                      <span className="absolute right-2 top-2">
                        <Status published={album.is_published} />
                      </span>
                    </div>
                    <div className="px-4 py-3">
                      <p className="truncate font-semibold text-slate-900 group-hover:text-blue-700">{album.title_uz}</p>
                      <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-slate-500">
                        <span>{album.event_date ? formatDate(album.event_date, "uz") : "Sanasiz"}</span>
                        <span>📷 {photos}</span>
                        {videos > 0 && <span>🎬 {videos}</span>}
                      </p>
                      {photos === 0 && videos === 0 && <p className="mt-1 text-sm text-amber-700">Hali rasm qo‘shilmagan</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali albom yo‘q.</p>
      )}
    </>
  );
}
