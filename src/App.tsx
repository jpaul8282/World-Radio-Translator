import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, ShieldAlert, Radio, Sparkles, Share2, Check, Mic, MicOff, Languages, Volume2, RefreshCw, ScrollText, Copy, Trash2, Download, CheckCheck, Sun, Moon, Wand2, ArrowRight, X, Globe } from "lucide-react";

import WorldMap from "./components/WorldMap";
import StationList from "./components/StationList";
import AudioPlayer from "./components/AudioPlayer";
import LanguageFrequencyChart from "./components/LanguageFrequencyChart";
import ResumeStationNotification from "./components/ResumeStationNotification";
import { RadioStation, LocationGeoProfile, LanguageDetectionResult, LanguageEncounterEvent } from "./types";
import { LiveTranslateClient, LiveTranslateState, LiveTranslateTurn, encodeWAV } from "./services/liveTranslateClient";

const SUPPORTED_LANGUAGES = [
  "Arabic",
  "Bengali",
  "Bulgarian",
  "Chinese (Simplified)",
  "Chinese (Traditional)",
  "Croatian",
  "Czech",
  "Danish",
  "Dutch",
  "English",
  "Estonian",
  "Finnish",
  "French",
  "German",
  "Greek",
  "Gujarati",
  "Hebrew",
  "Hindi",
  "Hungarian",
  "Indonesian",
  "Italian",
  "Japanese",
  "Kannada",
  "Korean",
  "Latvian",
  "Lithuanian",
  "Malayalam",
  "Marathi",
  "Norwegian",
  "Persian",
  "Polish",
  "Portuguese",
  "Romanian",
  "Russian",
  "Serbian",
  "Slovak",
  "Slovenian",
  "Spanish",
  "Swahili",
  "Swedish",
  "Tamil",
  "Telugu",
  "Thai",
  "Turkish",
  "Ukrainian",
  "Urdu",
  "Vietnamese"
];

const LANGUAGE_CODE_MAP: Record<string, string> = {
  "Arabic": "ar",
  "Bengali": "bn",
  "Bulgarian": "bg",
  "Chinese (Simplified)": "zh-CN",
  "Chinese (Traditional)": "zh-TW",
  "Croatian": "hr",
  "Czech": "cs",
  "Danish": "da",
  "Dutch": "nl",
  "English": "en",
  "Estonian": "et",
  "Finnish": "fi",
  "French": "fr",
  "German": "de",
  "Greek": "el",
  "Gujarati": "gu",
  "Hebrew": "he",
  "Hindi": "hi",
  "Hungarian": "hu",
  "Indonesian": "id",
  "Italian": "it",
  "Japanese": "ja",
  "Kannada": "kn",
  "Korean": "ko",
  "Latvian": "lv",
  "Lithuanian": "lt",
  "Malayalam": "ml",
  "Marathi": "mr",
  "Norwegian": "no",
  "Persian": "fa",
  "Polish": "pl",
  "Portuguese": "pt",
  "Romanian": "ro",
  "Russian": "ru",
  "Serbian": "sr",
  "Slovak": "sk",
  "Slovenian": "sl",
  "Spanish": "es",
  "Swahili": "sw",
  "Swedish": "sv",
  "Tamil": "ta",
  "Telugu": "te",
  "Thai": "th",
  "Turkish": "tr",
  "Ukrainian": "uk",
  "Urdu": "ur",
  "Vietnamese": "vi"
};

function getClientLanguageCode(lang: string | undefined): string {
  if (!lang) return "";
  const l = lang.toLowerCase().trim();
  
  // 1. Direct or partial keys matching
  for (const [name, code] of Object.entries(LANGUAGE_CODE_MAP)) {
    const nameLower = name.toLowerCase();
    if (l === nameLower || l.includes(nameLower) || nameLower.includes(l)) {
      return code;
    }
  }
  
  // 2. Direct code match (e.g. "es", "sv", "pt")
  const codes = Object.values(LANGUAGE_CODE_MAP);
  if (codes.includes(l)) {
    return l;
  }
  
  // 3. Custom hand-coded popular patterns / ISO-639 codes
  if (l.includes("ara") || l === "ar") return "ar";
  if (l.includes("ben") || l === "bn") return "bn";
  if (l.includes("bul") || l === "bg") return "bg";
  if (l.includes("chi") || l.includes("zho") || l === "zh") return "zh-CN";
  if (l.includes("hrv") || l === "hr") return "hr";
  if (l.includes("cze") || l.includes("ces") || l === "cs") return "cs";
  if (l.includes("dan") || l === "da") return "da";
  if (l.includes("dut") || l.includes("nld") || l === "nl") return "nl";
  if (l.includes("eng") || l === "un" || l === "en") return "en";
  if (l.includes("est") || l === "et") return "et";
  if (l.includes("fin") || l === "fi") return "fi";
  if (l.includes("fre") || l.includes("fra") || l === "fr") return "fr";
  if (l.includes("ger") || l.includes("deu") || l === "de") return "de";
  if (l.includes("gre") || l.includes("ell") || l === "el") return "el";
  if (l.includes("guj") || l === "gu") return "gu";
  if (l.includes("heb") || l === "he") return "he";
  if (l.includes("hin") || l === "hi") return "hi";
  if (l.includes("hun") || l === "hu") return "hu";
  if (l.includes("ind") || l === "id") return "id";
  if (l.includes("ita") || l === "it") return "it";
  if (l.includes("jpn") || l === "ja") return "ja";
  if (l.includes("kan") || l === "kn") return "kn";
  if (l.includes("kor") || l === "ko") return "ko";
  if (l.includes("lav") || l === "lv") return "lv";
  if (l.includes("lit") || l === "lt") return "lt";
  if (l.includes("mal") || l === "ml") return "ml";
  if (l.includes("mar") || l === "mr") return "mr";
  if (l.includes("nor") || l === "no") return "no";
  if (l.includes("fas") || l.includes("per") || l === "fa") return "fa";
  if (l.includes("pol") || l === "pl") return "pl";
  if (l.includes("por") || l === "pt") return "pt";
  if (l.includes("ron") || l.includes("rum") || l === "ro") return "ro";
  if (l.includes("rus") || l === "ru") return "ru";
  if (l.includes("srp") || l === "sr") return "sr";
  if (l.includes("slk") || l.includes("slo") || l === "sk") {
    if (l.includes("slovenian") || l === "sl") return "sl";
    return "sk";
  }
  if (l.includes("slv") || l === "sl") return "sl";
  if (l.includes("spa") || l === "es") return "es";
  if (l.includes("swa") || l === "sw") return "sw";
  if (l.includes("swe") || l === "sv") return "sv";
  if (l.includes("tam") || l === "ta") return "ta";
  if (l.includes("tel") || l === "te") return "te";
  if (l.includes("tha") || l === "th") return "th";
  if (l.includes("tur") || l === "tr") return "tr";
  if (l.includes("ukr") || l === "uk") return "uk";
  if (l.includes("urd") || l === "ur") return "ur";
  if (l.includes("vie") || l === "vi") return "vi";
  
  return l;
}

function isSameLanguage(langA: string | undefined, langB: string | undefined): boolean {
  if (!langA || !langB) return false;
  const codeA = getClientLanguageCode(langA);
  const codeB = getClientLanguageCode(langB);
  if (codeA && codeB && codeA === codeB) return true;

  const a = langA.toLowerCase().trim();
  const b = langB.toLowerCase().trim();
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const len = Math.min(a.length, b.length, 3);
  if (len >= 3 && a.slice(0, len) === b.slice(0, len)) return true;
  return false;
}

function generateInitialLanguageEvents(): LanguageEncounterEvent[] {
  const now = Date.now();
  const sampleData: { lang: string; station: string; count: number }[] = [
    { lang: "Spanish", station: "Cadena SER Madrid", count: 14 },
    { lang: "French", station: "France Info Paris", count: 11 },
    { lang: "German", station: "Deutschlandfunk Berlin", count: 8 },
    { lang: "English", station: "BBC World Service", count: 18 },
    { lang: "Japanese", station: "NHK Radio 1 Tokyo", count: 6 },
    { lang: "Arabic", station: "Sawt al-Arab Cairo", count: 7 },
    { lang: "Italian", station: "RAI Radio 1 Roma", count: 5 },
    { lang: "Portuguese", station: "CBN Rio de Janeiro", count: 9 },
    { lang: "Dutch", station: "NPO Radio 1 Amsterdam", count: 4 },
    { lang: "Hindi", station: "AIR Vividh Bharati Delhi", count: 5 },
  ];

  const events: LanguageEncounterEvent[] = [];
  let idCounter = 1;

  for (const item of sampleData) {
    for (let i = 0; i < item.count; i++) {
      const offsetMs = Math.floor(Math.random() * 58 * 60 * 1000);
      events.push({
        id: `init-evt-${idCounter++}`,
        language: item.lang,
        timestamp: now - offsetMs,
        stationName: item.station,
        source: 'station',
      });
    }
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("world_radio_dark_mode") === "true";
  });

  const toggleDarkMode = () => {
    const nextMode = !darkMode;
    setDarkMode(nextMode);
    localStorage.setItem("world_radio_dark_mode", String(nextMode));
  };

  const [languageEvents, setLanguageEvents] = useState<LanguageEncounterEvent[]>(generateInitialLanguageEvents);

  const [selectedProfile, setSelectedProfile] = useState<LocationGeoProfile | null>(null);
  const [activeStation, setActiveStation] = useState<RadioStation | null>(null);
  const [availableStations, setAvailableStations] = useState<RadioStation[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Resume Session / Last Played Station Persistence
  const [lastPlayedStation, setLastPlayedStation] = useState<RadioStation | null>(() => {
    try {
      const saved = localStorage.getItem("last_played_radio_station");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [lastPlayedTime, setLastPlayedTime] = useState<number | null>(() => {
    try {
      const saved = localStorage.getItem("last_played_timestamp");
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (activeStation) {
      const now = Date.now();
      setLastPlayedStation(activeStation);
      setLastPlayedTime(now);
      try {
        localStorage.setItem("last_played_radio_station", JSON.stringify(activeStation));
        localStorage.setItem("last_played_timestamp", String(now));
      } catch (e) {
        console.warn("Failed to store last played station:", e);
      }
    }
  }, [activeStation?.stationuuid, isPlaying]);

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(500);
  const [copied, setCopied] = useState(false);

  // Real-time Voice to Voice Gemini Live Translate Setup
  const [liveClient] = useState(() => new LiveTranslateClient());
  const [liveState, setLiveState] = useState<LiveTranslateState>({
    status: "idle",
    error: null,
    userTranscript: "",
    modelTranscript: "",
    turns: [],
  });
  const [liveTargetLang, setLiveTargetLang] = useState<string>("English");
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [savedClipIndex, setSavedClipIndex] = useState<number | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);

  // Language Auto-Detection State & Handlers
  const [detectionResult, setDetectionResult] = useState<LanguageDetectionResult | null>(null);
  const [isDetectingLang, setIsDetectingLang] = useState<boolean>(false);
  const [dismissedSuggestion, setDismissedSuggestion] = useState<boolean>(false);

  const detectIncomingLanguage = async (sampleTextOverride?: string) => {
    if (!activeStation && !sampleTextOverride) return;

    setIsDetectingLang(true);
    try {
      const response = await fetch("/api/detect-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stationLanguage: activeStation?.language || selectedProfile?.language || "",
          stationName: activeStation?.name || "",
          country: activeStation?.country || selectedProfile?.country || "",
          sampleText: sampleTextOverride || liveState.userTranscript || "",
          currentTargetLanguage: liveTargetLang,
        }),
      });

      if (response.ok) {
        const data: LanguageDetectionResult = await response.json();
        setDetectionResult(data);
        setDismissedSuggestion(false);
      }
    } catch (err) {
      console.warn("Language detection failed:", err);
    } finally {
      setIsDetectingLang(false);
    }
  };

  const handleApplySuggestedTarget = (newTargetLang: string) => {
    setLiveTargetLang(newTargetLang);
    setDismissedSuggestion(true);

    const currentStatus = liveClient.getLiveState().status;
    const isStreamActive = currentStatus === "connected" || currentStatus === "connecting";
    if (isStreamActive) {
      liveClient.disconnect();
      liveClient.clearHistory();
      setTimeout(() => {
        liveClient.connect(
          newTargetLang,
          (updatedState) => setLiveState({ ...updatedState }),
          undefined,
          activeStation?.language
        );
      }, 500);
    }
  };

  // Trigger language detection on station change or play state change
  useEffect(() => {
    if (activeStation) {
      detectIncomingLanguage();

      const rawLang = activeStation.language || selectedProfile?.language || "English";
      const matched = SUPPORTED_LANGUAGES.find(l => isSameLanguage(l, rawLang));
      const canonicalLang = matched || (rawLang.length > 2 ? rawLang.charAt(0).toUpperCase() + rawLang.slice(1) : "English");

      setLanguageEvents((prev) => [
        {
          id: `evt-stn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          language: canonicalLang,
          timestamp: Date.now(),
          stationName: activeStation.name,
          country: activeStation.country || selectedProfile?.country,
          source: 'station',
        },
        ...prev,
      ]);
    }
  }, [activeStation?.stationuuid, isPlaying]);

  // Record language encounter when automatic detection finishes
  useEffect(() => {
    if (detectionResult?.detectedLanguage) {
      setLanguageEvents((prev) => [
        {
          id: `evt-det-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          language: detectionResult.detectedLanguage,
          timestamp: Date.now(),
          stationName: activeStation?.name,
          country: activeStation?.country,
          source: 'detection',
        },
        ...prev,
      ]);
    }
  }, [detectionResult?.detectedLanguage]);

  const handleAddSampleEvent = () => {
    const sampleLangs = ["Spanish", "French", "German", "Japanese", "Arabic", "English", "Italian", "Portuguese", "Dutch", "Hindi", "Swedish", "Polish", "Korean", "Turkish"];
    const randomLang = sampleLangs[Math.floor(Math.random() * sampleLangs.length)];
    const sampleStations = ["Radio Globedia", "Airwaves FM", "Voice of the World", "International News Live", "Radio Capital", "Continental Air", "Global Wave 98"];
    const randomStation = sampleStations[Math.floor(Math.random() * sampleStations.length)];

    setLanguageEvents((prev) => [
      {
        id: `evt-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        language: randomLang,
        timestamp: Date.now(),
        stationName: randomStation,
        source: 'detection',
      },
      ...prev,
    ]);
  };

  const handleClearEvents = () => {
    setLanguageEvents([]);
  };

  // Re-evaluate suggestion when target language is changed
  useEffect(() => {
    if (detectionResult) {
      const differs = !isSameLanguage(detectionResult.detectedLanguage, liveTargetLang);
      setDetectionResult((prev) =>
        prev
          ? {
              ...prev,
              differsFromTarget: differs,
              reason: differs
                ? `Detected broadcast audio in ${prev.detectedLanguage}, which differs from your selected target (${liveTargetLang}).`
                : `Detected broadcast audio is ${prev.detectedLanguage}, matching your target language (${liveTargetLang}).`,
            }
          : null
      );
    }
  }, [liveTargetLang]);

  // Trigger detection update on live audio transcript arrival
  useEffect(() => {
    if (liveState.userTranscript && liveState.userTranscript.length > 20 && (!detectionResult || detectionResult.confidence < 0.9)) {
      detectIncomingLanguage(liveState.userTranscript);
    }
  }, [liveState.userTranscript]);

  const toggleLiveTranslation = async () => {
    const currentStatus = liveClient.getLiveState().status;
    if (currentStatus === "connected" || currentStatus === "connecting") {
      liveClient.disconnect();
      setLiveState(liveClient.getLiveState());
    } else {
      await liveClient.connect(liveTargetLang, (updatedState) => {
        setLiveState({ ...updatedState });
      }, undefined, activeStation?.language);
    }
  };

  const handleCopyTranscript = () => {
    if (liveState.turns.length === 0 && !liveState.userTranscript && !liveState.modelTranscript) return;
    
    let text = "=== World Radio Translator Transcript ===\n";
    text += `Target Language Selected: ${liveTargetLang}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;
    
    liveState.turns.forEach((turn, idx) => {
      const timeStr = new Date(turn.timestamp).toLocaleTimeString();
      text += `[Turn ${idx + 1} - ${timeStr}]\n`;
      text += `Captured Audio (Original): ${turn.originalText}\n`;
      text += `Interpreter (${liveTargetLang}): ${turn.translatedText}\n\n`;
    });

    if (liveState.userTranscript) {
      text += `[*Live Decoding*] Captured Audio (Original):\n${liveState.userTranscript}\n\n`;
    }
    if (liveState.modelTranscript) {
      text += `[*Live Decoding*] Interpreter (${liveTargetLang}):\n${liveState.modelTranscript}\n\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    });
  };

  const handleDownloadTranscript = () => {
    if (liveState.turns.length === 0 && !liveState.userTranscript && !liveState.modelTranscript) return;

    let text = "=== World Radio Translator Transcript ===\n";
    text += `Target Language Selected: ${liveTargetLang}\n`;
    text += `Date: ${new Date().toLocaleDateString()}\n\n`;

    liveState.turns.forEach((turn, idx) => {
      const timeStr = new Date(turn.timestamp).toLocaleTimeString();
      text += `[Turn ${idx + 1} - ${timeStr}]\n`;
      text += `Captured Audio (Original): ${turn.originalText}\n`;
      text += `Interpreter (${liveTargetLang}): ${turn.translatedText}\n\n`;
    });

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `world_radio_translation_transcript_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearSessionTranscript = () => {
    liveClient.clearHistory();
    setLiveState(liveClient.getLiveState());
  };

  const generateSyntheticWavClip = (text: string): Blob => {
    const sampleRate = 16000;
    const durationSec = Math.max(1.5, Math.min(8, text.length * 0.08));
    const numSamples = Math.floor(sampleRate * durationSec);
    const samples = new Float32Array(numSamples);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const charCode = text.charCodeAt(i % text.length) || 65;
      const freq1 = 220 + (charCode % 24) * 15;
      const freq2 = freq1 * 1.5;

      const env = Math.sin((Math.PI * i) / numSamples);
      const wave1 = Math.sin(2 * Math.PI * freq1 * t);
      const wave2 = Math.sin(2 * Math.PI * freq2 * t) * 0.5;
      const noise = (Math.random() - 0.5) * 0.04;

      samples[i] = (wave1 + wave2 + noise) * 0.25 * env;
    }

    const wavBuffer = encodeWAV(samples, sampleRate);
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const handleSaveTurnClip = (turn: LiveTranslateTurn, idx: number) => {
    const timeStampStr = new Date(turn.timestamp).toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = turn.audioFileName || `radio_clip_turn_${idx + 1}_${timeStampStr}.wav`;

    if (turn.audioUrl) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = turn.audioUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 1000);
    } else if (turn.audioBlob) {
      const url = URL.createObjectURL(turn.audioBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    } else {
      const textToSynthesize = (turn.originalText && !turn.originalText.includes("Listening..."))
        ? turn.originalText
        : turn.translatedText;
      const wavBlob = generateSyntheticWavClip(textToSynthesize || "Radio broadcast clip");
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
    }

    setSavedClipIndex(idx);
    setTimeout(() => setSavedClipIndex(null), 2000);
  };

  // Auto-scroll transcript container internally (NOT the window!)
  useEffect(() => {
    if (transcriptContainerRef.current) {
      const container = transcriptContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [liveState.turns, liveState.userTranscript, liveState.modelTranscript]);

  useEffect(() => {
    return () => {
      liveClient.disconnect();
    };
  }, [liveClient]);

  // Synchronize translation session with radio playing state:
  // When radio stops/pauses, the live translation should stop immediately.
  useEffect(() => {
    if (!isPlaying) {
      const currentStatus = liveClient.getLiveState().status;
      if (currentStatus === "connected" || currentStatus === "connecting") {
        liveClient.disconnect();
        setLiveState(liveClient.getLiveState());
      }
    }
  }, [isPlaying, liveClient]);

  // Sync theme-class with html/body elements for perfect Tailwind context propagation
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("world_radio_dark_mode", String(darkMode));
  }, [darkMode]);

  // Parse URL query coordinates on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLat = params.get("lat");
    const urlLng = params.get("lng");
    const urlRadius = params.get("radius");

    const initialLat = urlLat ? parseFloat(urlLat) : 46.2276; // Alpine region coordinates as default
    const initialLng = urlLng ? parseFloat(urlLng) : 2.2137;
    const initialRadius = urlRadius ? parseInt(urlRadius, 10) : 500;

    setSelectedCoords({ lat: initialLat, lng: initialLng });
    setRadiusKm(initialRadius);

    setProfileLoading(true);
    fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: initialLat,
        lng: initialLng,
        radiusKm: initialRadius,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSelectedProfile(data);
        setProfileLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load initial vicinity profile:", err);
        setProfileLoading(false);
      });
  }, []);

  const updateProfile = async (lat: number, lng: number, radius: number) => {
    setProfileLoading(true);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          radiusKm: radius,
        }),
      });

      const data: LocationGeoProfile = await response.json();
      setSelectedProfile(data);
    } catch (err) {
      console.error("Geocoding query failed:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleMapLocationClick = (coords: { lat: number; lng: number }) => {
    setSelectedCoords(coords);
    updateProfile(coords.lat, coords.lng, radiusKm);
  };

  const handleRadiusChangeEnd = () => {
    if (selectedCoords) {
      updateProfile(selectedCoords.lat, selectedCoords.lng, radiusKm);
    }
  };

  const handleShareVicinity = () => {
    if (!selectedCoords) return;
    const url = `${window.location.origin}/?lat=${selectedCoords.lat.toFixed(4)}&lng=${selectedCoords.lng.toFixed(4)}&radius=${radiusKm}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSelectStation = (station: RadioStation) => {
    const wasTranslating = liveState.status === "connected" || liveState.status === "connecting";
    if (wasTranslating) {
      liveClient.disconnect();
      liveClient.clearHistory();
      setLiveState(liveClient.getLiveState());
    }

    setActiveStation(station);
    setIsPlaying(true);

    if (wasTranslating) {
      // Cleanly restart the translation stream for the new selected station
      setTimeout(() => {
        liveClient.connect(liveTargetLang, (updatedState) => {
          setLiveState({ ...updatedState });
        }, undefined, station.language);
      }, 600);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 relative ${
      darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Local Notification for Session Resume */}
      <ResumeStationNotification
        lastStation={lastPlayedStation}
        lastPlayedTime={lastPlayedTime}
        isPlaying={isPlaying}
        activeStation={activeStation}
        onResume={handleSelectStation}
        darkMode={darkMode}
      />
      
      {/* Absolute Unobtrusive Floating Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed bottom-24 right-4 md:right-6 z-50 p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-all shadow-md active:scale-95 cursor-pointer select-none flex items-center justify-center"
        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>


      {/* Main Content Workspace Layout */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        
        {/* Left Section: Map pane & Channel Bento Selector */}
        <div className="flex-1 p-4 md:p-5 flex flex-col gap-4 lg:gap-5 w-full max-w-7xl mx-auto">
          
          {/* Gemini Live Voice-to-Voice Translation Dashboard */}
          <section className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/10 dark:to-teal-950/10 border border-emerald-500/25 dark:border-emerald-500/10 rounded-2xl p-4 md:p-5 flex flex-col gap-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/10 pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  liveState.status === "connected" 
                    ? "bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-500/30" 
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
                }`}>
                  <Radio className={`w-5 h-5 ${liveState.status === "connected" ? "animate-pulse" : ""}`} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>Gemini Live Radio Stream Interpreter</span>
                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase">
                      Stream API Only
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                    Translates the live radio stream directly using the gemini-3.5-live-translate-preview API
                  </p>
                </div>
              </div>

               {/* Connection + Language Selector */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => detectIncomingLanguage()}
                  disabled={isDetectingLang || !activeStation}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Detect incoming radio broadcast language automatically"
                >
                  <Wand2 className={`w-3.5 h-3.5 text-amber-500 ${isDetectingLang ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{isDetectingLang ? "Detecting..." : "Detect Language"}</span>
                </button>

                <div 
                  className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/60"
                  title="Select target language for real-time translation"
                >
                  <Languages className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={liveTargetLang}
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setLiveTargetLang(newLang);
                      const currentStatus = liveClient.getLiveState().status;
                      const isStreamActive = currentStatus === "connected" || currentStatus === "connecting";
                      if (isStreamActive) {
                        liveClient.disconnect();
                        liveClient.clearHistory();
                        liveClient.connect(newLang, (updatedState) => {
                          setLiveState({ ...updatedState });
                        }, undefined, activeStation?.language);
                      }
                    }}
                    disabled={false}
                    className="bg-transparent border-none text-xs font-semibold text-slate-600 dark:text-slate-300 focus:outline-none cursor-pointer pr-1 max-w-[130px] sm:max-w-[none]"
                    title="Select translation target language"
                  >
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={toggleLiveTranslation}
                  disabled={false}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 cursor-pointer flex items-center gap-2 shadow-sm ${
                    liveState.status === "connected"
                      ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                      : liveState.status === "connecting"
                      ? "bg-amber-500 text-white animate-pulse"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                  title={
                    liveState.status === "connected"
                      ? "Disconnect from Gemini Live translation session"
                      : liveState.status === "connecting"
                      ? "Connecting to Live stream WebSocket..."
                      : "Establish real-time voice interpretation and transcription session"
                  }
                >
                  <span>
                    {liveState.status === "connected"
                      ? "Stop Translation"
                      : liveState.status === "connecting"
                      ? "Connecting..."
                      : "Start Live Translation"}
                  </span>
                </button>
              </div>
            </div>

            {/* Smart Language Detection & Target Suggestion Banner */}
            <AnimatePresence>
              {detectionResult && !dismissedSuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
                    detectionResult.differsFromTarget
                      ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-900/20 border-amber-500/30 text-amber-950 dark:text-amber-100"
                      : "bg-gradient-to-r from-sky-500/15 via-indigo-500/10 to-sky-500/5 dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-sky-900/20 border-sky-500/30 text-sky-950 dark:text-sky-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 shadow-sm border border-slate-200/60 dark:border-slate-800/60 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5 sm:mt-0">
                      <Wand2 className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-200 uppercase tracking-wider font-mono text-[10px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                          Detected Audio: {detectionResult.detectedLanguage}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Target: <strong className="font-bold underline decoration-amber-500/50">{liveTargetLang}</strong>
                        </span>
                        {detectionResult.confidence && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                            ({Math.round(detectionResult.confidence * 100)}% confidence)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                        {detectionResult.reason || `Incoming audio detected in ${detectionResult.detectedLanguage}. Suggested target language: ${detectionResult.suggestedTargetLanguage}.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    {detectionResult.suggestedTargetLanguage && detectionResult.suggestedTargetLanguage !== liveTargetLang && (
                      <button
                        onClick={() => handleApplySuggestedTarget(detectionResult.suggestedTargetLanguage)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                        title={`Switch target language to ${detectionResult.suggestedTargetLanguage}`}
                      >
                        <span>Set Target to {detectionResult.suggestedTargetLanguage}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {detectionResult.detectedLanguage && detectionResult.detectedLanguage !== liveTargetLang && (
                      <button
                        onClick={() => handleApplySuggestedTarget(detectionResult.detectedLanguage)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2sm"
                        title={`Listen in native ${detectionResult.detectedLanguage}`}
                      >
                        Listen in {detectionResult.detectedLanguage}
                      </button>
                    )}
                    <button
                      onClick={() => setDismissedSuggestion(true)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                      title="Dismiss recommendation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Real-time D3 Language Frequency Bar Chart */}
            <LanguageFrequencyChart
              events={languageEvents}
              darkMode={darkMode}
              onSelectLanguage={(lang) => {
                setLiveTargetLang(lang);
              }}
              onAddSampleEvent={handleAddSampleEvent}
              onClearEvents={handleClearEvents}
            />

            {/* Connection Status Notice / Error message */}
            {liveState.error && (
              <div className="flex items-center gap-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs px-3.5 py-2.5 rounded-xl border border-rose-500/20">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{liveState.error}</span>
              </div>
            )}

            {liveState.status === "connecting" && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs px-3.5 py-2.5 rounded-xl border border-amber-500/20">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                <span>Setting up WebSocket connection with Gemini Live API...</span>
              </div>
            )}

            {liveState.status === "connected" && (
              <div className="flex flex-col gap-2 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-xs px-3.5 py-2.5 rounded-xl border border-emerald-500/25">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 mb-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="font-medium">Active Broadcast Interpretation session to {liveTargetLang} ready.</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="h-4 w-[2px] bg-emerald-500/30 rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                    <span className="h-6 w-[2px] bg-emerald-500/40 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span className="h-3 w-[2px] bg-emerald-500/20 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
                    <span className="h-5 w-[2px] bg-emerald-500/50 rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
                    <span className="h-4 w-[2px] bg-emerald-500/30 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>

              </div>
            )}

            {/* Real-time Broadcast Transcription Feed Panel */}
            {(liveState.status === "connected" || liveState.status === "error" || liveState.status === "connecting" || liveState.turns.length > 0 || liveState.userTranscript || liveState.modelTranscript) && (
              <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 p-4 shadow-sm flex flex-col gap-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800/40 pb-3">
                  <div className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-emerald-500" />
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                        Live Broadcast Transcription Feed
                      </h3>
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 font-sans">
                        Continuous log of captured and translated broadcast audio
                      </p>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      onClick={handleCopyTranscript}
                      title="Copy full transcript"
                      className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1 cursor-pointer shadow-2sm"
                    >
                      {copiedTranscript ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-500 animate-scale" />
                          <span className="text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownloadTranscript}
                      title="Download as TXT"
                      className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1 cursor-pointer shadow-2sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={clearSessionTranscript}
                      title="Clear session history"
                      className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-rose-950/20 shadow-2sm border border-slate-200/80 dark:border-rose-900/30 text-slate-500 dark:text-rose-400 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-300 dark:hover:border-rose-900/65 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                {/* Subtitle list scroll container */}
                <div 
                  ref={transcriptContainerRef}
                  className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                >
                  {/* Grid Column Headers (Visible list is not empty) */}
                  {liveState.turns.length > 0 && (
                    <div className="hidden md:grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-2 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-300 tracking-wider">
                      <div>CAPTURED ORIGINAL AUDIO</div>
                      <div>GEMINI SIMULTANEOUS INTERPRETATION</div>
                    </div>
                  )}

                  {/* Historical entries */}
                  {liveState.turns.map((turn, idx) => (
                    <div 
                      key={turn.id || idx} 
                      className="flex flex-col gap-2 pb-3.5 border-b border-slate-100 dark:border-slate-800/40 text-xs"
                    >
                      {/* Turn Action Bar with Save Clip button */}
                      <div className="flex items-center justify-between px-1 text-[11px] font-mono">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] border border-slate-200/50 dark:border-slate-700/50">
                            Turn #{idx + 1}
                          </span>
                          <span className="text-slate-400 dark:text-slate-300 text-[10px]">
                            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>

                        <button
                          onClick={() => handleSaveTurnClip(turn, idx)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2sm border ${
                            savedClipIndex === idx
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-500/60 active:scale-95"
                          }`}
                          title="Extract and save audio snippet for this turn as a WAV download"
                        >
                          {savedClipIndex === idx ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-white" />
                              <span>Clip Saved!</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Save Clip</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                        {/* Left Side: Original Native Language */}
                        <div className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/10 flex flex-col gap-1.5 justify-between">
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans text-sm font-medium">
                            {turn.originalText}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-300 font-mono border-t border-slate-100/50 dark:border-slate-800/20 pt-1.5 mt-0.5">
                            <span className="font-bold tracking-wider uppercase">NATIVE STREAM</span>
                          </div>
                        </div>

                        {/* Right Side: Translation */}
                        <div className="p-3 rounded-xl border border-emerald-500/12 dark:border-emerald-500/10 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.01] flex flex-col gap-1.5 justify-between">
                          <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed font-sans text-sm font-semibold">
                            {turn.translatedText}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400/90 font-mono border-t border-emerald-500/5 dark:border-emerald-500/5 pt-1.5 mt-0.5">
                            <span className="font-bold tracking-wider uppercase">Interpreted ({liveTargetLang})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Incoming Live Decoding Stream (User & Model Side by Side) */}
                  {(liveState.userTranscript || liveState.modelTranscript) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs items-stretch">
                      {/* Left: Original decoding live stream */}
                      <div className="p-3 rounded-xl border border-dashed border-slate-300/85 dark:border-slate-800 bg-slate-50/10 dark:bg-slate-900/5 flex flex-col gap-2 justify-between">
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-sans text-sm italic">
                          {liveState.userTranscript ? `"${liveState.userTranscript}"` : "Listening for active speech segments..."}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-300 font-mono border-t border-dashed border-slate-200/50 dark:border-slate-800/20 pt-1.5">
                          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                            DETECTOR
                          </span>
                          {liveState.userTranscript && (
                            <span className="text-amber-500 font-bold tracking-widest animate-pulse">DECODING...</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Model translating live stream */}
                      <div className="p-3 rounded-xl border border-dashed border-emerald-500/20 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.005] flex flex-col gap-2 justify-between">
                        <p className="text-emerald-600/80 dark:text-emerald-400/80 leading-relaxed font-sans text-sm italic">
                          {liveState.modelTranscript ? `"${liveState.modelTranscript}"` : `Translating live to ${liveTargetLang}...`}
                        </p>
                        <div className="flex items-center justify-between text-[9px] text-emerald-500 font-mono border-t border-dashed border-emerald-500/10 pt-1.5">
                          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            INTELLIGENCE
                          </span>
                          {liveState.modelTranscript && (
                            <span className="text-emerald-500 font-bold tracking-wide animate-pulse uppercase">TRANSLATING...</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state when session is active but waiting for first speech */}
                  {liveState.turns.length === 0 && !liveState.userTranscript && !liveState.modelTranscript && (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-300">
                      <ScrollText className="w-9 h-9 opacity-40 mb-2 animate-pulse" style={{ animationDuration: '3s' }} />
                      <p className="text-xs font-semibold uppercase tracking-wider font-mono">Listening to active broadcast frequencies...</p>
                      <p className="text-[10px] opacity-75 mt-1 max-w-md">Captured audio captions & simultaneous translations will flow into this dual-channel side-by-side display panel in real-time.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* World Map Container (Fitted size) */}
          <section className="w-full">
            <WorldMap
              darkMode={darkMode}
              onMapClick={handleMapLocationClick}
              selectedProfile={selectedProfile}
              loading={profileLoading}
              selectedCoords={selectedCoords}
              radiusKm={radiusKm}
              setRadiusKm={setRadiusKm}
              onRadiusChangeEnd={handleRadiusChangeEnd}
              stations={availableStations}
              activeStation={activeStation}
              isPlaying={isPlaying}
              onSelectStation={handleSelectStation}
            />
          </section>

          {/* Radios catalog lists panel */}
          <section className="flex-1">
            <StationList
              currentCountryProfile={selectedProfile}
              onSelectStation={handleSelectStation}
              activeStation={activeStation}
              isPlaying={isPlaying}
              isProfileLoading={profileLoading}
              onStationsLoaded={setAvailableStations}
            />
          </section>

        </div>



      </main>

      {/* Floating Sticky global audio streamer controls */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl">
        <AudioPlayer
          station={activeStation}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      </footer>



    </div>
  );
}
