import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { mediaBaseUrl } from "@/lib/media";
import { normalizeName } from "@/lib/staff-import";
import { positionGroup } from "@/lib/positions";
import AdminHeader from "@/components/admin/AdminHeader";
import StaffList, { type StaffItem } from "./StaffList";
import { allLessons } from "@/lib/all-lessons";

export const metadata: Metadata = { title: "O‘qituvchilar" };

export default async function AdminStaffPage() {
  const { supabase } = await requireAdmin();
  const [{ data: staff }, { data: classes }, lessons] = await Promise.all([
    supabase
      .from("staff")
      .select("id, full_name, short_name, position_uz, subject_uz, photo, phone, email, sort_order, is_published")
      .order("sort_order")
      .order("full_name"),
    supabase.from("school_classes").select("grade, letter, homeroom_teacher_id").not("homeroom_teacher_id", "is", null).order("grade").order("letter"),
    allLessons<{ teacher: string | null; alt_teacher: string | null }>(supabase, "teacher, alt_teacher"),
  ]);

  // Lessons per eMaktab name (how the timetable links to a profile).
  const lessonCount = new Map<string, number>();
  for (const l of lessons) {
    for (const t of [l.teacher, l.alt_teacher]) if (t) lessonCount.set(normalizeName(t), (lessonCount.get(normalizeName(t)) ?? 0) + 1);
  }
  const homerooms = new Map<number, string[]>();
  for (const c of classes ?? []) {
    const id = c.homeroom_teacher_id as number;
    homerooms.set(id, [...(homerooms.get(id) ?? []), `${c.grade}-${c.letter}`]);
  }

  const items: StaffItem[] = (staff ?? []).map((s) => ({
    id: s.id,
    name: s.full_name,
    shortName: s.short_name,
    position: s.position_uz,
    group: positionGroup(s.position_uz),
    subject: s.subject_uz,
    photo: s.photo ? `${mediaBaseUrl}/${s.photo}` : null,
    homeroom: homerooms.get(s.id) ?? [],
    lessons: s.short_name ? (lessonCount.get(normalizeName(s.short_name)) ?? 0) : 0,
    contact: Boolean(s.phone || s.email),
    order: s.sort_order,
    published: s.is_published,
  }));

  return (
    <>
      <AdminHeader title="O‘qituvchilar" action={{ href: "/admin/staff/new", label: "+ Qo‘shish" }} />
      <p className="-mt-3 mb-4 text-right">
        <Link href="/admin/staff/import" className="text-sm font-semibold text-blue-700 hover:underline">
          Excel&apos;dan yuklash →
        </Link>
      </p>
      {items.length ? (
        <StaffList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali hech kim qo‘shilmagan.</p>
      )}
    </>
  );
}
