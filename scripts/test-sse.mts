// Reading the assistant's stream: node --experimental-strip-types scripts/test-sse.mts
// The parser has to survive chunk boundaries falling anywhere, because they do.

import assert from "node:assert/strict";
import { readEvents } from "../src/lib/sse.ts";

/** Feeds a stream to the parser in the given chunks, the way a reader does. */
function collect(chunks: string[]) {
  let buffer = "";
  const all = [];
  for (const chunk of chunks) {
    buffer += chunk;
    const { events, rest } = readEvents(buffer);
    buffer = rest;
    all.push(...events);
  }
  return all;
}

const stream = `data: {"text":"Maktab"}\n\ndata: {"text":" telefoni: "}\n\ndata: {"text":"+998 90 970 90 91."}\n\ndata: {"done":true}\n\n`;

// Whole stream at once.
assert.deepEqual(collect([stream]), [{ text: "Maktab" }, { text: " telefoni: " }, { text: "+998 90 970 90 91." }, { done: true }]);

// One byte at a time — the worst case a slow connection can produce.
assert.deepEqual(collect([...stream]).map((e) => e.text ?? "").join(""), "Maktab telefoni: +998 90 970 90 91.");

// A split inside the JSON, and one between the two newlines that end a block.
assert.deepEqual(collect([`data: {"text":"Sal`, `om"}\n`, `\ndata: {"done":true}\n\n`]), [{ text: "Salom" }, { done: true }]);

// Nothing is emitted until a block is finished, so half an event never reaches the page.
assert.deepEqual(readEvents(`data: {"text":"yarim"`).events, []);
assert.equal(readEvents(`data: {"text":"yarim"`).rest, `data: {"text":"yarim"`);

// Errors travel on the same channel as the text.
assert.deepEqual(collect([`data: {"error":"too_many"}\n\n`]), [{ error: "too_many" }]);

// A block that is not JSON (a proxy's keep-alive comment, a truncated tail) is skipped, not thrown.
assert.deepEqual(collect([`: keep-alive\n\ndata: not json\n\ndata: {"text":"ok"}\n\n`]), [{ text: "ok" }]);

console.log("sse: ok");
