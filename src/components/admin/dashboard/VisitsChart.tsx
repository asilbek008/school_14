"use client";

import { useEffect, useRef, useState } from "react";

export type Day = { day: string; visitors: number; views: number };

const months = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
const label = (day: string) => {
  const [, m, d] = day.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]}`;
};
const num = (n: number) => n.toLocaleString("ru-RU");

/** A round top for the y axis: 1, 2 or 5 × 10^k, split into 4 steps. */
function niceMax(max: number) {
  if (max <= 4) return 4;
  const step = max / 4;
  const pow = 10 ** Math.floor(Math.log10(step));
  const nice = [1, 2, 2.5, 5, 10].find((m) => m * pow >= step)! * pow;
  return nice * 4;
}

const ranges = [7, 30, 90] as const;
const H = 230;
const PAD = { top: 14, right: 12, bottom: 28, left: 40 };

/**
 * "Sayt tashriflari": visitors a day (Tashkent days) for the last 7 / 30 / 90 days — one series, so no legend box;
 * a crosshair and tooltip on hover, the last day marked, and a table for screen readers.
 */
export default function VisitsChart({ days }: { days: Day[] }) {
  const [range, setRange] = useState<(typeof ranges)[number]>(7);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const data = days.slice(-range);
  const top = niceMax(Math.max(0, ...data.map((d) => d.visitors)));
  const w = Math.max(width, 280);
  const plotW = w - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (data.length > 1 ? (i / (data.length - 1)) * plotW : plotW / 2);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const points = data.map((d, i) => [x(i), y(d.visitors)] as const);
  // A gently smoothed line (monotone enough for daily counts; never overshoots below zero by more than a hair).
  const path = points.reduce((acc, [px, py], i) => {
    if (!i) return `M${px},${py}`;
    const [qx, qy] = points[i - 1];
    const cx = (qx + px) / 2;
    return `${acc} C${cx},${qy} ${cx},${py} ${px},${py}`;
  }, "");
  const area = points.length ? `${path} L${points.at(-1)![0]},${y(0)} L${points[0][0]},${y(0)} Z` : "";
  const ticks = [0, 1, 2, 3, 4].map((k) => (top / 4) * k);
  const every = Math.max(1, Math.ceil(data.length / Math.max(2, Math.min(7, Math.floor(plotW / 70)))));
  const total = data.reduce((a, d) => a + d.visitors, 0);
  const last = data.length - 1;
  const shown = hover ?? last;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    const i = Math.round(((px - PAD.left) / plotW) * (data.length - 1));
    setHover(Math.min(last, Math.max(0, i)));
  }

  return (
    <section className="rounded-2xl bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-bold text-slate-900">Sayt tashriflari</h2>
          <p className="text-[13px] text-slate-500">
            Kunlik tashrifchilar · {range} kunda jami {num(total)}
          </p>
        </div>
        <div className="flex gap-1.5" role="tablist" aria-label="Davr">
          {ranges.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => {
                setRange(r);
                setHover(null);
              }}
              className={`rounded-lg px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                range === r ? "bg-brand text-white" : "text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
              }`}
            >
              {r} kun
            </button>
          ))}
        </div>
      </div>

      <div ref={box} className="relative mt-4 text-[#2c5ce0] [html.admin-dark_&]:text-[#5b8cff]">
        {width > 0 && (
          <svg
            width={w}
            height={H}
            viewBox={`0 0 ${w} ${H}`}
            className="block touch-none select-none"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="visits-wash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={w - PAD.right} y1={y(t)} y2={y(t)} className="stroke-slate-200" strokeWidth="1" />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-slate-500 text-[11px] tabular-nums">
                  {num(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) =>
              i % every === 0 || i === last ? (
                <text key={d.day} x={x(i)} y={H - 8} textAnchor={i === last ? "end" : i === 0 ? "start" : "middle"} className="fill-slate-500 text-[11px]">
                  {label(d.day)}
                </text>
              ) : null,
            )}
            <path d={area} fill="url(#visits-wash)" />
            <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {range <= 30 &&
              points.map(([px, py], i) => (i === shown ? null : <circle key={i} cx={px} cy={py} r="3" fill="currentColor" className="opacity-70" />))}
            {shown >= 0 && points[shown] && (
              <>
                <line x1={points[shown][0]} x2={points[shown][0]} y1={PAD.top} y2={y(0)} className="stroke-slate-300" strokeWidth="1" />
                <circle cx={points[shown][0]} cy={points[shown][1]} r="5.5" fill="currentColor" className="stroke-[var(--chart-ring)]" strokeWidth="2.5" />
              </>
            )}
          </svg>
        )}
        {width > 0 && shown >= 0 && data[shown] && (
          <div
            className="admin-pop pointer-events-none absolute z-10 rounded-xl px-3 py-2 text-[12.5px]"
            style={{
              left: Math.min(Math.max(points[shown][0] - 70, 0), w - 150),
              top: Math.max(points[shown][1] - 66, 0),
              width: 150,
            }}
          >
            <p className="font-semibold text-slate-900">{label(data[shown].day)}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-slate-600">
              <span className="size-2 rounded-full bg-current text-[#2c5ce0] [html.admin-dark_&]:text-[#5b8cff]" />
              <b className="text-slate-900">{num(data[shown].visitors)}</b> tashrifchi
            </p>
            <p className="text-slate-500">{num(data[shown].views)} sahifa ko‘rildi</p>
          </div>
        )}
        {!total && <p className="absolute inset-x-0 top-1/3 text-center text-[13px] text-slate-500">Bu davrda hali tashrif yo‘q</p>}
      </div>

      <table className="sr-only">
        <caption>Kunlik tashrifchilar</caption>
        <thead>
          <tr>
            <th>Kun</th>
            <th>Tashrifchi</th>
            <th>Ko‘rish</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.day}>
              <td>{label(d.day)}</td>
              <td>{d.visitors}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
