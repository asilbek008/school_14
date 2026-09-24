/** Section heading as on the home page: kicker with a gold dash, title, optional description. */
export default function SectionHead({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="reveal mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <p className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#0c6d62] before:h-0.5 before:w-[18px] before:rounded before:bg-gold">
          {kicker}
        </p>
        <h2 className="font-display text-[clamp(1.6rem,2.9vw,2.1rem)] font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
      {desc && <p className="max-w-[56ch] text-[15px] text-slate-600">{desc}</p>}
    </div>
  );
}
