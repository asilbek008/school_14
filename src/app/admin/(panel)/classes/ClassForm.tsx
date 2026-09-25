import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, inputClass } from "@/components/admin/fields";
import { saveClass } from "./actions";

export type ClassRow = {
  id: number;
  grade: number;
  letter: string;
  homeroom_teacher_id: number | null;
  students: number | null;
  is_published: boolean;
};

export default function ClassForm({ row, staff }: { row?: ClassRow; staff: { id: number; full_name: string }[] }) {
  return (
    <AdminForm action={saveClass.bind(null, row?.id ?? null)}>
      <FormSection title="Sinf" hint={row ? undefined : "Bitta sinf qo‘shilsa, saqlangach uning dars jadvali ochiladi."}>
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
          <Field label="O‘quvchilar soni" hint="Ixtiyoriy. Hamma sinflarniki kiritilsa, saytdagi umumiy son shundan hisoblanadi.">
            <input type="number" name="students" min={0} max={60} defaultValue={row?.students ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Sinf rahbari" hint="Ro‘yxatda bo‘lmasa, avval «O‘qituvchilar» bo‘limida qo‘shing.">
        <select name="homeroom_teacher_id" aria-label="Sinf rahbari" defaultValue={row?.homeroom_teacher_id ?? ""} className={`${inputClass} md:max-w-md`}>
          <option value="">— Tanlanmagan —</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </select>
      </FormSection>

      <FormSection title="Ko‘rinishi">
        <PublishedCheckbox checked={row?.is_published ?? true} />
      </FormSection>
    </AdminForm>
  );
}
