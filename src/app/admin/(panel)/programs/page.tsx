import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { cleanKeyword } from "@/lib/content";
import { mediaBaseUrl } from "@/lib/media";
import AdminHeader from "@/components/admin/AdminHeader";
import SortableList, { type SortableItem } from "@/components/admin/SortableList";
import { reorderPrograms } from "./actions";

export const metadata: Metadata = { title: "Doimiy tadbirlar" };

export default async function AdminProgramsPage() {
  const { supabase } = await requireAdmin();
  const { data: programs } = await supabase
    .from("programs")
    .select("id, slug, name_uz, schedule_uz, keyword, cover, is_published, program_media(kind)")
    .order("sort_order")
    .order("id");

  // How many published news each keyword finds (what the program's page lists).
  const related = await Promise.all(
    (programs ?? []).map(async (p) => {
      const kw = cleanKeyword(p.keyword ?? "");
      if (kw.length < 3) return null;
      const { count } = await supabase
        .from("news")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .or(`title_uz.ilike."*${kw}*",body_uz.ilike."*${kw}*"`);
      return count ?? 0;
    }),
  );

  const items: SortableItem[] = (programs ?? []).map((p, i) => {
    const photos = p.program_media.filter((m) => m.kind === "photo").length;
    const videos = p.program_media.length - photos;
    return {
      id: p.id,
      name: p.name_uz,
      href: `/admin/programs/${p.id}`,
      cover: p.cover ? `${mediaBaseUrl}/${p.cover}` : null,
      meta: [
        `/programs/${p.slug}`,
        p.schedule_uz ? `🕒 ${p.schedule_uz}` : "",
        p.keyword ? `🔑 ${p.keyword} · ${related[i]} ta yangilik` : "",
        [photos && `📷 ${photos}`, videos && `🎬 ${videos}`].filter(Boolean).join(" "),
      ].filter(Boolean),
      warning: p.keyword ? null : "Kalit so‘z yo‘q — yangiliklar bog‘lanmaydi",
      published: p.is_published,
    };
  });

  return (
    <>
      <AdminHeader title="Doimiy tadbirlar" action={{ href: "/admin/programs/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Butun yil davomida muntazam o‘tadigan loyihalar (masalan, Zakovat). Har birining o‘z sahifasi bor; «kalit so‘z» kiritilsa,
        shu so‘z uchragan yangiliklar (Telegram&apos;dan kelganlari ham) o‘sha sahifada avtomatik chiqadi.
      </p>
      {items.length ? (
        <SortableList items={items} reorder={reorderPrograms} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali doimiy tadbir qo‘shilmagan.</p>
      )}
    </>
  );
}
