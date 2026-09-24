import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import VideoUploader from "@/components/admin/VideoUploader";
import YoutubeForm from "@/components/admin/YoutubeForm";
import VideoList from "@/components/admin/VideoList";
import { mediaBaseUrl } from "@/lib/media";
import ClubForm from "../ClubForm";
import { addClubMedia, addClubYoutube, deleteClub, deleteClubMedia } from "../actions";

export const metadata: Metadata = { title: "To‘garakni tahrirlash" };

export default async function EditClubPage({ params }: PageProps<"/admin/clubs/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: staff }, { data: media }] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", id).maybeSingle(),
    supabase.from("staff").select("id, full_name, position_uz").order("full_name"),
    supabase.from("club_media").select("id, kind, path").eq("club_id", id).order("sort_order").order("id"),
  ]);
  if (!row) notFound();
  const photos = (media ?? []).filter((m) => m.kind === "photo");
  const videos = (media ?? []).filter((m) => m.kind !== "photo");

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/clubs" />
      <ClubForm row={row} staff={staff ?? []} />

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Rasmlar ({photos.length})</h2>
        <p className="mb-3 text-sm text-slate-500">To‘garak sahifasida galereya bo‘lib chiqadi.</p>
        <PhotoUploader folder={`clubs/${id}`} onUploaded={addClubMedia.bind(null, id, "photo")} />
        {photos.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((p) => (
              <li key={p.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={`${mediaBaseUrl}/${p.path}`} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex justify-end px-3 py-2">
                  <DeleteButton action={deleteClubMedia.bind(null, id, p.id)} confirmText="Bu rasmni o‘chirasizmi?" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Videolar ({videos.length})</h2>
        <p className="mb-3 text-sm text-slate-500">Video faylni yuklang yoki YouTube havolasini qo‘shing.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <VideoUploader folder={`clubs/${id}`} onUploaded={addClubMedia.bind(null, id, "video")} />
          <YoutubeForm action={addClubYoutube.bind(null, id)} />
        </div>
        <VideoList videos={videos} remove={(videoId) => deleteClubMedia.bind(null, id, videoId)} />
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteClub.bind(null, id)} confirmText="Bu to‘garakni (rasm va videolari bilan) o‘chirasizmi?" />
      </div>
    </>
  );
}
