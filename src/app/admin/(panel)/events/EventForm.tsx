import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { saveEvent } from "./actions";
import SchoolYearField from "@/components/admin/SchoolYearField";
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
  school_year: number | null;
};

const dateOf = (iso: string | null | undefined) => toTashkentInput(iso ?? null).slice(0, 10);
const timeOf = (iso: string | null | undefined) => toTashkentInput(iso ?? null).slice(11, 16);

export default function EventForm({ row }: { row?: EventRow }) {
  // An all-day event is stored as 00:00–23:59: show no times for it.
  const allDay = row?.all_day ?? false;
  const endDate = row?.ends_at && dateOf(row.ends_at) !== dateOf(row.starts_at) ? dateOf(row.ends_at) : "";
  return (
    <AdminForm action={saveEvent.bind(null, row?.id ?? null)}>
      <FormSection title="Asosiy ma’lumot">
        <TranslatedField name="title" label="Tadbir nomi" row={row} />
        <Field label="Turkum">
          <select name="category" defaultValue={row?.category ?? "maktab"} className={`${inputClass} max-w-60`}>
            {eventCategories.map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </select>
        </Field>
        <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
      </FormSection>

      {/* Ticking "all day" hides the time fields (CSS only, the form stays server-rendered). */}
      <div className="group/when">
        <FormSection title="Vaqti va joyi" hint="Bayram kabi vaqtsiz tadbirlar uchun “Butun kun”ni belgilang — saytda faqat sana chiqadi.">
          <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 has-checked:border-blue-600 has-checked:bg-blue-50">
            <input type="checkbox" id="all-day" name="all_day" defaultChecked={allDay} className="size-4" />
            Butun kun
          </label>
          <div className="grid gap-4 sm:grid-cols-2 md:max-w-xl">
            <Field label="Sana *">
              <input type="date" name="start_date" required defaultValue={dateOf(row?.starts_at)} className={inputClass} />
            </Field>
            <div className="group-has-[#all-day:checked]/when:hidden">
              <Field label="Boshlanish vaqti *">
                <input type="time" name="start_time" defaultValue={allDay ? "" : timeOf(row?.starts_at)} className={inputClass} />
              </Field>
            </div>
            <div className="group-has-[#all-day:checked]/when:hidden">
              <Field label="Tugash vaqti" hint="Ixtiyoriy">
                <input type="time" name="end_time" defaultValue={allDay || !row?.ends_at ? "" : timeOf(row.ends_at)} className={inputClass} />
              </Field>
            </div>
            <div className="group-has-[#all-day:checked]/when:hidden">
              <Field label="Tugash sanasi" hint="Faqat bir necha kun davom etsa">
                <input type="date" name="end_date" defaultValue={allDay ? "" : endDate} className={inputClass} />
              </Field>
            </div>
          </div>
          <SchoolYearField value={row?.school_year} />
          <Field label="Joy" hint="Masalan: Majlislar zali">
            <input name="location" defaultValue={row?.location ?? ""} className={`${inputClass} md:max-w-xl`} />
          </Field>
        </FormSection>
      </div>

      <FormSection title="Ko‘rinishi">
        <PublishedCheckbox checked={row?.is_published ?? true} />
      </FormSection>
    </AdminForm>
  );
}
