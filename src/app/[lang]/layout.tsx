import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { locales } from "@/i18n/config";
import { resolveLang } from "@/i18n/server";
import SiteHeader from "@/components/SiteHeader";
import { school, telHref } from "@/lib/school";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { dict } = await resolveLang(params);
  return {
    title: { default: dict.site.name, template: `%s | ${dict.site.name}` },
    description: dict.site.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);

  return (
    <html lang={lang} className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50">
        <SiteHeader lang={lang} dict={dict} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
          {(school.phone || school.hours) && (
            <p className="mb-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-slate-600">
              {school.phone && (
                <a href={telHref(school.phone)} className="font-medium text-blue-700 hover:underline">
                  {school.phone}
                </a>
              )}
              {school.hours && <span>{school.hours[lang]}</span>}
            </p>
          )}
          © {new Date().getFullYear()} {dict.site.name}. {dict.footer.rights}
        </footer>
      </body>
    </html>
  );
}
