import { RadioStation, LanguageAlertRule, LanguageAlertTrigger } from "../types";

const STORAGE_KEY_RULES = "world_radio_language_alerts_v1";
const STORAGE_KEY_HISTORY = "world_radio_alert_history_v1";
const COOLDOWN_MS = 60000; // 60 seconds cooldown per station-rule match

export const DEFAULT_ALERT_RULES: LanguageAlertRule[] = [
  {
    id: "rule-default-spanish",
    targetLanguage: "Spanish",
    label: "Spanish Broadcast Alert",
    enabled: true,
    minConfidence: 0.65,
    notifyToast: true,
    notifySound: true,
    autoTune: false,
    triggerCount: 0,
    createdAt: Date.now() - 3600000,
  },
  {
    id: "rule-default-french",
    targetLanguage: "French",
    label: "French Broadcast Alert",
    enabled: false,
    minConfidence: 0.70,
    notifyToast: true,
    notifySound: true,
    autoTune: false,
    triggerCount: 0,
    createdAt: Date.now() - 1800000,
  },
  {
    id: "rule-default-japanese",
    targetLanguage: "Japanese",
    label: "Japanese Broadcast Alert",
    enabled: false,
    minConfidence: 0.70,
    notifyToast: true,
    notifySound: true,
    autoTune: false,
    triggerCount: 0,
    createdAt: Date.now() - 900000,
  },
];

// Language aliases and normalized forms for robust fuzzy matching
const LANGUAGE_ALIASES: Record<string, string[]> = {
  spanish: ["es", "spa", "español", "castellano", "castilian", "latin american spanish"],
  french: ["fr", "fra", "français", "francais"],
  german: ["de", "deu", "ger", "deutsch"],
  japanese: ["ja", "jp", "jpn", "日本語", "nihongo"],
  arabic: ["ar", "ara", "العربية", "arabiya"],
  english: ["en", "eng", "english"],
  italian: ["it", "ita", "italiano"],
  portuguese: ["pt", "por", "português", "portugues"],
  russian: ["ru", "rus", "русский"],
  chinese: ["zh", "zho", "chi", "mandarin", "cantonese", "中文", "putonghua"],
  dutch: ["nl", "nld", "dut", "nederlands"],
  hindi: ["hi", "hin", "हिन्दी"],
  korean: ["ko", "kor", "한국어"],
  turkish: ["tr", "tur", "türkçe", "turkce"],
  polish: ["pl", "pol", "polski"],
  swedish: ["sv", "swe", "svenska"],
  ukrainian: ["uk", "ukr", "українська"],
  greek: ["el", "ell", "gre", "ελληνικά"],
};

/**
 * Normalizes language string for comparison
 */
export function normalizeLanguage(lang: string | undefined | null): string {
  if (!lang) return "";
  return lang.trim().toLowerCase().replace(/[\-_]/g, " ");
}

/**
 * Checks if detected language matches the rule target language
 */
export function isLanguageMatch(ruleLanguage: string, detectedLanguage: string): boolean {
  const normRule = normalizeLanguage(ruleLanguage);
  const normDetected = normalizeLanguage(detectedLanguage);

  if (!normRule || !normDetected) return false;
  if (normRule === normDetected) return true;
  if (normDetected.includes(normRule) || normRule.includes(normDetected)) return true;

  // Check alias list for rule language
  const ruleAliases = LANGUAGE_ALIASES[normRule] || [];
  if (ruleAliases.some(alias => normDetected === alias || normDetected.includes(alias))) {
    return true;
  }

  // Check alias list for detected language
  for (const [canonical, aliases] of Object.entries(LANGUAGE_ALIASES)) {
    if (canonical === normRule && aliases.includes(normDetected)) return true;
    if (canonical === normDetected && aliases.includes(normRule)) return true;
  }

  return false;
}

/**
 * Loads alert rules from local storage
 */
export function loadAlertRules(): LanguageAlertRule[] {
  if (typeof window === "undefined") return DEFAULT_ALERT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RULES);
    if (!raw) return DEFAULT_ALERT_RULES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn("Failed to load alert rules from localStorage, falling back to defaults", err);
  }
  return DEFAULT_ALERT_RULES;
}

/**
 * Saves alert rules to local storage
 */
export function saveAlertRules(rules: LanguageAlertRule[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(rules));
  } catch (err) {
    console.warn("Failed to save alert rules to localStorage", err);
  }
}

/**
 * Loads alert trigger history from local storage
 */
export function loadAlertHistory(): LanguageAlertTrigger[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 50); // Keep max 50 recent
    }
  } catch (err) {
    console.warn("Failed to load alert history", err);
  }
  return [];
}

/**
 * Saves alert trigger history to local storage
 */
export function saveAlertHistory(triggers: LanguageAlertTrigger[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(triggers.slice(0, 50)));
  } catch (err) {
    console.warn("Failed to save alert history", err);
  }
}

// In-memory cooldown tracking: map of "ruleId:stationuuid" -> timestamp
const lastTriggeredMap = new Map<string, number>();

/**
 * Resets cooldown map (useful in tests)
 */
export function clearCooldowns(): void {
  lastTriggeredMap.clear();
}

/**
 * Evaluates whether a station and detected language trigger any active alert rules
 */
export function evaluateStationAlerts(
  station: RadioStation,
  detectedLanguage: string,
  confidence: number,
  rules: LanguageAlertRule[],
  source: 'background_scanner' | 'live_stream' | 'station_metadata' = 'background_scanner',
  snippet?: string
): { matchedRules: LanguageAlertRule[]; triggers: LanguageAlertTrigger[] } {
  const now = Date.now();
  const matchedRules: LanguageAlertRule[] = [];
  const triggers: LanguageAlertTrigger[] = [];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (confidence < rule.minConfidence) continue;

    if (isLanguageMatch(rule.targetLanguage, detectedLanguage)) {
      const cooldownKey = `${rule.id}:${station.stationuuid}`;
      const lastTrigger = lastTriggeredMap.get(cooldownKey) || 0;

      if (now - lastTrigger < COOLDOWN_MS) {
        // In cooldown, skip firing duplicate alert
        continue;
      }

      // Mark triggered
      lastTriggeredMap.set(cooldownKey, now);
      rule.lastTriggered = now;
      rule.triggerCount = (rule.triggerCount || 0) + 1;
      matchedRules.push(rule);

      triggers.push({
        id: `trig-${now}-${Math.random().toString(36).substring(2, 7)}`,
        ruleId: rule.id,
        language: detectedLanguage,
        stationuuid: station.stationuuid,
        stationName: station.name,
        stationCountry: station.country,
        streamUrl: station.url_resolved || station.url,
        confidence,
        timestamp: now,
        snippet,
        source,
      });
    }
  }

  return { matchedRules, triggers };
}

/**
 * Synthesizes a pleasant dual-tone radio alert chime using Web Audio API
 */
export function playRadioChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primary tone: 587.33 Hz (D5) -> 880 Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Harmonic chime tone: 1174.66 Hz (D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now + 0.12);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);

    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.08, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.55);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch (err) {
    console.debug("Web Audio chime skipped:", err);
  }
}
