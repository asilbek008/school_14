import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Caveat, Inter } from "next/font/google";
import "../globals.css";

// Separate root layout: the admin area is Uzbek-only and lives outside [lang].
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext", "cyrillic"] });
// The handwritten tagline on the dashboard banner.
const caveat = Caveat({ variable: "--font-script", subsets: ["latin"], weight: ["600"] });

export const metadata: Metadata = {
  title: { default: "Admin panel", template: "%s | 14-maktab admin" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  // Dark by default (the owner's design); AdminThemeToggle saves "light" in this cookie.
  const light = (await cookies()).get("admin_theme")?.value === "light";
  return (
    <html lang="uz" className={`${inter.variable} ${caveat.variable} h-full antialiased ${light ? "" : "admin-dark"}`}>
      <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
