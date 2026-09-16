import { test, describe } from "node:test";
import assert from "node:assert";
import { filterTranscriptTurns, splitTextByKeyword, escapeRegExp } from "../../src/lib/transcriptUtils";
import { LiveTranslateTurn } from "../../src/services/liveTranslateClient";

describe("New Functionality Testing: Transcript Feed Keyword Search", () => {
  const sampleTurns: LiveTranslateTurn[] = [
    {
      id: "turn-1",
      originalText: "Buenas tardes, transmitiendo en vivo desde Madrid con las noticias del clima.",
      translatedText: "Good afternoon, broadcasting live from Madrid with the weather forecast.",
      timestamp: new Date("2026-09-10T10:00:00Z"),
    },
    {
      id: "turn-2",
      originalText: "Une réunion d'urgence a été convoquée par le conseil municipal de Paris.",
      translatedText: "An emergency meeting has been called by the Paris city council.",
      timestamp: new Date("2026-09-10T10:01:00Z"),
    },
    {
      id: "turn-3",
      originalText: "Hier ist der Deutschlandfunk mit dem aktuellen Kulturmagazin.",
      translatedText: "This is Deutschlandfunk with the current culture magazine broadcast.",
      timestamp: new Date("2026-09-10T10:02:00Z"),
    },
    {
      id: "turn-4",
      originalText: "El equipo de fútbol local ganó la copa nacional en un partido dramático.",
      translatedText: "The local soccer team won the national cup in a dramatic match.",
      timestamp: new Date("2026-09-10T10:03:00Z"),
    },
  ];

  test("filterTranscriptTurns returns all turns when query is empty or whitespace", () => {
    assert.strictEqual(filterTranscriptTurns(sampleTurns, "").length, 4);
    assert.strictEqual(filterTranscriptTurns(sampleTurns, "   ").length, 4);
  });

  test("filterTranscriptTurns matches keywords in original foreign language text", () => {
    const resultsMadrid = filterTranscriptTurns(sampleTurns, "madrid");
    assert.strictEqual(resultsMadrid.length, 1);
    assert.strictEqual(resultsMadrid[0].id, "turn-1");

    const resultsParis = filterTranscriptTurns(sampleTurns, "urgence");
    assert.strictEqual(resultsParis.length, 1);
    assert.strictEqual(resultsParis[0].id, "turn-2");

    const resultsFutbol = filterTranscriptTurns(sampleTurns, "fútbol");
    assert.strictEqual(resultsFutbol.length, 1);
    assert.strictEqual(resultsFutbol[0].id, "turn-4");
  });

  test("filterTranscriptTurns matches keywords in translated target text", () => {
    const resultsWeather = filterTranscriptTurns(sampleTurns, "weather");
    assert.strictEqual(resultsWeather.length, 1);
    assert.strictEqual(resultsWeather[0].id, "turn-1");

    const resultsEmergency = filterTranscriptTurns(sampleTurns, "emergency");
    assert.strictEqual(resultsEmergency.length, 1);
    assert.strictEqual(resultsEmergency[0].id, "turn-2");

    const resultsSoccer = filterTranscriptTurns(sampleTurns, "soccer");
    assert.strictEqual(resultsSoccer.length, 1);
    assert.strictEqual(resultsSoccer[0].id, "turn-4");
  });

  test("filterTranscriptTurns performs case-insensitive search and trims whitespace", () => {
    const resultsCase = filterTranscriptTurns(sampleTurns, "  CULTURE  ");
    assert.strictEqual(resultsCase.length, 1);
    assert.strictEqual(resultsCase[0].id, "turn-3");
  });

  test("filterTranscriptTurns returns empty array when keyword does not exist", () => {
    const noResults = filterTranscriptTurns(sampleTurns, "nonexistent-keyword-xyz");
    assert.strictEqual(noResults.length, 0);
  });

  test("escapeRegExp safely neutralizes regex special characters", () => {
    const input = "test (100% weather [update] & $10)?";
    const escaped = escapeRegExp(input);
    assert.doesNotThrow(() => {
      const regex = new RegExp(escaped, "gi");
      assert.strictEqual(regex.test("test (100% weather [update] & $10)?"), true);
    });
  });

  test("splitTextByKeyword splits text into matching and non-matching chunks", () => {
    const chunks = splitTextByKeyword("Good morning live radio world", "radio");
    assert.strictEqual(chunks.length, 3);
    assert.strictEqual(chunks[0].text, "Good morning live ");
    assert.strictEqual(chunks[0].isMatch, false);
    assert.strictEqual(chunks[1].text, "radio");
    assert.strictEqual(chunks[1].isMatch, true);
    assert.strictEqual(chunks[2].text, " world");
    assert.strictEqual(chunks[2].isMatch, false);
  });
});
