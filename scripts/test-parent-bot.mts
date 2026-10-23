// Tests for supabase/functions/parent-bot/bot.ts (the parts without a database):
//   node --experimental-strip-types scripts/test-parent-bot.mts
import assert from "node:assert/strict";
import { dayLabel, morning, parseClass, pickDay, quizParams, tashkentDay } from "../supabase/functions/parent-bot/bot.ts";
import type { Db, Tg } from "../supabase/functions/parent-bot/bot.ts";

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

// Quiz polls: fits Telegram's limits or is skipped.
const q = { question: "2 + 2 = ?", options: ["3", "4"], correct: 1, explanation: "Ikki qo‘shish ikki.", image: null };
assert.equal(quizParams(q, "Matematika")?.correct_option_id, 1);
assert.equal(quizParams(q, "Matematika")?.question, "🧠 Matematika: 2 + 2 = ?");
assert.equal(quizParams({ ...q, image: "tests/a.jpg" }, null), null);
assert.equal(quizParams({ ...q, options: ["x".repeat(101), "4"] }, null), null);
assert.equal(quizParams({ ...q, correct: 5 }, null), null);
assert.equal("explanation" in quizParams({ ...q, explanation: "x".repeat(201) }, null)!, false);
console.log("quiz ok");

// --- The 07:00 lessons broadcast -------------------------------------------------------------
// A stand-in for the part of the Supabase client bot.ts uses: the calls chain and the whole thing
// is awaited, so the query object itself is handed to a per-test handler.
class Q {
  table: string;
  handle: (q: Q) => { data?: unknown; count?: number };
  op = "select";
  cols = "";
  opts: { head?: boolean } | undefined;
  eqs: Record<string, unknown> = {};
  patch: Record<string, unknown> | null = null;
  ids: unknown[] | null = null;
  constructor(table: string, handle: (q: Q) => { data?: unknown; count?: number }) {
    this.table = table;
    this.handle = handle;
  }
  select(cols: string, opts?: { head?: boolean }) {
    this.cols = cols;
    this.opts = opts;
    return this;
  }
  eq(column: string, value: unknown) {
    this.eqs[column] = value;
    return this;
  }
  update(patch: Record<string, unknown>) {
    this.op = "update";
    this.patch = patch;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  in(_column: string, ids: unknown[]) {
    this.ids = ids;
    return this;
  }
  not() { return this; }
  or() { return this; }
  lte() { return this; }
  gte() { return this; }
  order() { return this; }
  limit() { return this; }
  range() { return this; }
  maybeSingle() { return this; }
  then(ok: (v: unknown) => unknown, bad?: (e: unknown) => unknown) {
    return Promise.resolve(this.handle(this)).then(ok, bad);
  }
}

type Sent = { chat_id: number; text: string };

function run(opts: { now: Date; holiday?: boolean; chats: { chat_id: number; class_id: number }[]; blocked?: number[] }) {
  const marked: unknown[] = [];
  const deleted: unknown[] = [];
  const sent: Sent[] = [];
  const db = {
    from: (table: string) =>
      new Q(table, (q) => {
        if (table === "calendar_periods") return { data: opts.holiday ? [{ title_uz: "Kuzgi ta’til" }] : [] };
        if (table === "parent_bot_chats") {
          if (q.op === "update") {
            marked.push({ patch: q.patch, ids: q.ids });
            return {};
          }
          if (q.op === "delete") {
            deleted.push(...(q.ids ?? []));
            return {};
          }
          return { data: opts.chats };
        }
        if (table === "school_classes") {
          const id = Number(q.eqs.id);
          return { data: { id, grade: 7 + id, letter: "A" } };
        }
        if (table === "lessons") {
          // Class 2 has no timetable that day; the head request is the count check.
          const empty = Number(q.eqs.class_id) === 2;
          if (q.opts?.head) return { count: empty ? 0 : 2 };
          return {
            data: empty ? [] : [{ period: 1, teacher: "Aliyev A.", alt_teacher: null, subject: { name_uz: "Matematika" }, alt: null }],
          };
        }
        return { data: [] };
      }),
  };
  const tg: Tg = async (method, params) => {
    if (method !== "sendMessage") return { ok: true };
    const chat_id = Number(params.chat_id);
    if (opts.blocked?.includes(chat_id)) return { ok: false, error_code: 403, description: "bot was blocked" };
    sent.push({ chat_id, text: String(params.text) });
    return { ok: true };
  };
  return morning(db as unknown as Db, tg, opts.now).then((result) => ({ result, sent, marked, deleted }));
}

const monday = new Date("2026-09-28T02:00:00Z"); // 07:00 in Tashkent
const sunday = new Date("2026-09-27T02:00:00Z");
const chats = [{ chat_id: 10, class_id: 1 }, { chat_id: 11, class_id: 1 }, { chat_id: 12, class_id: 2 }];

// Sunday and holidays: nothing goes out at all.
assert.equal((await run({ now: sunday, chats })).result.skipped, "yakshanba");
assert.equal((await run({ now: monday, holiday: true, chats })).result.skipped, "ta’til");

// A normal morning: the two chats of the class that has lessons, and nothing for the class that has none.
const day = await run({ now: monday, chats });
assert.deepEqual(day.sent.map((m) => m.chat_id), [10, 11]);
assert.match(day.sent[0].text, /Xayrli tong/);
assert.match(day.sent[0].text, /Matematika/);
assert.equal(day.result.sent, 2);
// Only the chats actually reached are marked, so a failed send is retried in the next run.
assert.deepEqual(day.marked, [{ patch: { morning_sent_on: "2026-09-28" }, ids: [10, 11] }]);
assert.deepEqual(day.deleted, []);

// A parent who blocked the bot is dropped, and is not marked as sent.
const blocked = await run({ now: monday, chats, blocked: [11] });
assert.deepEqual(blocked.sent.map((m) => m.chat_id), [10]);
assert.deepEqual(blocked.deleted, [11]);
assert.deepEqual(blocked.marked, [{ patch: { morning_sent_on: "2026-09-28" }, ids: [10] }]);
assert.equal(blocked.result.removed, 1);

console.log("ertalabki darslar: ok");
