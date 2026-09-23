import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { toTashkentInput } from "@/lib/format";
import { saveNews } from "./actions";
import { newsCategories, type NewsCategory } from "@/lib/categories";

const categoryLabels: Record<NewsCategory, string> = { yangilik: "Yangilik", elon: "E’lon", tadbir: "Tadbir", yutuq: "Yutuq" };

export type NewsRow = {
  id: number;
  slug: string;
  title_uz: string;
  title_ru: string | null;
  title_en: string | null;
  body_uz: string;
  body_ru: string | null;
  body_en: string | null;
  cover_image: string | null;
  is_published: boolean;
  published_at: string | null;
  category: NewsCategory;
};

export default function NewsForm({ row }: { row?: NewsRow }) {
  return (
    <AdminForm action={saveNews.bind(null, row?.id ?? null)}>
      <TranslatedField name="title" label="Sarlavha" row={row} />
      <Field label="Turkum">
        <select name="category" defaultValue={row?.category ?? "yangilik"} className={`${inputClass} max-w-60`}>
          {newsCategories.map((c) => (
            <option key={c} value={c}>{categoryLabels[c]}</option>
          ))}
        </select>
      </Field>
      <TranslatedField name="body" label="Matn" row={row} multiline uzRequired={false} />
      <Field label="Muqova rasmi">
        <div className="mt-2">
          <ImageUpload name="cover_image" folder="news" initialPath={row?.cover_image ?? null} publicBaseUrl={mediaBaseUrl} />
        </div>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Manzil (slug)" hint="Bo‘sh qoldirilsa, sarlavhadan avtomatik yaratiladi. Masalan: yangi-oquv-yili">
          <input name="slug" defaultValue={row?.slug} pattern="[a-z0-9\-]*" className={inputClass} />
        </Field>
        <Field label="Sana" hint="Bo‘sh qoldirilsa, e’lon qilingan vaqt qo‘yiladi.">
          <input type="datetime-local" name="published_at" defaultValue={toTashkentInput(row?.published_at ?? null)} className={inputClass} />
        </Field>
      </div>
      <PublishedCheckbox checked={row?.is_published ?? false} label="E’lon qilish (saytda ko‘rsatish)" />
    </AdminForm>
  );
}
