import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { yearLabel, type SchoolYearRow } from "@/lib/school-years";
import { saveYear } from "./actions";

const numbers = [
  { name: "students", label: "O‘quvchilar" },
  { name: "staff", label: "Xodimlar" },
  { name: "classes", label: "Sinflar" },
  { name: "graduates", label: "Bitiruvchilar" },
] as const;

/** One school year: its numbers and the summary shown on the year's page. */
export default function YearForm({ row, free }: { row: SchoolYearRow | null; free?: number[] }) {
  return (
    <AdminForm action={saveYear.bind(null, row?.start_year ?? null)}>
      {!row && (
        <FormSection title="O‘quv yili">
          <Field label="Qaysi o‘quv yili">
            <select name="start_year" required className={inputClass}>
              {free?.map((y) => (
                <option key={y} value={y}>
                  {yearLabel(y)}
                </option>
              ))}
            </select>
          </Field>
        </FormSection>
      )}
      <FormSection title="Raqamlar" hint="Faqat aniq, tasdiqlangan sonlarni yozing. Bo‘sh qolgani saytda ko‘rsatilmaydi.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map(({ name, label }) => (
            <Field key={name} label={label}>
              <input name={name} inputMode="numeric" pattern="\d*" defaultValue={row?.[name] ?? ""} className={inputClass} />
            </Field>
          ))}
        </div>
      </FormSection>
      <FormSection title="Yil yakuni" hint="O‘sha yilning asosiy voqealari, yutuqlar, olimpiada natijalari va hokazo. Oddiy matn, paragraflarni bo‘sh qator bilan ajrating.">
        <TranslatedField name="summary" label="Matn" row={row} multiline uzRequired={false} />
      </FormSection>
      <FormSection title="Ko‘rinish">
        <PublishedCheckbox checked={row?.is_published ?? true} label="Saytdagi yillar ro‘yxatida ko‘rsatish" />
      </FormSection>
    </AdminForm>
  );
}
