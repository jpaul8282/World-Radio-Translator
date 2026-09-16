import { RadioStation } from "../types";

export interface SessionShareActiveFilters {
  tab?: "radio" | "podcasts";
  radiusKm?: number;
  selectedCoords?: { lat: number; lng: number } | null;
  country?: string;
  transcriptView?: "all" | "bookmarks";
  transcriptSearch?: string;
  podcastCategory?: string;
}

export interface SessionShareState {
  station: RadioStation | null;
  targetLanguage: string;
  filters: SessionShareActiveFilters;
  autoPlay?: boolean;
}

export interface ParsedSharedSession {
  station: RadioStation | null;
  targetLanguage: string | null;
  filters: SessionShareActiveFilters;
  autoPlay: boolean;
  isValid: boolean;
}

/**
 * Encodes station metadata into a compact base64 representation for URL transmission.
 */
export function encodeStationForUrl(station: RadioStation): string {
  const payload = {
    u: station.stationuuid,
    n: station.name,
    s: station.url,
    c: station.country,
    cc: station.countrycode,
    l: station.language,
    cd: station.codec,
    br: station.bitrate,
    t: station.tags,
    lat: station.geo_lat,
    lng: station.geo_long,
    fav: station.favicon,
    hp: station.homepage,
  };

  try {
    const jsonStr = JSON.stringify(payload);
    // Universal utf-8 base64 encoding
    if (typeof btoa !== "undefined") {
      return encodeURIComponent(btoa(unescape(encodeURIComponent(jsonStr))));
    } else if (typeof Buffer !== "undefined") {
      return encodeURIComponent(Buffer.from(jsonStr, "utf-8").toString("base64"));
    }
    return encodeURIComponent(jsonStr);
  } catch {
    return "";
  }
}

/**
 * Decodes station metadata from a base64 URL parameter.
 */
export function decodeStationFromUrl(encoded: string): RadioStation | null {
  try {
    let jsonStr = "";
    if (typeof atob !== "undefined") {
      jsonStr = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
    } else if (typeof Buffer !== "undefined") {
      jsonStr = Buffer.from(decodeURIComponent(encoded), "base64").toString("utf-8");
    } else {
      jsonStr = decodeURIComponent(encoded);
    }

    const p = JSON.parse(jsonStr);
    if (!p.n && !p.s && !p.u) return null;

    return {
      changeid: `restored-${Date.now()}`,
      stationuuid: p.u || `shared-stn-${Date.now()}`,
      name: p.n || "Shared Broadcast Station",
      url: p.s || "",
      url_resolved: p.s || "",
      homepage: p.hp || "",
      favicon: p.fav || "",
      tags: p.t || "",
      country: p.c || "",
      countrycode: p.cc || "",
      state: "",
      language: p.l || "english",
      votes: 100,
      clickcount: 500,
      codec: p.cd || "MP3",
      bitrate: p.br || 128,
      geo_lat: typeof p.lat === "number" ? p.lat : undefined,
      geo_long: typeof p.lng === "number" ? p.lng : undefined,
    };
  } catch (err) {
    console.warn("Failed to decode station from URL parameter:", err);
    return null;
  }
}

/**
 * Generates a full deep-link URL capturing the current listening state,
 * target language, station, and active filters.
 */
export function generateSessionShareUrl(baseUrl: string, state: SessionShareState): string {
  // Normalize base URL
  let origin = "http://localhost:3000";
  let pathname = "/";
  try {
    const parsed = new URL(baseUrl || "http://localhost:3000/");
    origin = parsed.origin;
    pathname = parsed.pathname || "/";
  } catch {
    // fallback
  }

  const url = new URL(pathname, origin);
  url.searchParams.set("share", "session");

  if (state.targetLanguage) {
    url.searchParams.set("targetLang", state.targetLanguage);
  }

  if (state.station) {
    url.searchParams.set("stName", state.station.name);
    if (state.station.stationuuid) url.searchParams.set("stId", state.station.stationuuid);
    if (state.station.url) url.searchParams.set("stUrl", state.station.url);
    if (state.station.country) url.searchParams.set("stCountry", state.station.country);
    if (state.station.language) url.searchParams.set("stLang", state.station.language);

    const encoded = encodeStationForUrl(state.station);
    if (encoded) {
      url.searchParams.set("stData", encoded);
    }
  }

  if (state.filters.tab) {
    url.searchParams.set("tab", state.filters.tab);
  }

  if (state.filters.radiusKm) {
    url.searchParams.set("radius", String(state.filters.radiusKm));
  }

  if (state.filters.selectedCoords) {
    url.searchParams.set("lat", state.filters.selectedCoords.lat.toFixed(4));
    url.searchParams.set("lng", state.filters.selectedCoords.lng.toFixed(4));
  }

  if (state.filters.country) {
    url.searchParams.set("country", state.filters.country);
  }

  if (state.filters.transcriptView && state.filters.transcriptView !== "all") {
    url.searchParams.set("view", state.filters.transcriptView);
  }

  if (state.filters.transcriptSearch && state.filters.transcriptSearch.trim()) {
    url.searchParams.set("search", state.filters.transcriptSearch.trim());
  }

  if (state.filters.podcastCategory) {
    url.searchParams.set("category", state.filters.podcastCategory);
  }

  url.searchParams.set("autoplay", state.autoPlay !== false ? "1" : "0");

  return url.toString();
}

/**
 * Parses deep-link query parameters from window.location.search or any URL string.
 */
export function parseSessionShareUrl(searchOrUrl: string): ParsedSharedSession {
  let search = searchOrUrl;
  try {
    if (searchOrUrl.includes("?")) {
      search = searchOrUrl.slice(searchOrUrl.indexOf("?"));
    }
  } catch {
    // Keep as is
  }

  const params = new URLSearchParams(search);
  const isShareSession = params.get("share") === "session" || params.has("stData") || params.has("stName") || params.has("stUrl");

  const targetLang = params.get("targetLang") || null;
  const rawTab = params.get("tab");
  const tab: "radio" | "podcasts" | undefined = rawTab === "podcasts" ? "podcasts" : rawTab === "radio" ? "radio" : undefined;
  const radius = params.get("radius") ? parseInt(params.get("radius")!, 10) : undefined;
  const latStr = params.get("lat");
  const lngStr = params.get("lng");
  const selectedCoords = latStr && lngStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lngStr))
    ? { lat: parseFloat(latStr), lng: parseFloat(lngStr) }
    : null;
  const country = params.get("country") || undefined;
  const transcriptView = params.get("view") === "bookmarks" ? "bookmarks" : params.get("view") === "all" ? "all" : undefined;
  const transcriptSearch = params.get("search") || undefined;
  const podcastCategory = params.get("category") || undefined;
  const autoPlay = params.get("autoplay") !== "0";

  let station: RadioStation | null = null;
  const stData = params.get("stData");
  if (stData) {
    station = decodeStationFromUrl(stData);
  }

  if (!station && (params.get("stName") || params.get("stUrl"))) {
    station = {
      changeid: `shared-restored-${Date.now()}`,
      stationuuid: params.get("stId") || `shared-station-${Date.now()}`,
      name: params.get("stName") || "Shared Broadcast Station",
      url: params.get("stUrl") || "",
      url_resolved: params.get("stUrl") || "",
      homepage: "",
      favicon: "",
      tags: params.get("category") || "shared,broadcast",
      country: params.get("stCountry") || "",
      countrycode: "",
      state: "",
      language: params.get("stLang") || "english",
      votes: 100,
      clickcount: 500,
      codec: "MP3",
      bitrate: 128,
      geo_lat: selectedCoords ? selectedCoords.lat : undefined,
      geo_long: selectedCoords ? selectedCoords.lng : undefined,
    };
  }

  return {
    station,
    targetLanguage: targetLang,
    filters: {
      tab,
      radiusKm: radius,
      selectedCoords,
      country,
      transcriptView,
      transcriptSearch,
      podcastCategory,
    },
    autoPlay,
    isValid: Boolean(isShareSession || station || targetLang),
  };
}

/**
 * Formats a clean, professional invitation message with the deep link.
 */
export function formatSessionShareInvitation(state: SessionShareState, shareUrl: string): string {
  const stationName = state.station?.name || "Global Broadcast Airwaves";
  const country = state.station?.country ? ` (${state.station.country})` : "";
  const target = state.targetLanguage || "English";
  const tabDesc = state.filters.tab === "podcasts" ? "Continuous Podcast Stream" : "Live Radio Broadcast";

  let msg = `📻 Join my simultaneous listening session on World Radio Translator!\n`;
  msg += `🎙️ Broadcast: ${stationName}${country}\n`;
  msg += `🎧 Format: ${tabDesc}\n`;
  msg += `🌐 Live Translation: ${target}\n`;
  if (state.filters.radiusKm && state.filters.selectedCoords) {
    msg += `📍 Scanner Vicinity: ${state.filters.selectedCoords.lat.toFixed(2)}°, ${state.filters.selectedCoords.lng.toFixed(2)}° (${state.filters.radiusKm} km radius)\n`;
  }
  msg += `\n✨ Open this link to tune in and translate simultaneously:\n${shareUrl}`;
  return msg;
}
