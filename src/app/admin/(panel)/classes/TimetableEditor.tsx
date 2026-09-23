import AdminForm from "@/components/admin/AdminForm";
import { fmtMinutes, lessons, shiftForGrade } from "@/lib/bells";
import { WEEKDAYS } from "@/lib/timetable";
import { saveTimetable } from "./actions";

const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

/** Weekly grid of subject pickers: rows are lessons (with the shift's bell times), columns are days. */
export default function TimetableEditor({
  classId,
  grade,
  subjects,
  current,
}: {
  classId: number;
  grade: number;
  subjects: { id: number; name_uz: string }[];
  current: { weekday: number; period: number; subject_id: number; teacher: string | null }[];
}) {
  const shift = shiftForGrade(grade);
  const find = (weekday: number, period: number) => current.find((l) => l.weekday === weekday && l.period === period);

  return (
    <AdminForm action={saveTimetable.bind(null, classId)} submitLabel="Jadvalni saqlash">
      <p className="text-sm text-slate-600">
        {grade}-sinflar {shift.id}-smenada ({shift.start} dan). Har bir katakka fan tanlang (o‘qituvchi ismi ixtiyoriy); dars bo‘lmasa «—» qoldiring.
      </p>
      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[860px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="w-24 py-2 pr-2 font-semibold">Dars</th>
              {WEEKDAYS.map((d) => (
                <th key={d} className="px-1 py-2 font-semibold">
                  {dayNames[d - 1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lessons(shift).map((l) => (
              <tr key={l.n} className="border-t border-slate-100">
                <td className="py-2 pr-2 align-middle">
                  <b>{l.n}-dars</b>
                  <span className="block text-xs tabular-nums text-slate-500">
                    {fmtMinutes(l.start)}–{fmtMinutes(l.end)}
                  </span>
                </td>
                {WEEKDAYS.map((d) => (
                  <td key={d} className="px-1 py-2">
                    <select
                      name={`l-${d}-${l.n}`}
                      defaultValue={find(d, l.n)?.subject_id ?? ""}
                      aria-label={`${dayNames[d - 1]}, ${l.n}-dars`}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">—</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name_uz}
                        </option>
                      ))}
                    </select>
                    <input
                      name={`t-${d}-${l.n}`}
                      defaultValue={find(d, l.n)?.teacher ?? ""}
                      placeholder="O‘qituvchi"
                      aria-label={`${dayNames[d - 1]}, ${l.n}-dars o‘qituvchisi`}
                      className="mt-1 w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 focus:border-blue-600 focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminForm>
  );
}
