import Link from "next/link";

/**
 * Section heading as on the home page: kicker with a gold dash, title, and on the right an
 * optional description or an outlined "see all" button.
 */
export default function SectionHead({
  kicker,
  title,
  desc,
  action,
}: {
  kicker: string;
  title: string;
  desc?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="reveal mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <p className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold tracking-wide text-[#0c6d62] before:h-0.5 before:w-[18px] before:rounded before:bg-gold">
          {kicker}
        </p>
        <h2 className="font-display text-[clamp(1.6rem,2.9vw,2.1rem)] font-bold tracking-tight text-slate-900">{title}</h2>
      </div>
      {desc && <p className="max-w-[56ch] text-[15px] text-slate-600">{desc}</p>}
      {action && (
        <Link
          href={action.href}
          className="press rounded-full border-[1.5px] border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-900 hover:border-brand hover:text-brand"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
