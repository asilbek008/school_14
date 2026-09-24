import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import { clubSchedule } from "@/lib/clubs";
import AdminHeader from "@/components/admin/AdminHeader";
import SortableList, { type SortableItem } from "@/components/admin/SortableList";
import { reorderClubs } from "./actions";

export const metadata: Metadata = { title: "To‘garaklar" };

const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default async function AdminClubsPage() {
  const { supabase } = await requireAdmin();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name_uz, schedule_uz, days, start_time, end_time, grade_from, grade_to, leader, photo, is_published, staff(full_name), club_media(kind)")
    .order("sort_order")
    .order("id");

  const items: SortableItem[] = (clubs ?? []).map((c) => {
    const schedule = clubSchedule(c, dayNames) || c.schedule_uz;
    // Untyped client: the to-one embed comes typed as a list.
    const leader = (c.staff as unknown as { full_name: string } | null)?.full_name ?? c.leader;
    const photos = c.club_media.filter((m) => m.kind === "photo").length;
    const videos = c.club_media.length - photos;
    return {
      id: c.id,
      name: c.name_uz,
      href: `/admin/clubs/${c.id}`,
      cover: c.photo ? `${mediaBaseUrl}/${c.photo}` : null,
      meta: [
        c.grade_from && c.grade_to ? `${c.grade_from}–${c.grade_to}-sinflar` : "",
        schedule ? `🕒 ${schedule}` : "",
        leader ? `👤 ${leader}` : "",
        [photos && `📷 ${photos}`, videos && `🎬 ${videos}`].filter(Boolean).join(" "),
      ].filter(Boolean),
      warning: !schedule && !leader ? "Vaqti va rahbari kiritilmagan" : null,
      published: c.is_published,
    };
  });

  return (
    <>
      <AdminHeader title="To‘garaklar" action={{ href: "/admin/clubs/new", label: "+ Qo‘shish" }} />
      {items.length ? (
        <SortableList items={items} reorder={reorderClubs} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali to‘garak qo‘shilmagan.</p>
      )}
    </>
  );
}
