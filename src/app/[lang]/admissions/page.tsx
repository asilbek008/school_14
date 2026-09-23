import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import CmsPage from "@/components/CmsPage";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/admissions">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.admissions };
}

export default async function Page({ params }: PageProps<"/[lang]/admissions">) {
  const { lang, dict } = await resolveLang(params);
  return <CmsPage slug="admissions" fallbackTitle={dict.nav.admissions} lang={lang} dict={dict} />;
}
