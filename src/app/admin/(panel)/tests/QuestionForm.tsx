import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { saveQuestion } from "./actions";

export type QuestionRow = { id: number; question: string; options: string[]; correct: number; explanation: string | null; image: string | null };

const letters = ["A", "B", "C", "D", "E", "F"];

/** One question: the text (and an optional picture), up to six options with the right one marked, an explanation. */
export default function QuestionForm({ testId, row }: { testId: number; row?: QuestionRow }) {
  return (
    <AdminForm action={saveQuestion.bind(null, testId, row?.id ?? null)}>
      <FormSection title="Savol">
        <Field label="Savol matni">
          <textarea name="question" required rows={4} maxLength={4000} defaultValue={row?.question ?? ""} className={inputClass} />
        </Field>
        <ImageUpload name="image" folder="tests" initialPath={row?.image ?? null} publicBaseUrl={mediaBaseUrl} />
      </FormSection>
      <FormSection title="Javob variantlari" hint="To‘g‘ri variantni chapdagi doiracha bilan belgilang. E va F — kerak bo‘lsa.">
        <div className="space-y-2.5">
          {letters.map((l, i) => (
            <div key={l} className="flex items-center gap-3">
              <input
                type="radio"
                name="correct"
                value={l}
                required
                defaultChecked={row ? row.correct === i : false}
                aria-label={`${l} — to‘g‘ri javob`}
                className="size-5 shrink-0 accent-green-600"
              />
              <span className="w-5 shrink-0 font-bold text-slate-700">{l})</span>
              <input
                name={`option_${l}`}
                defaultValue={row?.options[i] ?? ""}
                required={i < 2}
                maxLength={1000}
                className={`${inputClass} mt-0`}
                placeholder={i < 4 ? "" : "ixtiyoriy"}
              />
            </div>
          ))}
        </div>
      </FormSection>
      <FormSection title="Izoh" hint="Ixtiyoriy: nima uchun shu javob to‘g‘ri. O‘quvchi javob bergandan keyin ko‘radi.">
        <textarea name="explanation" rows={3} maxLength={4000} defaultValue={row?.explanation ?? ""} className={inputClass} />
      </FormSection>
      {!row && (
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" name="next" value="new" defaultChecked className="size-4" />
          Saqlagach, keyingi savolni qo‘shish
        </label>
      )}
    </AdminForm>
  );
}
