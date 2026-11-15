import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  normalizeAudioMimeType,
  formatRecordingDuration
} from "../../src/services/audioTranscribeService";

test("Audio Transcription Service & Footer Volume Control", async (t) => {
  await t.test("normalizeAudioMimeType strips codec parameters cleanly", () => {
    assert.equal(normalizeAudioMimeType("audio/webm;codecs=opus"), "audio/webm");
    assert.equal(normalizeAudioMimeType("AUDIO/MP4; codecs=mp4a"), "audio/mp4");
    assert.equal(normalizeAudioMimeType("video/webm;codecs=vp8"), "audio/webm");
    assert.equal(normalizeAudioMimeType(""), "audio/webm");
    assert.equal(normalizeAudioMimeType(undefined), "audio/webm");
  });

  await t.test("formatRecordingDuration formats seconds as MM:SS", () => {
    assert.equal(formatRecordingDuration(0), "00:00");
    assert.equal(formatRecordingDuration(7), "00:07");
    assert.equal(formatRecordingDuration(65), "01:05");
    assert.equal(formatRecordingDuration(125.9), "02:05");
    assert.equal(formatRecordingDuration(-4), "00:00");
  });

  await t.test("server.ts configures /api/transcribe-audio strictly with gemini-3.5-transcribe", () => {
    const serverContent = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf-8");
    assert.ok(serverContent.includes('app.post("/api/transcribe-audio"'));
    assert.ok(serverContent.includes('model: "gemini-3.5-transcribe"'));
  });

  await t.test("AudioPlayer component provides an accessible footer volume slider", () => {
    const playerContent = fs.readFileSync(
      path.join(process.cwd(), "src/components/AudioPlayer.tsx"),
      "utf-8"
    );
    assert.ok(playerContent.includes('id="control_volume_slider"'));
    assert.ok(playerContent.includes('type="range"'));
    assert.ok(playerContent.includes('aria-label="Stream volume"'));
    assert.ok(playerContent.includes('id="control_volume_percent"'));
  });
});
