import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import { categoryLabels } from "./OpennessForm";

export const metadata: Metadata = { title: "Ochiqlik" };

export default async function AdminOpennessPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("openness_items")
    .select("id, category, title_uz, amount, period, happened_on, is_published")
    .order("category")
    .order("sort_order")
    .order("id", { ascending: false });
  const rows = data ?? [];

  return (
    <>
      <AdminHeader title="Ochiqlik" action={{ href: "/admin/openness/new", label: "+ Qo‘shish" }} />
      <p className="mb-4 max-w-3xl text-sm text-slate-600">
        Byudjet, homiylik yordami, xaridlar va hisobotlar — saytdagi «Ochiqlik» bo‘limida chiqadi. Har bir raqam rasmiy hujjat bilan
        tasdiqlangan bo‘lsin: hujjatni «Hujjatlar» bo‘limiga yuklab, shu yerda tanlang.
      </p>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl bg-white shadow-sm">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/openness/${r.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{categoryLabels[r.category] ?? r.category}</span>
                <span className="min-w-0 flex-1 font-medium text-slate-900">{r.title_uz}</span>
                {r.amount !== null && <span className="text-sm font-semibold text-slate-700">{Number(r.amount).toLocaleString("ru-RU")} so‘m</span>}
                <span className="text-sm text-slate-500">{r.period ?? (r.happened_on ? formatDate(r.happened_on, "uz") : "")}</span>
                {!r.is_published && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Yashirin</span>}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">Hali ma’lumot kiritilmagan.</p>
      )}
    </>
  );
}
