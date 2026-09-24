import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { allLessons } from "@/lib/all-lessons";
import { normalizeName } from "@/lib/staff-import";
import { classLabel } from "@/lib/timetable";
import { shiftForGrade } from "@/lib/bells";
import AdminHeader from "@/components/admin/AdminHeader";
import ClassList, { type ClassItem } from "./ClassList";

type ClassListRow = {
  id: number;
  grade: number;
  letter: string;
  is_published: boolean;
  staff: { full_name: string } | null;
};

export const metadata: Metadata = { title: "Sinflar va dars jadvali" };

export default async function AdminClassesPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: staff }, lessons] = await Promise.all([
    supabase.from("school_classes").select("id, grade, letter, is_published, staff(full_name)").order("grade").order("letter"),
    supabase.from("staff").select("short_name").not("short_name", "is", null),
    allLessons<{ class_id: number; teacher: string | null; alt_teacher: string | null }>(supabase, "class_id, teacher, alt_teacher"),
  ]);
  // Without generated DB types supabase-js types the to-one `staff` embed as an array.
  const classes = (data ?? []) as unknown as ClassListRow[];

  // Per class: lessons, and teacher names that do not match anyone's eMaktab name (no profile link).
  const known = new Set((staff ?? []).map((s) => normalizeName(s.short_name!)));
  const stats = new Map<number, { lessons: number; unlinked: Set<string> }>();
  for (const l of lessons) {
    const s = stats.get(l.class_id) ?? { lessons: 0, unlinked: new Set<string>() };
    s.lessons++;
    for (const t of [l.teacher, l.alt_teacher]) if (t && !known.has(normalizeName(t))) s.unlinked.add(t);
    stats.set(l.class_id, s);
  }

  const items: ClassItem[] = classes.map((c) => ({
    id: c.id,
    label: classLabel(c),
    grade: c.grade,
    shift: shiftForGrade(c.grade).id,
    homeroom: c.staff?.full_name ?? null,
    lessons: stats.get(c.id)?.lessons ?? 0,
    unlinked: [...(stats.get(c.id)?.unlinked ?? [])],
    published: c.is_published,
  }));

  return (
    <>
      <AdminHeader title="Sinflar va dars jadvali" action={{ href: "/admin/classes/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 text-sm text-slate-600">
        Sinfni oching — dars jadvali o‘sha yerda to‘ldiriladi. Fanlar ro‘yxati:{" "}
        <Link href="/admin/subjects" className="text-blue-700 hover:underline">Fanlar</Link>.
      </p>
      {items.length ? (
        <ClassList items={items} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali sinf qo‘shilmagan.</p>
      )}
    </>
  );
}
