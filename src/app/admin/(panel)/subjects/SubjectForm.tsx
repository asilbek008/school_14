import AdminForm from "@/components/admin/AdminForm";
import { Field, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveSubject } from "./actions";

export type SubjectRow = {
  id: number;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
  sort_order: number;
};

export default function SubjectForm({ row }: { row?: SubjectRow }) {
  return (
    <AdminForm action={saveSubject.bind(null, row?.id ?? null)}>
      <TranslatedField name="name" label="Fan nomi" row={row} />
      <Field label="Tartib raqami" hint="Jadval tahririda fanlar ro‘yxati shu tartibda chiqadi.">
        <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 100} className={`${inputClass} max-w-40`} />
      </Field>
    </AdminForm>
  );
}
