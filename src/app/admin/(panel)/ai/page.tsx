import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import DeleteButton from "@/components/admin/DeleteButton";
import AiForm from "./AiForm";
import AiTest from "./AiTest";
import { forgetAi } from "./actions";

export const metadata: Metadata = { title: "AI yordamchi" };

type State = {
  enabled: boolean;
  model: string;
  has_key: boolean;
  today: number;
  total: number;
  recent: { at: string; lang: string | null; question: string; ok: boolean }[];
};

/** The assistant's key, its switch and what visitors have been asking. */
export default async function AdminAiPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.rpc("ai_admin");
  const state = (data ?? { enabled: false, model: "claude-haiku-4-5-20251001", has_key: false, today: 0, total: 0, recent: [] }) as State;

  return (
    <>
      <AdminHeader title="AI yordamchi" />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Saytdagi «AI yordamchi» sahifasi ota-onalarning savollariga sayt ma’lumotlari asosida javob beradi. Ishlashi uchun Anthropic
        konsolidan (console.anthropic.com) API kalit olib, shu yerga kiriting — kalit bazada saqlanadi, brauzerga qaytarilmaydi va
        menga ham ko‘rinmaydi. Kalit kiritilmaguncha sahifa saytda ochilmaydi.
      </p>
      <ol className="mb-5 max-w-3xl list-decimal space-y-1 pl-5 text-sm text-slate-600">
        <li>console.anthropic.com → ro‘yxatdan o‘ting (Uzbekiston qo‘llab-quvvatlanadi).</li>
        <li><b>Billing</b> bo‘limidan kredit qo‘shing (eng kami $5) — kreditsiz kalit ishlamaydi.</li>
        <li><b>API keys</b> → «Create key» → kalit <b>bir marta</b> ko‘rsatiladi: «Copy» tugmasini bosing.</li>
        <li>Shu sahifadagi maydonga qo‘ying va saqlang, keyin «Sinov savoli» bilan tekshiring.</li>
      </ol>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900">{state.today}</p>
          <p className="text-sm text-slate-500">savol (24 soat)</p>
        </div>
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className="text-3xl font-extrabold text-slate-900">{state.total}</p>
          <p className="text-sm text-slate-500">jami savol</p>
        </div>
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm">
          <p className={`text-sm font-semibold ${state.enabled && state.has_key ? "text-green-800" : "text-amber-800"}`}>
            {state.has_key ? (state.enabled ? "✓ Yoqilgan" : "Kalit bor, o‘chirilgan") : "Kalit kiritilmagan"}
          </p>
          <p className="text-sm text-slate-500">{state.model}</p>
        </div>
      </div>

      <AiForm state={state} />
      {state.has_key && <AiTest />}

      <section className="mt-8">
        <h2 className="mb-3 text-base font-bold text-slate-900">So‘nggi savollar</h2>
        <p className="mb-3 max-w-3xl text-sm text-slate-600">
          Ko‘p takrorlangan savollarni «Savol-javob» bo‘limiga qo‘shsangiz, ular AI’siz ham darhol javob topadi.
        </p>
        {state.recent.length ? (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
            {state.recent.map((q, i) => (
              <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold uppercase text-slate-600">{q.lang ?? "uz"}</span>
                <span className="min-w-0 flex-1 text-slate-800">{q.question}</span>
                <span className="text-xs text-slate-500">{formatDateTime(q.at, "uz")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Hali savol berilmagan.</p>
        )}
      </section>

      {state.has_key && (
        <div className="mt-8 border-t border-slate-200 pt-4 text-right">
          <DeleteButton action={forgetAi} confirmText="Kalit o‘chiriladi va yordamchi saytda yopiladi. Davom etasizmi?" />
        </div>
      )}
    </>
  );
}
