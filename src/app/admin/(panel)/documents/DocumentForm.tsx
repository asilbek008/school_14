import AdminForm from "@/components/admin/AdminForm";
import FileUpload from "@/components/admin/FileUpload";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { documentCategories } from "@/lib/categories";
import { saveDocument } from "./actions";

export type DocumentRow = Record<string, unknown> & {
  id: number;
  category: string;
  path: string | null;
  url: string | null;
  file_size: number | null;
  doc_date: string | null;
  is_published: boolean;
};

export const categoryLabels: Record<string, string> = {
  meyoriy: "Me’yoriy hujjatlar",
  buyruq: "Buyruqlar",
  hisobot: "Hisobotlar",
  shakl: "Ariza shakllari",
  boshqa: "Boshqa",
};

export default function DocumentForm({ row }: { row?: DocumentRow }) {
  return (
    <AdminForm action={saveDocument.bind(null, row?.id ?? null)}>
      <FormSection title="Asosiy ma’lumot">
        <TranslatedField name="title" label="Hujjat nomi" row={row} />
        <TranslatedField name="description" label="Qisqacha izoh" row={row} multiline uzRequired={false} />
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-xl">
          <Field label="Bo‘lim">
            <select name="category" defaultValue={row?.category ?? "meyoriy"} className={inputClass}>
              {documentCategories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Hujjat sanasi" hint="Ixtiyoriy — hujjatda ko‘rsatilgan sana.">
            <input type="date" name="doc_date" defaultValue={row?.doc_date ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Fayl yoki havola" hint="Faylni yuklang; hujjat boshqa saytda bo‘lsa (masalan lex.uz), faqat havolasini kiriting.">
        <FileUpload
          name="path"
          sizeName="file_size"
          folder="documents"
          initialPath={row?.path ?? null}
          initialSize={row?.file_size ?? null}
          publicBaseUrl={mediaBaseUrl}
        />
        <Field label="Havola" hint="Fayl yuklangan bo‘lsa, havola saqlanmaydi.">
          <input type="url" name="url" defaultValue={row?.url ?? ""} placeholder="https://lex.uz/…" className={inputClass} />
        </Field>
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
