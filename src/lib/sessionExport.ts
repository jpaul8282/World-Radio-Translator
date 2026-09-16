import { RadioStation, BookmarkedTurn, LanguageDetectionResult } from "../types";
import { LiveTranslateTurn, LiveTranslateState } from "../services/liveTranslateClient";

export interface BroadcastSessionExport {
  app: string;
  version: string;
  exportedAt: string; // ISO 8601 string
  session: {
    targetLanguage: string;
    detectedLanguage: string | null;
    status: string;
    totalTurns: number;
    totalBookmarks: number;
    sessionStartTime?: string;
    sessionEndTime?: string;
    durationEstimateSeconds?: number;
  };
  station: RadioStation | null;
  transcripts: Array<{
    id: string;
    turnIndex: number;
    timestamp: string;
    originalText: string;
    translatedText: string;
    audioUrl?: string;
  }>;
  bookmarks: BookmarkedTurn[];
  liveBuffer?: {
    userTranscript: string;
    modelTranscript: string;
  };
}

export interface BuildSessionExportParams {
  station: RadioStation | null;
  turns: LiveTranslateTurn[];
  bookmarks: BookmarkedTurn[];
  targetLanguage: string;
  detectionResult?: LanguageDetectionResult | null;
  liveStatus?: string;
  liveState?: LiveTranslateState;
  appVersion?: string;
  exportDate?: Date;
}

/**
 * Safely sanitizes a station or topic name for use in a file system path / file name
 */
export function sanitizeFilenamePart(name: string): string {
  if (!name || !name.trim()) return "unnamed-station";
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "station";
}

/**
 * Generates a clean, timestamped file name for the exported session JSON
 */
export function formatSessionFilename(stationName?: string, date: Date = new Date()): string {
  const cleanName = stationName ? sanitizeFilenamePart(stationName) : "broadcast-session";
  const dateStr = date.toISOString().replace(/[:.]/g, "-");
  return `session_${cleanName}_${dateStr}.json`;
}

/**
 * Assembles the full broadcast session payload containing station metadata,
 * all transcript turns, and user bookmarks into a clean structured JSON schema for offline analysis.
 */
export function buildBroadcastSessionExport(params: BuildSessionExportParams): BroadcastSessionExport {
  const exportDate = params.exportDate || new Date();
  const exportedAt = exportDate.toISOString();
  const appVersion = params.appVersion || "1.2.0";

  // Normalize transcript turns
  const normalizedTranscripts = (params.turns || []).map((turn, index) => {
    let timestampStr: string;
    if (turn.timestamp instanceof Date) {
      timestampStr = !isNaN(turn.timestamp.getTime()) ? turn.timestamp.toISOString() : exportedAt;
    } else if (typeof turn.timestamp === "number") {
      timestampStr = new Date(turn.timestamp).toISOString();
    } else if (typeof turn.timestamp === "string") {
      timestampStr = turn.timestamp;
    } else {
      timestampStr = exportedAt;
    }

    return {
      id: turn.id || `turn-${index + 1}-${Date.parse(timestampStr) || Date.now()}`,
      turnIndex: index + 1,
      timestamp: timestampStr,
      originalText: turn.originalText || "",
      translatedText: turn.translatedText || "",
      ...(turn.audioUrl ? { audioUrl: turn.audioUrl } : {}),
    };
  });

  // Calculate session duration estimate if turns exist
  let sessionStartTime: string | undefined;
  let sessionEndTime: string | undefined;
  let durationEstimateSeconds: number | undefined;

  if (normalizedTranscripts.length > 0) {
    sessionStartTime = normalizedTranscripts[0].timestamp;
    sessionEndTime = normalizedTranscripts[normalizedTranscripts.length - 1].timestamp;

    const startMs = Date.parse(sessionStartTime);
    const endMs = Date.parse(sessionEndTime);
    if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
      durationEstimateSeconds = Math.round((endMs - startMs) / 1000);
    }
  }

  // Include in-progress live buffer text if present
  let liveBuffer: { userTranscript: string; modelTranscript: string } | undefined;
  if (params.liveState && (params.liveState.userTranscript || params.liveState.modelTranscript)) {
    liveBuffer = {
      userTranscript: params.liveState.userTranscript || "",
      modelTranscript: params.liveState.modelTranscript || "",
    };
  }

  return {
    app: "Remix: World Radio Translator",
    version: appVersion,
    exportedAt,
    session: {
      targetLanguage: params.targetLanguage || "English",
      detectedLanguage: params.detectionResult?.detectedLanguage || null,
      status: params.liveStatus || params.liveState?.status || "idle",
      totalTurns: normalizedTranscripts.length,
      totalBookmarks: (params.bookmarks || []).length,
      ...(sessionStartTime ? { sessionStartTime } : {}),
      ...(sessionEndTime ? { sessionEndTime } : {}),
      ...(durationEstimateSeconds !== undefined ? { durationEstimateSeconds } : {}),
    },
    station: params.station ? { ...params.station } : null,
    transcripts: normalizedTranscripts,
    bookmarks: (params.bookmarks || []).map((b) => ({ ...b })),
    ...(liveBuffer ? { liveBuffer } : {}),
  };
}

/**
 * Triggers a client-side browser file download containing the formatted JSON session
 */
export function downloadSessionJson(
  sessionData: BroadcastSessionExport,
  customFilename?: string
): string {
  const filename = customFilename || formatSessionFilename(sessionData.station?.name);
  const jsonContent = JSON.stringify(sessionData, null, 2);

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}
