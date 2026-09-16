import { test, describe } from "node:test";
import assert from "node:assert";
import {
  CURATED_PODCAST_SHOWS,
  PODCAST_CATEGORIES,
  podcastToStation,
  filterPodcastShows,
} from "../../src/lib/podcastDirectory";

describe("Live Podcast Shows: Directory and Filter Engine", () => {
  test("CURATED_PODCAST_SHOWS contains valid, authenticated live podcast shows", () => {
    assert.ok(CURATED_PODCAST_SHOWS.length >= 8, "Expected at least 8 curated live podcast shows");

    const ids = new Set<string>();
    const uuids = new Set<string>();

    for (const show of CURATED_PODCAST_SHOWS) {
      assert.ok(show.id && show.id.length > 0, `Show missing ID: ${JSON.stringify(show)}`);
      assert.ok(show.showName && show.showName.length > 0, `Show missing showName: ${show.id}`);
      assert.ok(show.network && show.network.length > 0, `Show missing network: ${show.id}`);
      assert.ok(show.episodeOrTopic && show.episodeOrTopic.length > 0, `Show missing topic: ${show.id}`);
      assert.ok(show.streamUrl.startsWith("http"), `Show streamUrl must start with http: ${show.id}`);
      assert.ok(show.country && show.country.length > 0, `Show country missing: ${show.id}`);
      assert.ok(show.language && show.language.length > 0, `Show language missing: ${show.id}`);
      assert.ok(PODCAST_CATEGORIES.includes(show.category), `Category invalid for show: ${show.id}`);
      assert.strictEqual(show.isLive, true, `Show must be live: ${show.id}`);

      // Ensure unique IDs
      assert.strictEqual(ids.has(show.id), false, `Duplicate show ID: ${show.id}`);
      assert.strictEqual(uuids.has(show.stationuuid), false, `Duplicate stationuuid: ${show.stationuuid}`);
      ids.add(show.id);
      uuids.add(show.stationuuid);
    }
  });

  test("podcastToStation maps LivePodcastShow to RadioStation with full compatibility", () => {
    const show = CURATED_PODCAST_SHOWS[0];
    const station = podcastToStation(show);

    assert.strictEqual(station.name, show.showName);
    assert.strictEqual(station.stationuuid, show.stationuuid);
    assert.strictEqual(station.url, show.streamUrl);
    assert.strictEqual(station.url_resolved, show.streamUrlResolved);
    assert.strictEqual(station.country, show.country);
    assert.strictEqual(station.language, show.language);
    assert.strictEqual(station.isPodcast, true);
    assert.strictEqual(station.podcastShowName, show.showName);
    assert.strictEqual(station.podcastCategory, show.category);
    assert.strictEqual(station.podcastTopic, show.episodeOrTopic);
    assert.strictEqual(station.podcastHost, show.host);
    assert.ok(station.tags.includes("podcast"));
  });

  test("filterPodcastShows filters correctly by category", () => {
    const newsShows = filterPodcastShows(CURATED_PODCAST_SHOWS, "", "News & Analysis", "All Languages");
    assert.ok(newsShows.length > 0);
    assert.ok(newsShows.every((s) => s.category === "News & Analysis"));

    const scienceShows = filterPodcastShows(CURATED_PODCAST_SHOWS, "", "Tech & Science", "All Languages");
    assert.ok(scienceShows.length > 0);
    assert.ok(scienceShows.every((s) => s.category === "Tech & Science"));
  });

  test("filterPodcastShows filters correctly by language", () => {
    const frenchShows = filterPodcastShows(CURATED_PODCAST_SHOWS, "", "All Categories", "French");
    assert.ok(frenchShows.length > 0);
    assert.ok(frenchShows.every((s) => s.language.toLowerCase() === "french"));

    const germanShows = filterPodcastShows(CURATED_PODCAST_SHOWS, "", "All Categories", "German");
    assert.ok(germanShows.length > 0);
    assert.ok(germanShows.every((s) => s.language.toLowerCase() === "german"));
  });

  test("filterPodcastShows matches keyword search across title, host, network, and tags", () => {
    // Search by network
    const bbcResults = filterPodcastShows(CURATED_PODCAST_SHOWS, "BBC", "All Categories", "All Languages");
    assert.ok(bbcResults.length >= 1);
    assert.ok(bbcResults.some((s) => s.network.includes("BBC")));

    // Search by tag
    const sciFiResults = filterPodcastShows(CURATED_PODCAST_SHOWS, "sci-fi", "All Categories", "All Languages");
    assert.ok(sciFiResults.length >= 1);

    // Search by nonexistent keyword
    const emptyResults = filterPodcastShows(CURATED_PODCAST_SHOWS, "xyznonexistentquery123", "All Categories", "All Languages");
    assert.strictEqual(emptyResults.length, 0);
  });
});
