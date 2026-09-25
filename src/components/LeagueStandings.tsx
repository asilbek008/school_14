"use client";

import { useState } from "react";
import { fill } from "@/i18n/fill";
import { districtOf, isOurSchool, ROUND_QUESTIONS, type LeagueRow, type LeagueStage } from "@/lib/league";

export type LeagueLabels = {
  title: string;
  intro: string;
  school: string;
  schoolNote: string;
  republic: string;
  region: string;
  teams: string;
  ours: string;
  ourBadge: string;
  search: string;
  all: string;
  onlyOurs: string;
  district: string;
  filterLabel: string;
  place: string;
  team: string;
  points: string;
  rating: string;
  total: string;
  round: string;
  asOf: string;
  more: string;
  shown: string;
  noMatch: string;
  placeOf: string;
  lastRound: string;
  pending: string;
  up: string;
  down: string;
  maxPoints: string;
};

export type LeagueView = { stage: LeagueStage; title: string | null; asOf: string | null; rows: LeagueRow[] };

const PAGE = 50;
const medals = ["🥇", "🥈", "🥉"];

/** Places after the rounds before the last one (equal totals share a place), to show who moved up or down. */
function previousPlaces(rows: LeagueRow[]): Map<LeagueRow, number> {
  const played = rows[0]?.rounds.length ?? 0;
  const places = new Map<LeagueRow, number>();
  if (played < 2) return places;
  const before = rows.map((r) => ({ r, points: r.rounds.slice(0, -1).reduce((a, rd) => a + (rd?.[0] ?? 0), 0) })).sort((a, b) => b.points - a.points);
  before.forEach((x, i) => places.set(x.r, i && before[i - 1].points === x.points ? places.get(before[i - 1].r)! : i + 1));
  return places;
}

/** Standings by stage (as the staff directory): stage tabs, search, filter; our school's teams stand out. */
export default function LeagueStandings({ tables, t }: { tables: LeagueView[]; t: LeagueLabels }) {
  const [stage, setStage] = useState(tables[0].stage);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(""); // "" | "ours" | "d:<district>"
  const [limit, setLimit] = useState(PAGE);

  const table = tables.find((x) => x.stage === stage) ?? tables[0];
  const rounds = table.rows[0]?.rounds.length ?? 0;
  // Games at our school: every team is ours, so no highlighting, search or filter — just the table.
  const local = table.stage === "school";
  const withRating = table.rows.some((r) => r.rating != null);
  const ours = local ? [] : table.rows.filter(isOurSchool);
  // Games at school run ahead of the league's tables: say how far a league table goes.
  const latest = Math.max(...tables.map((x) => x.rows[0]?.rounds.length ?? 0));
  const behind = !local && rounds < latest;
  const before = local ? previousPlaces(table.rows) : new Map<LeagueRow, number>();
  const districts = [...new Set(table.rows.map(districtOf).filter((d): d is string => !!d))].sort((a, b) => a.localeCompare(b));

  const q = query.trim().toLowerCase();
  const shown = table.rows.filter(
    (r) =>
      local ||
      (!filter || (filter === "ours" ? isOurSchool(r) : districtOf(r) === filter.slice(2))) &&
      (!q || r.team.toLowerCase().includes(q) || (r.school ?? "").toLowerCase().includes(q)),
  );
  const visible = shown.slice(0, limit);
  const choose = (next: () => void) => {
    next();
    setLimit(PAGE);
  };

  return (
    <div>
      {/* Stages: our school, republic, region. */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none]">
        <div role="group" aria-label={t.title} className="flex w-max gap-2">
          {tables.map((x) => {
            const active = x.stage === stage;
            return (
              <button
                key={x.stage}
                type="button"
                aria-pressed={active}
                onClick={() => choose(() => (setStage(x.stage), setFilter("")))}
                className={`press inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  active ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand"
                }`}
              >
                {t[x.stage]}
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{x.rows.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Our teams in this stage. */}
      {ours.length > 0 && (
        <div className="mb-6">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
            {t.ours} · {table.title ? `${table.title} · ` : ""}
            {table.asOf ? fill(t.asOf, { date: table.asOf }) : ""}
          </p>
          {/* Phones: one row that scrolls sideways; wider screens: a grid. */}
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-5">
            {ours.map((r) => (
              <li key={`${r.place}-${r.team}`} className="w-44 shrink-0 rounded-[14px] border border-brand/30 bg-brand-soft/60 p-4 sm:w-auto">
                <p className="font-display text-3xl font-bold leading-none text-brand-deep">
                  {r.place}
                  <span className="text-base font-semibold text-slate-500">/{table.rows.length}</span>
                </p>
                <p className="mt-2 truncate font-bold text-slate-900">{r.team}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {r.points} {t.points.toLowerCase()} · {r.rating ?? "—"} {t.rating.toLowerCase()}
                </p>
                {rounds > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1">
                    {r.rounds.map((rd, i) => (
                      <span key={i} className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-700" title={fill(t.round, { n: i + 1 })}>
                        {i + 1}: {rd ? rd[0] : "—"}
                      </span>
                    ))}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {behind && <p className="mb-4 rounded-xl bg-gold-soft px-4 py-2.5 text-sm font-medium text-gold-deep">{fill(t.pending, { n: rounds })}</p>}

      {local && (
        <p className="mb-4 text-sm text-slate-600">
          {t.schoolNote}
          {table.asOf ? ` · ${fill(t.asOf, { date: table.asOf })}` : ""}
        </p>
      )}

      <div className={`mb-4 flex flex-col gap-2.5 sm:flex-row ${local ? "hidden" : ""}`}>
        <label className="relative flex-1">
          <span className="sr-only">{t.search}</span>
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => choose(() => setQuery(e.target.value))}
            placeholder={t.search}
            className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-soft"
          />
        </label>
        <select
          value={filter}
          onChange={(e) => choose(() => setFilter(e.target.value))}
          aria-label={t.filterLabel}
          className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
        >
          <option value="">
            {t.all} · {table.rows.length}
          </option>
          <option value="ours">
            {t.onlyOurs} · {ours.length}
          </option>
          {districts.length > 1 &&
            districts.map((d) => (
              <option key={d} value={`d:${d}`}>
                {fill(t.district, { d })} · {table.rows.filter((r) => districtOf(r) === d).length}
              </option>
            ))}
        </select>
      </div>

      {local ? (
        <SchoolBoard rows={table.rows} before={before} t={t} />
      ) : shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-slate-500">{t.noMatch}</p>
      ) : (
        <>
          {/* Phones: cards. */}
          <ul className="space-y-2.5 md:hidden">
            {visible.map((r) => {
              const mine = !local && isOurSchool(r);
              return (
                <li key={`${r.place}-${r.team}-${r.school}`} className={`flex items-center gap-3 rounded-2xl border p-3.5 ${mine ? "border-brand/40 bg-brand-soft/60" : "border-slate-200 bg-white"}`}>
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${mine ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}>{r.place}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate font-semibold text-slate-900">{r.team}</b>
                    {r.school && <span className="block truncate text-xs text-slate-500">{r.school}</span>}
                    <span className="mt-1 block text-xs text-slate-600">
                      {r.rounds.map((rd, i) => `${i + 1}: ${rd ? rd[0] : "—"}`).join(" · ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <b className="font-display block text-lg text-slate-900">{r.points}</b>
                    {withRating && <span className="text-xs text-slate-500">{r.rating ?? "—"}</span>}
                  </span>
                </li>
              );
            })}
          </ul>

          {/* Wider screens: table. */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full border-collapse text-left text-[14.5px]">
              <thead className="bg-slate-50">
                <tr className="border-b-2 border-slate-200 text-[11.5px] font-bold text-slate-500">
                  <th scope="col" className="w-16 px-4 py-3.5 text-center">{t.place}</th>
                  <th scope="col" className="px-4 py-3.5">{t.team}</th>
                  <th scope="col" className="px-4 py-3.5 text-right">{t.points}</th>
                  {withRating && <th scope="col" className="px-4 py-3.5 text-right">{t.rating}</th>}
                  {Array.from({ length: rounds }, (_, i) => (
                    <th key={i} scope="col" className="px-4 py-3.5 text-right">
                      {fill(t.round, { n: i + 1 })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const mine = !local && isOurSchool(r);
                  return (
                    <tr
                      key={`${r.place}-${r.team}-${r.school}`}
                      className={`border-b border-slate-100 last:border-0 ${mine ? "bg-brand-soft/70 font-semibold" : "transition-colors hover:bg-slate-50"}`}
                    >
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-grid min-w-8 place-items-center rounded-lg px-1.5 py-1 text-sm font-bold ${mine ? "bg-brand text-white" : r.place <= 3 ? "bg-gold-soft text-gold-deep" : "text-slate-600"}`}>
                          {r.place}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <b className="font-semibold text-slate-900">{r.team}</b>
                          {mine && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">{t.ourBadge}</span>}
                        </span>
                        {r.school && <span className="block text-[13px] font-normal text-slate-500">{r.school}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-display text-base font-bold tabular-nums text-slate-900">{r.points}</td>
                      {withRating && <td className="px-4 py-3 text-right tabular-nums text-slate-600">{r.rating ?? "—"}</td>}
                      {r.rounds.map((rd, i) => (
                        <td key={i} className="px-4 py-3 text-right tabular-nums">
                          {rd ? (
                            <>
                              <b className="text-slate-900">{rd[0]}</b>
                              <span className="ml-1 text-[12px] font-normal text-slate-400">{rd[1] ?? ""}</span>
                            </>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{fill(t.shown, { n: visible.length, total: shown.length })}</span>
            {shown.length > limit && (
              <button type="button" onClick={() => setLimit(limit + PAGE)} className="press rounded-full border border-slate-200 bg-white px-4 py-2 font-bold text-brand hover:border-brand">
                {fill(t.more, { n: Math.min(PAGE, shown.length - limit) })}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Our school's own games as a scoreboard: medals, how each team moved since the previous round, points per round
 * (the latest one stands out) and a bar of the total against the questions played so far.
 */
function SchoolBoard({ rows, before, t }: { rows: LeagueRow[]; before: Map<LeagueRow, number>; t: LeagueLabels }) {
  const played = rows[0]?.rounds.length ?? 0;
  const max = played * ROUND_QUESTIONS;
  return (
    <ol className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {rows.map((r) => {
        const prev = before.get(r);
        const moved = prev ? prev - r.place : 0;
        return (
          <li key={`${r.place}-${r.team}`} className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 p-4 last:border-0 sm:flex-nowrap sm:px-5 ${r.place === 1 ? "bg-gold-soft/50" : ""}`}>
            <span className={`grid size-11 shrink-0 place-items-center rounded-xl font-display text-lg font-bold ${r.place <= 3 ? "bg-white text-2xl shadow-sm" : "bg-slate-100 text-slate-600"}`}>
              {medals[r.place - 1] ?? r.place}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <b className="truncate text-[16px] text-slate-900">{r.team}</b>
                {moved !== 0 && (
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-bold ${moved > 0 ? "bg-teal-soft text-teal" : "bg-red-50 text-red-700"}`}
                    title={fill(moved > 0 ? t.up : t.down, { n: Math.abs(moved) })}
                  >
                    {moved > 0 ? "▲" : "▼"} {Math.abs(moved)}
                  </span>
                )}
              </span>
              {max > 0 && (
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-slate-100" title={`${r.points} / ${max}`}>
                  <span className="block h-full rounded-full bg-gradient-to-r from-brand to-teal" style={{ width: `${Math.min(100, (r.points / max) * 100)}%` }} />
                </span>
              )}
            </span>
            <span className="order-last flex w-full gap-1.5 sm:order-none sm:w-auto">
              {r.rounds.map((rd, i) => {
                const last = i === played - 1;
                return (
                  <span
                    key={i}
                    className={`min-w-14 rounded-lg px-2 py-1 text-center ${last ? "bg-navy text-white" : "bg-slate-100 text-slate-700"}`}
                    title={`${fill(t.round, { n: i + 1 })}${last ? ` · ${t.lastRound}` : ""} · ${fill(t.maxPoints, { n: ROUND_QUESTIONS })}`}
                  >
                    <span className={`block text-[10.5px] font-semibold ${last ? "text-white/70" : "text-slate-500"}`}>{fill(t.round, { n: i + 1 })}</span>
                    <b className="block text-[15px] tabular-nums">{rd ? rd[0] : "—"}</b>
                  </span>
                );
              })}
            </span>
            <span className="shrink-0 text-right">
              <b className="font-display block text-2xl tabular-nums leading-none text-slate-900">{r.points}</b>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t.total}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
