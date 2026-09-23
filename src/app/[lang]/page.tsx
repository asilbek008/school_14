import { notFound } from "next/navigation";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{dict.home.welcome}</h1>
        <p className="mt-4 text-lg text-slate-600">{dict.home.intro}</p>
      </div>
    </section>
  );
}
