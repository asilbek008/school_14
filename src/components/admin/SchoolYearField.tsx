import { currentSchoolYear } from "@/lib/school";
import { yearChoices, yearLabel } from "@/lib/school-years";
import { Field, inputClass } from "./fields";

/**
 * "O‘quv yili" in the news, event and achievement forms (owner's request): which school year the item belongs to on
 * the site (year pages, the year filter). "By date" keeps it automatic (1 September – 31 August).
 */
export default function SchoolYearField({ value }: { value?: number | null }) {
  const current = currentSchoolYear().from;
  return (
    <Field label="O‘quv yili" hint="Qaysi o‘quv yili sahifasida chiqadi. «Sana bo‘yicha» — 1-sentabrdan 31-avgustgacha sanaga qarab o‘zi aniqlanadi.">
      <select name="school_year" defaultValue={value ?? ""} className={`${inputClass} max-w-72`}>
        <option value="">Sana bo‘yicha (avtomatik)</option>
        {yearChoices(current, value).map((y) => (
          <option key={y} value={y}>
            {yearLabel(y)}
            {y === current ? " — joriy" : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}
