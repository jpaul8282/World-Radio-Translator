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

