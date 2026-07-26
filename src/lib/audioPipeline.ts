export interface AudioPipeline {
  ctx: AudioContext;
  sourceNode: MediaElementAudioSourceNode;
}

/**
 * Returns or initializes a single unified MediaElementAudioSourceNode for an HTMLMediaElement.
 * In Web Audio API, an HTMLMediaElement can ONLY be connected to createMediaElementSource once.
 * Subsequent calls throw "HTMLMediaElement already connected previously to a different MediaElementSourceNode".
 */
export function getOrCreateAudioPipeline(audioElement: HTMLMediaElement): AudioPipeline {
  const el = audioElement as any;

  if (el.__audioPipeline && el.__audioPipeline.ctx && el.__audioPipeline.ctx.state !== "closed") {
    return el.__audioPipeline as AudioPipeline;
  }

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

  // Reuse existing shared AudioContext on window if valid, otherwise instantiate
  let ctx: AudioContext = (window as any).__sharedAudioContext;
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioCtx();
    (window as any).__sharedAudioContext = ctx;
  }

  let sourceNode: MediaElementAudioSourceNode;
  if (el.__mediaElementSource && el.__mediaElementSource.context === ctx) {
    sourceNode = el.__mediaElementSource;
  } else {
    try {
      sourceNode = ctx.createMediaElementSource(audioElement);
      el.__mediaElementSource = sourceNode;
    } catch (e) {
      if (el.__mediaElementSource) {
        sourceNode = el.__mediaElementSource;
      } else {
        console.error("Failed to create MediaElementSource:", e);
        throw e;
      }
    }
  }

  const pipeline: AudioPipeline = { ctx, sourceNode };
  el.__audioPipeline = pipeline;
  return pipeline;
}
