import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import AlbumForm from "../AlbumForm";
import { addPhotos, deleteAlbum, deletePhoto, setCover } from "../actions";

export const metadata: Metadata = { title: "Albom" };

export default async function EditAlbumPage({ params }: PageProps<"/admin/gallery/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { data: album } = await supabase.from("gallery_albums").select("*").eq("id", id).maybeSingle();
  if (!album) notFound();
  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, path")
    .eq("album_id", id)
    .order("sort_order")
    .order("id");
  const cover = album.cover_photo ?? photos?.[0]?.path;

  return (
    <>
      <AdminHeader title={album.title_uz} back="/admin/gallery" />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold">Rasmlar ({photos?.length ?? 0})</h2>
        <PhotoUploader albumId={id} onUploaded={addPhotos} />
        {photos && photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo) => (
              <li key={photo.id} className={`overflow-hidden rounded-xl bg-white shadow-sm ${photo.path === cover ? "ring-3 ring-blue-600" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={`${mediaBaseUrl}/${photo.path}`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  {photo.path === cover ? (
                    <span className="font-medium text-blue-700">Muqova</span>
                  ) : (
                    <form action={setCover.bind(null, id, photo.path)}>
                      <button className="text-blue-700 hover:underline">Muqova qilish</button>
                    </form>
                  )}
                  <DeleteButton action={deletePhoto.bind(null, id, photo.id)} confirmText="Bu rasmni o‘chirasizmi?" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h2 className="mb-3 text-lg font-bold">Albom ma’lumotlari</h2>
      <AlbumForm row={album} />
      <div className="mt-4 text-right">
        <DeleteButton action={deleteAlbum.bind(null, id)} confirmText="Albom va undagi barcha rasmlar o‘chiriladi. Davom etasizmi?" />
      </div>
    </>
  );
}
