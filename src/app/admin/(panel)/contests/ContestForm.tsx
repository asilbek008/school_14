import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { toTashkentInput } from "@/lib/format";
import { fieldLabels, levelLabels } from "../achievements/AchievementForm";
import { saveContest } from "./actions";

export type ContestRow = Record<string, unknown> & {
  id: number;
  field: string;
  level: string;
  grade_from: number | null;
  grade_to: number | null;
  place: string | null;
  starts_at: string | null;
  all_day: boolean;
  registration_until: string | null;
  contact: string | null;
  organizer: string | null;
  source_url: string | null;
  external: boolean;
  sort_order: number;
  is_published: boolean;
};

const grades = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function ContestForm({ row }: { row?: ContestRow }) {
  return (
    <AdminForm action={saveContest.bind(null, row?.id ?? null)}>
      <FormSection title="Tanlov">
        <TranslatedField name="title" label="Nomi (masalan: Matematika fanidan maktab olimpiadasi)" row={row} />
        <TranslatedField name="description" label="Tavsifi — shartlari, nimalarga tayyorlanish kerak" row={row} multiline />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Turi">
            {/* The same words as the achievements wall, so a contest and its result are filed alike. */}
            <select name="field" defaultValue={row?.field ?? "olimpiada"} className={inputClass}>
              {Object.entries(fieldLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Bosqichi">
            <select name="level" defaultValue={row?.level ?? "maktab"} className={inputClass}>
              {Object.entries(levelLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Kimlar uchun va qachon">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sinfdan" hint="Bo‘sh qoldirsangiz — barcha sinflar">
            <select name="grade_from" defaultValue={row?.grade_from ?? ""} className={inputClass}>
              <option value="">—</option>
              {grades.map((n) => (
                <option key={n} value={n}>
                  {n}-sinf
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sinfgacha">
            <select name="grade_to" defaultValue={row?.grade_to ?? ""} className={inputClass}>
              <option value="">—</option>
              {grades.map((n) => (
                <option key={n} value={n}>
                  {n}-sinf
                </option>
              ))}
            </select>
          </Field>
          <Field label="Boshlanish vaqti" hint="Toshkent vaqti. Vaqti e’lon qilinmagan bo‘lsa, pastdagi katakni belgilang.">
            <input type="datetime-local" name="starts_at" defaultValue={toTashkentInput(row?.starts_at ?? null)} className={inputClass} />
          </Field>
          <Field label="Ro‘yxat qachon yopiladi" hint="Shu vaqtdan keyin saytdagi forma yo‘qoladi. Bo‘sh — yopilmaydi.">
            <input type="datetime-local" name="registration_until" defaultValue={toTashkentInput(row?.registration_until ?? null)} className={inputClass} />
          </Field>
          <Field label="Joyi" hint="Masalan: maktab akt zali">
            <input name="place" defaultValue={row?.place ?? ""} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Aloqa" hint="Bo‘sh qoldirsangiz maktab telefoni ko‘rsatiladi">
            <input name="contact" defaultValue={row?.contact ?? ""} maxLength={300} className={inputClass} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="all_day" defaultChecked={row?.all_day ?? false} />
          Faqat sana ma’lum, vaqti e’lon qilinmagan
        </label>
      </FormSection>

      <FormSection title="Manba">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tashkilotchi" hint="Masalan: RoboContest yoki Xalq ta’limi boshqarmasi. Maktab tanlovida bo‘sh qoldiring.">
            <input name="organizer" defaultValue={row?.organizer ?? ""} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Rasmiy e’lon havolasi" hint="Sanalarni shu sahifadan olganmiz — o‘quvchi ham tekshira oladi">
            <input type="url" name="source_url" defaultValue={row?.source_url ?? ""} maxLength={500} placeholder="https://" className={inputClass} />
          </Field>
        </div>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" name="external" defaultChecked={row?.external ?? false} className="mt-1" />
          <span>
            <b>Ro‘yxatdan o‘tish tashkilotchi saytida</b>
            <span className="block text-[13px] text-slate-500">
              Belgilansa, saytimizdagi ariza formasi o‘rniga rasmiy e’longa tugma chiqadi. Havola majburiy bo‘ladi.
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection title="Ko‘rinishi">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tartib raqami" hint="Kichik raqam yuqorida turadi">
            <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 0} className={inputClass} />
          </Field>
        </div>
        <PublishedCheckbox checked={row?.is_published ?? false} />
      </FormSection>
    </AdminForm>
  );
}
