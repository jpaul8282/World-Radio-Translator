import test from "node:test";
import assert from "node:assert/strict";
import {
  encodeStationForUrl,
  decodeStationFromUrl,
  generateSessionShareUrl,
  parseSessionShareUrl,
  formatSessionShareInvitation,
  SessionShareState,
} from "../../src/lib/sessionShare.js";
import { RadioStation } from "../../src/types.js";

test("Session Deep-Link Sharing: Station serialization", async (t) => {
  const mockStation: RadioStation = {
    changeid: "ch-abc-1",
    stationuuid: "stn-uuid-999",
    name: "Radio France Inter",
    url: "https://stream.radiofrance.fr/franceinter/mid.mp3",
    url_resolved: "https://stream.radiofrance.fr/franceinter/mid.mp3",
    homepage: "https://radiofrance.fr/franceinter",
    favicon: "https://radiofrance.fr/favicon.ico",
    tags: "news,talk,french,culture",
    country: "France",
    countrycode: "FR",
    state: "Paris",
    language: "french",
    votes: 980,
    clickcount: 14500,
    codec: "MP3",
    bitrate: 192,
    geo_lat: 48.8566,
    geo_long: 2.3522,
  };

  await t.test("encodes and decodes station round-trip accurately", () => {
    const encoded = encodeStationForUrl(mockStation);
    assert.ok(encoded.length > 0);

    const decoded = decodeStationFromUrl(encoded);
    assert.ok(decoded);
    assert.equal(decoded.stationuuid, mockStation.stationuuid);
    assert.equal(decoded.name, mockStation.name);
    assert.equal(decoded.url, mockStation.url);
    assert.equal(decoded.country, mockStation.country);
    assert.equal(decoded.language, mockStation.language);
    assert.equal(decoded.bitrate, mockStation.bitrate);
    assert.equal(decoded.geo_lat, mockStation.geo_lat);
    assert.equal(decoded.geo_long, mockStation.geo_long);
  });

  await t.test("decodeStationFromUrl returns null on invalid or corrupted string", () => {
    assert.equal(decodeStationFromUrl("not-valid-base64!"), null);
    assert.equal(decodeStationFromUrl(""), null);
  });
});

test("Session Deep-Link Sharing: URL Generation & Parsing", async (t) => {
  const mockStation: RadioStation = {
    changeid: "ch-2",
    stationuuid: "bbc-world-live-01",
    name: "BBC World Service",
    url: "https://stream.live.bbcspeakers.org/live.mp3",
    url_resolved: "https://stream.live.bbcspeakers.org/live.mp3",
    homepage: "https://bbc.co.uk",
    favicon: "https://bbc.co.uk/favicon.ico",
    tags: "news,international",
    country: "United Kingdom",
    countrycode: "GB",
    state: "London",
    language: "english",
    votes: 3000,
    clickcount: 50000,
    codec: "MP3",
    bitrate: 128,
    geo_lat: 51.5074,
    geo_long: -0.1278,
  };

  const sampleState: SessionShareState = {
    station: mockStation,
    targetLanguage: "Spanish",
    filters: {
      tab: "radio",
      radiusKm: 750,
      selectedCoords: { lat: 51.5074, lng: -0.1278 },
      country: "United Kingdom",
      transcriptView: "all",
      transcriptSearch: "climate",
    },
    autoPlay: true,
  };

  await t.test("generateSessionShareUrl builds valid URL with all parameters", () => {
    const shareUrl = generateSessionShareUrl("https://worldradiotranslator.org/", sampleState);
    assert.ok(shareUrl.startsWith("https://worldradiotranslator.org/?"));
    assert.ok(shareUrl.includes("share=session"));
    assert.ok(shareUrl.includes("targetLang=Spanish"));
    assert.ok(shareUrl.includes("stName=BBC+World+Service") || shareUrl.includes("stName=BBC%20World%20Service"));
    assert.ok(shareUrl.includes("tab=radio"));
    assert.ok(shareUrl.includes("radius=750"));
    assert.ok(shareUrl.includes("lat=51.5074"));
    assert.ok(shareUrl.includes("lng=-0.1278"));
    assert.ok(shareUrl.includes("search=climate"));
    assert.ok(shareUrl.includes("autoplay=1"));
    assert.ok(shareUrl.includes("stData="));
  });

  await t.test("parseSessionShareUrl extracts state, station, and active filters accurately", () => {
    const shareUrl = generateSessionShareUrl("https://worldradiotranslator.org/", sampleState);
    const parsed = parseSessionShareUrl(shareUrl);

    assert.equal(parsed.isValid, true);
    assert.equal(parsed.targetLanguage, "Spanish");
    assert.equal(parsed.autoPlay, true);
    assert.equal(parsed.filters.tab, "radio");
    assert.equal(parsed.filters.radiusKm, 750);
    assert.ok(parsed.filters.selectedCoords);
    assert.equal(parsed.filters.selectedCoords?.lat, 51.5074);
    assert.equal(parsed.filters.selectedCoords?.lng, -0.1278);
    assert.equal(parsed.filters.transcriptSearch, "climate");

    assert.ok(parsed.station);
    assert.equal(parsed.station?.name, "BBC World Service");
    assert.equal(parsed.station?.stationuuid, "bbc-world-live-01");
    assert.equal(parsed.station?.language, "english");
  });

  await t.test("parseSessionShareUrl handles podcast stream session sharing", () => {
    const podcastState: SessionShareState = {
      station: {
        changeid: "pod-1",
        stationuuid: "podcast-npr-upfirst",
        name: "NPR Up First Live",
        url: "https://play.podtrac.com/npr-510318/edge1.mp3",
        url_resolved: "https://play.podtrac.com/npr-510318/edge1.mp3",
        homepage: "https://npr.org",
        favicon: "https://npr.org/favicon.ico",
        tags: "podcast,news,daily",
        country: "United States",
        countrycode: "US",
        state: "DC",
        language: "english",
        votes: 1200,
        clickcount: 8500,
        codec: "MP3",
        bitrate: 128,
      },
      targetLanguage: "Japanese",
      filters: {
        tab: "podcasts",
        podcastCategory: "News & Current Affairs",
      },
      autoPlay: true,
    };

    const shareUrl = generateSessionShareUrl("https://worldradiotranslator.org/", podcastState);
    const parsed = parseSessionShareUrl(shareUrl);

    assert.equal(parsed.isValid, true);
    assert.equal(parsed.targetLanguage, "Japanese");
    assert.equal(parsed.filters.tab, "podcasts");
    assert.equal(parsed.filters.podcastCategory, "News & Current Affairs");
    assert.equal(parsed.station?.name, "NPR Up First Live");
  });

  await t.test("formatSessionShareInvitation formats friendly message with station and target language", () => {
    const shareUrl = "https://worldradiotranslator.org/?share=session&targetLang=Spanish";
    const msg = formatSessionShareInvitation(sampleState, shareUrl);

    assert.ok(msg.includes("BBC World Service"));
    assert.ok(msg.includes("Spanish"));
    assert.ok(msg.includes(shareUrl));
  });
});
