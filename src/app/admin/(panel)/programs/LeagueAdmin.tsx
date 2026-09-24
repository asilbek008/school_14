import AdminForm from "@/components/admin/AdminForm";
import DeleteButton from "@/components/admin/DeleteButton";
import { Field, inputClass } from "@/components/admin/fields";
import { formatDate, formatDateTime } from "@/lib/format";
import { isOurSchool, type LeagueRow, type LeagueStage } from "@/lib/league";
import { deleteLeague, importLeague } from "./actions";

export const stageNames: Record<LeagueStage, string> = { republic: "Respublika bosqichi", region: "Viloyat bosqichi" };

type Stored = { stage: LeagueStage; title: string | null; as_of: string | null; rows: LeagueRow[]; updated_at: string };

/** The league tables of a program: what is on the site now per stage, and the Excel upload that replaces one. */
export default function LeagueAdmin({ programId, tables, notice }: { programId: number; tables: Stored[]; notice?: string }) {
  return (
    <section id="league" className="mt-10 scroll-mt-24">
      <h2 className="mb-1 text-lg font-bold">O‘quvchilar ligasi reytingi</h2>
      <p className="mb-3 max-w-3xl text-sm text-slate-500">
        Ligining Excel faylini yuklang («Jamoalar ro‘yhati» varag‘i: №, Jamoa nomi, Jami, 1-tur, 2-tur … — har biri ochko va reyting).
        Tadbir sahifasida bosqichlar bo‘yicha jadval chiqadi, 14-maktab jamoalari ajratib ko‘rsatiladi. Yangi tur chiqqanda faylni qayta
        yuklang — eski jadval almashtiriladi.
      </p>
      {notice && <p className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {(["republic", "region"] as const).map((stage) => {
          const table = tables.find((t) => t.stage === stage);
          const ours = table?.rows.filter(isOurSchool) ?? [];
          return (
            <div key={stage} className="rounded-xl bg-white p-4 text-sm shadow-sm">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-900">{stageNames[stage]}</p>
                {table && <DeleteButton action={deleteLeague.bind(null, programId, stage)} confirmText={`${stageNames[stage]} jadvalini o‘chirasizmi?`} />}
              </div>
              {table ? (
                <>
                  <p className="mt-1 text-slate-600">
                    {table.rows.length} ta jamoa · {table.rows[0]?.rounds.length ?? 0} tur
                    {table.as_of && ` · ${formatDate(table.as_of, "uz")} holatiga`}
                  </p>
                  {table.title && <p className="text-slate-500">{table.title}</p>}
                  <p className="mt-2 text-slate-700">
                    {ours.length ? ours.map((r) => `${r.team} — ${r.place}-o‘rin`).join(" · ") : <span className="text-amber-700">14-maktab jamoasi topilmadi</span>}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">Yuklangan: {formatDateTime(table.updated_at, "uz")}</p>
                </>
              ) : (
                <p className="mt-1 text-slate-500">Hali yuklanmagan.</p>
              )}
            </div>
          );
        })}
      </div>

      <AdminForm action={importLeague.bind(null, programId)} submitLabel="Jadvalni yuklash">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Bosqich *">
            <select name="stage" required defaultValue="republic" className={inputClass}>
              {(["republic", "region"] as const).map((s) => (
                <option key={s} value={s}>
                  {stageNames[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mavsum nomi" hint="Masalan: Kuzgi mavsum 2026">
            <input name="title" className={inputClass} />
          </Field>
          <Field label="Qaysi sana holatiga">
            <input type="date" name="as_of" className={inputClass} />
          </Field>
        </div>
        <Field label="Excel fayl (.xlsx) *">
          <input type="file" name="file" required accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="mt-2 block text-sm" />
        </Field>
      </AdminForm>
    </section>
  );
}
