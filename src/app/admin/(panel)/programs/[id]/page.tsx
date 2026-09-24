import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { cleanKeyword } from "@/lib/content";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import PhotoUploader from "@/components/admin/PhotoUploader";
import PhotoManager from "@/components/admin/PhotoManager";
import VideoUploader from "@/components/admin/VideoUploader";
import YoutubeForm from "@/components/admin/YoutubeForm";
import VideoList from "@/components/admin/VideoList";
import ProgramForm from "../ProgramForm";
import { addProgramMedia, addProgramYoutube, deleteProgram, deleteProgramMedia, reorderProgramPhotos } from "../actions";

export const metadata: Metadata = { title: "Doimiy tadbirni tahrirlash" };

export default async function EditProgramPage({ params }: PageProps<"/admin/programs/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: media }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", id).maybeSingle(),
    supabase.from("program_media").select("id, kind, path").eq("program_id", id).order("sort_order").order("id"),
  ]);
  if (!row) notFound();
  const photos = (media ?? []).filter((m) => m.kind === "photo");
  const videos = (media ?? []).filter((m) => m.kind !== "photo");

  const kw = cleanKeyword(row.keyword ?? "");
  const relatedNews =
    kw.length >= 3
      ? ((
          await supabase
            .from("news")
            .select("id", { count: "exact", head: true })
            .eq("is_published", true)
            .or(`title_uz.ilike."*${kw}*",body_uz.ilike."*${kw}*"`)
        ).count ?? 0)
      : undefined;

  return (
    <>
      <AdminHeader title={row.name_uz} back="/admin/programs" />
      <ProgramForm row={row} relatedNews={relatedNews} />

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Rasmlar ({photos.length})</h2>
        <p className="mb-3 text-sm text-slate-500">Tadbir sahifasida tavsifdan keyin galereya bo‘lib chiqadi.</p>
        <PhotoUploader folder={`programs/${id}`} onUploaded={addProgramMedia.bind(null, id, "photo")} />
        <PhotoManager
          items={photos.map((p) => ({ id: p.id, path: p.path, url: `${mediaBaseUrl}/${p.path}` }))}
          reorder={reorderProgramPhotos.bind(null, id)}
          remove={deleteProgramMedia.bind(null, id)}
        />
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-bold">Videolar ({videos.length})</h2>
        <p className="mb-3 text-sm text-slate-500">Video faylni yuklang yoki YouTube havolasini qo‘shing.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <VideoUploader folder={`programs/${id}`} onUploaded={addProgramMedia.bind(null, id, "video")} />
          <YoutubeForm action={addProgramYoutube.bind(null, id)} />
        </div>
        <VideoList videos={videos} remove={(mediaId) => deleteProgramMedia.bind(null, id, mediaId)} />
      </section>

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteProgram.bind(null, id)} confirmText="Bu doimiy tadbirni (rasm va videolari bilan) o‘chirasizmi?" />
      </div>
    </>
  );
}
