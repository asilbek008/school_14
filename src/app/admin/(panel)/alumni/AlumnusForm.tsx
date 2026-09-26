import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveAlumnus } from "./actions";

export type AlumnusRow = Record<string, unknown> & {
  id: number;
  full_name: string;
  graduation_year: number;
  class_label: string | null;
  photo: string | null;
  consent: boolean;
  is_published: boolean;
};

export default function AlumnusForm({ row }: { row?: AlumnusRow }) {
  return (
    <AdminForm action={saveAlumnus.bind(null, row?.id ?? null)}>
      <FormSection title="Bitiruvchi">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Field label="Ism-familiyasi *">
            <input name="full_name" required defaultValue={row?.full_name ?? ""} maxLength={120} className={inputClass} />
          </Field>
          <Field label="Bitirgan yili *" hint="Masalan: 2005">
            <input type="number" name="graduation_year" required min={1976} max={2100} defaultValue={row?.graduation_year ?? ""} className={inputClass} />
          </Field>
          <Field label="Sinfi" hint="Masalan: 11-A">
            <input name="class_label" defaultValue={row?.class_label ?? ""} maxLength={20} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="occupation" label="Kasbi / hozirgi faoliyati (masalan: Shifokor, Termiz shahar kasalxonasi)" row={row} uzRequired={false} />
        <TranslatedField name="story" label="Qisqacha hikoya" row={row} multiline uzRequired={false} />
      </FormSection>

      <FormSection title="Rasm" hint="Ixtiyoriy. Bo‘lmasa, ism bosh harflari chiqadi.">
        <ImageUpload name="photo" folder="alumni" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
      </FormSection>

      <FormSection title="Rozilik" hint="Bitiruvchining ismi, rasmi va hikoyasi faqat uning o‘z roziligi bilan saytga chiqadi.">
        <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" name="consent" defaultChecked={row?.consent ?? false} className="mt-0.5 size-4" />
          Bitiruvchi o‘zi haqidagi ma’lumotni saytda ko‘rsatishga rozilik bergan
        </label>
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
