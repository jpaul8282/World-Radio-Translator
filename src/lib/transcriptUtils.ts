import { LiveTranslateTurn } from "../services/liveTranslateClient";

/**
 * Escapes special regex characters to safely build RegExp patterns from user inputs
 */
export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Filters live translation turns by keyword query.
 * Matches against both the captured original native audio text and the translated text.
 * Performs case-insensitive matching with leading/trailing whitespace normalization.
 *
 * @param turns - Array of transcript turns
 * @param query - User-entered search keyword or phrase
 * @returns Filtered array of turns matching the query, or all turns if query is empty
 */
export function filterTranscriptTurns(
  turns: LiveTranslateTurn[],
  query: string
): LiveTranslateTurn[] {
  if (!query || !query.trim()) {
    return turns;
  }

  const normalizedQuery = query.trim().toLowerCase();

  return turns.filter((turn) => {
    const originalMatches =
      typeof turn.originalText === "string" &&
      turn.originalText.toLowerCase().includes(normalizedQuery);

    const translatedMatches =
      typeof turn.translatedText === "string" &&
      turn.translatedText.toLowerCase().includes(normalizedQuery);

    return originalMatches || translatedMatches;
  });
}

/**
 * Breaks a string into plain text and highlighted keyword chunks
 */
export interface HighlightChunk {
  text: string;
  isMatch: boolean;
}

export function splitTextByKeyword(text: string, query: string): HighlightChunk[] {
  if (!text) return [];
  if (!query || !query.trim()) {
    return [{ text, isMatch: false }];
  }

  const trimmed = query.trim();
  const escaped = escapeRegExp(trimmed);
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  if (parts.length <= 1) {
    return [{ text, isMatch: false }];
  }

  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      isMatch: part.toLowerCase() === trimmed.toLowerCase(),
    }));
}

/**
 * Extracts turns belonging to the last N minutes of the broadcast session.
 * If no turns fall within the exact time window but turns exist, returns up to the last 20 turns
 * to ensure users can still summarize short or delayed recording sessions.
 *
 * @param turns - Array of transcript turns
 * @param windowMinutes - Time window in minutes (default: 10)
 * @param referenceTime - Reference timestamp in ms (default: Date.now())
 */
export function getTurnsForSummaryWindow(
  turns: LiveTranslateTurn[],
  windowMinutes: number = 10,
  referenceTime: number = Date.now()
): LiveTranslateTurn[] {
  if (!turns || turns.length === 0) {
    return [];
  }

  const windowMs = windowMinutes * 60 * 1000;
  const cutoffTime = referenceTime - windowMs;

  const windowTurns = turns.filter((turn) => {
    const timestampMs = turn.timestamp instanceof Date ? turn.timestamp.getTime() : Number(turn.timestamp);
    return !isNaN(timestampMs) && timestampMs >= cutoffTime;
  });

  if (windowTurns.length > 0) {
    return windowTurns;
  }

  // Fallback: If session timestamps are older than the window or relative, take the most recent turns (up to 20)
  return turns.slice(-20);
}

/**
 * Formats transcript turns into a clean structured text block for Gemini summarization prompt
 */
export function formatTurnsForSummarization(turns: LiveTranslateTurn[]): string {
  if (!turns || turns.length === 0) {
    return "No transcript turns recorded.";
  }

  return turns
    .map((turn, idx) => {
      const date = turn.timestamp instanceof Date ? turn.timestamp : new Date(turn.timestamp);
      const timeStr = !isNaN(date.getTime())
        ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
        : `Turn ${idx + 1}`;
      const orig = turn.originalText ? turn.originalText.trim() : "";
      const trans = turn.translatedText ? turn.translatedText.trim() : "";
      return `[${timeStr}] Native Audio: "${orig}" | Translated: "${trans}"`;
    })
    .join("\n");
}

