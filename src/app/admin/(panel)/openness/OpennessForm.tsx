import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, PublishedCheckbox, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveOpenness } from "./actions";

export type OpennessRow = Record<string, unknown> & {
  id: number;
  category: string;
  amount: string | number | null;
  period: string | null;
  happened_on: string | null;
  document_id: number | null;
  url: string | null;
  sort_order: number;
  is_published: boolean;
};

export const categoryLabels: Record<string, string> = {
  byudjet: "Byudjet",
  homiylik: "Homiylik yordami",
  xarid: "Xaridlar",
  hisobot: "Hisobotlar",
  boshqa: "Boshqa",
};

export default function OpennessForm({ row, documents }: { row?: OpennessRow; documents: { id: number; title_uz: string }[] }) {
  return (
    <AdminForm action={saveOpenness.bind(null, row?.id ?? null)}>
      <FormSection title="Ma’lumot" hint="Faqat rasmiy hujjat bilan tasdiqlangan raqamlarni kiriting.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Bo‘lim">
            <select name="category" defaultValue={row?.category ?? "byudjet"} className={inputClass}>
              {Object.entries(categoryLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Summa (so‘m)" hint="Hisobot bo‘lsa, bo‘sh qoldiring.">
            <input name="amount" inputMode="numeric" defaultValue={row?.amount != null ? String(row.amount).replace(/\.00$/, "") : ""} className={inputClass} />
          </Field>
          <Field label="Sana" hint="Ixtiyoriy.">
            <input type="date" name="happened_on" defaultValue={row?.happened_on ?? ""} className={inputClass} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Davr" hint="Masalan: 2026-yil 1-chorak.">
            <input name="period" defaultValue={row?.period ?? ""} className={inputClass} />
          </Field>
          <Field label="Tartib raqami">
            <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 0} className={inputClass} />
          </Field>
        </div>
        <TranslatedField name="title" label="Nomi" row={row} />
        <TranslatedField name="note" label="Izoh (ixtiyoriy)" row={row} multiline uzRequired={false} />
      </FormSection>

      <FormSection title="Tasdiqlovchi hujjat" hint="Saytdagi hujjatlardan birini tanlang yoki tashqi havolani yozing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hujjat">
            <select name="document_id" defaultValue={row?.document_id ? String(row.document_id) : ""} className={inputClass}>
              <option value="">— tanlanmagan —</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title_uz}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tashqi havola">
            <input name="url" type="url" placeholder="https://openbudget.uz/..." defaultValue={row?.url ?? ""} className={inputClass} />
          </Field>
        </div>
      </FormSection>

      <PublishedCheckbox checked={row?.is_published ?? true} />
    </AdminForm>
  );
}
