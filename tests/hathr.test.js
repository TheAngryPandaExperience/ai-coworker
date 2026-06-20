import test from "node:test";
import assert from "node:assert/strict";
import { buildAreaPrompt, getArea, HATHR_AREAS } from "../src/hathr/areas.js";
import { createHumanTiming } from "../src/hathr/human-timing.js";
import { getChatUrl, loadHathrConfig } from "../src/hathr/config.js";

test("HATHR_AREAS defines three independent areas", () => {
  assert.equal(HATHR_AREAS.length, 3);
  assert.deepEqual(
    HATHR_AREAS.map((area) => area.id),
    ["hpi", "meds-dx", "therapy"]
  );
});

test("buildAreaPrompt creates HPI prompt from content", () => {
  const prompt = buildAreaPrompt("hpi", { content: "Patient reports chest pain." });
  assert.match(prompt, /HPI/i);
  assert.match(prompt, /Patient reports chest pain/);
});

test("meds-dx prompt requires date", () => {
  assert.throws(
    () => buildAreaPrompt("meds-dx", { content: "Lisinopril 10mg daily" }),
    /date/i
  );
});

test("meds-dx prompt includes selected date and directions language", () => {
  const prompt = buildAreaPrompt("meds-dx", {
    content: "Lisinopril 10mg PO daily",
    date: "2026-06-20",
  });
  assert.match(prompt, /2026-06-20/);
  assert.match(prompt, /directions/i);
});

test("therapy prompt requires dates list", () => {
  assert.throws(
    () => buildAreaPrompt("therapy", { content: "CBT session notes" }),
    /dates/i
  );
});

test("therapy prompt includes provided dates", () => {
  const prompt = buildAreaPrompt("therapy", {
    content: "Client engaged in exposure exercise.",
    dates: "2026-06-01, 2026-06-08",
  });
  assert.match(prompt, /2026-06-01, 2026-06-08/);
  assert.match(prompt, /therapy/i);
});

test("getArea returns area metadata", () => {
  const area = getArea("therapy");
  assert.ok(area);
  assert.equal(area.shortcut, "F3");
});

test("human timing stays within configured bounds", async () => {
  let index = 0;
  const values = [0.5, 0.5, 1, 0.25, 0.75];
  const timing = createHumanTiming(() => values[index++ % values.length]);

  const ranged = timing.intBetween(10, 20);
  assert.ok(ranged >= 10 && ranged <= 20);

  const delay = timing.typingDelay(40, 100);
  assert.ok(delay >= 40 && delay <= 100);

  const started = Date.now();
  await timing.pause(50, 50);
  assert.ok(Date.now() - started >= 45);
});

test("hathr config loads and resolves chat URL", () => {
  const config = loadHathrConfig();
  assert.match(config.appUrl, /hathr/i);
  assert.equal(getChatUrl(config), "https://app.hathr.ai/chat");
});
