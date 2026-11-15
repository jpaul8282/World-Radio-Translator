import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Copy,
  Check,
  Trash2,
  Languages,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Volume2,
  X,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from "lucide-react";
import {
  blobToBase64,
  formatRecordingDuration,
  MicTranscriptEntry,
  normalizeAudioMimeType,
  pickSupportedMicMimeType,
  transcribeMicrophoneAudio
} from "../services/audioTranscribeService";

interface MicTranscriberPanelProps {
  supportedLanguages: string[];
  liveTargetLang: string;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export function MicTranscriberPanel({
  supportedLanguages,
  liveTargetLang,
  isOpen,
  onToggleOpen
}: MicTranscriberPanelProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [languageHint, setLanguageHint] = useState<string>("Auto-detect");
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<MicTranscriptEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [translatingId, setTranslatingId] = useState<string | null>(null);
  const [micLevels, setMicLevels] = useState<number[]>(new Array(16).fill(12));
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const analyserIntervalRef = useRef<number | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const cancelRecordingRef = useRef<boolean>(false);
  const recordingSecondsRef = useRef<number>(0);

  // Clean up preview audio URL when replaced or unmounted
  useEffect(() => {
    return () => {
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, [previewAudioUrl]);

  // Clean up microphone hardware tracks & timers on unmount
  useEffect(() => {
    return () => {
      cleanupMediaResources();
    };
  }, []);

  const cleanupMediaResources = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (analyserIntervalRef.current) {
      window.clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => {
        try {
          t.stop();
        } catch {
          // ignore
        }
      });
      mediaStreamRef.current = null;
    }
    if (micAudioCtxRef.current && micAudioCtxRef.current.state !== "closed") {
      try {
        micAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      micAudioCtxRef.current = null;
    }
    setMicLevels(new Array(16).fill(12));
  };

  const handleStartRecording = async () => {
    setError(null);
    cancelRecordingRef.current = false;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone recording is not supported in this browser environment.");
      return;
    }

    if (!isOpen) {
      onToggleOpen();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const selectedMime = pickSupportedMicMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: selectedMime });
      } catch {
        recorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recordingSecondsRef.current = 0;
      setRecordingSeconds(0);

      // Setup live microphone volume meter
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        micAudioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 32;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyserIntervalRef.current = window.setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const nextLevels = Array.from({ length: 16 }, (_, idx) => {
            const val = dataArray[idx % dataArray.length] || 0;
            return Math.max(12, Math.min(100, Math.round((val / 255) * 100)));
          });
          setMicLevels(nextLevels);
        }, 70);
      } catch {
        // Level visualization is optional; continue recording cleanly
      }

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const capturedSeconds = recordingSecondsRef.current;
        const recordedMime = recorder.mimeType || selectedMime || "audio/webm";
        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];
        cleanupMediaResources();
        setIsRecording(false);

        if (cancelRecordingRef.current) {
          cancelRecordingRef.current = false;
          return;
        }

        if (chunks.length === 0) {
          setError("No audio was captured from your microphone.");
          return;
        }

        const audioBlob = new Blob(chunks, { type: normalizeAudioMimeType(recordedMime) });
        if (audioBlob.size < 100) {
          setError("Recorded audio clip was too short. Please speak for at least 1 second.");
          return;
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        setPreviewAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });

        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(audioBlob);
          const result = await transcribeMicrophoneAudio({
            audioBase64,
            mimeType: recordedMime,
            languageHint
          });

          const text = result.transcript?.trim() || "";
          if (!text) {
            setError("No speech detected in the recording. Please try speaking clearly near the microphone.");
          } else {
            const newEntry: MicTranscriptEntry = {
              id: `mic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              transcript: text,
              languageHint: result.languageHint || languageHint,
              mimeType: result.mimeType,
              recordingSeconds: capturedSeconds,
              model: result.model || "gemini-3.5-transcribe",
              timestamp: result.timestamp || new Date().toISOString()
            };
            setEntries((prev) => [newEntry, ...prev]);
          }
        } catch (err: any) {
          setError(err?.message || "Failed to transcribe microphone audio.");
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
      setIsRecording(true);

      timerIntervalRef.current = window.setInterval(() => {
        recordingSecondsRef.current += 1;
        setRecordingSeconds(recordingSecondsRef.current);
      }, 1000);
    } catch (err: any) {
      cleanupMediaResources();
      setIsRecording(false);
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setError("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (err?.name === "NotFoundError") {
        setError("No microphone device detected on this system.");
      } else {
        setError(err?.message || "Could not start microphone recording.");
      }
    }
  };

  const handleStopAndTranscribe = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      cancelRecordingRef.current = false;
      mediaRecorderRef.current.stop();
    }
  };

  const handleCancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      cancelRecordingRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      cleanupMediaResources();
      setIsRecording(false);
    }
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleTranslateEntry = async (entry: MicTranscriptEntry) => {
    setTranslatingId(entry.id);
    setError(null);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: entry.transcript,
          targetLanguage: liveTargetLang
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Translation failed.");
      }
      setEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                translatedText: data.translated || entry.transcript,
                translatedLang: liveTargetLang
              }
            : item
        )
      );
    } catch (err: any) {
      setError(err?.message || "Could not translate transcript.");
    } finally {
      setTranslatingId(null);
    }
  };

  return (
    <section
      id="mic-transcriber-section"
      className="bg-gradient-to-r from-indigo-500/5 via-sky-500/5 to-emerald-500/5 dark:from-indigo-950/20 dark:via-sky-950/10 dark:to-emerald-950/15 border border-indigo-500/25 dark:border-indigo-500/15 rounded-2xl p-4 md:p-5 flex flex-col gap-3.5 shadow-sm"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl transition-all shrink-0 ${
              isRecording
                ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30"
                : isTranscribing
                ? "bg-indigo-500 text-white animate-pulse shadow-lg shadow-indigo-500/30"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            <Mic className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display font-bold text-sm tracking-tight text-slate-800 dark:text-slate-100">
                Microphone Speech-to-Text Transcriber
              </h2>
              <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase font-mono">
                gemini-3.5-transcribe
              </span>
              {entries.length > 0 && (
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono">
                  {entries.length} {entries.length === 1 ? "note" : "notes"}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
              Record voice memos, pronunciation practice, or spoken phrases using your microphone and transcribe them directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {!isRecording ? (
            <button
              type="button"
              id="btn_mic_start_recording"
              onClick={handleStartRecording}
              disabled={isTranscribing}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              {isTranscribing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing...</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Record & Transcribe</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              id="btn_mic_stop_transcribe"
              onClick={handleStopAndTranscribe}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-rose-600/20 transition-all active:scale-95 cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop & Transcribe ({formatRecordingDuration(recordingSeconds)})</span>
            </button>
          )}

          <button
            type="button"
            id="btn_mic_toggle_panel"
            onClick={onToggleOpen}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={isOpen ? "Collapse Microphone Transcriber" : "Expand Microphone Transcriber"}
            aria-label={isOpen ? "Collapse Microphone Transcriber" : "Expand Microphone Transcriber"}
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Workspace */}
      {isOpen && (
        <div className="flex flex-col gap-3.5 pt-2 border-t border-indigo-500/10">
          {/* Controls & Live Recorder Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3">
            {/* Language Hint Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <Languages className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Spoken Language Hint:</span>
              </div>
              <select
                id="select_mic_language_hint"
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                disabled={isRecording || isTranscribing}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Auto-detect">Auto-detect</option>
                {supportedLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Microphone Input Visualizer & Status */}
            <div className="flex items-center justify-between md:justify-end gap-3">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping mr-1" />
                    {micLevels.map((lvl, idx) => (
                      <span
                        key={idx}
                        className="w-1 bg-rose-500 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.round((lvl / 100) * 20))}px` }}
                      />
                    ))}
                    <span className="ml-2 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                      {formatRecordingDuration(recordingSeconds)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelRecording}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
                    title="Discard current recording"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              ) : isTranscribing ? (
                <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing speech with gemini-3.5-transcribe...</span>
                </div>
              ) : previewAudioUrl ? (
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <audio
                    src={previewAudioUrl}
                    controls
                    className="h-7 max-w-[220px] sm:max-w-[260px]"
                    title="Playback last recorded clip"
                  />
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-400 font-mono">
                  Ready for microphone input
                </span>
              )}
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="flex items-center justify-between gap-2 bg-rose-500/10 text-rose-700 dark:text-rose-400 text-xs px-3.5 py-2.5 rounded-xl border border-rose-500/20">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1 rounded hover:bg-rose-500/10 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Transcribed Notes List */}
          {entries.length > 0 ? (
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto pr-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Captured Microphone Transcriptions
                </span>
                <button
                  type="button"
                  onClick={() => setEntries([])}
                  className="text-[11px] text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              </div>

              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col gap-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-bold">
                        {entry.model}
                      </span>
                      <span>
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit"
                        })}
                      </span>
                      <span>({formatRecordingDuration(entry.recordingSeconds)})</span>
                      {entry.languageHint !== "Auto-detect" && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {entry.languageHint}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleTranslateEntry(entry)}
                        disabled={translatingId === entry.id}
                        className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Translate this transcript into ${liveTargetLang}`}
                      >
                        {translatingId === entry.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>Translate to {liveTargetLang}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            entry.id,
                            entry.translatedText
                              ? `${entry.transcript}\n\n[${entry.translatedLang}]: ${entry.translatedText}`
                              : entry.transcript
                          )
                        }
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        title="Copy transcription to clipboard"
                      >
                        {copiedId === entry.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                    {entry.transcript}
                  </p>

                  {entry.translatedText && (
                    <div className="mt-1 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                      <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-mono font-bold uppercase text-[10px] mr-1.5">
                          {entry.translatedLang}:
                        </span>
                        <span className="text-sm font-medium">{entry.translatedText}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !isRecording &&
            !isTranscribing && (
              <div className="text-center py-4 px-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Click <strong>Record & Transcribe</strong> to capture audio from your microphone and transcribe it with{" "}
                <code className="font-mono text-indigo-600 dark:text-indigo-400">gemini-3.5-transcribe</code>.
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}
