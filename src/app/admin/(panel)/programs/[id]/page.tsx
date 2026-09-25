import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { cleanKeyword } from "@/lib/content";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import RoundPhotoUploader from "@/components/admin/RoundPhotoUploader";
import PhotoManager from "@/components/admin/PhotoManager";
import VideoUploader from "@/components/admin/VideoUploader";
import YoutubeForm from "@/components/admin/YoutubeForm";
import VideoList from "@/components/admin/VideoList";
import ProgramForm from "../ProgramForm";
import LeagueAdmin, { stageNames } from "../LeagueAdmin";
import type { LeagueStage } from "@/lib/league";
import { addProgramMedia, addProgramYoutube, deleteProgram, deleteProgramMedia, reorderProgramPhotos } from "../actions";

export const metadata: Metadata = { title: "Doimiy tadbirni tahrirlash" };

export default async function EditProgramPage({ params, searchParams }: PageProps<"/admin/programs/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { league, teams } = await searchParams;
  const [{ data: row }, { data: media }, { data: leagueTables }] = await Promise.all([
    supabase.from("programs").select("*").eq("id", id).maybeSingle(),
    supabase.from("program_media").select("id, kind, path, round").eq("program_id", id).order("sort_order").order("id"),
    supabase.from("league_tables").select("stage, title, as_of, rows, updated_at").eq("program_id", id),
  ]);
  if (!row) notFound();
  const photos = (media ?? []).filter((m) => m.kind === "photo");
  // Photos by league round (newest round first), general ones last; rounds offered for upload: played + the next.
  const played = Math.max(0, ...(leagueTables ?? []).map((t) => t.rows[0]?.rounds.length ?? 0), ...photos.map((p) => p.round ?? 0));
  const rounds = Array.from({ length: played + 1 }, (_, i) => i + 1);
  const groups = [...new Set(photos.map((p) => p.round))].sort((a, b) => (b ?? 0) - (a ?? 0));
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
        <p className="mb-3 text-sm text-slate-500">
          Tadbir sahifasidagi «Foto-galereya»da har tur alohida bo‘lim bo‘lib chiqadi. Kalit so‘z uchragan va «2-tur» kabi turni
          aytgan yangiliklarning rasmlari o‘sha turga avtomatik qo‘shiladi — ularni bu yerga qayta yuklash shart emas.
        </p>
        <RoundPhotoUploader
          folder={`programs/${id}`}
          rounds={rounds}
          onUploaded={addProgramMedia.bind(null, id, "photo")}
        />
        {groups.map((round) => {
          const items = photos.filter((p) => p.round === round);
          return (
            <div key={round ?? "general"} className="mt-6">
              <h3 className="font-semibold text-slate-800">
                {round ? `${round}-tur` : "Umumiy"} <span className="font-normal text-slate-500">· {items.length} ta rasm</span>
              </h3>
              <PhotoManager
                items={items.map((p) => ({ id: p.id, path: p.path, url: `${mediaBaseUrl}/${p.path}` }))}
                reorder={reorderProgramPhotos.bind(null, id)}
                remove={deleteProgramMedia.bind(null, id)}
              />
            </div>
          );
        })}
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

      <LeagueAdmin
        programId={id}
        tables={leagueTables ?? []}
        notice={typeof league === "string" && league in stageNames ? `${stageNames[league as LeagueStage]}: ${teams} ta jamoa yuklandi.` : undefined}
      />

      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteProgram.bind(null, id)} confirmText="Bu doimiy tadbirni (rasm va videolari bilan) o‘chirasizmi?" />
      </div>
    </>
  );
}
