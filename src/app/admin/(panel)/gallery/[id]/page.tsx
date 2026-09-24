import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import VideoUploader from "@/components/admin/VideoUploader";
import YoutubeForm from "@/components/admin/YoutubeForm";
import VideoList from "@/components/admin/VideoList";
import PhotoManager from "@/components/admin/PhotoManager";
import AlbumForm from "../AlbumForm";
import { addPhotos, addVideos, addYoutube, deleteAlbum, deletePhoto, deleteVideo, reorderPhotos, setCover } from "../actions";

export const metadata: Metadata = { title: "Albom" };

export default async function EditAlbumPage({ params }: PageProps<"/admin/gallery/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: album }, { data: photos }, { data: videos }] = await Promise.all([
    supabase.from("gallery_albums").select("*").eq("id", id).maybeSingle(),
    supabase.from("gallery_photos").select("id, path").eq("album_id", id).order("sort_order").order("id"),
    supabase.from("gallery_videos").select("id, kind, path").eq("album_id", id).order("sort_order").order("id"),
  ]);
  if (!album) notFound();

  return (
    <>
      <AdminHeader title={album.title_uz} back="/admin/gallery" />

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold">Rasmlar ({photos?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-slate-500">Bir nechta rasmni birdaniga tanlashingiz mumkin. Muqova tanlanmasa, 1-rasm muqova bo‘ladi.</p>
        <PhotoUploader folder={`gallery/${id}`} onUploaded={addPhotos.bind(null, id)} />
        <PhotoManager
          items={(photos ?? []).map((p) => ({ ...p, url: `${mediaBaseUrl}/${p.path}` }))}
          cover={album.cover_photo}
          reorder={reorderPhotos.bind(null, id)}
          setCover={setCover.bind(null, id)}
          remove={deletePhoto.bind(null, id)}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-1 text-lg font-bold">Videolar ({videos?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-slate-500">Video faylni yuklang yoki YouTube havolasini qo‘shing — albom sahifasida rasmlardan keyin chiqadi.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <VideoUploader folder={`gallery/${id}`} onUploaded={addVideos.bind(null, id)} />
          <YoutubeForm action={addYoutube.bind(null, id)} />
        </div>
        <VideoList videos={videos ?? []} remove={(videoId) => deleteVideo.bind(null, id, videoId)} />
      </section>

      <h2 className="mb-3 text-lg font-bold">Albom ma’lumotlari</h2>
      <AlbumForm row={album} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteAlbum.bind(null, id)} confirmText="Albom va undagi barcha rasm va videolar o‘chiriladi. Davom etasizmi?" />
      </div>
    </>
  );
}
