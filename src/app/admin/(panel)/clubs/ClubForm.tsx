import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { CLUB_DAYS, hhmm } from "@/lib/clubs";
import { saveClub } from "./actions";

export type ClubRow = Record<string, unknown> & {
  id: number;
  grade_from: number | null;
  grade_to: number | null;
  leader: string | null;
  leader_id: number | null;
  days: number[] | null;
  start_time: string | null;
  end_time: string | null;
  photo: string | null;
  is_published: boolean;
};

export type StaffOption = { id: number; full_name: string; position_uz: string };

const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export default function ClubForm({ row, staff }: { row?: ClubRow; staff: StaffOption[] }) {
  const days = new Set(row?.days ?? []);
  return (
    <AdminForm action={saveClub.bind(null, row?.id ?? null)}>
      <FormSection title="Asosiy ma’lumot">
        <TranslatedField name="name" label="To‘garak nomi" row={row} />
        <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-md">
          <Field label="Sinfdan">
            <input type="number" name="grade_from" min={1} max={11} defaultValue={row?.grade_from ?? ""} className={inputClass} />
          </Field>
          <Field label="Sinfgacha">
            <input type="number" name="grade_to" min={1} max={11} defaultValue={row?.grade_to ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Vaqti va joyi" hint="Mashg‘ulot kunlarini belgilang va vaqtini tanlang.">
        <fieldset>
          <legend className="text-sm font-semibold text-slate-800">Kunlari</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CLUB_DAYS.map((d) => (
              <label key={d} className="cursor-pointer">
                <input type="checkbox" name="days" value={d} defaultChecked={days.has(d)} className="peer sr-only" />
                <span className="block rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition peer-checked:border-blue-700 peer-checked:bg-blue-700 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 hover:border-blue-400">
                  {dayNames[d - 1]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-2 md:max-w-md">
          <Field label="Boshlanishi">
            <input type="time" name="start_time" defaultValue={hhmm(row?.start_time ?? null) ?? ""} className={inputClass} />
          </Field>
          <Field label="Tugashi" hint="Ixtiyoriy">
            <input type="time" name="end_time" defaultValue={hhmm(row?.end_time ?? null) ?? ""} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="schedule" label="Vaqt bo‘yicha izoh (masalan: darsdan keyin)" row={row} uzRequired={false} />
        <TranslatedField name="place" label="Joyi" row={row} uzRequired={false} />
      </FormSection>

      <FormSection title="Rahbar" hint="Xodimlar ro‘yxatidan tanlang — saytda uning profiliga havola bo‘ladi.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Xodimlar ro‘yxatidan">
            <select name="leader_id" defaultValue={row?.leader_id ?? ""} className={inputClass}>
              <option value="">— Tanlanmagan —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} · {s.position_uz}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Yoki ismini yozing" hint="Faqat rahbar ro‘yxatda bo‘lmasa (masalan, tashqaridan kelgan murabbiy).">
            <input name="leader" defaultValue={row?.leader ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Muqova rasmi" hint="Ixtiyoriy. Qo‘shimcha rasm va videolarni saqlagandan keyin shu sahifada qo‘shasiz.">
        <ImageUpload name="photo" folder="clubs" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
      </FormSection>

      <FormSection title="Ko‘rinishi">
        <PublishedCheckbox checked={row?.is_published ?? true} />
      </FormSection>
    </AdminForm>
  );
}
