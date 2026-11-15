export interface TranscribeAudioResponse {
  transcript: string;
  model: string;
  mimeType: string;
  languageHint: string;
  durationMs: number;
  timestamp: string;
}

export interface MicTranscriptEntry {
  id: string;
  transcript: string;
  translatedText?: string;
  translatedLang?: string;
  languageHint: string;
  mimeType: string;
  recordingSeconds: number;
  model: string;
  timestamp: string;
}

/**
 * Normalizes a browser MediaRecorder MIME string into a clean MIME type
 * (stripping codec suffixes like ";codecs=opus").
 */
export function normalizeAudioMimeType(rawMimeType: string | undefined | null): string {
  if (!rawMimeType || typeof rawMimeType !== "string") {
    return "audio/webm";
  }
  const base = rawMimeType.split(";")[0].trim().toLowerCase();
  if (!base) return "audio/webm";
  if (base === "video/webm") return "audio/webm";
  return base;
}

/**
 * Selects the best supported MediaRecorder audio MIME type for the active browser.
 */
export function pickSupportedMicMimeType(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "audio/webm";
  }

  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/wav"
  ];

  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) {
        return candidate;
      }
    } catch {
      // Continue trying next candidate
    }
  }

  return "audio/webm";
}

/**
 * Converts a recorded audio Blob into a raw Base64 string (without data URI prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to encode audio blob to base64."));
        return;
      }
      const commaIdx = result.indexOf(",");
      resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => {
      reject(new Error("Failed to read audio recording blob."));
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Sends recorded microphone audio to the backend /api/transcribe-audio endpoint
 * backed by Gemini model "gemini-3.5-transcribe".
 */
export async function transcribeMicrophoneAudio(params: {
  audioBase64: string;
  mimeType: string;
  languageHint?: string;
}): Promise<TranscribeAudioResponse> {
  const cleanMime = normalizeAudioMimeType(params.mimeType);
  const res = await fetch("/api/transcribe-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audioBase64: params.audioBase64,
      mimeType: cleanMime,
      languageHint: params.languageHint || "Auto-detect",
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Transcription request failed with status ${res.status}`);
  }

  return data as TranscribeAudioResponse;
}

/**
 * Formats seconds as MM:SS for the microphone recording timer.
 */
export function formatRecordingDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
