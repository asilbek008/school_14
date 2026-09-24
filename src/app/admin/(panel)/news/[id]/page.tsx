import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import PhotoManager from "@/components/admin/PhotoManager";
import VideoUploader from "@/components/admin/VideoUploader";
import YoutubeForm from "@/components/admin/YoutubeForm";
import VideoList from "@/components/admin/VideoList";
import { mediaBaseUrl } from "@/lib/media";
import NewsForm from "../NewsForm";
import { addNewsPhotos, addNewsVideos, addNewsYoutube, deleteNews, deleteNewsPhoto, deleteNewsVideo, reorderNewsPhotos } from "../actions";

export const metadata: Metadata = { title: "Yangilikni tahrirlash" };

export default async function EditNewsPage({ params }: PageProps<"/admin/news/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: photos }, { data: videos }] = await Promise.all([
    supabase.from("news").select("*").eq("id", id).maybeSingle(),
    supabase.from("news_photos").select("id, path").eq("news_id", id).order("sort_order").order("id"),
    supabase.from("news_videos").select("id, kind, path").eq("news_id", id).order("sort_order").order("id"),
  ]);
  if (!row) notFound();

  return (
    <>
      <AdminHeader title="Yangilikni tahrirlash" back="/admin/news" />
      <NewsForm row={row} />

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Rasmlar galereyasi ({photos?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-slate-500">
          Muqovadan tashqari qo‘shimcha rasmlar — yangilik sahifasining pastida galereya bo‘lib chiqadi.
        </p>
        <PhotoUploader folder={`news/${id}`} onUploaded={addNewsPhotos.bind(null, id)} />
        <PhotoManager
          items={(photos ?? []).map((p) => ({ ...p, url: `${mediaBaseUrl}/${p.path}` }))}
          reorder={reorderNewsPhotos.bind(null, id)}
          remove={deleteNewsPhoto.bind(null, id)}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Videolar ({videos?.length ?? 0})</h2>
        <p className="mb-3 text-sm text-slate-500">Video faylni yuklang yoki YouTube havolasini qo‘shing — rasmlardan keyin chiqadi.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <VideoUploader folder={`news/${id}`} onUploaded={addNewsVideos.bind(null, id)} />
          <YoutubeForm action={addNewsYoutube.bind(null, id)} />
        </div>
        <VideoList videos={videos ?? []} remove={(videoId) => deleteNewsVideo.bind(null, id, videoId)} />
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteNews.bind(null, id)} confirmText="Bu yangilikni (rasm va videolari bilan) o‘chirasizmi?" />
      </div>
    </>
  );
}
