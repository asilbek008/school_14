export default function PageHeader({ title, intro, kicker }: { title: string; intro?: string; kicker?: string }) {
  return (
    <div className="chrome tricolor-rule">
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10">
        {kicker && (
          <span className="mb-3 inline-block rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
            {kicker}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-slate-300">{intro}</p>}
      </div>
    </div>
  );
}
