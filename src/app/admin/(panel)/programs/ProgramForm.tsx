import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveProgram } from "./actions";

export type ProgramRow = Record<string, unknown> & {
  id: number;
  slug: string;
  keyword: string | null;
  cover: string | null;
  sort_order: number;
  is_published: boolean;
};

export default function ProgramForm({ row }: { row?: ProgramRow }) {
  return (
    <AdminForm action={saveProgram.bind(null, row?.id ?? null)}>
      <TranslatedField name="name" label="Nomi (masalan: Zakovat — O‘quvchilar ligasi)" row={row} />
      <TranslatedField name="summary" label="Qisqa izoh (ro‘yxatdagi kartada)" row={row} uzRequired={false} />
      <TranslatedField name="description" label="Batafsil" row={row} multiline uzRequired={false} />
      <TranslatedField name="schedule" label="Vaqti (masalan: Har oy, juma • 11:00)" row={row} uzRequired={false} />
      <TranslatedField name="place" label="Joyi" row={row} uzRequired={false} />
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Havola nomi" hint="Sahifa manzili: /programs/zakovat">
          <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={row?.slug ?? ""} className={inputClass} />
        </Field>
        <Field label="Kalit so‘z" hint="Shu so‘z bor yangiliklar sahifada chiqadi">
          <input name="keyword" defaultValue={row?.keyword ?? ""} className={inputClass} />
        </Field>
        <Field label="Tartib raqami">
          <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 100} className={inputClass} />
        </Field>
      </div>
      <Field label="Rasm" hint="Ixtiyoriy — bo‘lmasa, oxirgi tegishli yangilik rasmi olinadi">
        <div className="mt-2">
          <ImageUpload name="cover" folder="programs" initialPath={row?.cover ?? null} publicBaseUrl={mediaBaseUrl} />
        </div>
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
