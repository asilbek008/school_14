import AdminForm from "@/components/admin/AdminForm";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveAlbum } from "./actions";

export type AlbumRow = Record<string, unknown> & {
  id: number;
  event_date: string | null;
  is_published: boolean;
};

export default function AlbumForm({ row }: { row?: AlbumRow }) {
  return (
    <AdminForm action={saveAlbum.bind(null, row?.id ?? null)} submitLabel={row ? "Saqlash" : "Albomni yaratish va rasm qo‘shish →"}>
      <TranslatedField name="title" label="Albom nomi" row={row} />
      <TranslatedField name="description" label="Tavsif" row={row} multiline uzRequired={false} />
      <Field label="Sana" hint="Ixtiyoriy. Albomlar shu sana bo‘yicha tartiblanadi.">
        <input type="date" name="event_date" defaultValue={row?.event_date ?? ""} className={`${inputClass} max-w-52`} />
      </Field>
      <PublishedCheckbox checked={row?.is_published ?? false} label="Saytda ko‘rsatish (rasmlar qo‘shilgach belgilang)" />
    </AdminForm>
  );
}
