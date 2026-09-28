/**
 * Reading server-sent events from the assistant's Edge Function (`data: {…}` blocks separated by a blank
 * line). Network chunks fall wherever they like — mid-word, mid-JSON, between the two newlines — so a
 * reader keeps the tail until the block it belongs to is complete. Shared by the chat and by the admin's
 * test button, and covered by `scripts/test-sse.mts`.
 */
export type AssistantEvent = { text?: string; done?: boolean; error?: string };

/** Pulls the events out of what has arrived so far and hands back the unfinished tail. */
export function readEvents(buffer: string): { events: AssistantEvent[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: AssistantEvent[] = [];
  for (const block of blocks) {
    const line = block.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(6)) as AssistantEvent);
    } catch {
      // A block that is not JSON is not something to show a parent — skip it and keep reading.
    }
  }
  return { events, rest };
}
