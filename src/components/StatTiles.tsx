import Link from "next/link";

/** Tile colors in turn: blue, teal, gold, coral (as on "About"); also the contact cards. */
export const tileColors = ["from-[#3e72e8] to-brand-deep", "from-[#17a090] to-[#0c6d62]", "from-[#e0a33e] to-gold-deep", "from-[#d2664e] to-[#a63b28]"];

/**
 * A row of colored number tiles (gallery, news, events, clubs, programs, staff, timetable; the home page,
 * where each tile links to its section).
 */
export default function StatTiles({ stats, className = "mb-8" }: { stats: { value: number; label: string; href?: string }[]; className?: string }) {
  return (
    <div className={`grid gap-2.5 sm:gap-3.5 ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2 lg:grid-cols-4"} ${className}`}>
      {stats.map(({ value, label, href }, i) => {
        const tile = `reveal relative overflow-hidden rounded-[14px] bg-gradient-to-br px-3.5 py-4 text-white after:absolute after:-right-8 after:-top-10 after:size-[110px] after:rounded-full after:bg-white/15 sm:px-5 sm:py-5 ${tileColors[i % tileColors.length]}`;
        const body = (
          <>
            <b className="font-display block text-2xl font-extrabold leading-none tracking-tight sm:text-[30px]">{value}</b>
            <span className="mt-1.5 block text-[12.5px] font-semibold opacity-90 sm:text-[13.5px]">{label}</span>
          </>
        );
        return href ? (
          <Link key={i} href={href} style={{ animationDelay: `${i * 60}ms` }} className={`lift group ${tile}`}>
            {body}
            <span aria-hidden className="absolute bottom-4 right-4 text-lg font-bold opacity-70 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100">
              →
            </span>
          </Link>
        ) : (
          <div key={i} style={{ animationDelay: `${i * 60}ms` }} className={tile}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
