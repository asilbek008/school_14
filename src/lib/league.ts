// "O‘quvchilar ligasi" (Zakovat students' league) standings: the Excel layout the league publishes, and helpers
// shared by the admin import and the public table.

export const leagueStages = ["school", "republic", "region"] as const;
export type LeagueStage = (typeof leagueStages)[number];
/** Stages that come from the league's Excel file; "school" (games played at our school) is typed in by the admin. */
export const importStages = ["republic", "region"] as const satisfies readonly LeagueStage[];

/** One round ("tur") is 24 questions. The league's sheets split it into two 12-question parts, each headed "N-tur". */
export const ROUND_QUESTIONS = 24;

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

/** The round a text is about: «2-turi», «1-TUR», «3-turdan» (not «turnir», «turkum»); null when it names none. */
export function roundOf(text: string): number | null {
  const n = Number(/(\d{1,2})\s*[-–—]\s*tur(?![nk])/iu.exec(text)?.[1] ?? 0);
  return n >= 1 && n <= 30 ? n : null;
}

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
  // Question columns ("1" … "12") before each "N-tur" tell how many questions it covers.
  const questionCounts = roundCols.map((c, k) => h.slice(k ? roundCols[k - 1] + 1 : totalCol + 1, c).filter((x) => /^\d+$/.test(x)).length);

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
  // The columns are half-rounds when they cover fewer than 24 questions — or, without question columns, when
  // nobody scored more than 12 in one (the region sheet). Two halves make one round.
  const halves = questionCounts.some((n) => n > 0)
    ? questionCounts.every((n) => n > 0 && n < ROUND_QUESTIONS)
    : rows.every((row) => row.rounds.every((rd) => rd == null || rd[0] <= ROUND_QUESTIONS / 2));
  if (halves) for (const row of rows) row.rounds = mergeHalves(row.rounds);
  let played = Math.max(0, ...rows.map((row) => row.rounds.length));
  while (played > 0 && rows.every((row) => row.rounds[played - 1] == null)) played--;
  for (const row of rows) row.rounds = row.rounds.slice(0, played);
  const withRating = (data[header + 1] ?? []).some((c) => norm(cell(c)) === "reyting");
  return rows.length ? { rows, withRating } : { rows, error: "Jadvalda jamoa topilmadi." };
}

/** [part1, part2, part3, part4] → [part1 + part2, part3 + part4]; a round nobody played in stays null. */
function mergeHalves(parts: LeagueRow["rounds"]): LeagueRow["rounds"] {
  const rounds: LeagueRow["rounds"] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const played = [parts[i], parts[i + 1]].filter((p): p is [number, number | null] => p != null);
    rounds.push(
      played.length
        ? [played.reduce((a, p) => a + p[0], 0), played.every((p) => p[1] == null) ? null : played.reduce((a, p) => a + (p[1] ?? 0), 0)]
        : null,
    );
  }
  return rounds;
}

/**
 * Our school's own games, typed by the admin one team per line — «Feniks: 12, 13» (points per round, «-» when the
 * team did not play). Places follow the total; equal totals share a place.
 */
export function parseSchoolRounds(input: string): { rows: LeagueRow[]; error?: string } {
  const rows: LeagueRow[] = [];
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const [i, line] of lines.entries()) {
    const m = /^(.+?)\s*[:—–=]\s*(.*)$/.exec(line);
    if (!m) return { rows: [], error: `${i + 1}-qator: «Jamoa: 12, 13» ko‘rinishida yozing.` };
    const team = m[1].replace(/^["“«]|["”»]$/g, "").trim();
    const cells = m[2].split(/[,;]/).map((c) => c.trim());
    const rounds = cells.map((c) => (c === "" || c === "-" || c === "—" ? null : Number(c.replace(",", "."))));
    const bad = rounds.find((p) => p != null && (!Number.isInteger(p) || p < 0 || p > ROUND_QUESTIONS));
    if (!team || team.length > 60) return { rows: [], error: `${i + 1}-qator: jamoa nomi 1–60 belgi bo‘lsin.` };
    if (bad !== undefined) return { rows: [], error: `${i + 1}-qator (${team}): har turda 0 dan ${ROUND_QUESTIONS} gacha butun son bo‘lsin.` };
    if (rounds.length > 20) return { rows: [], error: `${i + 1}-qator: turlar juda ko‘p.` };
    rows.push({
      place: 0,
      team,
      school: "Qiziriq tumani 14-maktab",
      points: rounds.reduce<number>((a, p) => a + (p ?? 0), 0),
      rating: null,
      rounds: rounds.map((p) => (p == null ? null : [p, null])),
    });
  }
  if (!rows.length) return { rows, error: "Kamida bitta jamoa yozing." };
  const played = Math.max(...rows.map((r) => r.rounds.length));
  for (const r of rows) while (r.rounds.length < played) r.rounds.push(null);
  rows.sort((a, b) => b.points - a.points);
  rows.forEach((r, i) => (r.place = i && rows[i - 1].points === r.points ? rows[i - 1].place : i + 1));
  return { rows };
}

/** The school table back in the admin's text form, to edit it. */
export const schoolRoundsText = (rows: LeagueRow[]) => rows.map((r) => `${r.team}: ${r.rounds.map((rd) => (rd ? rd[0] : "-")).join(", ")}`).join("\n");

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
