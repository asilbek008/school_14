import AdminForm from "@/components/admin/AdminForm";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { saveEvent } from "./actions";
import { eventCategories, type EventCategory } from "@/lib/categories";

const categoryLabels: Record<EventCategory, string> = { bayram: "Bayram", maktab: "Maktab tadbiri", olimpiada: "Olimpiada", sport: "Sport" };

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
  category: EventCategory;
  all_day: boolean;
};

export default function EventForm({ row }: { row?: EventRow }) {
  return (
    <AdminForm action={saveEvent.bind(null, row?.id ?? null)}>
      <TranslatedField name="title" label="Tadbir nomi" row={row} />
      <div className="flex flex-wrap items-end gap-6">
        <Field label="Turkum">
          <select name="category" defaultValue={row?.category ?? "maktab"} className={`${inputClass} max-w-60`}>
            {eventCategories.map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-slate-800">
          <input type="checkbox" name="all_day" defaultChecked={row?.all_day ?? false} className="size-4" />
          Butun kun (vaqtsiz, masalan bayram)
        </label>
      </div>
      <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Boshlanishi *" hint="“Butun kun” belgilansa, faqat sana olinadi.">
          <input type="datetime-local" name="starts_at" required defaultValue={toTashkentInput(row?.starts_at ?? null)} className={inputClass} />
        </Field>
        <Field label="Tugashi" hint="Ixtiyoriy. “Butun kun” da e’tiborga olinmaydi.">
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
