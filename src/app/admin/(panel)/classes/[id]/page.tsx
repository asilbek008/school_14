import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { classLabel } from "@/lib/timetable";
import { shiftForGrade } from "@/lib/bells";
import { normalizeName } from "@/lib/staff-import";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import ClassForm from "../ClassForm";
import TimetableEditor from "../TimetableEditor";
import { deleteClass } from "../actions";

export const metadata: Metadata = { title: "Sinf va dars jadvali" };

export default async function EditClassPage({ params, searchParams }: PageProps<"/admin/classes/[id]">) {
  const { supabase } = await requireAdmin();
  const id = Number((await params).id);
  const { saved } = await searchParams;
  const [{ data: row }, { data: staff }, { data: subjects }, { data: current }, { data: pupils }] = await Promise.all([
    supabase.from("school_classes").select("id, grade, letter, homeroom_teacher_id, students, is_published").eq("id", id).maybeSingle(),
    supabase.from("staff").select("id, full_name, short_name").order("full_name"),
    supabase.from("subjects").select("id, name_uz").order("sort_order").order("name_uz"),
    supabase.from("lessons").select("weekday, period, subject_id, teacher, alt_subject_id, alt_teacher").eq("class_id", id),
    supabase.from("pupils").select("id, full_name, display_name, gender, birth_date").eq("class_id", id).order("full_name"),
  ]);
  if (!row) notFound();

  // Teacher names in this timetable that match no one's eMaktab name, so they are not linked to a profile.
  const teachers = (staff ?? []).flatMap((s) => (s.short_name ? [s.short_name] : [])).sort((a, b) => a.localeCompare(b));
  const known = new Set(teachers.map(normalizeName));
  const unlinked = [
    ...new Set((current ?? []).flatMap((l) => [l.teacher, l.alt_teacher]).filter((t): t is string => !!t && !known.has(normalizeName(t)))),
  ];
  const shift = shiftForGrade(row.grade);
  const homeroom = staff?.find((s) => s.id === row.homeroom_teacher_id)?.full_name;
  const facts = [
    { label: "Smena", value: `${shift.id}-smena · ${shift.start} dan` },
    { label: "Sinf rahbari", value: homeroom ?? "Tanlanmagan", warn: !homeroom },
    { label: "Darslar", value: current?.length ? `${current.length} ta (haftasiga)` : "Jadval hali to‘ldirilmagan", warn: !current?.length },
    ...(unlinked.length
      ? [{ label: "Profilga bog‘lanmagan", value: `${unlinked.join(", ")} — xodimlar ro‘yxatida bunday eMaktab nomi yo‘q`, warn: true }]
      : []),
  ];

  return (
    <>
      <AdminHeader title={`${classLabel(row)} sinf`} back="/admin/classes" />
      <dl className="mb-6 grid gap-x-8 gap-y-2 rounded-xl bg-white p-5 text-sm shadow-sm sm:grid-cols-[auto_1fr]">
        {facts.map((f) => (
          <div key={f.label} className="contents">
            <dt className="font-semibold text-slate-600">{f.label}</dt>
            <dd className={f.warn ? "text-amber-700" : "text-slate-900"}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Haftalik dars jadvali</h2>
          <Link href={`/uz/timetable/${id}`} className="text-sm text-blue-700 hover:underline">
            Saytda ko‘rish ↗
          </Link>
        </div>
        {saved && <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">Jadval saqlandi.</p>}
        {subjects?.length ? (
          <TimetableEditor classId={id} grade={row.grade} subjects={subjects} teachers={teachers} current={current ?? []} />
        ) : (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">
            Avval <Link href="/admin/subjects" className="text-blue-700 hover:underline">Fanlar</Link> bo‘limida fanlarni qo‘shing.
          </p>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">
            O‘quvchilar{pupils?.length ? ` · ${pupils.length}` : ""}
            {!!pupils?.length && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                o‘g‘il {pupils.filter((p) => p.gender === "m").length} · qiz {pupils.filter((p) => p.gender === "f").length}
              </span>
            )}
          </h2>
          <Link href="/admin/classes/pupils" className="text-sm text-blue-700 hover:underline">
            eMaktab&apos;dan yuklash
          </Link>
        </div>
        {pupils?.length ? (
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-3 py-2">№</th>
                  <th className="px-3 py-2">F.I.Sh.</th>
                  <th className="px-3 py-2">Saytda</th>
                  <th className="px-3 py-2">Tug‘ilgan sana</th>
                  <th className="px-3 py-2">Jinsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pupils.map((p, i) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{p.full_name}</td>
                    <td className="px-3 py-2 text-slate-600">{p.display_name}</td>
                    <td className="px-3 py-2 tabular-nums">{p.birth_date?.split("-").reverse().join(".")}</td>
                    <td className="px-3 py-2">{p.gender === "m" ? "O‘g‘il" : p.gender === "f" ? "Qiz" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-xl bg-white p-6 text-sm text-slate-600 shadow-sm">Ro‘yxat hali yuklanmagan.</p>
        )}
      </section>

      <h2 className="mb-3 text-lg font-bold">Sinf ma’lumotlari</h2>
      <ClassForm row={row} staff={staff ?? []} />
      <div className="mt-8 border-t border-slate-200 pt-4 text-right">
        <DeleteButton action={deleteClass.bind(null, id)} confirmText="Sinf va uning dars jadvali o‘chirilsinmi?" />
      </div>
    </>
  );
}
