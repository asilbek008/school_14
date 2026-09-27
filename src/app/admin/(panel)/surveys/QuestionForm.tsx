"use client";

import { useState } from "react";
import AdminForm from "@/components/admin/AdminForm";
import { Field, FormSection, TranslatedField, inputClass } from "@/components/admin/fields";
import { saveQuestion } from "./actions";

export type QuestionRow = Record<string, unknown> & {
  id: number;
  kind: string;
  options_uz: string[];
  options_ru: string[];
  options_en: string[];
  required: boolean;
  sort_order: number;
};

export const kindLabels: Record<string, string> = {
  single: "Bitta javob",
  multi: "Bir nechta javob",
  scale: "Baho (1–5)",
  text: "Erkin matn",
};

const area = `${inputClass} min-h-24 font-mono text-[13px]`;

/** One question: its kind decides whether the option lists are needed. */
export default function QuestionForm({ surveyId, row }: { surveyId: number; row?: QuestionRow }) {
  const [kind, setKind] = useState(row?.kind ?? "single");
  const withOptions = kind === "single" || kind === "multi";

  return (
    <AdminForm action={saveQuestion.bind(null, surveyId, row?.id ?? null)}>
      <FormSection title="Savol">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Turi">
            <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
              {Object.entries(kindLabels).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tartib raqami">
            <input type="number" name="sort_order" defaultValue={row?.sort_order ?? 0} className={inputClass} />
          </Field>
          <Field label="Majburiymi">
            <label className="flex items-center gap-2 pt-2 text-sm text-slate-700">
              <input type="checkbox" name="required" defaultChecked={row?.required ?? true} className="size-4" />
              Javob berish shart
            </label>
          </Field>
        </div>
        <TranslatedField name="question" label="Savol matni" row={row} multiline />
      </FormSection>

      {withOptions && (
        <FormSection title="Variantlar" hint="Har bir variant alohida qatorda. Ruscha va inglizcha ro‘yxatdagi qatorlar soni o‘zbekchasi bilan bir xil bo‘lsin.">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-xs font-medium text-slate-500">
              O‘zbekcha
              <textarea name="options_uz" defaultValue={(row?.options_uz ?? []).join("\n")} className={area} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Ruscha
              <textarea name="options_ru" defaultValue={(row?.options_ru ?? []).join("\n")} className={area} />
            </label>
            <label className="block text-xs font-medium text-slate-500">
              Inglizcha
              <textarea name="options_en" defaultValue={(row?.options_en ?? []).join("\n")} className={area} />
            </label>
          </div>
        </FormSection>
      )}
    </AdminForm>
  );
}
