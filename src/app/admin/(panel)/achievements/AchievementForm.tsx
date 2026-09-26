import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveAchievement } from "./actions";
import SchoolYearField from "@/components/admin/SchoolYearField";

export type AchievementRow = Record<string, unknown> & {
  id: number;
  field: string;
  level: string;
  place: number | null;
  winner: string | null;
  names: string | null;
  names_consent: boolean;
  teacher_id: number | null;
  achieved_on: string;
  school_year: number | null;
  photo: string | null;
  is_published: boolean;
};

export const fieldLabels: Record<string, string> = { olimpiada: "Olimpiada", sport: "Sport", tanlov: "Tanlov", boshqa: "Boshqa" };
export const levelLabels: Record<string, string> = {
  maktab: "Maktab bosqichi",
  tuman: "Tuman bosqichi",
  viloyat: "Viloyat bosqichi",
  respublika: "Respublika bosqichi",
  xalqaro: "Xalqaro",
};

export default function AchievementForm({ row, staff }: { row?: AchievementRow; staff: { id: number; full_name: string }[] }) {
  return (
    <AdminForm action={saveAchievement.bind(null, row?.id ?? null)}>
      <FormSection title="Natija">
        <TranslatedField name="title" label="Nomi (masalan: Matematika fanidan olimpiada)" row={row} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Turi">
            <select name="field" defaultValue={row?.field ?? "olimpiada"} className={inputClass}>
              {Object.entries(fieldLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bosqichi">
            <select name="level" defaultValue={row?.level ?? "tuman"} className={inputClass}>
              {Object.entries(levelLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="O‘rin">
            <select name="place" defaultValue={row?.place ?? ""} className={inputClass}>
              <option value="">O‘rinsiz (sertifikat, faxriy yorliq…)</option>
              <option value="1">1-o‘rin</option>
              <option value="2">2-o‘rin</option>
              <option value="3">3-o‘rin</option>
            </select>
          </Field>
          <Field label="Sana">
            <input type="date" name="achieved_on" required defaultValue={row?.achieved_on ?? ""} className={inputClass} />
          </Field>
        </div>
        <SchoolYearField value={row?.school_year} />
        <TranslatedField name="result" label="Qo‘shimcha (masalan: Faxriy yorliq, 87 ball)" row={row} uzRequired={false} />
      </FormSection>

      <FormSection title="G‘olib" hint="Sinf yoki jamoani yozing. O‘quvchi ismi faqat ota-onasining roziligi bilan saytga chiqadi.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Sinf yoki jamoa" hint="Masalan: 9-A sinf yoki «Bilimdonlar» jamoasi">
            <input name="winner" defaultValue={row?.winner ?? ""} maxLength={200} className={inputClass} />
          </Field>
          <Field label="O‘quvchi(lar) ismi" hint="Ixtiyoriy — faqat rozilik bo‘lsa">
            <input name="names" defaultValue={row?.names ?? ""} maxLength={300} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" name="names_consent" defaultChecked={row?.names_consent ?? false} className="mt-0.5 size-4" />
          Ota-ona(lar) o‘quvchi ismini saytda ko‘rsatishga rozilik bergan
        </label>
        <Field label="Tayyorlagan o‘qituvchi" hint="Saytda uning profiliga havola bo‘ladi.">
          <select name="teacher_id" defaultValue={row?.teacher_id ?? ""} className={`${inputClass} md:max-w-md`}>
            <option value="">— tanlanmagan —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="Rasm" hint="Ixtiyoriy: diplom yoki mukofotlash lahzasi.">
        <ImageUpload name="photo" folder="achievements" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
