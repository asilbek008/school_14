import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveStaff } from "./actions";

export type StaffRow = {
  id: number;
  full_name: string;
  position_uz: string;
  position_ru: string | null;
  position_en: string | null;
  subject_uz: string | null;
  subject_ru: string | null;
  subject_en: string | null;
  photo: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function StaffForm({ row }: { row?: StaffRow }) {
  return (
    <AdminForm action={saveStaff.bind(null, row?.id ?? null)}>
      <Field label="Ism-familiya *">
        <input name="full_name" required defaultValue={row?.full_name} className={inputClass} />
      </Field>
      <TranslatedField name="position" label="Lavozim" row={row} />
      <TranslatedField name="subject" label="Fan" row={row} uzRequired={false} />
      <Field label="Rasm">
        <div className="mt-2">
          <ImageUpload name="photo" folder="staff" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
        </div>
      </Field>
      <Field label="Tartib raqami" hint="Kichik raqam ro‘yxatda yuqoriroq turadi (masalan, direktor = 0).">
        <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 100} className={`${inputClass} max-w-40`} />
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
