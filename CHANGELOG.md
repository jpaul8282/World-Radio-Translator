# Changelog & Release Notes

All notable changes to **Remix: World Radio Translator** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-09-10

### Added
- **Share Full Session Deep-Linking**: Added one-click session sharing via URL parameters (`#btn-share-full-session`), allowing users to generate deep links encoding active station metadata, Gemini interpreter target language, and active geographic scanner filters for simultaneous listening.
- **Save Full Session JSON Export**: Implemented comprehensive offline session archiving exporting station metadata, all transcript turns, and user bookmarks in a structured schema.
- **OpenSSF Best Practices Compliance**: Integrated full OpenSSF / Linux Foundation CII criteria checklist and verification suite.
- **FLOSS License**: Formalized MIT License with complete SPDX tags and clear repository licensing terms.
- **Jump to Context**: One-click locator button on bookmarked turns to smoothly navigate and highlight the original turn within the continuous live broadcast feed.
- **Neural WiFi Satellite Constellation Visualizer**: Real-time orbital space-mesh visualization featuring active ground-to-satellite neural laser uplinks, WiFi 7 carrier telemetry, inter-satellite laser links (ISL), and constellation diagnostics modal.
- **Automated Testing & Dynamic Analysis Suite**: Added comprehensive unit test suite (`npm run test:unit`) and dynamic input analysis fuzzing suite (`npm run test:dynamic`).
- **Comprehensive Documentation**: Added architectural specifications (`docs/ARCHITECTURE.md`), API endpoints reference (`docs/API.md`), contributing guidelines (`docs/CONTRIBUTING.md`), testing methodology (`docs/TESTING.md`), versioning policy (`docs/VERSIONING.md`), and bug reporting workflows (`docs/BUG_REPORTING.md`).
- **In-App Best Practices & Project Info Hub**: Embedded interactive modal detailing project architecture, FLOSS license, vulnerability reporting, and automated test diagnostics.

### Changed
- **Warning Flags & Strict Compilation**: Enabled strict compiler flags in TypeScript configuration (`strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`, `noFallthroughCasesInSwitch: true`).
- **Build System Standardization**: Enhanced build scripts with clean artifact removal, multi-stage static analysis, dynamic tests, and security audits.

### Fixed
- Fixed potential SSRF vulnerability in the streaming proxy endpoint by enforcing strict IP/domain blocklists for loopback, local LAN, and cloud instance metadata addresses.
- Resolved DOM scroll alignment when jumping between filtered bookmark views and the main broadcast transcript stream.

### Security
- Added HTTP Strict Transport Security (HSTS) with preload directive to prevent man-in-the-middle (MITM) attacks.
- Enforced cryptographic best practices using Web Crypto API and Node.js standard cryptographic primitives (SHA-256, AES-256-GCM, secure PRNG).
- Verified that zero publicly known high/critical CVEs exist in current dependencies via automated `npm audit`.

---

## [1.1.0] - 2026-08-15

### Added
- **Saved Favorites & Transcript Bookmarks**: Persistent bookmarking with search filtering, audio clip downloads, one-click Web Share API integration, and TXT exports.
- **Continuous Live Translation Engine**: Google Gemini Live API integration for sub-second audio transcription and multilingual translation.
- **Web Audio API Frequency Pipeline**: Spectrum analyzer visualizers and stereo spatial controls.

### Changed
- Improved resilient audio stream proxy with automatic header fallback handling for Icecast, Shoutcast, and HLS streams.

### Fixed
- Corrected audio buffer slicing to eliminate pops and clicks during live transcription stream handshakes.

---

## [1.0.0] - 2026-07-01

### Added
- Initial public release of **Remix: World Radio Translator**.
- Interactive 3D/2D geographical world map station finder with 200+ curated global live broadcast stations.
- Real-time station search by country, genre, language, and bitrate.
- Gemini AI cultural insights and regional broadcaster profiles.
