"use client";

import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, inputClass } from "@/components/admin/fields";
import { saveAi } from "./actions";

// Narxlar — 1 million token uchun (kirish / chiqish). Har savol odatda 10–15 ming kirish tokeni:
// maktab ma’lumotlari keshlanadi, shuning uchun takroriy savollar 10 barobar arzon tushadi.
const models = [
  { id: "claude-opus-5", label: "Opus 5 — eng kuchli javoblar ($5 / $25)" },
  { id: "claude-sonnet-5", label: "Sonnet 5 — muvozanatli ($2 / $10)" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 — eng arzon va tez ($1 / $5)" },
];

export default function AiForm({ state }: { state: { enabled: boolean; model: string; has_key: boolean } }) {
  return (
    <AdminForm action={saveAi}>
      <FormSection title="Ulanish" hint="Kalit bazada saqlanadi va brauzerga hech qachon qaytarilmaydi.">
        <Field label="API kalit" hint={state.has_key ? "Kalit kiritilgan. Almashtirish uchun yangisini yozing." : "console.anthropic.com → API keys."}>
          <input name="api_key" type="password" autoComplete="off" placeholder={state.has_key ? "••••••••••••" : "sk-…"} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Model">
            <select name="model" defaultValue={state.model} className={inputClass}>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Holati">
            <label className="flex items-center gap-2 pt-2 text-sm text-slate-700">
              <input type="checkbox" name="enabled" defaultChecked={state.enabled} className="size-4" />
              Saytda yoqilgan bo‘lsin
            </label>
          </Field>
        </div>
      </FormSection>
    </AdminForm>
  );
}
