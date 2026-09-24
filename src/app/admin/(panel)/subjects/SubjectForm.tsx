import AdminForm from "@/components/admin/AdminForm";
import { FormSection, TranslatedField } from "@/components/admin/fields";
import { saveSubject } from "./actions";

export type SubjectRow = {
  id: number;
  name_uz: string;
  name_ru: string | null;
  name_en: string | null;
};

export default function SubjectForm({ row }: { row?: SubjectRow }) {
  return (
    <AdminForm action={saveSubject.bind(null, row?.id ?? null)}>
      <FormSection
        title="Fan nomi"
        hint="Ruscha va inglizcha nomlar saytning o‘sha tillaridagi dars jadvalida chiqadi; bo‘sh bo‘lsa, o‘zbekchasi ko‘rsatiladi."
      >
        <TranslatedField name="name" label="Nomi" row={row} />
      </FormSection>
    </AdminForm>
  );
}
