// Tests for supabase/functions/parent-bot/bot.ts (the parts without a database):
//   node --experimental-strip-types scripts/test-parent-bot.mts
import assert from "node:assert/strict";
import { dayLabel, parseClass, pickDay, tashkentDay } from "../supabase/functions/parent-bot/bot.ts";

// Class names as parents type them.
assert.deepEqual(parseClass("8-A"), { grade: 8, letter: "A" });
assert.deepEqual(parseClass("8a"), { grade: 8, letter: "A" });
assert.deepEqual(parseClass("11 b"), { grade: 11, letter: "B" });
assert.deepEqual(parseClass("/darslar 5-Д"), { grade: 5, letter: "D" });
assert.deepEqual(parseClass("10–E sinf"), { grade: 10, letter: "E" });
assert.deepEqual(parseClass("7 ‘F"), { grade: 7, letter: "F" });
assert.equal(parseClass("12-A"), null);
assert.equal(parseClass("0-A"), null);
assert.equal(parseClass("salom"), null);
assert.equal(parseClass("8-sinf"), null);

// Tashkent is UTC+5: 20:00 UTC on Saturday is already Sunday there.
const sat = new Date("2026-09-26T20:00:00Z");
assert.deepEqual(tashkentDay(sat), { date: "2026-09-27", weekday: 0, minutes: 60 });
assert.equal(dayLabel(tashkentDay(new Date("2026-09-28T03:00:00Z"))), "Dushanba, 28-sentabr");

// Sunday: "today" and "tomorrow" both mean Monday.
assert.equal(pickDay(sat, "today").day.date, "2026-09-28");
assert.equal(pickDay(sat, "tomorrow").day.date, "2026-09-28");
// Saturday morning: tomorrow is Sunday → Monday.
const satMorning = new Date("2026-09-26T04:00:00Z");
assert.equal(pickDay(satMorning, "today").day.date, "2026-09-26");
assert.equal(pickDay(satMorning, "tomorrow").day.date, "2026-09-28");
// A weekday: tomorrow is the next day.
assert.equal(pickDay(new Date("2026-09-29T04:00:00Z"), "tomorrow").day.date, "2026-09-30");

console.log("parent-bot: ok");
