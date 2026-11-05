import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Info, ShieldAlert, Radio, Sparkles, Share2, Check, Mic, MicOff, Languages, Volume2, RefreshCw, ScrollText, Copy, Trash2, Download, CheckCheck, Sun, Moon, Wand2, ArrowRight, X, Globe, LogIn, LogOut, User as UserIcon, Database, Star, Bookmark, Search, LocateFixed, ArrowDownLeft, ShieldCheck, Scale, FileJson, Mail, Bell, BellRing, Compass, BookOpen } from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import WorldMap from "./components/WorldMap";
import StationList from "./components/StationList";
import AudioPlayer from "./components/AudioPlayer";
import LanguageFrequencyChart from "./components/LanguageFrequencyChart";
import ResumeStationNotification from "./components/ResumeStationNotification";
import LivePodcastShows from "./components/LivePodcastShows";
import { ProjectInfoModal } from "./components/ProjectInfoModal";
import { TranscriptSummaryModal } from "./components/TranscriptSummaryModal";
import { SessionShareModal } from "./components/SessionShareModal";
import { GmailModal } from "./components/GmailModal";
import { LanguageAlertToast } from "./components/LanguageAlertToast";
import { LanguageAlertsModal } from "./components/LanguageAlertsModal";
import { RadioStation, LocationGeoProfile, LanguageDetectionResult, LanguageEncounterEvent, BookmarkedTurn, LanguageAlertRule, LanguageAlertTrigger, BackgroundScannerStatus } from "./types";
import { loadAlertRules, saveAlertRules, loadAlertHistory, saveAlertHistory, evaluateStationAlerts, playRadioChime } from "./services/languageAlertService";
import { LiveTranslateClient, LiveTranslateState, LiveTranslateTurn, encodeWAV } from "./services/liveTranslateClient";
import { filterTranscriptTurns, splitTextByKeyword, getTurnsForSummaryWindow } from "./lib/transcriptUtils";
import { buildBroadcastSessionExport, downloadSessionJson } from "./lib/sessionExport";
import { generateSessionShareUrl, parseSessionShareUrl, SessionShareState } from "./lib/sessionShare";
import { auth, db, loginWithGoogle, logoutFirebase, testFirebaseConnection, handleFirestoreError, OperationType } from "./lib/firebase";

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
  const [mainContentTab, setMainContentTab] = useState<"radio" | "podcasts">("radio");
  const [savedSessionFeedback, setSavedSessionFeedback] = useState<boolean>(false);

  // Deep-Link Full Session Sharing States
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareSessionUrl, setShareSessionUrl] = useState<string>("");
  const [copiedShareSessionFeedback, setCopiedShareSessionFeedback] = useState<boolean>(false);
  const [sharedSessionJoinedNotice, setSharedSessionJoinedNotice] = useState<{
    stationName: string;
    targetLanguage: string;
  } | null>(null);

  // Firebase Authentication & Firestore User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Validate Firestore connection on app mount
    testFirebaseConnection();

    // Listen to Firebase Auth changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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

      // Sync to Firestore if user is logged in
      if (currentUser) {
        const docRef = doc(db, "user_listens", currentUser.uid);
        setDoc(
          docRef,
          {
            stationuuid: activeStation.stationuuid,
            stationName: activeStation.name,
            playedAt: new Date().toISOString(),
            userId: currentUser.uid,
          },
          { merge: true }
        ).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, `user_listens/${currentUser.uid}`);
        });
      }
    }
  }, [activeStation?.stationuuid, isPlaying, currentUser]);

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

  // Bookmarked transcript turns state & persistent synchronization
  const [bookmarkedTurns, setBookmarkedTurns] = useState<BookmarkedTurn[]>(() => {
    try {
      const saved = localStorage.getItem("world_radio_bookmarked_turns");
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn("Failed to load bookmarked turns from localStorage:", err);
      return [];
    }
  });
  const [transcriptViewFilter, setTranscriptViewFilter] = useState<"all" | "bookmarks">("all");
  const [bookmarkSearchQuery, setBookmarkSearchQuery] = useState<string>("");
  const [transcriptSearchQuery, setTranscriptSearchQuery] = useState<string>("");
  const [sharedTurnId, setSharedTurnId] = useState<string | null>(null);
  const [highlightedTurnId, setHighlightedTurnId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [projectModalInitialTab, setProjectModalInitialTab] = useState<"overview" | "manual" | "playstore" | "policies" | "license" | "security" | "versioning" | "bugs" | "testing">("overview");

  useEffect(() => {
    try {
      localStorage.setItem("world_radio_bookmarked_turns", JSON.stringify(bookmarkedTurns));
    } catch (err) {
      console.warn("Failed to save bookmarked turns to localStorage:", err);
    }
  }, [bookmarkedTurns]);

  const isTurnBookmarked = (turnId?: string) => {
    if (!turnId) return false;
    return bookmarkedTurns.some((b) => b.id === turnId);
  };

  const toggleBookmarkTurn = (turn: LiveTranslateTurn | BookmarkedTurn) => {
    const turnId = turn.id || `turn-${Date.now()}`;
    
    if (isTurnBookmarked(turnId)) {
      setBookmarkedTurns((prev) => prev.filter((b) => b.id !== turnId));
    } else {
      const newBookmark: BookmarkedTurn = {
        id: turnId,
        originalText: turn.originalText,
        translatedText: turn.translatedText,
        timestamp: turn.timestamp instanceof Date ? turn.timestamp.toISOString() : String(turn.timestamp),
        stationName: (turn as BookmarkedTurn).stationName || activeStation?.name || "Global Radio Station",
        stationCountry: (turn as BookmarkedTurn).stationCountry || activeStation?.country || "",
        targetLanguage: (turn as BookmarkedTurn).targetLanguage || liveTargetLang,
        bookmarkedAt: Date.now(),
        audioUrl: turn.audioUrl
      };
      setBookmarkedTurns((prev) => [newBookmark, ...prev]);
    }
  };

  const handleShareBookmarkedTurn = async (turn: BookmarkedTurn | LiveTranslateTurn) => {
    const turnId = turn.id || `turn-${Date.now()}`;
    const stationName = (turn as BookmarkedTurn).stationName || activeStation?.name || "Global Radio Station";
    const country = (turn as BookmarkedTurn).stationCountry || activeStation?.country || "";
    const targetLang = (turn as BookmarkedTurn).targetLanguage || liveTargetLang;
    const timeFormatted = new Date(turn.timestamp).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const shareTitle = `Radio Broadcast Translation • ${stationName}`;
    const shareText = `📻 Broadcast Station: ${stationName}${country ? ` (${country})` : ""}\n🕒 Timestamp: ${timeFormatted}\n\n🎙️ Original Audio:\n"${turn.originalText}"\n\n✨ Interpretation (${targetLang}):\n"${turn.translatedText}"\n\n— Shared via Remix: World Radio Translator`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
        setSharedTurnId(turnId);
        setTimeout(() => setSharedTurnId(null), 2500);
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return; // User cancelled share dialog
        }
        console.warn("navigator.share failed, falling back to clipboard:", err);
      }
    }

    // Fallback: Copy pre-formatted message to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setSharedTurnId(turnId);
      setTimeout(() => setSharedTurnId(null), 2500);
    } catch (clipErr) {
      console.warn("Clipboard fallback failed:", clipErr);
    }
  };

  const clearAllBookmarks = () => {
    if (window.confirm("Are you sure you want to remove all saved transcript bookmarks?")) {
      setBookmarkedTurns([]);
    }
  };

  const handleJumpToContext = (turnId: string) => {
    // Switch to "all" log view if currently in bookmarks tab
    if (transcriptViewFilter !== "all") {
      setTranscriptViewFilter("all");
    }

    // Set highlight pulse on target turn
    setHighlightedTurnId(turnId);

    // Allow DOM to update tab before scrolling
    setTimeout(() => {
      const element = document.getElementById(`turn-item-${turnId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 80);

    // Reset highlight effect after animation duration
    setTimeout(() => {
      setHighlightedTurnId((curr) => (curr === turnId ? null : curr));
    }, 3500);
  };

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
    if (transcriptViewFilter === "bookmarks") {
      if (bookmarkedTurns.length === 0) return;
      let text = "=== World Radio Translator - Saved Bookmarks ===\n";
      text += `Total Bookmarks: ${bookmarkedTurns.length}\n`;
      text += `Date: ${new Date().toLocaleDateString()}\n\n`;

      bookmarkedTurns.forEach((turn, idx) => {
        const timeStr = new Date(turn.timestamp).toLocaleString();
        text += `[Bookmark ${idx + 1} - ${turn.stationName || "Radio"} (${turn.targetLanguage || "Translated"}) - ${timeStr}]\n`;
        text += `Original Stream: ${turn.originalText}\n`;
        text += `Translation: ${turn.translatedText}\n\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        setCopiedTranscript(true);
        setTimeout(() => setCopiedTranscript(false), 2000);
      });
      return;
    }

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
    if (transcriptViewFilter === "bookmarks") {
      if (bookmarkedTurns.length === 0) return;
      let text = "=== World Radio Translator - Saved Bookmarks ===\n";
      text += `Total Bookmarks: ${bookmarkedTurns.length}\n`;
      text += `Date: ${new Date().toLocaleDateString()}\n\n`;

      bookmarkedTurns.forEach((turn, idx) => {
        const timeStr = new Date(turn.timestamp).toLocaleString();
        text += `[Bookmark ${idx + 1} - ${turn.stationName || "Radio"} (${turn.targetLanguage || "Translated"}) - ${timeStr}]\n`;
        text += `Original Stream: ${turn.originalText}\n`;
        text += `Translation: ${turn.translatedText}\n\n`;
      });

      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `world_radio_saved_bookmarks_${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

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
    setTranscriptSearchQuery("");
  };

  const handleSaveFullSession = () => {
    const sessionExport = buildBroadcastSessionExport({
      station: activeStation,
      turns: liveState.turns,
      bookmarks: bookmarkedTurns,
      targetLanguage: liveTargetLang,
      detectionResult,
      liveStatus: liveState.status,
      liveState,
    });

    downloadSessionJson(sessionExport);
    setSavedSessionFeedback(true);
    setTimeout(() => setSavedSessionFeedback(false), 2500);
  };

  const handleShareFullSession = () => {
    const shareState: SessionShareState = {
      station: activeStation,
      targetLanguage: liveTargetLang,
      filters: {
        tab: mainContentTab,
        radiusKm,
        selectedCoords,
        country: selectedProfile?.country || activeStation?.country,
        transcriptView: transcriptViewFilter,
        transcriptSearch: transcriptSearchQuery,
      },
      autoPlay: true,
    };

    const url = generateSessionShareUrl(window.location.origin, shareState);
    setShareSessionUrl(url);
    setIsShareModalOpen(true);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedShareSessionFeedback(true);
        setTimeout(() => setCopiedShareSessionFeedback(false), 2500);
      }).catch(() => {});
    }
  };

  // Broadcast transcript summarization states
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [summaryText, setSummaryText] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryTurnsCount, setSummaryTurnsCount] = useState(0);
  const [summaryIsFallback, setSummaryIsFallback] = useState(false);

  // Custom Language Alerts & Background Airwaves Scanner States
  const [alertRules, setAlertRules] = useState<LanguageAlertRule[]>(() => loadAlertRules());
  const [alertHistory, setAlertHistory] = useState<LanguageAlertTrigger[]>(() => loadAlertHistory());
  const [activeToasts, setActiveToasts] = useState<LanguageAlertTrigger[]>([]);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [scannerStatus, setScannerStatus] = useState<BackgroundScannerStatus>({
    isScanning: false,
    currentStationIndex: 0,
    scannedStationName: null,
    scannedStationUuid: null,
    lastScanTime: null,
    scanIntervalSeconds: 20,
    totalScannedCount: 0,
    matchCount: 0,
    scanMode: "filtered_list",
  });

  const handleUpdateAlertRules = (updatedRules: LanguageAlertRule[]) => {
    setAlertRules(updatedRules);
    saveAlertRules(updatedRules);
  };

  const handleDismissToast = (triggerId: string) => {
    setActiveToasts((prev) => prev.filter((t) => t.id !== triggerId));
  };

  const handleMuteRule = (ruleId: string) => {
    const updated = alertRules.map((r) => (r.id === ruleId ? { ...r, enabled: false } : r));
    handleUpdateAlertRules(updated);
    setActiveToasts((prev) => prev.filter((t) => t.ruleId !== ruleId));
  };

  const handleTuneInFromAlert = (trigger: LanguageAlertTrigger) => {
    handleDismissToast(trigger.id);
    const found = availableStations.find((s) => s.stationuuid === trigger.stationuuid);
    if (found) {
      handleSelectStation(found);
    } else {
      const syntheticStation: RadioStation = {
        changeid: trigger.stationuuid,
        stationuuid: trigger.stationuuid,
        name: trigger.stationName,
        url: trigger.streamUrl,
        url_resolved: trigger.streamUrl,
        homepage: "",
        favicon: "",
        tags: trigger.language,
        country: trigger.stationCountry || "",
        countrycode: "",
        state: "",
        language: trigger.language,
        votes: 100,
        clickcount: 100,
        codec: "MP3",
        bitrate: 128,
      };
      handleSelectStation(syntheticStation);
    }
  };

  const handleTriggerTestAlert = (lang: string) => {
    const sampleStation = availableStations[0] || {
      stationuuid: "test-sample-station",
      name: "Cadena SER Madrid",
      country: "Spain",
      url: "https://cadenaser.example.com",
      url_resolved: "https://cadenaser.example.com",
    };

    const dummyTrigger: LanguageAlertTrigger = {
      id: `test-trig-${Date.now()}`,
      ruleId: alertRules.find((r) => r.targetLanguage.toLowerCase() === lang.toLowerCase())?.id || "rule-test",
      language: lang,
      stationuuid: sampleStation.stationuuid,
      stationName: sampleStation.name,
      stationCountry: sampleStation.country,
      streamUrl: sampleStation.url_resolved || sampleStation.url,
      confidence: 0.88,
      timestamp: Date.now(),
      snippet: `Live radio broadcast snippet detected in ${lang}.`,
      source: "background_scanner",
    };

    setActiveToasts((prev) => [dummyTrigger, ...prev]);
    setAlertHistory((prev) => {
      const nextHistory = [dummyTrigger, ...prev].slice(0, 50);
      saveAlertHistory(nextHistory);
      return nextHistory;
    });
  };

  // Background Scanner Engine
  useEffect(() => {
    if (!scannerStatus.isScanning) return;

    const intervalMs = Math.max(5000, scannerStatus.scanIntervalSeconds * 1000);

    const timer = setInterval(() => {
      let pool = availableStations;
      if (scannerStatus.scanMode === "favorites" && bookmarkedTurns.length > 0) {
        pool = availableStations.filter((s) =>
          bookmarkedTurns.some((b) => b.stationName === s.name)
        );
        if (pool.length === 0) pool = availableStations;
      }

      if (!pool || pool.length === 0) return;

      const nextIndex = (scannerStatus.currentStationIndex + 1) % pool.length;
      const candidate = pool[nextIndex];
      if (!candidate) return;

      const rawStationLang = candidate.language || "";
      const detectedLang = rawStationLang.length > 2
        ? rawStationLang.charAt(0).toUpperCase() + rawStationLang.slice(1).toLowerCase()
        : rawStationLang || "Unknown";

      const confidence = rawStationLang ? 0.85 : 0.50;

      const { matchedRules, triggers } = evaluateStationAlerts(
        candidate,
        detectedLang,
        confidence,
        alertRules,
        "background_scanner",
        `Radio broadcast from ${candidate.country || "airwaves"} in ${detectedLang}`
      );

      if (triggers.length > 0) {
        if (matchedRules.some((r) => r.notifySound)) {
          playRadioChime();
        }

        const toastTriggers = triggers.filter((_, i) => matchedRules[i]?.notifyToast);
        if (toastTriggers.length > 0) {
          setActiveToasts((prev) => [...toastTriggers, ...prev]);
        }

        setAlertHistory((prev) => {
          const nextHistory = [...triggers, ...prev].slice(0, 50);
          saveAlertHistory(nextHistory);
          return nextHistory;
        });

        const autoTuneRule = matchedRules.find((r) => r.autoTune);
        if (autoTuneRule) {
          handleSelectStation(candidate);
        }
      }

      setScannerStatus((prev) => ({
        ...prev,
        currentStationIndex: nextIndex,
        scannedStationName: candidate.name,
        scannedStationUuid: candidate.stationuuid,
        lastScanTime: Date.now(),
        totalScannedCount: prev.totalScannedCount + 1,
        matchCount: prev.matchCount + triggers.length,
      }));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [
    scannerStatus.isScanning,
    scannerStatus.scanIntervalSeconds,
    scannerStatus.scanMode,
    scannerStatus.currentStationIndex,
    availableStations,
    alertRules,
    bookmarkedTurns,
  ]);

  // Check live stream language detection against alert rules
  useEffect(() => {
    if (detectionResult?.detectedLanguage && activeStation && isPlaying) {
      const { matchedRules, triggers } = evaluateStationAlerts(
        activeStation,
        detectionResult.detectedLanguage,
        detectionResult.confidence || 0.75,
        alertRules,
        "live_stream",
        liveState.userTranscript || undefined
      );

      if (triggers.length > 0) {
        if (matchedRules.some((r) => r.notifySound)) {
          playRadioChime();
        }
        const toastTriggers = triggers.filter((_, i) => matchedRules[i]?.notifyToast);
        if (toastTriggers.length > 0) {
          setActiveToasts((prev) => [...toastTriggers, ...prev]);
        }
        setAlertHistory((prev) => {
          const nextHistory = [...triggers, ...prev].slice(0, 50);
          saveAlertHistory(nextHistory);
          return nextHistory;
        });
      }
    }
  }, [detectionResult?.detectedLanguage, activeStation?.stationuuid, isPlaying, alertRules]);


  const handleSummarizeTranscript = async () => {
    if (liveState.turns.length === 0) return;

    // Filter turns belonging to the last 10 minutes of broadcast session
    const turnsToSummarize = getTurnsForSummaryWindow(liveState.turns, 10);
    if (turnsToSummarize.length === 0) return;

    setIsSummaryModalOpen(true);
    setIsSummarizing(true);
    setSummaryError(null);
    setSummaryTurnsCount(turnsToSummarize.length);

    try {
      const response = await fetch("/api/summarize-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          turns: turnsToSummarize,
          stationName: activeStation?.name || "Active Broadcast",
          country: activeStation?.country || "",
          targetLanguage: liveTargetLang || "English",
          windowMinutes: 10,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setSummaryText(data.summary);
      setSummaryTurnsCount(data.turnsCount || turnsToSummarize.length);
      setSummaryIsFallback(!!data.isFallback);
    } catch (err: any) {
      console.error("[Summarize Transcript] Error:", err);
      setSummaryError(err.message || "Failed to generate broadcast summary.");
    } finally {
      setIsSummarizing(false);
    }
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

  // Parse URL query coordinates and deep-link session sharing on startup
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const parsedShared = parseSessionShareUrl(window.location.search);

    let initialLat = 46.2276; // Alpine region coordinates as default
    let initialLng = 2.2137;
    let initialRadius = 500;

    if (parsedShared.isValid) {
      if (parsedShared.targetLanguage) {
        setLiveTargetLang(parsedShared.targetLanguage);
      }
      if (parsedShared.filters.tab) {
        setMainContentTab(parsedShared.filters.tab);
      }
      if (parsedShared.filters.radiusKm) {
        initialRadius = parsedShared.filters.radiusKm;
        setRadiusKm(parsedShared.filters.radiusKm);
      }
      if (parsedShared.filters.selectedCoords) {
        initialLat = parsedShared.filters.selectedCoords.lat;
        initialLng = parsedShared.filters.selectedCoords.lng;
      }
      if (parsedShared.filters.transcriptView) {
        setTranscriptViewFilter(parsedShared.filters.transcriptView);
      }
      if (parsedShared.filters.transcriptSearch) {
        setTranscriptSearchQuery(parsedShared.filters.transcriptSearch);
      }
      if (parsedShared.station) {
        setActiveStation(parsedShared.station);
        if (parsedShared.autoPlay) {
          setIsPlaying(true);
        }
        setSharedSessionJoinedNotice({
          stationName: parsedShared.station.name,
          targetLanguage: parsedShared.targetLanguage || "English",
        });
        setTimeout(() => setSharedSessionJoinedNotice(null), 8000);
      }
    } else {
      const urlLat = params.get("lat");
      const urlLng = params.get("lng");
      const urlRadius = params.get("radius");

      if (urlLat) initialLat = parseFloat(urlLat);
      if (urlLng) initialLng = parseFloat(urlLng);
      if (urlRadius) initialRadius = parseInt(urlRadius, 10);
      setRadiusKm(initialRadius);
    }

    setSelectedCoords({ lat: initialLat, lng: initialLng });

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

      {/* App Navigation & Firebase Auth Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-base tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>World Radio Translator</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/20">
                  Firebase Sync Active
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                Global Airwaves Scanner & Real-time Live Translation
              </p>
            </div>
          </div>

            {/* Policies & Terms Direct Launcher */}
            <button
              type="button"
              onClick={() => {
                setProjectModalInitialTab("policies");
                setShowProjectModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Service, Data, Privacy, and Radio Streaming Policies"
              id="btn_open_policies_modal"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Policies & Terms</span>
            </button>

            {/* OpenSSF Best Practices & Compliance Hub */}
            <button
              type="button"
              onClick={() => {
                setProjectModalInitialTab("overview");
                setShowProjectModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Open Source Standards, FLOSS License, Security Policies & Automated Test Hub"
              id="btn_open_project_info_modal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">OpenSSF Standards</span>
              <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                v1.2.0
              </span>
            </button>

            {/* Illustrated User's Manual Button */}
            <button
              type="button"
              onClick={() => {
                setProjectModalInitialTab("manual");
                setShowProjectModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Official User's Manual with 5 illustrated feature guides"
              id="btn_open_user_manual_header"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">User Manual</span>
            </button>

            {/* Gmail Workspace Hub Button */}
            <button
              type="button"
              id="btn_open_gmail_header"
              onClick={() => setIsGmailModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-500/50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Open Gmail (Send broadcast digest, drafts & email history)"
            >
              <Mail className="w-3.5 h-3.5 text-red-500" />
              <span className="hidden sm:inline">Gmail</span>
            </button>

            {/* Custom Language Alerts & Background Airwaves Scanner Button */}
            <button
              type="button"
              id="btn_open_language_alerts_modal"
              onClick={() => setIsAlertsModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer ${
                scannerStatus.isScanning
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-500/50 text-slate-700 dark:text-slate-200"
              }`}
              title="Custom Language Detection Alerts & Background Airwaves Scanner"
            >
              {scannerStatus.isScanning ? (
                <BellRing className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
              ) : (
                <Bell className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden sm:inline">Language Alerts</span>
              {alertRules.filter((r) => r.enabled).length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono">
                  {alertRules.filter((r) => r.enabled).length}
                </span>
              )}
            </button>

            {/* Firebase Authentication Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
            {currentUser ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-1.5 pl-2.5">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-6 h-6 rounded-full border border-emerald-500/50 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-500" />
                )}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight max-w-[120px] truncate">
                    {currentUser.displayName || currentUser.email || "Account Active"}
                  </span>
                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Cloud Synced
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => logoutFirebase()}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                  title="Sign out of Firebase"
                  id="btn_firebase_logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => loginWithGoogle()}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Sign in with Google via Firebase Auth"
                id="btn_firebase_login"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>
      </header>
      
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
          
          {/* Shared Session Joined Welcome Banner */}
          {sharedSessionJoinedNotice && (
            <div
              className="bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent border border-teal-500/30 text-teal-950 dark:text-teal-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between shadow-sm animate-fade-in"
              id="notice-shared-session-joined"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-600 dark:text-teal-300">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-[10px] text-teal-700 dark:text-teal-400 font-mono block">
                    Shared Live Session Active
                  </span>
                  <span>
                    Tuned into <strong>{sharedSessionJoinedNotice.stationName}</strong> with live interpreter target:{" "}
                    <strong className="underline">{sharedSessionJoinedNotice.targetLanguage}</strong>.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSharedSessionJoinedNotice(null)}
                className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-300 p-1 cursor-pointer"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
            {(liveState.status === "connected" || liveState.status === "error" || liveState.status === "connecting" || liveState.turns.length > 0 || liveState.userTranscript || liveState.modelTranscript || bookmarkedTurns.length > 0) && (
              <div className="border border-slate-200/60 dark:border-slate-800/60 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 p-4 shadow-sm flex flex-col gap-3.5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-150 dark:border-slate-800/40 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-4 h-4 text-emerald-500" />
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                          Broadcast Transcription Feed
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-300 font-sans">
                          Continuous log of captured audio & saved translation bookmarks
                        </p>
                      </div>
                    </div>

                    {/* View Filter Toggle Buttons */}
                    <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-900/80 p-0.5 rounded-lg text-xs font-mono border border-slate-200/50 dark:border-slate-800 self-start sm:self-auto">
                      <button
                        onClick={() => setTranscriptViewFilter("all")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-[11px] ${
                          transcriptViewFilter === "all"
                            ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2sm"
                            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        }`}
                      >
                        <span>All Logs</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700/60 text-[10px]">
                          {transcriptSearchQuery.trim()
                            ? `${filterTranscriptTurns(liveState.turns, transcriptSearchQuery).length}/${liveState.turns.length}`
                            : liveState.turns.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setTranscriptViewFilter("bookmarks")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 text-[11px] ${
                          transcriptViewFilter === "bookmarks"
                            ? "bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-2sm"
                            : "text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-300"
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${bookmarkedTurns.length > 0 ? "fill-amber-400 text-amber-500" : ""}`} />
                        <span>Saved Bookmarks</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          {bookmarkedTurns.length}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-1.5 self-end md:self-auto flex-wrap">
                    {/* Summarize Transcript Button */}
                    <button
                      id="btn-summarize-transcript"
                      onClick={handleSummarizeTranscript}
                      disabled={liveState.turns.length === 0 || isSummarizing}
                      title={
                        liveState.turns.length === 0
                          ? "No transcript turns captured yet to summarize"
                          : "Summarize the last 10 minutes of broadcast with Gemini 3.8 Flash"
                      }
                      className={`p-1 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2sm ${
                        liveState.turns.length === 0
                          ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400"
                          : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-400 font-semibold"
                      }`}
                    >
                      {isSummarizing ? (
                        <>
                          <RefreshCw className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-spin" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Summarize (10m)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyTranscript}
                      title={transcriptViewFilter === "bookmarks" ? "Copy saved bookmarks" : "Copy full transcript"}
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
                      title={transcriptViewFilter === "bookmarks" ? "Download bookmarks as TXT" : "Download transcript as TXT"}
                      className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-850 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-1 cursor-pointer shadow-2sm"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>

                    {/* Save Full Session JSON Button */}
                    <button
                      id="btn-save-full-session"
                      onClick={handleSaveFullSession}
                      title="Save full broadcast session (station metadata, all transcript turns & user bookmarks) as JSON for offline analysis"
                      className={`p-1 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2sm ${
                        savedSessionFeedback
                          ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400 text-emerald-600 dark:text-emerald-300"
                          : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:bg-emerald-50/40 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {savedSessionFeedback ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-emerald-500 animate-scale" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Saved Session!</span>
                        </>
                      ) : (
                        <>
                          <FileJson className="w-3 h-3 text-emerald-500" />
                          <span className="font-semibold">Save Full Session</span>
                        </>
                      )}
                    </button>

                    {/* Share Full Session Deep-Link Button */}
                    <button
                      id="btn-share-full-session"
                      onClick={handleShareFullSession}
                      title="Share full live session with deep-link URL (station, language & filters) for simultaneous listening"
                      className={`p-1 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2sm ${
                        copiedShareSessionFeedback
                          ? "bg-teal-50 dark:bg-teal-950/50 border border-teal-400 text-teal-600 dark:text-teal-300"
                          : "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-700/60 hover:bg-teal-50/40 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      {copiedShareSessionFeedback ? (
                        <>
                          <CheckCheck className="w-3 h-3 text-teal-500 animate-scale" />
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3 h-3 text-teal-500" />
                          <span className="font-semibold">Share Full Session</span>
                        </>
                      )}
                    </button>

                    {/* Email via Gmail Button */}
                    <button
                      id="btn-email-session-gmail"
                      onClick={() => setIsGmailModalOpen(true)}
                      title="Email live broadcast digest and translations via Gmail"
                      className="p-1 px-2.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2sm bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700/60 hover:bg-red-50/40 dark:hover:bg-slate-800/60"
                    >
                      <Mail className="w-3 h-3 text-red-500" />
                      <span className="font-semibold">Email via Gmail</span>
                    </button>

                    {transcriptViewFilter === "all" ? (
                      <button
                        onClick={clearSessionTranscript}
                        title="Clear session history"
                        className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-rose-950/20 shadow-2sm border border-slate-200/80 dark:border-rose-900/30 text-slate-500 dark:text-rose-400 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-300 dark:hover:border-rose-900/65 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    ) : (
                      bookmarkedTurns.length > 0 && (
                        <button
                          onClick={clearAllBookmarks}
                          title="Clear all saved bookmarks"
                          className="p-1 px-2.5 rounded-lg text-[11px] font-medium bg-white dark:bg-rose-950/20 shadow-2sm border border-slate-200/80 dark:border-rose-900/30 text-slate-500 dark:text-rose-400 hover:text-rose-600 hover:border-rose-200 dark:hover:text-rose-300 dark:hover:border-rose-900/65 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear All</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Subtitle list scroll container */}
                <div 
                  ref={transcriptContainerRef}
                  className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar scroll-smooth"
                >
                  {/* ALL LOGS VIEW */}
                  {transcriptViewFilter === "all" && (() => {
                    const filteredTurns = filterTranscriptTurns(liveState.turns, transcriptSearchQuery);
                    return (
                      <>
                        {/* Search Bar for All Logs */}
                        {(liveState.turns.length > 0 || transcriptSearchQuery) && (
                          <div className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xs pb-1 pt-0.5">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={transcriptSearchQuery}
                                onChange={(e) => setTranscriptSearchQuery(e.target.value)}
                                placeholder="Filter transcript turns by keyword (native audio or translation)..."
                                className="w-full pl-8 pr-24 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-2xs"
                                id="input_transcript_search_all_logs"
                              />
                              {transcriptSearchQuery ? (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                    {filteredTurns.length} {filteredTurns.length === 1 ? "match" : "matches"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setTranscriptSearchQuery("")}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                    title="Clear keyword search"
                                    id="btn_clear_transcript_search"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-slate-400 pointer-events-none">
                                  {liveState.turns.length} {liveState.turns.length === 1 ? "turn" : "turns"}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {transcriptSearchQuery.trim() && filteredTurns.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-300 bg-white/40 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/60 p-5">
                            <Search className="w-7 h-7 text-slate-400/60 mb-2 animate-pulse" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                              No matching transcript logs found
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 max-w-sm">
                              No transcript turns matched &ldquo;{transcriptSearchQuery}&rdquo;. Try another keyword or clear the search filter.
                            </p>
                            <button
                              type="button"
                              onClick={() => setTranscriptSearchQuery("")}
                              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                              id="btn_reset_transcript_search"
                            >
                              Clear Keyword Filter
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Grid Column Headers (Visible list is not empty) */}
                            {filteredTurns.length > 0 && (
                              <div className="hidden md:grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-2 text-[10px] font-mono font-bold text-slate-400 dark:text-slate-300 tracking-wider">
                                <div>CAPTURED ORIGINAL AUDIO</div>
                                <div>GEMINI SIMULTANEOUS INTERPRETATION</div>
                              </div>
                            )}

                            {/* Historical entries */}
                            {filteredTurns.map((turn, idx) => {
                              const originalIndex = liveState.turns.findIndex(
                                (t) => (t.id && t.id === turn.id) || t === turn
                              );
                              const turnNumber = originalIndex !== -1 ? originalIndex + 1 : idx + 1;
                              const isHighlighted = highlightedTurnId === turn.id;
                              return (
                                <div 
                                  key={turn.id || idx} 
                                  id={`turn-item-${turn.id}`}
                                  className={`flex flex-col gap-2 pb-3.5 border-b text-xs transition-all duration-500 rounded-xl px-2.5 py-2 ${
                                    isHighlighted
                                      ? "bg-amber-500/15 dark:bg-amber-500/20 border-amber-500/60 shadow-md ring-2 ring-amber-400/50 scale-[1.01]"
                                      : "border-slate-100 dark:border-slate-800/40"
                                  }`}
                                >
                                  {/* Turn Action Bar with Star Bookmark & Save Clip button */}
                                  <div className="flex items-center justify-between px-1 text-[11px] font-mono">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border transition-colors ${
                                        isHighlighted
                                          ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/50 dark:border-slate-700/50"
                                      }`}>
                                        Turn #{turnNumber}
                                      </span>
                                      <span className="text-slate-400 dark:text-slate-300 text-[10px]">
                                        {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                      </span>
                                      {isHighlighted && (
                                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-300 animate-bounce">
                                          <LocateFixed className="w-3 h-3" />
                                          <span>Target Turn</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {/* Star / Bookmark Button */}
                                      <button
                                        onClick={() => toggleBookmarkTurn(turn)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2sm border ${
                                          isTurnBookmarked(turn.id)
                                            ? "bg-amber-500/15 dark:bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-500/40"
                                            : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-amber-400 hover:text-amber-500"
                                        }`}
                                        title={isTurnBookmarked(turn.id) ? "Remove bookmark for this turn" : "Star and bookmark this turn"}
                                      >
                                        <Star className={`w-3.5 h-3.5 ${isTurnBookmarked(turn.id) ? "fill-amber-400 text-amber-500" : ""}`} />
                                        <span>{isTurnBookmarked(turn.id) ? "Bookmarked" : "Bookmark"}</span>
                                      </button>

                                      {/* Share Button (when bookmarked) */}
                                      {isTurnBookmarked(turn.id) && (
                                        <button
                                          onClick={() => handleShareBookmarkedTurn(turn)}
                                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2sm border ${
                                            sharedTurnId === turn.id
                                              ? "bg-emerald-600 text-white border-emerald-600"
                                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40"
                                          }`}
                                          title="Share this bookmarked transcript turn via Web Share API"
                                        >
                                          {sharedTurnId === turn.id ? (
                                            <>
                                              <Check className="w-3.5 h-3.5 text-white" />
                                              <span>Shared!</span>
                                            </>
                                          ) : (
                                            <>
                                              <Share2 className="w-3.5 h-3.5" />
                                              <span>Share</span>
                                            </>
                                          )}
                                        </button>
                                      )}

                                      {/* Save Clip Button */}
                                      <button
                                        onClick={() => handleSaveTurnClip(turn, originalIndex !== -1 ? originalIndex : idx)}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2sm border ${
                                          savedClipIndex === (originalIndex !== -1 ? originalIndex : idx)
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-500/60 active:scale-95"
                                        }`}
                                        title="Extract and save audio snippet for this turn as a WAV download"
                                      >
                                        {savedClipIndex === (originalIndex !== -1 ? originalIndex : idx) ? (
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
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                                    {/* Left Side: Original Native Language */}
                                    <div className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/10 flex flex-col gap-1.5 justify-between">
                                      <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans text-sm font-medium">
                                        {transcriptSearchQuery.trim()
                                          ? splitTextByKeyword(turn.originalText, transcriptSearchQuery).map((chunk, cIdx) =>
                                              chunk.isMatch ? (
                                                <mark
                                                  key={cIdx}
                                                  className="bg-amber-300/70 dark:bg-amber-400/30 text-slate-900 dark:text-amber-200 px-0.5 rounded font-bold"
                                                >
                                                  {chunk.text}
                                                </mark>
                                              ) : (
                                                <span key={cIdx}>{chunk.text}</span>
                                              )
                                            )
                                          : turn.originalText}
                                      </p>
                                      <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-300 font-mono border-t border-slate-100/50 dark:border-slate-800/20 pt-1.5 mt-0.5">
                                        <span className="font-bold tracking-wider uppercase">NATIVE STREAM</span>
                                      </div>
                                    </div>

                                    {/* Right Side: Translation */}
                                    <div className="p-3 rounded-xl border border-emerald-500/12 dark:border-emerald-500/10 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.01] flex flex-col gap-1.5 justify-between">
                                      <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed font-sans text-sm font-semibold">
                                        {transcriptSearchQuery.trim()
                                          ? splitTextByKeyword(turn.translatedText, transcriptSearchQuery).map((chunk, cIdx) =>
                                              chunk.isMatch ? (
                                                <mark
                                                  key={cIdx}
                                                  className="bg-emerald-300/70 dark:bg-emerald-400/30 text-emerald-950 dark:text-emerald-100 px-0.5 rounded font-bold"
                                                >
                                                  {chunk.text}
                                                </mark>
                                              ) : (
                                                <span key={cIdx}>{chunk.text}</span>
                                              )
                                            )
                                          : turn.translatedText}
                                      </p>
                                      <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400/90 font-mono border-t border-emerald-500/5 dark:border-emerald-500/5 pt-1.5 mt-0.5">
                                        <span className="font-bold tracking-wider uppercase">Interpreted ({liveTargetLang})</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </>
                        )}

                        {/* Incoming Live Decoding Stream (User & Model Side by Side) */}
                        {(!transcriptSearchQuery.trim() ||
                          (liveState.userTranscript && liveState.userTranscript.toLowerCase().includes(transcriptSearchQuery.toLowerCase().trim())) ||
                          (liveState.modelTranscript && liveState.modelTranscript.toLowerCase().includes(transcriptSearchQuery.toLowerCase().trim()))) &&
                          (liveState.userTranscript || liveState.modelTranscript) && (
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
                      </>
                    );
                  })()}

                  {/* SAVED BOOKMARKS FILTER VIEW */}
                  {transcriptViewFilter === "bookmarks" && (
                    <div className="flex flex-col gap-3">
                      {/* Search Input for Bookmarks */}
                      {bookmarkedTurns.length > 1 && (
                        <div className="relative mb-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={bookmarkSearchQuery}
                            onChange={(e) => setBookmarkSearchQuery(e.target.value)}
                            placeholder="Filter saved bookmarks by keyword or station..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      )}

                      {bookmarkedTurns.filter((turn) => {
                        if (!bookmarkSearchQuery.trim()) return true;
                        const q = bookmarkSearchQuery.toLowerCase();
                        return (
                          turn.originalText.toLowerCase().includes(q) ||
                          turn.translatedText.toLowerCase().includes(q) ||
                          (turn.stationName && turn.stationName.toLowerCase().includes(q))
                        );
                      }).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-300 bg-white/40 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800/60 p-6">
                          <Star className="w-9 h-9 text-amber-400/60 mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                            {bookmarkSearchQuery ? "No matching bookmarks found" : "No Saved Bookmarks Yet"}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 max-w-sm">
                            {bookmarkSearchQuery
                              ? "Try adjusting your search query or view all broadcast logs."
                              : "Click the ⭐ Bookmark button on any translation turn in the live feed to save key quotes, news highlights, and phrases."}
                          </p>
                        </div>
                      ) : (
                        bookmarkedTurns
                          .filter((turn) => {
                            if (!bookmarkSearchQuery.trim()) return true;
                            const q = bookmarkSearchQuery.toLowerCase();
                            return (
                              turn.originalText.toLowerCase().includes(q) ||
                              turn.translatedText.toLowerCase().includes(q) ||
                              (turn.stationName && turn.stationName.toLowerCase().includes(q))
                            );
                          })
                          .map((turn) => (
                            <div
                              key={turn.id}
                              className="flex flex-col gap-2 p-3.5 rounded-xl border border-amber-500/20 dark:border-amber-500/15 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] text-xs shadow-2sm"
                            >
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-500/20 flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                                    <span>{turn.stationName || "Radio Station"}</span>
                                  </span>
                                  {turn.targetLanguage && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] border border-emerald-500/20">
                                      {turn.targetLanguage}
                                    </span>
                                  )}
                                  <span className="text-slate-400 dark:text-slate-400 text-[10px]">
                                    {new Date(turn.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {/* Jump to Context Button */}
                                  <button
                                    onClick={() => handleJumpToContext(turn.id)}
                                    className="p-1 px-2.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-300 hover:text-sky-700 dark:hover:text-sky-200 transition-all cursor-pointer flex items-center gap-1 border border-sky-500/30 hover:border-sky-500/50 shadow-2sm"
                                    title="Jump to original location in full transcript feed"
                                    id={`btn_jump_context_${turn.id}`}
                                  >
                                    <LocateFixed className="w-3 h-3 text-sky-500" />
                                    <span>Jump to Context</span>
                                  </button>

                                  {/* Share Button */}
                                  <button
                                    onClick={() => handleShareBookmarkedTurn(turn)}
                                    className={`p-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-2sm ${
                                      sharedTurnId === turn.id
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 border-slate-200 dark:border-slate-800"
                                    }`}
                                    title="Share this bookmarked transcript turn via Web Share API"
                                  >
                                    {sharedTurnId === turn.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-white" />
                                        <span>Shared!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Share2 className="w-3 h-3" />
                                        <span>Share</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => toggleBookmarkTurn(turn)}
                                    className="p-1 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer flex items-center gap-1 border border-amber-500/30 hover:border-rose-500/30"
                                    title="Remove from saved bookmarks"
                                  >
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                                    <span>Saved</span>
                                  </button>
                                  <button
                                    onClick={() => handleSaveTurnClip({
                                      id: turn.id,
                                      originalText: turn.originalText,
                                      translatedText: turn.translatedText,
                                      timestamp: new Date(turn.timestamp),
                                      audioUrl: turn.audioUrl
                                    }, 0)}
                                    className="p-1 px-2.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-all cursor-pointer flex items-center gap-1 border border-slate-200 dark:border-slate-800"
                                    title="Download audio clip"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Clip</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch mt-1">
                                <div className="p-3 rounded-xl border border-slate-200/50 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-900/10 flex flex-col gap-1.5 justify-between">
                                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-sans text-sm font-medium">
                                    {turn.originalText}
                                  </p>
                                  <div className="flex items-center justify-between text-[9px] text-slate-400 dark:text-slate-400 font-mono border-t border-slate-100/50 dark:border-slate-800/20 pt-1.5 mt-0.5">
                                    <span className="font-bold tracking-wider uppercase">NATIVE BROADCAST</span>
                                  </div>
                                </div>

                                <div className="p-3 rounded-xl border border-emerald-500/12 dark:border-emerald-500/10 bg-emerald-500/[0.015] dark:bg-emerald-500/[0.01] flex flex-col gap-1.5 justify-between">
                                  <p className="text-emerald-900 dark:text-emerald-300 leading-relaxed font-sans text-sm font-semibold">
                                    {turn.translatedText}
                                  </p>
                                  <div className="flex items-center justify-between text-[9px] text-emerald-600 dark:text-emerald-400/90 font-mono border-t border-emerald-500/5 dark:border-emerald-500/5 pt-1.5 mt-0.5">
                                    <span className="font-bold tracking-wider uppercase">INTERPRETED ({turn.targetLanguage || liveTargetLang})</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Primary View Switcher: Live Radio Airwaves vs. Live Podcast Shows */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3 pt-1">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setMainContentTab("radio")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mainContentTab === "radio"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                id="tab_radio_airwaves"
              >
                <Radio className="w-4 h-4 text-emerald-500" />
                <span>Live Radio Airwaves</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200/70 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                  Global Map
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMainContentTab("podcasts")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  mainContentTab === "podcasts"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs border border-slate-200/80 dark:border-slate-700"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                id="tab_live_podcasts"
              >
                <Mic className="w-4 h-4 text-emerald-500" />
                <span>Live Podcast Shows</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold uppercase">
                  Spoken Live
                </span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                {mainContentTab === "radio"
                  ? "Interactive 3D Coordinates & Regional Frequencies"
                  : "Continuous 24/7 Spoken Talk & Investigative Series"}
              </span>
            </div>
          </div>

          {/* Conditional Rendering based on selected tab */}
          {mainContentTab === "radio" ? (
            <>
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
            </>
          ) : (
            /* Live Podcast Shows Directory & Showcase */
            <section className="w-full flex-1">
              <LivePodcastShows
                onSelectPodcast={handleSelectStation}
                activeStation={activeStation}
                isPlaying={isPlaying}
                onTriggerTranslation={() => {
                  if (liveState.status !== "connected" && liveState.status !== "connecting") {
                    toggleLiveTranslation();
                  }
                }}
                liveTargetLang={liveTargetLang}
              />
            </section>
          )}

        </div>



      </main>

      {/* Floating Sticky global audio streamer controls */}
      <footer className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-2xl">
        <AudioPlayer
          station={activeStation}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          onShareSession={handleShareFullSession}
        />
      </footer>

      {/* Open Source Standards, Documentation, FLOSS License & Security Modal */}
      <ProjectInfoModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        darkMode={darkMode}
        activeStationName={activeStation?.name}
        activeStreamUrl={activeStation?.urlResolved || activeStation?.url}
        initialTab={projectModalInitialTab}
      />

      {/* Broadcast Transcript Intelligence Summary Modal */}
      <TranscriptSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={summaryText}
        isLoading={isSummarizing}
        error={summaryError}
        onRefresh={handleSummarizeTranscript}
        turnsCount={summaryTurnsCount}
        windowMinutes={10}
        stationName={activeStation?.name || "Active Broadcast"}
        targetLanguage={liveTargetLang}
        isFallback={summaryIsFallback}
        onEmailViaGmail={() => setIsGmailModalOpen(true)}
      />

      {/* Share Full Session Deep-Link Modal */}
      <SessionShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareUrl={shareSessionUrl}
        station={activeStation}
        targetLanguage={liveTargetLang}
        filters={{
          tab: mainContentTab,
          radiusKm,
          selectedCoords,
          country: selectedProfile?.country || activeStation?.country,
          transcriptView: transcriptViewFilter,
          transcriptSearch: transcriptSearchQuery,
        }}
      />

      {/* Gmail Workspace Hub Modal */}
      <GmailModal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        activeStation={activeStation}
        activeTargetLanguage={liveTargetLang}
        transcriptTurns={liveState.turns}
        latestSummary={summaryText}
      />

      {/* Language Detection Alert Toast Notification Container */}
      <LanguageAlertToast
        triggers={activeToasts}
        rules={alertRules}
        onDismiss={handleDismissToast}
        onTuneIn={handleTuneInFromAlert}
        onMuteRule={handleMuteRule}
      />

      {/* Language Alerts & Background Scanner Modal */}
      <LanguageAlertsModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        rules={alertRules}
        onUpdateRules={handleUpdateAlertRules}
        scannerStatus={scannerStatus}
        onToggleScanner={(enabled) =>
          setScannerStatus((prev) => ({ ...prev, isScanning: enabled }))
        }
        onUpdateScannerInterval={(seconds) =>
          setScannerStatus((prev) => ({ ...prev, scanIntervalSeconds: seconds }))
        }
        onUpdateScannerMode={(mode) =>
          setScannerStatus((prev) => ({ ...prev, scanMode: mode }))
        }
        alertHistory={alertHistory}
        onClearHistory={() => {
          setAlertHistory([]);
          saveAlertHistory([]);
        }}
        onTuneInStation={(stationuuid) => {
          const found = availableStations.find((s) => s.stationuuid === stationuuid);
          if (found) handleSelectStation(found);
        }}
        onTriggerTestAlert={handleTriggerTestAlert}
        supportedLanguages={SUPPORTED_LANGUAGES}
      />
    </div>
  );
}
