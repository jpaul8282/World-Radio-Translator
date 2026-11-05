import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLanguage,
  isLanguageMatch,
  evaluateStationAlerts,
  clearCooldowns,
  DEFAULT_ALERT_RULES,
} from "../../src/services/languageAlertService.js";
import { RadioStation, LanguageAlertRule } from "../../src/types.js";

test("Language Alert Service: Language normalization & alias matching", async (t) => {
  await t.test("normalizeLanguage normalizes casing, trims, and cleans dashes", () => {
    assert.equal(normalizeLanguage("  SPANISH  "), "spanish");
    assert.equal(normalizeLanguage("en-US"), "en us");
    assert.equal(normalizeLanguage(""), "");
    assert.equal(normalizeLanguage(null), "");
  });

  await t.test("isLanguageMatch matches identical languages case-insensitively", () => {
    assert.ok(isLanguageMatch("Spanish", "spanish"));
    assert.ok(isLanguageMatch("FRENCH", "French"));
    assert.ok(isLanguageMatch("German", "GERMAN"));
  });

  await t.test("isLanguageMatch recognizes standard language aliases and ISO codes", () => {
    // Spanish aliases
    assert.ok(isLanguageMatch("Spanish", "es"));
    assert.ok(isLanguageMatch("Spanish", "español"));
    assert.ok(isLanguageMatch("Spanish", "castellano"));

    // French aliases
    assert.ok(isLanguageMatch("French", "fr"));
    assert.ok(isLanguageMatch("French", "français"));

    // Japanese aliases
    assert.ok(isLanguageMatch("Japanese", "ja"));
    assert.ok(isLanguageMatch("Japanese", "jpn"));
    assert.ok(isLanguageMatch("Japanese", "nihongo"));

    // German aliases
    assert.ok(isLanguageMatch("German", "de"));
    assert.ok(isLanguageMatch("German", "deutsch"));

    // Arabic aliases
    assert.ok(isLanguageMatch("Arabic", "ar"));
  });

  await t.test("isLanguageMatch returns false on unrelated languages", () => {
    assert.strictEqual(isLanguageMatch("Spanish", "Russian"), false);
    assert.strictEqual(isLanguageMatch("Japanese", "French"), false);
    assert.strictEqual(isLanguageMatch("English", "Greek"), false);
  });
});

test("Language Alert Service: Alert rule evaluation & cooldown throttling", async (t) => {
  const dummyStation: RadioStation = {
    changeid: "stn-1",
    stationuuid: "uuid-cadena-ser-123",
    name: "Cadena SER Madrid",
    url: "https://cadenaser.example.com",
    url_resolved: "https://cadenaser.example.com/live",
    homepage: "https://cadenaser.com",
    favicon: "",
    tags: "news,talk",
    country: "Spain",
    countrycode: "ES",
    state: "Madrid",
    language: "Spanish",
    votes: 500,
    clickcount: 200,
    codec: "MP3",
    bitrate: 128,
  };

  const testRules: LanguageAlertRule[] = [
    {
      id: "rule-spanish",
      targetLanguage: "Spanish",
      label: "Spanish Alert",
      enabled: true,
      minConfidence: 0.60,
      notifyToast: true,
      notifySound: true,
      autoTune: false,
      triggerCount: 0,
      createdAt: Date.now(),
    },
    {
      id: "rule-japanese",
      targetLanguage: "Japanese",
      label: "Japanese Alert",
      enabled: true,
      minConfidence: 0.70,
      notifyToast: true,
      notifySound: false,
      autoTune: true,
      triggerCount: 0,
      createdAt: Date.now(),
    },
    {
      id: "rule-french-disabled",
      targetLanguage: "French",
      label: "French Alert",
      enabled: false, // Disabled
      minConfidence: 0.50,
      notifyToast: true,
      notifySound: true,
      autoTune: false,
      triggerCount: 0,
      createdAt: Date.now(),
    },
  ];

  await t.test("evaluates match when language matches and confidence exceeds threshold", () => {
    clearCooldowns();
    const result = evaluateStationAlerts(dummyStation, "Spanish", 0.85, testRules, "background_scanner");

    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.matchedRules[0].id, "rule-spanish");
    assert.equal(result.triggers.length, 1);
    assert.equal(result.triggers[0].stationName, "Cadena SER Madrid");
    assert.equal(result.triggers[0].language, "Spanish");
    assert.equal(result.triggers[0].source, "background_scanner");
  });

  await t.test("does not trigger when confidence is below minimum threshold", () => {
    clearCooldowns();
    const result = evaluateStationAlerts(dummyStation, "Spanish", 0.45, testRules, "background_scanner");
    assert.equal(result.triggers.length, 0);
  });

  await t.test("does not trigger for disabled rules", () => {
    clearCooldowns();
    const frenchStation: RadioStation = {
      ...dummyStation,
      stationuuid: "uuid-france-info-456",
      name: "France Info",
      country: "France",
      language: "French",
    };
    const result = evaluateStationAlerts(frenchStation, "French", 0.90, testRules, "background_scanner");
    assert.equal(result.triggers.length, 0);
  });

  await t.test("throttles duplicate alerts for the same station within cooldown period", () => {
    clearCooldowns();
    // First evaluation: fires
    const firstResult = evaluateStationAlerts(dummyStation, "Spanish", 0.85, testRules, "background_scanner");
    assert.equal(firstResult.triggers.length, 1);

    // Second evaluation immediately for the same station & rule: skipped by cooldown
    const secondResult = evaluateStationAlerts(dummyStation, "Spanish", 0.85, testRules, "background_scanner");
    assert.equal(secondResult.triggers.length, 0);

    // A different station: fires even if same language
    const otherSpanishStation: RadioStation = {
      ...dummyStation,
      stationuuid: "uuid-rnek-789",
      name: "Radio Nacional de España",
    };
    const thirdResult = evaluateStationAlerts(otherSpanishStation, "Spanish", 0.85, testRules, "background_scanner");
    assert.equal(thirdResult.triggers.length, 1);
  });
});
