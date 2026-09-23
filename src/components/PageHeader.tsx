export default function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="border-b border-slate-200 bg-blue-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-slate-600">{intro}</p>}
      </div>
    </div>
  );
}
