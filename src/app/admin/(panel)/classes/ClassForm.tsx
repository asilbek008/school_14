import AdminForm from "@/components/admin/AdminForm";
import { Field, PublishedCheckbox, inputClass } from "@/components/admin/fields";
import { saveClass } from "./actions";

export type ClassRow = {
  id: number;
  grade: number;
  letter: string;
  homeroom_teacher_id: number | null;
  is_published: boolean;
};

export default function ClassForm({ row, staff }: { row?: ClassRow; staff: { id: number; full_name: string }[] }) {
  return (
    <AdminForm action={saveClass.bind(null, row?.id ?? null)}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sinf *">
          <select name="grade" required defaultValue={row?.grade ?? ""} className={inputClass}>
            <option value="" disabled>
              Tanlang
            </option>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g}-sinf
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={row ? "Harf *" : "Harf(lar) *"}
          hint={row ? "Masalan: A" : "Bir nechta sinfni birdan qo‘shish mumkin: A, B, D, E"}
        >
          <input name="letter" required defaultValue={row?.letter} className={inputClass} />
        </Field>
      </div>
      <Field label="Sinf rahbari" hint="Ro‘yxatda bo‘lmasa, avval «O‘qituvchilar» bo‘limida qo‘shing.">
        <select name="homeroom_teacher_id" defaultValue={row?.homeroom_teacher_id ?? ""} className={inputClass}>
          <option value="">— Tanlanmagan —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
