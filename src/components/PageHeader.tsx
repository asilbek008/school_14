export default function PageHeader({ title, intro, kicker }: { title: string; intro?: string; kicker?: string }) {
  return (
    <div className="chrome tricolor-rule">
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-10">
        {kicker && (
          <span className="mb-3 inline-block animate-fade-up rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold">
            {kicker}
          </span>
        )}
        <h1 className="animate-fade-up text-3xl font-bold tracking-tight [animation-delay:60ms] sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl animate-fade-up text-slate-300 [animation-delay:120ms]">{intro}</p>}
      </div>
    </div>
  );
}
