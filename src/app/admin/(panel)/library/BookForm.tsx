import AdminForm from "@/components/admin/AdminForm";
import BookFileField from "@/components/admin/BookFileField";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveBook } from "./actions";

export type BookRow = Record<string, unknown> & {
  id: number;
  grade: number | null;
  subject_id: number | null;
  language: string;
  author: string | null;
  edition: string | null;
  source: string | null;
  kind: string;
  path: string | null;
  url: string | null;
  file_size: number | null;
  pages: number | null;
  cover: string | null;
  is_published: boolean;
};

export default function BookForm({ row, subjects }: { row?: BookRow; subjects: { id: number; name_uz: string }[] }) {
  return (
    <AdminForm action={saveBook.bind(null, row?.id ?? null)}>
      <FormSection title="Kitob">
        <TranslatedField name="title" label="Nomi (masalan: Algebra 8-sinf)" row={row} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Sinf">
            <select name="grade" defaultValue={row?.grade ?? ""} className={inputClass}>
              <option value="">Umumiy (hamma sinflar)</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g}-sinf
                </option>
              ))}
            </select>
          </Field>
          <Field label="Fan" hint="Ro‘yxat «Fanlar» bo‘limidan">
            <select name="subject_id" defaultValue={row?.subject_id ?? ""} className={inputClass}>
              <option value="">— tanlanmagan —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name_uz}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Kitob tili">
            <select name="language" defaultValue={row?.language ?? "uz"} className={inputClass}>
              <option value="uz">O‘zbekcha</option>
              <option value="ru">Ruscha</option>
              <option value="en">Inglizcha</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Muallif(lar)">
            <input name="author" maxLength={300} defaultValue={row?.author ?? ""} className={inputClass} />
          </Field>
          <Field label="Nashr / yil" hint="Masalan: 2023 yoki 3-nashr">
            <input name="edition" maxLength={60} defaultValue={row?.edition ?? ""} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="description" label="Qisqacha izoh (ixtiyoriy)" row={row} multiline uzRequired={false} />
      </FormSection>

      <FormSection title="PDF fayl va muqova" hint="PDF yuklangach, muqova 1-sahifadan avtomatik chiziladi va sahifalar sanaladi.">
        <BookFileField initial={{ path: row?.path ?? null, size: row?.file_size ?? null, pages: row?.pages ?? null, cover: row?.cover ?? null }} />
        <Field label="Yoki havola" hint="Fayl juda katta bo‘lsa yoki kitob boshqa saytda (masalan, rasmiy elektron darsliklar sayti) turgan bo‘lsa. PDF yuklangan bo‘lsa, havola hisobga olinmaydi.">
          <input name="url" type="url" defaultValue={row?.url ?? ""} placeholder="https://…" className={inputClass} />
        </Field>
      </FormSection>

      <FormSection title="Manba" hint="Kitob qayerdan olingani. Faqat tarqatishga ruxsat berilgan kitoblarni joylang (masalan, vazirlik bepul e’lon qilgan elektron darsliklar).">
        <input name="source" maxLength={300} defaultValue={row?.source ?? ""} placeholder="Masalan: Respublika ta’lim markazi, elektron darslik" className={inputClass} />
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
