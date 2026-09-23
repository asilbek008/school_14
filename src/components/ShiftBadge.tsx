import { fill } from "@/i18n/fill";
import type { Shift } from "@/lib/bells";

/** "1-smena · 08:00 dan" pill; gold for the morning shift, blue for the afternoon one. */
export default function ShiftBadge({ shift, label }: { shift: Shift; label: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
        shift.id === 1 ? "bg-gold-soft text-gold-deep" : "bg-brand-soft text-brand-deep"
      }`}
    >
      {fill(label, { n: shift.id, time: shift.start })}
    </span>
  );
}
