import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import { clubSchedule } from "@/lib/clubs";
import AdminHeader from "@/components/admin/AdminHeader";
import ClubList, { type ClubItem } from "./ClubList";

export const metadata: Metadata = { title: "To‘garaklar" };

const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default async function AdminClubsPage() {
  const { supabase } = await requireAdmin();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("id, name_uz, schedule_uz, days, start_time, end_time, grade_from, grade_to, leader, photo, is_published, staff(full_name), club_media(kind)")
    .order("sort_order")
    .order("id");

  const items: ClubItem[] = (clubs ?? []).map((c) => ({
    id: c.id,
    name: c.name_uz,
    grades: c.grade_from && c.grade_to ? `${c.grade_from}–${c.grade_to}-sinflar` : null,
    schedule: clubSchedule(c, dayNames) || c.schedule_uz,
    // Untyped client: the to-one embed comes typed as a list.
    leader: (c.staff as unknown as { full_name: string } | null)?.full_name ?? c.leader,
    cover: c.photo ? `${mediaBaseUrl}/${c.photo}` : null,
    photos: c.club_media.filter((m) => m.kind === "photo").length,
    videos: c.club_media.filter((m) => m.kind !== "photo").length,
    published: c.is_published,
  }));

  return (
    <>
      <AdminHeader title="To‘garaklar" action={{ href: "/admin/clubs/new", label: "+ Qo‘shish" }} />
      {items.length ? (
        <ClubList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali to‘garak qo‘shilmagan.</p>
      )}
    </>
  );
}
