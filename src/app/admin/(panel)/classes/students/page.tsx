import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { school } from "@/lib/school";
import { classLabel } from "@/lib/timetable";
import AdminHeader from "@/components/admin/AdminHeader";
import StudentsForm from "./StudentsForm";
import { saveStudents } from "../actions";

export const metadata: Metadata = { title: "O‘quvchilar soni" };

export default async function StudentsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("school_classes").select("id, grade, letter, students").order("grade").order("letter");
  const classes = (data ?? []).map((c) => ({ id: c.id, label: classLabel(c), grade: c.grade, students: c.students }));

  return (
    <>
      <AdminHeader title="Sinflar bo‘yicha o‘quvchilar soni" back="/admin/classes" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Har bir sinfdagi o‘quvchilar sonini yozing. Hamma sinflarniki kiritilgach, saytdagi «o‘quvchilar» soni shu yig‘indidan
        hisoblanadi; ungacha tasdiqlangan umumiy son ({school.stats.students}) ko‘rsatiladi. Bo‘sh qoldirilgan sinf — «kiritilmagan».
      </p>
      {classes.length ? (
        <StudentsForm classes={classes} action={saveStudents} confirmed={school.stats.students} />
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali sinf qo‘shilmagan.</p>
      )}
    </>
  );
}
