import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminForm from "@/components/admin/AdminForm";
import { FormSection, TranslatedField } from "@/components/admin/fields";
import { savePage } from "../actions";
import { pageInfo, translationStatus } from "../info";

export const metadata: Metadata = { title: "Sahifani tahrirlash" };

export default async function EditPagePage({ params }: PageProps<"/admin/pages/[slug]">) {
  const { supabase } = await requireAdmin();
  const { slug } = await params;
  const { data: row } = await supabase.from("pages").select("*").eq("slug", slug).maybeSingle();
  if (!row) notFound();
  const info = pageInfo[slug];
  const missing = translationStatus(row).filter((s) => !s.body);

  return (
    <>
      <AdminHeader title={row.title_uz} back="/admin/pages" />
      <div className="mb-6 space-y-2 rounded-xl bg-white p-5 text-sm shadow-sm">
        {info && <p className="text-slate-700">{info.where}</p>}
        {info && (
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold text-slate-600">Saytda ko‘rish:</span>
            {(["uz", "ru", "en"] as const).map((lang) => (
              <a key={lang} href={`/${lang}${info.path}`} target="_blank" className="text-blue-700 hover:underline">
                {lang.toUpperCase()} ↗
              </a>
            ))}
          </p>
        )}
        {missing.length > 0 && (
          <p className="text-amber-700">
            {missing.map((s) => s.label).join(", ")} matni yo‘q — saytning o‘sha tilida o‘zbekcha matn ko‘rsatiladi.
          </p>
        )}
        <p className="text-xs text-slate-400">Oxirgi tahrir: {formatDateTime(row.updated_at, "uz")}</p>
      </div>
      <AdminForm action={savePage.bind(null, slug)}>
        <FormSection title="Sarlavha" hint={info?.title}>
          <TranslatedField name="title" label="Sarlavha" row={row} />
        </FormSection>
        <FormSection title="Matn" hint="Oddiy matn: paragraflarni bo‘sh qator bilan ajrating. Faqat tasdiqlangan ma’lumotni yozing.">
          <TranslatedField name="body" label="Matn" row={row} multiline uzRequired={false} />
        </FormSection>
      </AdminForm>
    </>
  );
}
