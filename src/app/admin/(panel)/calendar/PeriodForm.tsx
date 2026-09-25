import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { savePeriod } from "./actions";

export type PeriodRow = Record<string, unknown> & {
  id: number;
  kind: string;
  starts_on: string;
  ends_on: string;
  is_published: boolean;
};

export const kindLabels: Record<string, string> = {
  chorak: "Chorak",
  tatil: "Ta’til",
  imtihon: "Imtihonlar",
  boshqa: "Boshqa",
};

/** Suggested names, so the four quarters and holidays are written the same way every year. */
const suggestions = {
  uz: ["1-chorak", "2-chorak", "3-chorak", "4-chorak", "Kuzgi ta’til", "Qishki ta’til", "Bahorgi ta’til", "Yozgi ta’til", "Yakuniy attestatsiya"],
  ru: ["1-я четверть", "2-я четверть", "3-я четверть", "4-я четверть", "Осенние каникулы", "Зимние каникулы", "Весенние каникулы", "Летние каникулы", "Итоговая аттестация"],
  en: ["Term 1", "Term 2", "Term 3", "Term 4", "Autumn holiday", "Winter holiday", "Spring holiday", "Summer holiday", "Final exams"],
};

export default function PeriodForm({ row }: { row?: PeriodRow }) {
  return (
    <AdminForm action={savePeriod.bind(null, row?.id ?? null)}>
      <FormSection title="Davr">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Turi">
            <select name="kind" defaultValue={row?.kind ?? "chorak"} className={inputClass}>
              {Object.entries(kindLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Boshlanishi">
            <input type="date" name="starts_on" required defaultValue={row?.starts_on ?? ""} className={inputClass} />
          </Field>
          <Field label="Tugashi" hint="Bir kunlik bo‘lsa, bo‘sh qoldiring.">
            <input type="date" name="ends_on" defaultValue={row?.ends_on ?? ""} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="title" label="Nomi" row={row} suggestions={suggestions} />
        <TranslatedField name="note" label="Izoh (ixtiyoriy)" row={row} uzRequired={false} />
      </FormSection>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
