// Checks the pasted-text test parser: node --experimental-strip-types scripts/test-question-import.mts
import assert from "node:assert/strict";
import { parseQuestionRows, parseQuestionText } from "../src/lib/test-import.ts";

// Numbered, answers marked with * and "Javob:", an explanation, a two-line question.
let r = parseQuestionText(`1. 2 + 2 = ?
A) 3
*B) 4
C) 5
D) 6
Izoh: ikki qo‘shuv ikki.

2) Poytaxtimiz qaysi shahar?
Tanlang:
a) Samarqand
b) Toshkent
c) Buxoro
d) Xiva
Javob: b`);
assert.deepEqual(r.errors, []);
assert.equal(r.questions.length, 2);
assert.equal(r.questions[0].correct, 1);
assert.equal(r.questions[0].explanation, "ikki qo‘shuv ikki.");
assert.equal(r.questions[1].question, "Poytaxtimiz qaysi shahar?\nTanlang:");
assert.equal(r.questions[1].options[1], "Toshkent");
assert.equal(r.questions[1].correct, 1);

// Key at the end, Cyrillic letters, "A." style.
r = parseQuestionText(`1. Вопрос один
А. да
Б. нет
2. Вопрос два
А. x
Б. y
В. z

Ответы: 1-Б, 2-В`);
assert.deepEqual(r.errors, []);
assert.deepEqual(r.questions.map((q) => q.correct), [1, 2]);

// Unnumbered questions follow each other; explanation ends at a blank line.
r = parseQuestionText(`Birinchi savol
A) bir
B) ikki *
Izoh: chunki
shunday

Ikkinchi savol
A) uch
B) to‘rt
Javob: A`);
assert.deepEqual(r.errors, []);
assert.equal(r.questions.length, 2);
assert.equal(r.questions[0].explanation, "chunki\nshunday");
assert.equal(r.questions[1].question, "Ikkinchi savol");

// Missing answer is reported, nothing is guessed.
r = parseQuestionText(`1. Savol\nA) x\nB) y`);
assert.equal(r.questions.length, 0);
assert.match(r.errors[0], /to‘g‘ri javob belgilanmagan/);

// A question mentioning "Kalit so‘z" is not an answer key.
r = parseQuestionText(`1. Kalit so‘z nima?\nA) x\n*B) y`);
assert.deepEqual(r.errors, []);
assert.equal(r.questions[0].question, "Kalit so‘z nima?");

// Excel rows: header, sample row skipped, numeric answer, missing option column.
r = parseQuestionRows([
  ["Savol", "A", "B", "C", "D", "Javob", "Izoh"],
  ["Namuna: 1+1?", "1", "2", "3", "4", "B", ""],
  ["3 × 3 = ?", "6", "9", "12", null, "B", "ko‘paytirish"],
  ["Rang?", "qizil", "yashil", null, null, 2, null],
  ["Yomon", "x", null, null, null, "A", null],
]);
assert.equal(r.questions.length, 2);
assert.deepEqual(r.questions[0].options, ["6", "9", "12"]);
assert.equal(r.questions[1].correct, 1);
assert.equal(r.errors.length, 1);

// Topic and difficulty (text and Excel).
{
  const t = parseQuestionText("1. 2 + 2 = ?\nA) 3\n*B) 4\nMavzu: Qo‘shish\nQiyinlik: oson\n2. 3 · 3 = ?\nA) 9\nB) 6\nJavob: A");
  assert.equal(t.errors.length, 0);
  assert.equal(t.questions[0].topic, "Qo‘shish");
  assert.equal(t.questions[0].difficulty, 1);
  assert.equal(t.questions[1].topic, null);
  const x = parseQuestionRows([["Savol", "A", "B", "Javob", "Mavzu", "Qiyinlik"], ["1 + 1", "2", "3", "A", "Sonlar", "o‘rta"]]);
  assert.equal(x.questions[0].topic, "Sonlar");
  assert.equal(x.questions[0].difficulty, 2);
}

console.log("test-question-import: ok");
