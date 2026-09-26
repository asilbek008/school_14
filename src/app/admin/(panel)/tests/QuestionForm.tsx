import AdminForm from "@/components/admin/AdminForm";
import ImageUpload from "@/components/admin/ImageUpload";
import { Field, FormSection, inputClass } from "@/components/admin/fields";
import { mediaBaseUrl } from "@/lib/media";
import { difficultyLabels } from "@/lib/tests";
import { saveQuestion } from "./actions";

export type QuestionRow = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string | null;
  image: string | null;
  topic: string | null;
  difficulty: number | null;
};

const letters = ["A", "B", "C", "D", "E", "F"];

/** One question: the text (and an optional picture), up to six options with the right one marked, an explanation. */
/** `topics` — the subject's topics so far, offered as suggestions (the question bank groups by them). */
export default function QuestionForm({ testId, row, topics = [] }: { testId: number; row?: QuestionRow; topics?: string[] }) {
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
      <FormSection title="Savollar bazasi" hint="Ixtiyoriy: mavzu va qiyinlik. Saytda «Fan bo‘yicha mashq»da mavzu tanlash va admin «Savollar bazasi»da shu bo‘yicha guruhlanadi.">
        <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
          <Field label="Mavzu">
            <input name="topic" list="question-topics" maxLength={80} defaultValue={row?.topic ?? ""} placeholder="Masalan: Kasrlar" className={inputClass} />
            <datalist id="question-topics">
              {topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Qiyinlik">
            <select name="difficulty" defaultValue={row?.difficulty ?? ""} className={inputClass}>
              <option value="">Belgilanmagan</option>
              {[1, 2, 3].map((d) => (
                <option key={d} value={d}>
                  {difficultyLabels[d]}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
