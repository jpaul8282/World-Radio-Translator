import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizeFilenamePart,
  formatSessionFilename,
  buildBroadcastSessionExport,
  BroadcastSessionExport,
} from "../../src/lib/sessionExport.js";
import { RadioStation, BookmarkedTurn } from "../../src/types.js";
import { LiveTranslateTurn, LiveTranslateState } from "../../src/services/liveTranslateClient.js";

test("Session Export: Filename sanitization and formatting", async (t) => {
  await t.test("sanitizeFilenamePart replaces non-alphanumeric characters with hyphens", () => {
    assert.equal(sanitizeFilenamePart("BBC World Service (UK) 93.2!"), "bbc-world-service-uk-93-2");
    assert.equal(sanitizeFilenamePart("NHK ラジオ第1"), "nhk-1");
    assert.equal(sanitizeFilenamePart(""), "unnamed-station");
    assert.equal(sanitizeFilenamePart("   "), "unnamed-station");
    assert.equal(sanitizeFilenamePart("---Radio-France---"), "radio-france");
  });

  await t.test("formatSessionFilename includes station name and valid timestamp structure", () => {
    const fixedDate = new Date("2026-09-13T12:30:00.000Z");
    const filename = formatSessionFilename("Radio France Internationale", fixedDate);
    assert.ok(filename.startsWith("session_radio-france-internationale_"));
    assert.ok(filename.endsWith(".json"));
    assert.ok(filename.includes("2026-09-13T12-30-00"));
  });

  await t.test("formatSessionFilename handles empty station name fallback", () => {
    const fixedDate = new Date("2026-09-13T12:30:00.000Z");
    const filename = formatSessionFilename(undefined, fixedDate);
    assert.equal(filename, "session_broadcast-session_2026-09-13T12-30-00-000Z.json");
  });
});

test("Session Export: buildBroadcastSessionExport", async (t) => {
  const mockStation: RadioStation = {
    changeid: "ch-123",
    stationuuid: "uuid-bbc-001",
    name: "BBC World Service",
    url: "https://stream.live.bbcspeakers.org/live.mp3",
    url_resolved: "https://stream.live.bbcspeakers.org/live.mp3",
    homepage: "https://bbc.co.uk/worldserviceradio",
    favicon: "https://bbc.co.uk/favicon.ico",
    tags: "news,talk,world,international",
    country: "United Kingdom",
    countrycode: "GB",
    state: "London",
    language: "english",
    votes: 4500,
    clickcount: 22000,
    codec: "MP3",
    bitrate: 128,
    geo_lat: 51.5074,
    geo_long: -0.1278,
  };

  const startTime = new Date("2026-09-13T10:00:00.000Z");
  const middleTime = new Date("2026-09-13T10:02:30.000Z");
  const endTime = new Date("2026-09-13T10:05:00.000Z");

  const mockTurns: LiveTranslateTurn[] = [
    {
      id: "turn-1",
      originalText: "Good morning, this is the BBC World Service live from London.",
      translatedText: "Bonjour, ici la BBC World Service en direct de Londres.",
      timestamp: startTime,
    },
    {
      id: "turn-2",
      originalText: "Today we are analyzing renewable energy progress across European coastlines.",
      translatedText: "Aujourd'hui nous analysons les progrès des énergies renouvelables sur les côtes européennes.",
      timestamp: middleTime,
    },
    {
      id: "turn-3",
      originalText: "Here is the summary of global market closes.",
      translatedText: "Voici le résumé de la clôture des marchés mondiaux.",
      timestamp: endTime,
    },
  ];

  const mockBookmarks: BookmarkedTurn[] = [
    {
      id: "bm-1",
      originalText: "Today we are analyzing renewable energy progress across European coastlines.",
      translatedText: "Aujourd'hui nous analysons les progrès des énergies renouvelables sur les côtes européennes.",
      timestamp: middleTime.toISOString(),
      stationName: "BBC World Service",
      stationCountry: "United Kingdom",
      targetLanguage: "French",
      bookmarkedAt: middleTime.getTime() + 1000,
    },
  ];

  const mockLiveState: LiveTranslateState = {
    status: "connected",
    error: null,
    userTranscript: "Partial incoming audio buffer...",
    modelTranscript: "Tampon audio partiel en cours...",
    turns: mockTurns,
  };

  await t.test("correctly bundles station metadata, all turns, and bookmarks", () => {
    const fixedExportDate = new Date("2026-09-13T10:06:00.000Z");

    const exported: BroadcastSessionExport = buildBroadcastSessionExport({
      station: mockStation,
      turns: mockTurns,
      bookmarks: mockBookmarks,
      targetLanguage: "French",
      liveStatus: "connected",
      liveState: mockLiveState,
      appVersion: "1.2.0",
      exportDate: fixedExportDate,
    });

    // Check core app information
    assert.equal(exported.app, "Remix: World Radio Translator");
    assert.equal(exported.version, "1.2.0");
    assert.equal(exported.exportedAt, "2026-09-13T10:06:00.000Z");

    // Check session metadata
    assert.equal(exported.session.targetLanguage, "French");
    assert.equal(exported.session.status, "connected");
    assert.equal(exported.session.totalTurns, 3);
    assert.equal(exported.session.totalBookmarks, 1);
    assert.equal(exported.session.sessionStartTime, "2026-09-13T10:00:00.000Z");
    assert.equal(exported.session.sessionEndTime, "2026-09-13T10:05:00.000Z");
    assert.equal(exported.session.durationEstimateSeconds, 300); // 5 minutes = 300s

    // Check station payload
    assert.ok(exported.station !== null);
    assert.equal(exported.station.name, "BBC World Service");
    assert.equal(exported.station.country, "United Kingdom");
    assert.equal(exported.station.bitrate, 128);

    // Check transcripts array
    assert.equal(exported.transcripts.length, 3);
    assert.equal(exported.transcripts[0].originalText, "Good morning, this is the BBC World Service live from London.");
    assert.equal(exported.transcripts[0].translatedText, "Bonjour, ici la BBC World Service en direct de Londres.");
    assert.equal(exported.transcripts[0].turnIndex, 1);
    assert.equal(exported.transcripts[1].turnIndex, 2);

    // Check bookmarks array
    assert.equal(exported.bookmarks.length, 1);
    assert.equal(exported.bookmarks[0].id, "bm-1");
    assert.equal(exported.bookmarks[0].stationName, "BBC World Service");

    // Check live buffer
    assert.ok(exported.liveBuffer);
    assert.equal(exported.liveBuffer.userTranscript, "Partial incoming audio buffer...");
    assert.equal(exported.liveBuffer.modelTranscript, "Tampon audio partiel en cours...");

    // Validate valid JSON stringification without errors
    const serialized = JSON.stringify(exported, null, 2);
    assert.ok(serialized.length > 500);
    const parsed = JSON.parse(serialized);
    assert.equal(parsed.station.name, "BBC World Service");
    assert.equal(parsed.transcripts.length, 3);
    assert.equal(parsed.bookmarks.length, 1);
  });

  await t.test("handles session with null station, empty turns, and empty bookmarks gracefully", () => {
    const fixedExportDate = new Date("2026-09-13T10:10:00.000Z");

    const exported = buildBroadcastSessionExport({
      station: null,
      turns: [],
      bookmarks: [],
      targetLanguage: "Spanish",
      exportDate: fixedExportDate,
    });

    assert.equal(exported.station, null);
    assert.equal(exported.transcripts.length, 0);
    assert.equal(exported.bookmarks.length, 0);
    assert.equal(exported.session.totalTurns, 0);
    assert.equal(exported.session.totalBookmarks, 0);
    assert.equal(exported.session.targetLanguage, "Spanish");
    assert.equal(exported.session.sessionStartTime, undefined);
    assert.equal(exported.session.sessionEndTime, undefined);
    assert.equal(exported.session.durationEstimateSeconds, undefined);
    assert.equal(exported.liveBuffer, undefined);
  });
});
