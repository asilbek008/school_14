import type { Metadata } from "next";
import { resolveLang } from "@/i18n/server";
import CmsPage from "@/components/CmsPage";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return { title: dict.nav.about };
}

export default async function Page({ params }: PageProps<"/[lang]/about">) {
  const { lang, dict } = await resolveLang(params);
  return <CmsPage slug="about" fallbackTitle={dict.nav.about} lang={lang} dict={dict} />;
}
