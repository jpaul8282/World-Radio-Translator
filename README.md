# Remix: World Radio Translator 🌍📻

[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF-Best%20Practices%20Passing-brightgreen.svg)](docs/SECURITY_PRACTICES.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version: 1.2.0](https://img.shields.io/badge/version-1.2.0-blue.svg)](docs/VERSIONING.md)
[![Automated Tests](https://img.shields.io/badge/tests-48%20passing-success.svg)](docs/TESTING.md)
[![Static Analysis](https://img.shields.io/badge/static%20analysis-strict%20passing-success.svg)](docs/TESTING.md)
[![AI Engine: Google Gemini](https://img.shields.io/badge/AI%20Engine-Gemini%203.8%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)
[![Security: HSTS / MITM Protected](https://img.shields.io/badge/MITM%20Defense-HSTS%20Preloaded-emerald.svg)](SECURITY.md)

> **Remix: World Radio Translator** allows users to discover, stream, and comprehend live audio broadcasts and continuous podcast shows from every corner of the planet. Powered by Google Gemini Live Speech-to-Speech intelligence, incoming spoken foreign dialogues are decoded, transcribed, and translated in real time into over 50 target languages.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [System Architecture & Audio Pipeline](#-system-architecture--audio-pipeline)
- [Visual User Guide & Application Walkthrough (5 Core Workflows)](#-visual-user-guide--application-walkthrough-5-core-workflows)
  - [1. App Instructions & Live Stream Tuning via Interactive Globe](#1-app-instructions--live-stream-tuning-via-interactive-globe)
  - [2. Gemini Live Real-Time Speech Translation & Dual Subtitles](#2-gemini-live-real-time-speech-translation--dual-subtitles)
  - [3. Account Settings, Google Profile & Firebase Cloud Sync](#3-account-settings-google-profile--firebase-cloud-sync)
  - [4. Regional & Country Airwaves Discovery](#4-regional--country-airwaves-discovery)
  - [5. Background Airwaves Scanner, Custom Language Alerts & Session Export](#5-background-airwaves-scanner-custom-language-alerts--session-export)
- [Key Features & Capabilities](#-key-features--capabilities)
  - [1. Global Live Radio Airwaves & Interactive Globe](#1-global-live-radio-airwaves--interactive-globe)
  - [2. Live Podcast Shows Directory](#2-live-podcast-shows-directory)
  - [3. Gemini Live Real-Time Interpreter](#3-gemini-live-real-time-interpreter)
  - [4. Save Full Session for Offline Analysis](#4-save-full-session-for-offline-analysis)
  - [5. Broadcast Summarization (10-Minute Rolling Window)](#5-broadcast-summarization-10-minute-rolling-window)
  - [6. Transcript Keyword Search & Highlighting](#6-transcript-keyword-search--highlighting)
  - [7. Starred Bookmarks & Jump to Context](#7-starred-bookmarks--jump-to-context)
  - [8. Neural WiFi Satellite Space-Mesh](#8-neural-wifi-satellite-space-mesh)
  - [9. Firebase Cloud Sync & Google Auth](#9-firebase-cloud-sync--google-auth)
- [Offline Analysis JSON Schema](#-offline-analysis-json-schema)
- [REST API Reference](#-rest-api-reference)
- [Build, Test & Development Guide](#-build-test--development-guide)
- [Security, OpenSSF & Compliance](#-security-openssf--compliance)
- [License](#-license)
- [Documentation Index](#-documentation-index)

---

## 🌐 Project Overview

| Property | Value |
| :--- | :--- |
| **Project Name** | Remix: World Radio Translator |
| **Current Version** | `1.2.0` (SemVer 2.0.0 compliant) |
| **FLOSS License** | [MIT License](LICENSE) / [LICENSE.md](LICENSE.md) |
| **Repository** | [https://github.com/remix-radio/world-radio-translator](https://github.com/remix-radio/world-radio-translator) |
| **Issue Tracker** | [https://github.com/remix-radio/world-radio-translator/issues](https://github.com/remix-radio/world-radio-translator/issues) |
| **Security Contact** | [security@worldradiotranslator.org](mailto:security@worldradiotranslator.org) / [SECURITY.md](SECURITY.md) |

---

## 🏗️ System Architecture & Audio Pipeline

The application features a low-latency, resilient audio pipeline bridging browser Web Audio APIs with a secure Node.js proxy and the Google Gemini Live API:

```text
  +-------------------------------------------------------------------------+
  |                           Client Browser                                |
  |                                                                         |
  |  [ Audio Stream URL ] ---> [ <audio> / HLS.js ]                         |
  |                                   |                                     |
  |                                   v                                     |
  |                        [ Web Audio Context ]                            |
  |                                   |                                     |
  |        +--------------------------+--------------------------+          |
  |        |                                                     |          |
  |        v                                                     v          |
  |  [ AnalyserNode ]                                    [ AudioWorklet /   |
  |  (Spectrum & Volume)                                 ScriptProcessor ]  |
  |        |                                                     |          |
  |        v                                                     v          |
  |  Canvas Visualizer                             [ Float32 -> Int16 PCM ] |
  |                                                              |          |
  |                                                              v          |
  |                                                    [ Base64 Chunking ]  |
  |                                                              |          |
  +--------------------------------------------------------------|----------+
                                                                 |
                                        WebSocket (16kHz / Mono) |
                                                                 v
  +-------------------------------------------------------------------------+
  |                           Backend & AI Services                         |
  |                                                                         |
  |  [ Express Server (server.ts) ] <------- Server-Side Gemini API Key     |
  |             |                                                           |
  |             +---> /api/proxy-stream (SSRF-hardened audio relay)        |
  |             +---> /api/summarize-transcript (Gemini 3.8 Flash)          |
  |             +---> /api/podcast-insights (Gemini 3.1 Flash-Lite)         |
  |             |                                                           |
  |             v                                                           |
  |  [ Google Gemini Live Speech-to-Speech Engine ]                         |
  |             |                                                           |
  |             v                                                           |
  |  [ Real-Time Multilingual Transcript Turns (Original & Translated) ]    |
  +-------------------------------------------------------------------------+
```

---

## 📱 Visual User Guide & Application Walkthrough (5 Core Workflows)

This section provides complete user instructions for operating **Remix: World Radio Translator**, configuring your **Account Settings & Cloud Sync**, and navigating **Regional & Country** airwaves with illustrated walkthrough images.

---

### 1. App Instructions & Live Stream Tuning via Interactive Globe

![1. App Instructions & Live Stream Tuning](src/assets/images/guide_radio_tuning_map_1793902826836.jpg)

#### Overview & Step-by-Step Instructions:
1. **Interactive 3D Holographic Globe**:
   - Click and drag across the glowing globe to pan through global regions (Europe, Americas, Asia, Africa, Oceania).
   - Each radiant pulsing node represents an active terrestrial FM/AM transmitter or digital internet broadcast stream.
   - Click any station pin directly on the globe to inspect the broadcaster metadata, frequency, city, and country.
2. **Starting & Pausing Live Playback**:
   - Click the central **Play/Pause** button in the bottom dock or select any station from the discovery list.
   - Audio is streamed through the server-side SSRF-hardened relay (`/api/proxy-stream`) with automatic CORS injection and DNS rebinding protection.
3. **Volume & Audio Spectrum Visualizer**:
   - Adjust output volume smoothly using the slider or keyboard shortcuts.
   - The real-time canvas visualizer renders responsive frequency spectrum waveforms directly from the Web Audio `AnalyserNode`.
4. **Terrestrial Radio vs. Continuous Spoken Podcasts**:
   - Use the top navigation bar to toggle between **Live Radio** and **24/7 Spoken Podcasts** (BBC Global News, NPR Up First, Deutsche Welle, NHK Japan).
5. **Neural SpaceMesh Satellite Uplink**:
   - Toggle the **SpaceMesh** button in the header to route your audio streams through simulated orbital satellite relays (LEO, MEO, GEO) with low-latency WiFi noise cancellation.

---

### 2. Gemini Live Real-Time Speech Translation & Dual Subtitles

![2. Real-Time Gemini Live Translation](src/assets/images/guide_live_translation_1793902839769.jpg)

#### Overview & Step-by-Step Instructions:
1. **Activating the Live Interpreter**:
   - Click **"Start Live Translation"** in the Interpreter control bar. The app initiates a low-latency 16 kHz 16-bit mono PCM audio pipeline over WebSocket to the Google Gemini Live API (`gemini-3.5-live-translate-preview`).
2. **Selecting Target Language**:
   - Choose from over 50 supported global languages (English, Spanish, French, German, Japanese, Hindi, Mandarin, Arabic, Portuguese, etc.) using the target language dropdown.
3. **Smart Language Detection**:
   - The neural language detection engine dynamically analyzes incoming spoken dialogue.
   - If the broadcaster changes languages or speaks a dialect different from your target, a suggestion banner appears with a 1-click button to tune your target language.
4. **Dual-Channel Live Subtitles**:
   - **Left Column**: Displays the captured original spoken foreign dialogue with speaker turns and timestamps.
   - **Right Column**: Displays the simultaneous real-time translation powered by Gemini Live AI.
5. **Transcript Keyword Search & Highlighting**:
   - Filter through historical turns by entering terms into the transcript search bar with instantaneous bilingual case-insensitive matching and emerald highlight tags.
6. **Star Bookmarking & Jump to Context**:
   - Click the star icon on any turn to save notable quotes. In the "Saved Bookmarks" tab, click **"Jump to Context"** to smoothly scroll directly to that turn in the full live feed.

---

### 3. Account Settings, Google Profile & Firebase Cloud Sync

![3. Account Settings & Firebase Cloud Sync](src/assets/images/guide_account_settings_1793902852776.jpg)

#### Overview & Step-by-Step Instructions:
1. **Google Account Authentication**:
   - Sign in with your Google account via Firebase Authentication (`userConfirmedInUI: true`).
   - Your authenticated profile picture, display name, and user email (`westerveldjp@gmail.com`) are displayed in the account badge.
2. **Firebase Cloud Sync Status**:
   - The green status indicator confirms that your favorite stations, saved quote bookmarks, and custom scanner alert rules are continuously synchronized with Google Cloud Firestore (`ai-studio-remixworldradiot-28a8ed3a-4334-4619-a1bf-dff6e3de5527`).
   - Click **"Sync Now"** at any time to force an immediate cloud sync snapshot across all your connected mobile and desktop devices.
3. **User Preferences & Audio Buffer Customization**:
   - **Appearance**: Toggle between Dark Mode and Light Mode with theme color palettes.
   - **Audio Buffer Latency Slider**: Customize audio buffering from ultra-low latency (12 ms / 64 samples) for rapid speech recognition up to 256 samples for unstable or jittery network conditions.
   - **Audio Notification Chimes**: Toggle synthesized radio frequency notification chimes when custom language alerts trigger in the background.
   - **Session History & Retention**: Select history retention (e.g. store last 30 days or clear history with a single click).

---

### 4. Regional & Country Airwaves Discovery

![4. Regional & Country Airwaves Discovery](src/assets/images/guide_region_country_filter_1793902865907.jpg)

#### Overview & Step-by-Step Instructions:
1. **Continent & Region Selector Tabs**:
   - Switch between **Europe**, **Americas**, **Asia**, **Africa**, and **Oceania** tabs to explore regional broadcast ecosystems.
2. **Country Selection Dropdown**:
   - Filter stations by individual countries featuring national flags and ISO country codes (e.g., France 🇫🇷, Germany 🇩🇪, Italy 🇮🇹, Spain 🇪🇸, United Kingdom 🇬🇧, Japan 🇯🇵, Brazil 🇧🇷).
   - Selecting a country filters the station catalog to show verified broadcasters, official languages, and cultural trivia.
3. **GPS Vicinity Radius Slider**:
   - Adjust the radial scanning slider between **200 km and 2,000 km**.
   - Click **"Detect My Location"** or click on any point on the world map to calculate Great Circle distances and discover nearby municipal and regional stations.
4. **Broadcaster Badges & Frequency Tags**:
   - Each station card presents frequency identifiers (e.g., `FM 105.3 MHz`), streaming codec badges (`MP3`, `AAC`), bitrates (`128 kbps`, `320 kbps`), and broadcast genre tags (`News`, `Talk`, `Jazz`, `Culture`).

---

### 5. Background Airwaves Scanner, Custom Language Alerts & Session Export

![5. Background Airwaves Scanner & Language Alert Toasts](src/assets/images/guide_alerts_scanner_export_1793902881339.jpg)

#### Overview & Step-by-Step Instructions:
1. **Background Airwaves Scanner**:
   - Toggle the background scanner on to autonomously probe regional and international stations for specific spoken languages while you continue listening to your current broadcast.
2. **Configuring Custom Language Alerts**:
   - Select languages to monitor (e.g. Spanish, French, Japanese, German, Arabic).
   - Set confidence threshold from 50% to 95%.
   - When a station broadcasting in your target language is detected, an interactive radar toast notification appears showing the station name, country, and confidence match.
   - Click **"Tune In & Translate"** on the toast to immediately switch playback and start translation.
3. **10-Minute Rolling Broadcast Summarization**:
   - Click **"Summarize (10m)"** (`#btn-summarize-transcript`) to trigger Gemini 3.8 Flash to synthesize the last 10 minutes of broadcast speech into an executive briefing with key topics, notable quotes, and cultural broadcaster context.
4. **Save Full Session JSON (`#btn-save-full-session`)**:
   - Export your entire listening session (station metadata, all transcript turns, star bookmarks, and detection events) as a standardized, OpenSSF-compliant JSON archive for offline research or language study.
5. **Google Workspace Gmail Export**:
   - Click **"Email via Gmail"** to open the Gmail broadcast digest modal. Preview rendered HTML digests with base64url compliance and dispatch them directly to colleagues or save to Gmail Drafts.

---

## ✨ Key Features & Capabilities

### 1. Global Live Radio Airwaves & Interactive Globe
- **3D Coordinate Locator**: Explore an interactive geographical world map with real-time pinpoint markers for radio stations spanning Europe, Asia, the Americas, Africa, and Oceania.
- **Radial Distance Scanning**: Adjust scanning radii between **100 km and 2,000 km** to discover regional community and municipal stations near any selected latitude and longitude.
- **Cultural & Geo Profiles**: View country capitals, official languages, native greetings, regional music genres, and broadcast segment highlights.

### 2. Live Podcast Shows Directory
- **24/7 Spoken Live Streams**: Direct access to continuous live spoken broadcasts from international networks including *BBC Global News Podcast*, *NPR Up First*, *Deutsche Welle Inside Europe*, *RFI Grand Journal*, *NHK Radio Japan*, and *Radio Ambulante*.
- **Category & Topic Filters**: Filter by *News & Analysis*, *Tech & Science*, *Culture & Arts*, *Storytelling & Audio Drama*, *Philosophy & Society*, and *Interviews & Debates*.
- **Gemini AI Factsheets**: Generate on-demand factsheets summarizing show backgrounds, host bios, core themes, current episode talking points, and linguistic advice.

### 3. Gemini Live Real-Time Interpreter
- **Sub-Second Translation**: Live incoming foreign radio audio is continuously captured, downsampled to 16 kHz 16-bit mono PCM, and streamed over WebSockets to Google Gemini.
- **50+ Target Languages**: Translate into English, Spanish, French, German, Japanese, Mandarin, Arabic, Hindi, Portuguese, and many more.
- **Automatic Language Detection**: Detects source audio language dynamically and alerts the user if the broadcast language differs from their target language.

### 4. Save Full Session for Offline Analysis
- **One-Click Export Button** (`#btn-save-full-session`): Generate and download a formatted, indented `.json` file containing the complete state of the listening session.
- **Comprehensive Session Bundle**: Includes full broadcaster metadata, all captured native audio turns, translated output, speaker labels, bookmarks, and telemetry duration.
- **Researcher & Language Learner Ready**: Formatted according to a strict, standardized schema for easy loading into Python, R, or text analysis pipelines.

### 5. Share Full Session (Deep-Link State Synchronization)
- **One-Click Share Button** (`#btn-share-full-session`): Generates a deep-link URL capturing the current listening state so users can invite others to listen and translate simultaneously.
- **Full State Encoding**:
  - *Broadcast Station Metadata*: Encodes station UUID, name, streaming URL, country, broadcast language, codec, and bitrate.
  - *Interpreter Configuration*: Encodes selected target language for the real-time Gemini interpreter.
  - *Active Scanner Filters*: Preserves geographic coordinates (lat/lng), scanning radius (km), active view tabs (radio vs. continuous podcasts), and transcript search/bookmark filters.
- **Seamless Invitee Onboarding**: Recipients opening the link automatically tune into the broadcast station, initialize real-time translation into the shared language, and sync geographic filters with an automatic welcome banner.
- **Multi-Channel Sharing**: Supports instant clipboard copying, native device sharing via the Web Share API, and formatted social/chat invitation text.

### 6. Broadcast Summarization (10-Minute Rolling Window)
- **Gemini 3.8 Flash AI Synthesis**: Click **Summarize (10m)** in the transcript controls to generate an executive briefing of the most recent 10 minutes of broadcast dialog.
- **Structured Sections**:
  - *Executive Summary*: High-level synopsis of recent news, discussion, or commentary.
  - *Key Topics & Themes*: Bulleted analytical breakdown of topics discussed.
  - *Notable Quotes & Excerpts*: Exact translated statements from the broadcast.
  - *Broadcaster & Cultural Context*: Analysis of host perspectives, tone, and cultural nuances.

### 6. Transcript Keyword Search & Highlighting
- **Live Filtering**: Search through extensive session history by entering terms into the transcript search bar.
- **Bilingual Matching**: Matches queries against both the captured native foreign language audio text and the translated text.
- **Context Highlighting**: Matching terms are illuminated with high-contrast emerald highlight chips.

### 7. Starred Bookmarks & Jump to Context
- **Save Key Turns**: Star memorable quotes, breaking news items, or educational phrases.
- **Jump to Context**: Click the location pin button on any saved bookmark to smoothly scroll the main transcript view directly to that turn and pulse-highlight it.
- **Audio Clip & TXT Export**: Download individual audio snippets, export bookmarks as clean text, or share via the Web Share API.

### 8. Neural WiFi Satellite Space-Mesh
- **Simulated Orbital Constellation**: 8 orbital nodes (LEO, MEO, GEO, and Polar orbits) simulating space-based neural relays.
- **Live Ground-to-Space Uplinks**: Dynamic laser trajectory visualization connecting the user's active radio coordinates to the nearest orbital satellite.
- **Constellation Telemetry**: WiFi 7 / 802.11be carrier protocols, carrier frequencies, Doppler velocity, downlink latency, and signal-to-noise optimization.

### 9. Firebase Cloud Sync & Google Auth
- **Google Sign-In**: Sign in with a single click using Firebase Authentication.
- **Multi-Device State**: Synchronize saved bookmark collections, favorite stations, and user preferences seamlessly via Google Cloud Firestore.

---

## 📊 Offline Analysis JSON Schema

The **'Save Full Session'** feature outputs an indented JSON file following this structure:

```json
{
  "app": "Remix: World Radio Translator",
  "version": "1.2.0",
  "exportedAt": "2026-09-13T10:15:30.000Z",
  "session": {
    "targetLanguage": "English",
    "detectedLanguage": "French",
    "status": "connected",
    "totalTurns": 24,
    "totalBookmarks": 3,
    "sessionStartTime": "2026-09-13T09:45:10.000Z",
    "sessionEndTime": "2026-09-13T10:15:25.000Z",
    "durationEstimateSeconds": 1815
  },
  "station": {
    "name": "Radio France Internationale",
    "country": "France",
    "countrycode": "FR",
    "language": "french",
    "url": "https://stream.rfi.fr/live.mp3",
    "codec": "MP3",
    "bitrate": 128,
    "tags": "news,talk,world,culture",
    "geo_lat": 48.8566,
    "geo_long": 2.3522
  },
  "transcripts": [
    {
      "id": "turn-1-1789388710",
      "turnIndex": 1,
      "timestamp": "2026-09-13T09:45:10.000Z",
      "originalText": "Bienvenue sur RFI, il est 11 heures à Paris.",
      "translatedText": "Welcome to RFI, it is 11 o'clock in Paris."
    }
  ],
  "bookmarks": [
    {
      "id": "bm-1",
      "originalText": "Bienvenue sur RFI...",
      "translatedText": "Welcome to RFI...",
      "timestamp": "2026-09-13T09:45:10.000Z",
      "stationName": "Radio France Internationale",
      "stationCountry": "France",
      "targetLanguage": "English",
      "bookmarkedAt": 1789388715000
    }
  ],
  "liveBuffer": {
    "userTranscript": "",
    "modelTranscript": ""
  }
}
```

---

## 🔌 REST API Reference

All backend API routes are hosted under `/api/*` and protected against common web attack vectors:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status, uptime, version, and active configuration. |
| `GET` | `/api/proxy-stream?url=<url>` | SSRF-mitigated audio stream proxy with automatic CORS header injection. |
| `POST` | `/api/summarize-transcript` | Generates a 10-minute structured broadcast summary using Gemini 3.8 Flash. |
| `POST` | `/api/podcast-insights` | Generates educational show factsheets using Gemini 3.1 Flash-Lite. |
| `POST` | `/api/detect-language` | Analyzes incoming transcript chunks to identify audio language and confidence. |
| `GET` | `/api/satellites` | Returns orbital coordinates, velocities, and link status for the space-mesh. |

---

## 🛠️ Build, Test & Development Guide

### Prerequisites
- **Node.js**: Version 20.x or higher
- **npm**: Version 10.x or higher
- **Gemini API Key**: Set in server environment as `GEMINI_API_KEY`

### Setup & Development

```bash
# 1. Clone the repository
git clone https://github.com/remix-radio/world-radio-translator.git
cd world-radio-translator

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY

# 4. Start local development server (binds to http://localhost:3000)
npm run dev
```

### Testing & Verification Pipeline

```bash
# Run complete test suite (unit + dynamic fuzzing tests)
npm test

# Run unit tests only
npm run test:unit

# Run dynamic analysis & input fuzzing tests
npm run test:dynamic

# Strict TypeScript type checking & linting
npm run lint
npm run static-analysis

# Check dependencies for security vulnerabilities
npm run audit

# Compile production bundle
npm run build

# Start production server
npm start
```

---

## 🛡️ Security, OpenSSF & Compliance

- **Permissive FLOSS License**: Distributed under the OSI-approved [MIT License](LICENSE).
- **Zero Advertising & Private by Default**: No tracking pixels, no advertising beacons, and strictly ephemeral in-memory audio buffering ([docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)).
- **SSRF Defense**: Strict IP and hostname blocklist in the streaming proxy preventing requests to private subnets, localhost, and cloud metadata endpoints (`169.254.169.254`).
- **HSTS Preload & Secure Headers**: Preloaded HTTP Strict Transport Security (`max-age=63072000`), CSP, `X-Content-Type-Options: nosniff`, and `X-Frame-Options: SAMEORIGIN`.
- **Standard Cryptography**: Standardized on Web Crypto API and Node.js `crypto` primitives (SHA-256, secure PRNG). Deprecated algorithms (MD5, SHA-1, DES) are banned.
- **Vulnerability Reporting**: Response SLA within 24–48 hours as documented in [SECURITY.md](SECURITY.md).

---

## 📄 License

This project is licensed under the terms of the **MIT License**. See [LICENSE](LICENSE) or [LICENSE.md](LICENSE.md) for the full license text.

```text
MIT License
Copyright (c) 2026 Remix: World Radio Translator Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```

---

## 📚 Documentation Index

| Guide | Description |
| :--- | :--- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | In-depth technical architecture, audio pipeline, and WebSockets. |
| [API.md](docs/API.md) | Detailed specifications for all REST endpoints and payloads. |
| [TESTING.md](docs/TESTING.md) | Test suite methodology, coverage standards, and dynamic analysis. |
| [CONTRIBUTING.md](docs/CONTRIBUTING.md) | Guidelines for contributing code, styles, and reporting defects. |
| [SECURITY.md](SECURITY.md) | Vulnerability disclosure policy and response SLA. |
| [SECURITY_PRACTICES.md](docs/SECURITY_PRACTICES.md) | OpenSSF security controls and cryptographic defense standards. |
| [RADIO_STREAMING_SECURITY_LAB.md](docs/RADIO_STREAMING_SECURITY_LAB.md) | Defensive lab for SSRF prevention, redirect validation, DNS rebinding, and secure streaming. |
| [SERVICE_POLICY.md](docs/SERVICE_POLICY.md) | Terms of service and acceptable conduct guidelines. |
| [DATA_POLICY.md](docs/DATA_POLICY.md) | Ephemeral data lifecycle, audio stream privacy, and buffer policies. |
| [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md) | Privacy protections, GDPR/CCPA disclosures, and telemetry zero-storage. |
| [RADIO_STREAMING_POLICY.md](docs/RADIO_STREAMING_POLICY.md) | Radio Browser index policies, CORS proxy ethics, and DMCA safe harbor. |
| [CHANGELOG.md](CHANGELOG.md) | Version history, feature announcements, and security patches. |
