# System Architecture & Technical Specifications

**Remix: World Radio Translator** is a full-stack, real-time audio streaming, speech recognition, and multilingual live translation application.

---

## 1. High-Level Architecture

```
[ World Radio Stations ]
        │ (Icecast / Shoutcast / HLS audio streams)
        ▼
[ Resilient Stream Proxy ] ◄── (MITM / HSTS / SSRF Defense Layer)
        │
   Audio Buffer
        │
   ┌────┴───────────────────────────────┐
   ▼                                    ▼
[ Web Audio Pipeline & Visualizer ]   [ Speech Analyzer & Chunk Buffer ]
   │ (EQ, Gain, FFT Analyzer)           │ (PCM 16kHz conversion)
   ▼                                    ▼
[ HTML5 Audio Output ]                [ Gemini Live API Stream Client ]
                                        │ (gemini-3.5-live-translate-preview)
                                        ▼
                                  [ Multilingual Translation Engine ]
                                        │
                                  ┌─────┴─────────────────────┐
                                  ▼                           ▼
                           [ Real-Time Transcript ]    [ Translated Speech Audio ]
```

---

## 2. Core Subsystems

### 1. Resilient Audio Stream Proxy
- Proxies remote HTTP/HTTPS radio streams to prevent Mixed Content blocking in HTTPS environments.
- Normalizes stream headers (`Icy-MetaData`, `Accept`, `User-Agent`).
- Implements SSRF defense blocking loopback, RFC 1918 private subnets, and cloud instance metadata.
- Handles redirects and multi-format audio streams (MP3, AAC, OGG, HLS M3U8).

### 2. Neural WiFi Satellite Constellation
- High-fidelity visual spatial space-mesh simulating LEO/GEO satellite communications.
- Renders inter-satellite laser links (ISL) using dynamic trigonometric coordinate projection.
- Calculates nearest satellite nodes relative to active station ground coordinates using the Haversine distance formula.

### 3. Speech & Translation Engine
- Ingests live audio slices into the Google Gemini Live API.
- Sub-second bi-directional translation into user-selected target languages (English, Spanish, French, Japanese, Arabic, etc.).
- Audio synthesis via Google prebuilt voice profiles (e.g. Echo, Aoede, Fenrir).

### 4. Saved Bookmarks & Jump-To-Context
- In-memory and persistent storage of notable translation turns.
- Includes fuzzy search, audio clip download, Web Share API invocation, and one-click smooth scrolling to the original context turn.
