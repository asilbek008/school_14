import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveStaff } from "./actions";
import { staffPositions } from "@/lib/positions";

export type StaffRow = {
  id: number;
  full_name: string;
  short_name: string | null;
  position_uz: string;
  position_ru: string | null;
  position_en: string | null;
  subject_uz: string | null;
  subject_ru: string | null;
  subject_en: string | null;
  photo: string | null;
  category_uz: string | null;
  category_ru: string | null;
  category_en: string | null;
  education_uz: string | null;
  education_ru: string | null;
  education_en: string | null;
  experience_years: number | null;
  phone: string | null;
  email: string | null;
  bio_uz: string | null;
  bio_ru: string | null;
  bio_en: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function StaffForm({ row }: { row?: StaffRow }) {
  return (
    <AdminForm action={saveStaff.bind(null, row?.id ?? null)}>
      <Field label="Ism-familiya *">
        <input name="full_name" required defaultValue={row?.full_name} className={inputClass} />
      </Field>
      <Field label="eMaktab'dagi nomi" hint="Dars jadvalidagidek, masalan «Karimova D.A.». Shu orqali jadvaldagi ism profilga bog‘lanadi.">
        <input name="short_name" maxLength={80} defaultValue={row?.short_name ?? ""} className={`${inputClass} max-w-xs`} />
      </Field>
      <TranslatedField
        name="position"
        label="Lavozim"
        row={row}
        suggestions={{ uz: staffPositions.map((p) => p.uz), ru: staffPositions.map((p) => p.ru), en: staffPositions.map((p) => p.en) }}
      />
      <TranslatedField name="subject" label="Fan" row={row} uzRequired={false} />
      <Field label="Rasm">
        <div className="mt-2">
          <ImageUpload name="photo" folder="staff" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
        </div>
      </Field>
      <h2 className="border-t border-slate-100 pt-6 text-base font-bold text-slate-900">
        Profil sahifasi <span className="font-normal text-slate-500">(hammasi ixtiyoriy — bo‘sh maydonlar saytda ko‘rinmaydi)</span>
      </h2>
      <TranslatedField name="category" label="Toifa (masalan, Oliy toifa)" row={row} uzRequired={false} />
      <TranslatedField name="education" label="Ma’lumoti (masalan, Oliy, TerDU)" row={row} uzRequired={false} />
      <Field label="Ish staji (yil)">
        <input type="number" name="experience_years" min={0} max={70} defaultValue={row?.experience_years ?? ""} className={`${inputClass} max-w-40`} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Telefon" hint="Saytda hammaga ko‘rinadi — faqat xodimning roziligi bilan kiriting.">
          <input type="tel" name="phone" defaultValue={row?.phone ?? ""} className={inputClass} />
        </Field>
        <Field label="Elektron pochta" hint="Saytda hammaga ko‘rinadi — faqat xodimning roziligi bilan kiriting.">
          <input type="email" name="email" defaultValue={row?.email ?? ""} className={inputClass} />
        </Field>
      </div>
      <TranslatedField name="bio" label="Qo‘shimcha ma’lumot (tajriba, yutuqlar)" row={row} multiline uzRequired={false} />
      <Field label="Tartib raqami" hint="Kichik raqam ro‘yxatda yuqoriroq turadi (masalan, direktor = 0).">
        <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 100} className={`${inputClass} max-w-40`} />
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
