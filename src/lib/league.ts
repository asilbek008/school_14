// "O‘quvchilar ligasi" (Zakovat students' league) standings: the Excel layout the league publishes, and helpers
// shared by the admin import and the public table.

export const leagueStages = ["republic", "region"] as const;
export type LeagueStage = (typeof leagueStages)[number];

/** One team's line: place, name, points and rating in total and per round (null = did not play that round). */
export type LeagueRow = {
  place: number;
  team: string;
  school: string | null;
  points: number;
  rating: number | null;
  rounds: ([number, number | null] | null)[];
};

export type LeagueTable = { stage: LeagueStage; title: string | null; as_of: string | null; rows: LeagueRow[] };

/** How the league writes our school in team names: "Benom (Qiziriq tumani 14-maktab)". */
export const OUR_SCHOOL = "qiziriq tumani 14-maktab";

const norm = (v: string) =>
  v
    .toLowerCase()
    .replace(/[‘’ʻʼ`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

export const isOurSchool = (row: Pick<LeagueRow, "team" | "school">) => norm(`${row.team} ${row.school ?? ""}`).includes(OUR_SCHOOL);

/** "Benom (Qiziriq tumani 14-maktab)" → team "Benom", school "Qiziriq tumani 14-maktab". */
export function splitTeam(name: string): { team: string; school: string | null } {
  const m = /^(.*?)\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/.exec(name.trim());
  return m && m[1] ? { team: m[1].trim(), school: m[2].trim() } : { team: name.trim(), school: null };
}

/** The district ("Qiziriq", "Denov" …) of a school or team name, when it says "… tuman(i)". */
export function districtOf(row: Pick<LeagueRow, "team" | "school">): string | null {
  const m = /([A-Za-zʻʼ‘’'`O-]+)\s+tuman/i.exec(row.school ?? row.team);
  return m ? m[1].replace(/[ʻʼ‘`]/g, "’") : null;
}

const num = (v: unknown): number | null => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v.replace(",", ".")))) return Number(v.replace(",", "."));
  return null;
};
const cell = (v: unknown) => (v == null ? "" : String(v).trim());

/**
 * Reads a sheet in the league's layout: a header row with "№", "Jamoa nomi", "Jami" and "1-tur", "2-tur" …; each of
 * "Jami" and "N-tur" spans two columns (points, then rating); the next row says "ochko / reyting". Question columns
 * between them are ignored.
 */
export function parseLeagueSheet(data: unknown[][]): { rows: LeagueRow[]; withRating?: boolean; error?: string } {
  const header = data.findIndex((r) => r.some((c) => norm(cell(c)) === "jamoa nomi"));
  if (header < 0) return { rows: [], error: "«Jamoa nomi» ustuni topilmadi." };
  const h = data[header].map((c) => norm(cell(c)));
  const placeCol = h.findIndex((c) => c === "№" || c === "t/r" || c === "no");
  const nameCol = h.indexOf("jamoa nomi");
  const totalCol = h.indexOf("jami");
  const roundCols = h.flatMap((c, i) => (/^\d+-tur$/.test(c) ? [i] : [])).sort((a, b) => Number(h[a].split("-")[0]) - Number(h[b].split("-")[0]));
  if (totalCol < 0) return { rows: [], error: "«Jami» ustuni topilmadi." };

  const rows: LeagueRow[] = [];
  for (const r of data.slice(header + 1)) {
    const name = cell(r[nameCol]);
    const points = num(r[totalCol]);
    if (!name || points == null || norm(name) === "ochko") continue;
    const rounds = roundCols.map((c) => {
      const p = num(r[c]);
      return p == null ? null : ([p, num(r[c + 1])] as [number, number | null]);
    });
    rows.push({ place: num(r[placeCol]) ?? rows.length + 1, ...splitTeam(name), points, rating: num(r[totalCol + 1]), rounds });
  }
  // Rounds nobody has played yet are dropped from the end.
  let played = roundCols.length;
  while (played > 0 && rows.every((row) => row.rounds[played - 1] == null)) played--;
  for (const row of rows) row.rounds = row.rounds.slice(0, played);
  const withRating = (data[header + 1] ?? []).some((c) => norm(cell(c)) === "reyting");
  return rows.length ? { rows, withRating } : { rows, error: "Jadvalda jamoa topilmadi." };
}

/**
 * Of all sheets, the one in the league layout with ratings and the most teams (a file can also hold a points-only
 * summary and old seasons).
 */
export function pickLeagueSheet(sheets: { data: unknown[][] }[]) {
  const score = (p: ReturnType<typeof parseLeagueSheet>) => (p.withRating ? 1e6 : 0) + p.rows.length;
  let best: ReturnType<typeof parseLeagueSheet> = { rows: [], error: "Faylda reyting jadvali topilmadi." };
  for (const s of sheets) {
    const parsed = parseLeagueSheet(s.data);
    if (parsed.rows.length && score(parsed) > score(best)) best = parsed;
  }
  return best;
}
