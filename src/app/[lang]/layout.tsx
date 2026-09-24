import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import { locales } from "@/i18n/config";
import { resolveLang } from "@/i18n/server";
import YearBanner from "@/components/YearBanner";
import { currentSchoolYear, siteUrl } from "@/lib/school";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
});
// Display face for big headlines (no Cyrillic: Russian text falls back to Inter).
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang, dict } = await resolveLang(params);
  const ogLocale = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" }[lang];
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${dict.site.name} — ${dict.site.description}`, template: `%s | ${dict.site.name}` },
    description: dict.site.description,
    applicationName: dict.site.name,
    // Language versions (hreflang) of every page are listed in sitemap.xml; a layout-wide alternate
    // would point every page at the home pages.
    // Links shared in Telegram or Facebook show the school's card (opengraph-image.tsx), name and description.
    openGraph: {
      type: "website",
      siteName: dict.site.name,
      locale: ogLocale,
      title: dict.site.name,
      description: dict.site.description,
    },
    twitter: { card: "summary_large_image" },
    formatDetection: { telephone: false },
  };
}

// Runs before the first paint so a dark-mode visitor never sees a white flash: the saved choice,
// else the system setting. ThemeToggle changes it later.
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang, dict } = await resolveLang(params);

  return (
    // suppressHydrationWarning: the theme script adds the "dark" class before React hydrates.
    <html lang={lang} className={`${inter.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-paper">
        <SiteHeader lang={lang} dict={dict} />
        <YearBanner lang={lang} current={currentSchoolYear().from} t={dict.year} />
        <main className="flex-1">{children}</main>
        <SiteFooter lang={lang} dict={dict} />
      </body>
    </html>
  );
}
