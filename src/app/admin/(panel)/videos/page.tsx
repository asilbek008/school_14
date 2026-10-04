import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { mediaBaseUrl, youtubeThumb } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import { categoryLabels } from "./VideoForm";

export const metadata: Metadata = { title: "Video" };

export default async function AdminVideosPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("videos")
    .select("id, title_uz, category, kind, path, cover, recorded_on, is_published")
    .order("sort_order")
    .order("recorded_on", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Video" action={{ href: "/admin/videos/new", label: "+ Video qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «Video» bo‘limi: tadbirlar, ochiq darslar va to‘garaklardan lavhalar. Videoni YouTube’ga joylab havolasini qo‘yish eng
        qulay yo‘l — u bepul va telefon aloqasiga qarab sifatini o‘zi moslaydi. Fayl yuklash ham mumkin, lekin 50 MB gacha.
      </p>
      {rows.length ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const poster = r.kind === "youtube" ? youtubeThumb(r.path) : r.cover ? `${mediaBaseUrl}/${r.cover}` : null;
            return (
              <li key={r.id} className="overflow-hidden rounded-xl bg-white shadow-sm">
                <Link href={`/admin/videos/${r.id}`} className="block hover:opacity-90">
                  <div className="aspect-video w-full bg-slate-900">
                    {poster && (
                      // eslint-disable-next-line @next/next/no-img-element -- YouTube's thumbnail host
                      <img src={poster} alt="" loading="lazy" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">{categoryLabels[r.category] ?? r.category}</span>
                      <span className="text-slate-500">{r.kind === "youtube" ? "YouTube" : "Video fayl"}</span>
                      {!r.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Yashirin</span>}
                    </div>
                    <p className="font-medium text-slate-900">{r.title_uz}</p>
                    {r.recorded_on && <p className="text-xs text-slate-500">{formatDate(r.recorded_on, "uz")}</p>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali video qo‘shilmagan.</p>
      )}
    </>
  );
}
