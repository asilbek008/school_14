import AdminForm from "@/components/admin/AdminForm";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { saveEvent } from "./actions";

export type EventRow = {
  id: number;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  description_uz: string;
  description_ru: string | null;
  description_en: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  is_published: boolean;
};

export default function EventForm({ row }: { row?: EventRow }) {
  return (
    <AdminForm action={saveEvent.bind(null, row?.id ?? null)}>
      <TranslatedField name="title" label="Tadbir nomi" row={row} />
      <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Boshlanishi *">
          <input type="datetime-local" name="starts_at" required defaultValue={toTashkentInput(row?.starts_at ?? null)} className={inputClass} />
        </Field>
        <Field label="Tugashi" hint="Ixtiyoriy">
          <input type="datetime-local" name="ends_at" defaultValue={toTashkentInput(row?.ends_at ?? null)} className={inputClass} />
        </Field>
        <Field label="Joy" hint="Masalan: Majlislar zali">
          <input name="location" defaultValue={row?.location ?? ""} className={inputClass} />
        </Field>
      </div>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
