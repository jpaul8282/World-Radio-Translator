export interface RadioStation {
  changeid: string;
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  votes: number;
  clickcount: number;
  codec: string;
  bitrate: number;
  geo_lat?: number | string | null;
  geo_long?: number | string | null;
  isPodcast?: boolean;
  podcastShowName?: string;
  podcastHost?: string;
  podcastCategory?: string;
  podcastTopic?: string;
  podcastEpisode?: string;
}

export type PodcastCategory =
  | 'All Categories'
  | 'News & Analysis'
  | 'Tech & Science'
  | 'Culture & Arts'
  | 'Storytelling & Audio Drama'
  | 'Philosophy & Society'
  | 'Interviews & Debates'
  | 'Comedy & Satire';

export interface LivePodcastShow {
  id: string;
  stationuuid: string;
  showName: string;
  episodeOrTopic: string;
  network: string;
  host?: string;
  description: string;
  category: PodcastCategory;
  language: string;
  country: string;
  countryCode: string;
  streamUrl: string;
  streamUrlResolved: string;
  homepage?: string;
  favicon?: string;
  tags: string[];
  scheduleOrAiring: string;
  isLive: boolean;
  listenerCount?: number;
  featured?: boolean;
}

export interface PodcastShowInsights {
  showName: string;
  network: string;
  executiveSummary: string;
  coreThemes: string[];
  hostBio: string;
  currentEpisodeAnalysis: string;
  suggestedDiscussionPoints: string[];
  targetLanguageAdvice: string;
  source: string;
}

export interface LocationGeoProfile {
  country: string;
  countryCode: string;
  countryCodes?: string[];
  language: string;
  capital: string;
  description: string;
  nativeGreeting: string;
  genres: string[];
}

export interface BroadcastSegment {
  type: 'Station Profile' | 'Artist Spotlight' | 'Language Phrase' | 'Music History' | 'Broadcaster Tagline';
  originalText: string;
  estimatedDuration: number; // in seconds
}

export interface LanguageDetectionResult {
  detectedLanguage: string;
  languageCode: string;
  confidence: number;
  differsFromTarget: boolean;
  suggestedTargetLanguage: string;
  reason: string;
}

export interface LanguageEncounterEvent {
  id: string;
  language: string;
  timestamp: number; // Unix epoch ms
  stationName?: string;
  country?: string;
  source: 'detection' | 'station' | 'translation';
}

export interface LanguageFrequencyData {
  language: string;
  count: number;
  percentage: number;
  lastSeen: number;
  stations: string[];
}

export interface BookmarkedTurn {
  id: string;
  originalText: string;
  translatedText: string;
  timestamp: string; // ISO date string
  stationName?: string;
  stationCountry?: string;
  targetLanguage?: string;
  bookmarkedAt: number; // timestamp ms
  audioUrl?: string;
}

export interface NeuralSatellite {
  id: string;
  name: string;
  code: string;
  orbitType: 'LEO' | 'MEO' | 'GEO' | 'Polar';
  altitudeKm: number;
  velocityKmS: number;
  lat: number;
  lng: number;
  uplinkBand: string; // e.g. "Ka-Band Neural 60GHz", "THz Optical Laser"
  wifiProtocol: string; // e.g. "WiFi 7 / 802.11be SpaceMesh"
  latencyMs: number;
  signalStrength: number; // 0 - 100%
  throughputGbps: number;
  status: 'ONLINE' | 'RELAYING' | 'SYNCHRONIZING' | 'OPTIMAL';
  activeRelays: number;
  region: string;
}

export interface SatelliteUplinkState {
  enabled: boolean;
  activeSatelliteId: string | null;
  mode: 'auto-mesh' | 'manual-lock' | 'ionosphere-quantum';
  downlinkLatency: number;
  neuralSyncScore: number;
  packetsRelayed: number;
  wifiNoiseReduction: boolean;
}

export interface LanguageAlertRule {
  id: string;
  targetLanguage: string; // e.g. "Spanish", "Japanese", "Arabic", "French", "German"
  label?: string; // Optional user label
  enabled: boolean;
  minConfidence: number; // 0.0 - 1.0 (default 0.70)
  notifyToast: boolean; // In-app toast notification
  notifySound: boolean; // Synthesized radio chime tone
  autoTune: boolean; // Automatically switch station when detected
  lastTriggered?: number; // epoch ms
  triggerCount: number;
  createdAt: number;
}

export interface LanguageAlertTrigger {
  id: string;
  ruleId: string;
  language: string;
  stationuuid: string;
  stationName: string;
  stationCountry?: string;
  streamUrl: string;
  confidence: number;
  timestamp: number; // epoch ms
  snippet?: string;
  source: 'background_scanner' | 'live_stream' | 'station_metadata';
}

export interface BackgroundScannerStatus {
  isScanning: boolean;
  currentStationIndex: number;
  scannedStationName: string | null;
  scannedStationUuid: string | null;
  lastScanTime: number | null;
  scanIntervalSeconds: number; // e.g. 15s or 30s
  totalScannedCount: number;
  matchCount: number;
  scanMode: 'filtered_list' | 'global_random' | 'favorites';
}

