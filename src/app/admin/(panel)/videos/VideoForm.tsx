import { videoCategories } from "@/lib/categories";
import AdminForm from "@/components/admin/AdminForm";
import SchoolYearField from "@/components/admin/SchoolYearField";
import VideoSource from "@/components/admin/VideoSource";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveVideo } from "./actions";

export type VideoRow = Record<string, unknown> & {
  id: number;
  category: string;
  kind: "youtube" | "file";
  path: string;
  cover: string | null;
  recorded_on: string | null;
  school_year: number | null;
  sort_order: number;
  is_published: boolean;
};

export const categoryLabels: Record<string, string> = {
  tadbir: "Tadbir",
  dars: "Ochiq dars",
  togarak: "To‘garak",
  tanishtiruv: "Maktab bilan tanishuv",
  yutuq: "Yutuq",
  boshqa: "Boshqa",
};

export default function VideoForm({ row }: { row?: VideoRow }) {
  return (
    <AdminForm action={saveVideo.bind(null, row?.id ?? null)}>
      <FormSection title="Video" hint="YouTube birinchi tanlov: bepul va telefon aloqasiga qarab sifatini o‘zi moslaydi.">
        <VideoSource initial={{ kind: row?.kind ?? "youtube", path: row?.path ?? "", cover: row?.cover ?? null }} />
      </FormSection>

      <FormSection title="Ma’lumot">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Turkum">
            <select name="category" defaultValue={row?.category ?? "tadbir"} className={inputClass}>
              {videoCategories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sanasi" hint="Video olingan kun (ixtiyoriy).">
            <input type="date" name="recorded_on" defaultValue={row?.recorded_on ?? ""} className={inputClass} />
          </Field>
          <Field label="Tartib raqami">
            <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 0} className={inputClass} />
          </Field>
        </div>
        <SchoolYearField value={row?.school_year ?? null} />
        <TranslatedField name="title" label="Nomi" row={row} />
        <TranslatedField name="description" label="Tavsif (ixtiyoriy)" row={row} multiline uzRequired={false} />
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
