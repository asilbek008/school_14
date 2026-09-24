import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { normalizeName } from "@/lib/staff-import";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import StaffForm from "../StaffForm";
import { deleteStaff } from "../actions";
import { allLessons } from "@/lib/all-lessons";

export const metadata: Metadata = { title: "Tahrirlash" };

export default async function EditStaffPage({ params }: PageProps<"/admin/staff/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const [{ data: row }, { data: homerooms }, lessons] = await Promise.all([
    supabase.from("staff").select("*").eq("id", id).maybeSingle(),
    supabase.from("school_classes").select("grade, letter").eq("homeroom_teacher_id", id).order("grade").order("letter"),
    allLessons<{ teacher: string | null; alt_teacher: string | null; school_classes: { grade: number; letter: string } | null }>(
      supabase,
      "teacher, alt_teacher, school_classes(grade, letter)",
    ),
  ]);
  if (!row) notFound();

  // Where the timetable names this person (by the eMaktab name).
  const key = row.short_name ? normalizeName(row.short_name) : null;
  const classes = new Map<string, number>();
  let lessonCount = 0;
  for (const l of key ? lessons : []) {
    if (![l.teacher, l.alt_teacher].some((t) => t && normalizeName(t) === key)) continue;
    lessonCount++;
    const c = l.school_classes;
    if (c) classes.set(`${c.grade}-${c.letter}`, c.grade);
  }
  const classList = [...classes.entries()].sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0])).map(([label]) => label);

  const facts = [
    { label: "Sinf rahbari", value: homerooms?.length ? homerooms.map((c) => `${c.grade}-${c.letter}`).join(", ") : "—" },
    {
      label: "Dars jadvalida",
      value: !row.short_name
        ? "eMaktab nomi kiritilmagan — jadvaldagi ism profilga bog‘lanmaydi"
        : lessonCount
          ? `${lessonCount} ta dars · ${classList.join(", ")}`
          : `«${row.short_name}» nomi bilan dars topilmadi`,
      warn: !row.short_name || !lessonCount,
    },
  ];

  return (
    <>
      <AdminHeader title={row.full_name} back="/admin/staff" />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-xl bg-white p-5 shadow-sm">
        <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
          {facts.map((f) => (
            <div key={f.label} className="contents">
              <dt className="font-semibold text-slate-600">{f.label}</dt>
              <dd className={f.warn ? "text-amber-700" : "text-slate-900"}>{f.value}</dd>
            </div>
          ))}
        </dl>
        {row.is_published && (
          <Link href={`/uz/staff/${id}`} target="_blank" className="text-sm font-semibold text-blue-700 hover:underline">
            Saytda ko‘rish ↗
          </Link>
        )}
      </div>
      <StaffForm row={row} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteStaff.bind(null, id)} confirmText="Ro‘yxatdan o‘chirasizmi?" />
      </div>
    </>
  );
}
