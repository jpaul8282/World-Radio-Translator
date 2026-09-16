import { test, describe } from "node:test";
import assert from "node:assert";
import { getTurnsForSummaryWindow, formatTurnsForSummarization } from "../../src/lib/transcriptUtils";
import { LiveTranslateTurn } from "../../src/services/liveTranslateClient";

describe("New Functionality Testing: Transcript 10-Minute Summarization Window", () => {
  const nowMs = 1757500000000; // Fixed reference point

  const testTurns: LiveTranslateTurn[] = [
    {
      id: "turn-old",
      originalText: "Ancien segment d'il y a 25 minutes",
      translatedText: "Old broadcast segment from 25 minutes ago",
      timestamp: new Date(nowMs - 25 * 60 * 1000), // 25 minutes ago
    },
    {
      id: "turn-15m",
      originalText: "Segment d'il y a 15 minutes",
      translatedText: "Segment from 15 minutes ago",
      timestamp: new Date(nowMs - 15 * 60 * 1000), // 15 minutes ago
    },
    {
      id: "turn-8m",
      originalText: "Le président annonce une nouvelle directive économique.",
      translatedText: "The president announces a new economic directive.",
      timestamp: new Date(nowMs - 8 * 60 * 1000), // 8 minutes ago (within 10m window)
    },
    {
      id: "turn-5m",
      originalText: "Des perturbations sur les lignes de métro sont signalées.",
      translatedText: "Disruptions on the subway lines are reported.",
      timestamp: new Date(nowMs - 5 * 60 * 1000), // 5 minutes ago (within 10m window)
    },
    {
      id: "turn-1m",
      originalText: "Passons maintenant aux prévisions météo pour demain.",
      translatedText: "Moving on now to tomorrow's weather forecast.",
      timestamp: new Date(nowMs - 1 * 60 * 1000), // 1 minute ago (within 10m window)
    },
  ];

  test("returns empty array when turns list is empty", () => {
    assert.deepStrictEqual(getTurnsForSummaryWindow([], 10, nowMs), []);
  });

  test("correctly filters turns within the 10-minute window", () => {
    const windowTurns = getTurnsForSummaryWindow(testTurns, 10, nowMs);
    assert.strictEqual(windowTurns.length, 3);
    assert.strictEqual(windowTurns[0].id, "turn-8m");
    assert.strictEqual(windowTurns[1].id, "turn-5m");
    assert.strictEqual(windowTurns[2].id, "turn-1m");
  });

  test("correctly filters turns within a custom 20-minute window", () => {
    const windowTurns = getTurnsForSummaryWindow(testTurns, 20, nowMs);
    assert.strictEqual(windowTurns.length, 4);
    assert.strictEqual(windowTurns[0].id, "turn-15m");
  });

  test("falls back to recent turns when all turns are older than the specified window", () => {
    const oldTurnsOnly = testTurns.slice(0, 2); // 25m and 15m ago
    const result = getTurnsForSummaryWindow(oldTurnsOnly, 10, nowMs);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].id, "turn-old");
    assert.strictEqual(result[1].id, "turn-15m");
  });

  test("formatTurnsForSummarization formats turns chronologically with speaker labels", () => {
    const formatted = formatTurnsForSummarization(testTurns.slice(2));
    assert.ok(formatted.includes("Native Audio: \"Le président annonce une nouvelle directive économique.\""));
    assert.ok(formatted.includes("Translated: \"The president announces a new economic directive.\""));
    assert.ok(formatted.includes("Translated: \"Moving on now to tomorrow's weather forecast.\""));
  });

  test("formatTurnsForSummarization returns placeholder for empty turns", () => {
    const formatted = formatTurnsForSummarization([]);
    assert.strictEqual(formatted, "No transcript turns recorded.");
  });
});
