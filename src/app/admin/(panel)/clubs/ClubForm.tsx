import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveClub } from "./actions";

export type ClubRow = Record<string, unknown> & {
  id: number;
  grade_from: number | null;
  grade_to: number | null;
  leader: string | null;
  photo: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function ClubForm({ row }: { row?: ClubRow }) {
  return (
    <AdminForm action={saveClub.bind(null, row?.id ?? null)}>
      <TranslatedField name="name" label="To‘garak nomi" row={row} />
      <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
      <TranslatedField name="schedule" label="Vaqti (masalan: Seshanba, Juma • 15:00)" row={row} uzRequired={false} />
      <TranslatedField name="place" label="Joyi" row={row} uzRequired={false} />
      <div className="grid gap-4 md:grid-cols-4">
        <Field label="Sinfdan">
          <input type="number" name="grade_from" min={1} max={11} defaultValue={row?.grade_from ?? ""} className={inputClass} />
        </Field>
        <Field label="Sinfgacha">
          <input type="number" name="grade_to" min={1} max={11} defaultValue={row?.grade_to ?? ""} className={inputClass} />
        </Field>
        <Field label="Rahbar" hint="Ixtiyoriy">
          <input name="leader" defaultValue={row?.leader ?? ""} className={inputClass} />
        </Field>
        <Field label="Tartib raqami">
          <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 100} className={inputClass} />
        </Field>
      </div>
      <Field label="Rasm" hint="Ixtiyoriy">
        <div className="mt-2">
          <ImageUpload name="photo" folder="clubs" initialPath={row?.photo ?? null} publicBaseUrl={mediaBaseUrl} />
        </div>
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
