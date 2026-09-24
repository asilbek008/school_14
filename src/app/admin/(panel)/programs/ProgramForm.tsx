import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveProgram } from "./actions";

export type ProgramRow = Record<string, unknown> & {
  id: number;
  slug: string;
  keyword: string | null;
  cover: string | null;
  is_published: boolean;
};

export default function ProgramForm({ row, relatedNews }: { row?: ProgramRow; relatedNews?: number }) {
  return (
    <AdminForm action={saveProgram.bind(null, row?.id ?? null)}>
      <FormSection title="Asosiy ma’lumot">
        <TranslatedField name="name" label="Nomi (masalan: Zakovat — O‘quvchilar ligasi)" row={row} />
        <TranslatedField name="summary" label="Qisqa izoh (ro‘yxatdagi kartada)" row={row} uzRequired={false} />
        <TranslatedField name="description" label="Batafsil" row={row} multiline uzRequired={false} />
      </FormSection>

      <FormSection title="Vaqti va joyi">
        <TranslatedField name="schedule" label="Vaqti (masalan: Har oy, juma • 11:00)" row={row} uzRequired={false} />
        <TranslatedField name="place" label="Joyi" row={row} uzRequired={false} />
      </FormSection>

      <FormSection
        title="Sahifa va yangiliklar"
        hint="Kalit so‘z kiritilsa, shu so‘z sarlavha yoki matnda uchragan yangiliklar (Telegram’dan kelganlari ham) tadbir sahifasida avtomatik chiqadi va umumiy yangiliklar ro‘yxatida takrorlanmaydi."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Havola nomi *" hint="Sahifa manzili: /programs/zakovat — lotin harflari, raqam va chiziqcha">
            <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={row?.slug ?? ""} className={inputClass} />
          </Field>
          <Field
            label="Kalit so‘z"
            hint={relatedNews === undefined ? "Masalan: Zakovat" : `Hozir shu so‘z bilan ${relatedNews} ta yangilik topildi`}
          >
            <input name="keyword" defaultValue={row?.keyword ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Muqova rasmi"
        hint={
          row
            ? "Ixtiyoriy — bo‘lmasa, oxirgi tegishli yangilik rasmi olinadi."
            : "Ixtiyoriy. Qo‘shimcha rasm va videolarni saqlagandan keyin shu sahifada qo‘shasiz."
        }
      >
        <ImageUpload name="cover" folder="programs" initialPath={row?.cover ?? null} publicBaseUrl={mediaBaseUrl} />
      </FormSection>

      <FormSection title="Ko‘rinishi">
        <PublishedCheckbox checked={row?.is_published ?? true} />
      </FormSection>
    </AdminForm>
  );
}
