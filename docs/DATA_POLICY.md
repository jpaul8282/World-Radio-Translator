# Data Policy & Data Retention Specification

**Effective Date:** September 10, 2026  
**Document Version:** 1.2.0  
**Project:** Remix: World Radio Translator  

---

## 1. Overview & Data Governance Principles

Remix: World Radio Translator adheres to strict data minimization, zero-tracking, and ephemeral-by-default architecture. This document outlines how audio streams, translation buffers, user session state, and simulated orbital telemetry are collected, processed, and retained.

---

## 2. Data Categorization & Processing Lifecycles

| Data Classification | Type of Data | Storage Mechanism | Retention Period | Deletion Trigger |
| :--- | :--- | :--- | :--- | :--- |
| **Live Audio Buffers** | PCM audio byte slices streamed via backend proxy | Volatile RAM only (Node.js Buffer stream) | ~2–10 seconds (transient ring buffer) | Overwritten continuously; destroyed on station switch or disconnect |
| **Live Transcript Turns** | Original spoken text & translated target text | Client-side React memory | Active browser tab lifetime | Cleared on "Clear Transcript" click, station change, or tab close |
| **10-Minute Summary Input** | Transcript text slices formatted for Gemini | Volatile server RAM during API call | Duration of HTTP request (< 5 seconds) | Destroyed immediately after response transmission |
| **User Bookmarks & Stars** | Saved turn text, timestamp, audio clip blob | Client `localStorage` (or Firestore if logged in) | User-determined | Click "Remove Bookmark" or browser storage wipe |
| **Custom Radio Stations** | User-added station name, stream URL, country | Client `localStorage` (or Firestore if logged in) | User-determined | Click "Delete Custom Station" or clear storage |
| **Client Audio Preferences** | Volume, muted state, target language, dark mode | Client `localStorage` (`radio_prefs_*`) | Persistent until cleared | Browser settings clear or local reset |
| **Orbital Space-Mesh Telemetry** | Simulated satellite orbits, ISL laser lines | Mathematical client-side simulation | Ephemeral (real-time compute) | No persistence (calculated on tick) |
| **Diagnostic Payloads** | Browser version, resolution, OpenSSF test statuses | None unless user copies to clipboard | Ephemeral | User discretion |

---

## 3. Ephemeral In-Memory Audio Processing

1. **No Audio Recording or Long-Term Buffering**: The backend audio proxy (`/api/proxy-stream`) functions as a non-caching HTTP streaming pipe designed strictly to negotiate codecs, manage Icecast headers, and handle Cross-Origin Resource Sharing (CORS). Audio chunks pass directly through Node.js pipe streams into client Web Audio contexts without being written to disk, databases, or object storage.
2. **Speech-to-Text Audio Slices**: Audio frames captured for live speech-to-text inference are downsampled to 16 kHz Mono WAV format in memory and transmitted via secure TLS connections to Google Gemini Live / Flash API workers. No audio recordings are retained on application servers following translation inference.
3. **Broadcast Summarization Pipeline**: The `/api/summarize-transcript` endpoint aggregates transcript turns strictly from the recent listening window (default: 10 minutes) provided in the request payload. It generates structured markdown summaries in volatile memory without caching the raw turns.

---

## 4. Client-Side Persistence & Storage Control

Users retain total control over any data stored locally within their browser:

- **Local Storage Keys Used**:
  - `radio_saved_bookmarks`: Array of starred transcript turns with optional synthetic audio clips.
  - `radio_custom_stations`: Array of user-created streaming stations.
  - `radio_target_lang`: Selected translation target language (default: `English`).
  - `radio_volume`: User volume preference (`0.0` to `1.0`).
  - `radio_theme_dark`: Boolean indicator for dark mode preferences.
- **Export Capabilities**: Users can export transcript logs and saved bookmarks at any time via the UI using the **Download TXT** or **Export Bookmarks** actions.
- **Data Erasure**: Users can purge all local data instantaneously via browser DevTools or by clicking **Clear Bookmarks** and **Clear Transcript** in the feed interface.

---

## 5. Cloud Storage & Firebase Synchronization (Optional)

When an authenticated user connects via Google OAuth:
1. **Scope**: Only user-authored bookmarks, custom stations, and favorite channel lists are synchronized to their private Firestore path (`users/{uid}/...`).
2. **Access Control**: Enforced through strict `firestore.rules` where read and write privileges are restricted exclusively to `request.auth.uid == userId`.
3. **Data Portability & Right to Erasure**: Users may delete individual records or request complete account data deletion through our support desk (`privacy@worldradiotranslator.org`), which is fulfilled within 72 hours.

---

## 6. Telemetry & Analytics

- **No Third-Party Trackers**: We do not embed Google Analytics, Mixpanel, Meta Pixel, or any commercial tracking scripts.
- **No Fingerprinting**: The Service does not construct canvas fingerprinting, battery status profiling, or hardware-based persistent user identifiers.
- **Simulated Satellite Constellation**: The orbital visualization is driven by client-side trigonometric algorithms simulating low-Earth-orbit satellites and neural relays. It does not ping external military or commercial satellite telemetry feeds.

---

## 7. Compliance & Standards

This Data Policy adheres to the **OpenSSF Best Practices Badge** requirements, **GDPR (Regulation EU 2016/679)** data minimization principles, and the **California Consumer Privacy Act (CCPA)**.

---

## 8. Inquiries & Data Requests

To exercise your right to access, rectify, or purge stored data:
- **Email**: `data@worldradiotranslator.org`
- **Data Protection Officer Contact**: `dpo@worldradiotranslator.org`
