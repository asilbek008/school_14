import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

// Separate root layout: the admin area is Uzbek-only and lives outside [lang].
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext", "cyrillic"] });

export const metadata: Metadata = {
  title: { default: "Admin panel", template: "%s | 14-maktab admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="uz" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
