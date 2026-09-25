import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { testSubjects } from "@/lib/tests";
import uz from "@/i18n/dictionaries/uz.json";
import { saveTest } from "./actions";

export type TestRow = Record<string, unknown> & {
  id: number;
  subject: string;
  kind: string;
  grade: number | null;
  time_limit: number | null;
  is_published: boolean;
};

export const subjectLabels = uz.tests.subjects as Record<string, string>;

export default function TestForm({ row }: { row?: TestRow }) {
  return (
    <AdminForm action={saveTest.bind(null, row?.id ?? null)}>
      <FormSection title="Test">
        <TranslatedField name="title" label="Nomi (masalan: Kimyo — 1-variant yoki Kasrlar mavzusi)" row={row} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Fan">
            <select name="subject" required defaultValue={row?.subject ?? ""} className={inputClass}>
              <option value="" disabled>
                — tanlang —
              </option>
              {testSubjects.map((s) => (
                <option key={s} value={s}>
                  {subjectLabels[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Turi">
            <select name="kind" defaultValue={row?.kind ?? "mavzu"} className={inputClass}>
              <option value="mavzu">Fan / mavzu testi</option>
              <option value="dtm">DTM savollari</option>
            </select>
          </Field>
          <Field label="Sinf" hint="Ixtiyoriy">
            <select name="grade" defaultValue={row?.grade ?? ""} className={inputClass}>
              <option value="">— barcha —</option>
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  {g}-sinf
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vaqt (daqiqa)" hint="Bo‘sh — vaqt cheklanmaydi">
            <input type="number" name="time_limit" min={1} max={300} defaultValue={row?.time_limit ?? ""} className={inputClass} />
          </Field>
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          <b>DTM savollari</b> turidagi testlarning savollari saytdagi «DTM sinov imtihoni»ga ham qo‘shiladi: har urinishda shu fanning
          barcha DTM savollaridan tasodifiy tanlanadi (majburiy fanlardan 10 tadan, asosiy fanlardan 30 tadan).
        </p>
        <TranslatedField name="description" label="Qisqacha tavsif (ixtiyoriy)" row={row} uzRequired={false} />
        <Field label="Manba / muallif" hint="Kim tuzgan yoki qayerdan olingan va litsenziyasi. Masalan: «Kimyo o‘qituvchisi A. Karimov» yoki «OpenStax Chemistry 2e, CC BY 4.0 — tarjima». Saytda test ostida ko‘rsatiladi.">
          <input name="source" maxLength={300} defaultValue={(row?.source as string | null) ?? ""} className={inputClass} />
        </Field>
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
          Faqat o‘qituvchilar o‘zi tuzgan yoki ochiq litsenziyali savollarni joylang. Test kitoblari, pullik saytlar, Telegram kanallari va
          «sizib chiqqan DTM savollari»ni ko‘chirmang — mualliflik huquqi buziladi va xato javoblar ko‘p uchraydi. Har savolni ikkinchi
          o‘qituvchi kalitga qaramasdan yechib tekshirsin.
        </p>
      </FormSection>
      <PublishedCheckbox checked={row?.is_published ?? false} label="Saytda ko‘rsatish (savollar tayyor bo‘lgach belgilang)" />
    </AdminForm>
  );
}
