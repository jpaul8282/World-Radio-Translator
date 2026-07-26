import { useState, useEffect, useRef } from "react";
import { RadioStation } from "../types";
import { Play, Pause, Volume2, VolumeX, ShieldAlert, BadgeInfo, Disc3, Radio } from "lucide-react";
import Hls from "hls.js";

interface AudioPlayerProps {
  station: RadioStation | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export default function AudioPlayer({ station, isPlaying, setIsPlaying }: AudioPlayerProps) {
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Web Audio Analyser references
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const lastUrlRef = useRef<string>("");
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize Web Audio Analyser node safely on play
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    const setupAudioAnalyser = async () => {
      try {
        if (!audioContextRef.current) {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            audioContextRef.current = new AudioCtx();
          }
        }

        const ctx = audioContextRef.current;
        if (ctx && ctx.state === "suspended") {
          await ctx.resume();
        }

        if (ctx && !sourceNodeRef.current && audioRef.current) {
          const source = ctx.createMediaElementSource(audioRef.current);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64; // 32 frequency bins
          analyser.smoothingTimeConstant = 0.8;

          source.connect(analyser);
          analyser.connect(ctx.destination);

          sourceNodeRef.current = source;
          analyserRef.current = analyser;
        }
      } catch (err) {
        console.warn("[AudioAnalyser] Setup notice:", err);
      }
    };

    setupAudioAnalyser();
  }, [isPlaying]);

  // Real-time frequency domain canvas renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    let frameId: number;

    const renderWaveform = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx2d.clearRect(0, 0, width, height);

      const analyser = analyserRef.current;
      const hasActiveAudio = isPlaying && analyser;

      if (hasActiveAudio) {
        const bufferLength = analyser.frequencyBinCount; // 32 bins
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barCount = 28;
        const gap = 2;
        const barWidth = (width - gap * (barCount - 1)) / barCount;

        for (let i = 0; i < barCount; i++) {
          // Map index to frequency bin with a slight logarithmic bias for punchy visuals
          const dataIndex = Math.min(bufferLength - 1, Math.floor(Math.pow(i / barCount, 0.85) * bufferLength));
          const freqValue = dataArray[dataIndex] || 0;

          const percent = freqValue / 255;
          const minHeight = 3;
          const barHeight = Math.max(minHeight, percent * (height - 6));

          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Multi-color dynamic gradient matching Emerald to Indigo dark mode palette
          const gradient = ctx2d.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, "rgba(16, 185, 129, 0.85)"); // Emerald 500
          gradient.addColorStop(0.6, "rgba(20, 184, 166, 0.9)"); // Teal 500
          gradient.addColorStop(1, "rgba(99, 102, 241, 1)");   // Indigo 500

          ctx2d.fillStyle = gradient;

          // Draw rounded pill bars
          ctx2d.beginPath();
          if (typeof ctx2d.roundRect === "function") {
            ctx2d.roundRect(x, y, barWidth, barHeight, [ barWidth / 2 ]);
          } else {
            ctx2d.rect(x, y, barWidth, barHeight);
          }
          ctx2d.fill();
        }
      } else {
        // Idle state: draw subtle animated idle pulses
        const barCount = 28;
        const gap = 2;
        const barWidth = (width - gap * (barCount - 1)) / barCount;
        const time = Date.now() * 0.003;

        for (let i = 0; i < barCount; i++) {
          const idlePercent = 0.15 + 0.1 * Math.sin(time + i * 0.3);
          const barHeight = Math.max(3, idlePercent * (height - 6));
          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          ctx2d.fillStyle = "rgba(148, 163, 184, 0.25)";
          ctx2d.beginPath();
          if (typeof ctx2d.roundRect === "function") {
            ctx2d.roundRect(x, y, barWidth, barHeight, [ barWidth / 2 ]);
          } else {
            ctx2d.rect(x, y, barWidth, barHeight);
          }
          ctx2d.fill();
        }
      }

      frameId = requestAnimationFrame(renderWaveform);
    };

    renderWaveform();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isPlaying]);

  // Synchronize audio stream play/pause when station or isPlaying changes
  useEffect(() => {
    if (!audioRef.current) return;

    if (!station) {
      lastUrlRef.current = "";
      playPromiseRef.current = null;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      try {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
      } catch (e) {}
      setIsPlaying(false);
      setLoading(false);
      setStreamError(null);
      return;
    }

    const targetUrl = station.url_resolved || station.url;
    const proxiedUrl = `/api/proxy-stream?url=${encodeURIComponent(targetUrl)}`;
    const isHls = targetUrl.toLowerCase().includes(".m3u8") || station.url.toLowerCase().includes(".m3u8");

    let isCancelled = false;

    if (isPlaying) {
      const startPlayback = async () => {
        // Auto-resume custom Web Audio pipelines to prevent browser-side playback block of media source
        if (typeof window !== "undefined" && typeof (window as any).__resumeMicContext === "function") {
          try {
            await (window as any).__resumeMicContext();
          } catch (e) {
            console.warn("[Audio Setup] Failed to resume Web Audio context before play:", e);
          }
        }

        if (isCancelled || !audioRef.current) return;

        const currentActiveUrl = isHls ? targetUrl : proxiedUrl;
        const isNewSource = lastUrlRef.current !== currentActiveUrl;
        if (isNewSource) {
          lastUrlRef.current = currentActiveUrl;
          setStreamError(null);
          setLoading(true);

          if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
          }

          try {
            audioRef.current.pause();
          } catch (e) {}

          if (isHls) {
            if (audioRef.current.canPlayType("application/vnd.apple.mpegurl")) {
              // Safari / Apple native HLS support
              audioRef.current.src = targetUrl;
              audioRef.current.load();
            } else if (Hls.isSupported()) {
              // Chrome / Firefox / Opera Hls.js fallback
              const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                maxBufferSize: 0, 
                maxBufferLength: 1.5,
                liveDurationInfinity: true,
              });
              hlsRef.current = hls;
              
              hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                  console.warn(`HLS.js encountered fatal error: ${data.details}. Attempting recovery...`);
                  if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    console.log("HLS network error. Switching to proxied HLS playlist fallback...");
                    try {
                      hls.destroy();
                      hlsRef.current = null;
                      if (audioRef.current) {
                        audioRef.current.src = proxiedUrl;
                        audioRef.current.play().catch(() => setErrorState());
                      }
                    } catch (err) {
                      setErrorState();
                    }
                  } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    hls.recoverMediaError();
                  } else {
                    setErrorState();
                  }
                }
              });

              hls.loadSource(targetUrl);
              hls.attachMedia(audioRef.current);
            } else {
              // Absolute fallback using stream proxy
              audioRef.current.src = proxiedUrl;
              audioRef.current.load();
            }
          } else {
            // Standard MP3 / AAC / OGG streams
            audioRef.current.src = proxiedUrl;
            audioRef.current.load();
          }
        }

        setLoading(true);
        try {
          const playPromise = audioRef.current.play();
          playPromiseRef.current = playPromise;

          await playPromise;

          if (isCancelled) return;
          if (playPromiseRef.current === playPromise) {
            setLoading(false);
            setStreamError(null);
          }
        } catch (err: any) {
          if (isCancelled) return;
          
          if (err.name === "AbortError" || err.message?.includes("interrupted")) {
            console.log("Audio playback interrupted by a newer state change (expected behavior).");
          } else {
            console.error("Audio playback failed:", err);
            setErrorState();
          }
        }
      };

      startPlayback();
    } else {
      setLoading(false);
      playPromiseRef.current = null;
      lastUrlRef.current = ""; // Force reload on next play to bypass stale buffers
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      try {
        audioRef.current.pause();
        // Do NOT call removeAttribute("src") or load() on pause, to prevent browser media error trigger
      } catch (e) {}
    }

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [station, isPlaying]);

  // Synchronize volume sliders
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const setErrorState = () => {
    setLoading(false);
    setIsPlaying(false);
    setStreamError("Unable to stream this broadcast. The station's stream server may be offline, restricted, or returned an error status.");
  };

  const handleRetryPlayback = () => {
    lastUrlRef.current = "";
    setStreamError(null);
    setLoading(true);
    setIsPlaying(true);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-t border-slate-200/50 dark:border-slate-800/50 py-3.5 px-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg relative min-h-[75px]">
      
      {/* Stream Error Notification Banner */}
      {streamError && station && (
        <div className="absolute -top-12 left-0 right-0 mx-4 bg-rose-500/90 dark:bg-rose-950/95 text-white px-4 py-2 rounded-xl shadow-lg border border-rose-400/30 text-xs flex items-center justify-between gap-3 animate-slide-up z-50">
          <div className="flex items-center gap-2 overflow-hidden">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-300" />
            <span className="truncate font-medium">{streamError}</span>
          </div>
          <button
            onClick={handleRetryPlayback}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
          >
            Retry Stream
          </button>
        </div>
      )}

      {/* Hidden native HTML5 audio stream player */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onCanPlay={() => {
          setLoading(false);
          setStreamError(null);
        }}
        onWaiting={() => setLoading(true)}
        onError={() => {
          // If we are not playing or if there is no station/element, ignore the error (avoiding error state during pause/src clear)
          if (!isPlaying || !station || !audioRef.current) return;

          const error = audioRef.current.error;
          if (!error) {
            // No real error payload exists (usually triggered asynchronously during source swaps). Safeguard execution.
            return;
          }

          if (error.code === 1) {
            // MediaError.MEDIA_ERR_ABORTED: The fetching of the associated resource was aborted by the user (or source changed).
            return;
          }

          const currentSrc = audioRef.current.src || "";

          // If currentSrc is empty, resembles the base application HTML path, or is invalid, ignore the error safely
          if (
            !currentSrc ||
            currentSrc === window.location.href ||
            currentSrc === window.location.origin + "/" ||
            !currentSrc.startsWith("http") ||
            (currentSrc.includes(window.location.host) && (currentSrc.endsWith("/") || currentSrc.split("?")[0] === window.location.href.split("?")[0]))
          ) {
            return;
          }

          // Fallback to non-resolved URL if available
          const fallbackProxied = `/api/proxy-stream?url=${encodeURIComponent(station.url)}`;
          // Route fallback through proxy if not already playing it
          if (currentSrc && !currentSrc.includes(encodeURIComponent(station.url))) {
            audioRef.current.src = fallbackProxied;
            audioRef.current.play().catch(() => setErrorState());
          } else {
            setErrorState();
          }
        }}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Station information branding */}
      <div className="flex items-center gap-3 w-full md:w-1/3">
        {station ? (
          <>
            <div className="relative">
              <div className={`w-11 h-11 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 ${isPlaying ? 'animate-spin [animation-duration:8s]' : ''}`}>
                {station.favicon ? (
                  <img
                    src={station.favicon}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const tgt = e.target as HTMLImageElement;
                      tgt.style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Radio className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              {/* Dynamic blinking radio stream indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 bg-green-500 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-scale" />
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                {station.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-300 truncate capitalize">
                {station.tags ? station.tags.split(',').slice(0, 2).join(' • ') : 'Global Channel'}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-400">
            <button
              type="button"
              className="w-11 h-11 rounded-full border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center flex-shrink-0"
              aria-label="No station loaded"
            >
              <Disc3 className="w-5 h-5 text-slate-300 dark:text-slate-500" />
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-semibold">Tuning Station empty...</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400">Select any target location above</span>
            </div>
          </div>
        )}
      </div>

      {/* Media Player Primary Controls & Real-time Frequency Waveform Visualizer */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full md:w-1/3">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={!station}
          className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow flex-shrink-0 ${
            !station
              ? "bg-slate-200 dark:bg-slate-800 cursor-not-allowed text-slate-400"
              : isPlaying
              ? "bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
              : "bg-emerald-500 hover:bg-emerald-600 hover:scale-105"
          }`}
          id="control_play_pause"
          title={!station ? "No station tuned empty" : loading ? "Loading stream..." : isPlaying ? "Pause broadcast" : "Play broadcast"}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-[1px]" />
          )}
        </button>

        {/* Real-Time AudioAnalyser Frequency Spectrum Waveform */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <canvas
            ref={canvasRef}
            width={160}
            height={32}
            className="rounded-lg bg-slate-100/70 dark:bg-slate-950/70 border border-slate-200/60 dark:border-slate-800/60 px-1 py-0.5 shadow-inner"
            title="Real-time Web Audio API Frequency Spectrum Analyser"
          />
          <span className="text-[9px] font-mono font-semibold text-slate-400 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            {isPlaying ? "Live Frequency Spectrum" : "Audio Analyser Idle"}
          </span>
        </div>
      </div>

      {/* Media Player Volume & Actions */}
      <div className="flex items-center justify-end gap-3.5 w-full md:w-1/3">
        {/* Volume Controllers */}
        <div className="flex items-center gap-2 text-slate-500">
          <button
            onClick={toggleMute}
            className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            id="control_mute"
            title={isMuted || volume === 0 ? "Unmute audio" : "Mute audio"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-20 accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>
      </div>

    </div>
  );
}
