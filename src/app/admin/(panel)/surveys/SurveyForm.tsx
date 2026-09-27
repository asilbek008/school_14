import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { saveSurvey } from "./actions";

export type SurveyRow = Record<string, unknown> & {
  id: number;
  audience: string;
  closes_at: string | null;
  is_published: boolean;
};

export const audienceLabels: Record<string, string> = {
  hamma: "Hamma uchun",
  "ota-ona": "Ota-onalar uchun",
  oquvchi: "O‘quvchilar uchun",
  oqituvchi: "O‘qituvchilar uchun",
};

export default function SurveyForm({ row }: { row?: SurveyRow }) {
  return (
    <AdminForm action={saveSurvey.bind(null, row?.id ?? null)}>
      <FormSection title="So‘rovnoma">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kim uchun">
            <select name="audience" defaultValue={row?.audience ?? "hamma"} className={inputClass}>
              {Object.entries(audienceLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Qachongacha ochiq" hint="Bo‘sh qoldirsangiz, o‘zingiz yopguningizcha ochiq turadi.">
            <input type="datetime-local" name="closes_at" defaultValue={row?.closes_at ? toTashkentInput(row.closes_at) : ""} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="title" label="Nomi" row={row} />
        <TranslatedField name="description" label="Izoh (ixtiyoriy)" row={row} multiline uzRequired={false} />
      </FormSection>
      <PublishedCheckbox checked={row?.is_published ?? false} />
    </AdminForm>
  );
}
