import Link from "next/link";

// Rendered inside [lang]/layout, but not-found pages don't receive params,
// so the text is shown in all three languages.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="text-6xl font-bold text-brand">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        Sahifa topilmadi · Страница не найдена · Page not found
      </h1>
      <Link href="/" className="mt-6 inline-block font-medium text-brand hover:underline">
        ← 14-maktab
      </Link>
    </div>
  );
}
