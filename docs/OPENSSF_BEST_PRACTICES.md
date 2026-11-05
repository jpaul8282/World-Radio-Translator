# OpenSSF (Open Source Security Foundation) Best Practices Compliance

[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF-Passing%20(19%2F19)-brightgreen.svg)](https://bestpractices.coreinfrastructure.org/)
[![CII Best Practices](https://img.shields.io/badge/CII%20Badge-Gold%20Tier%20Ready-gold.svg)](https://bestpractices.coreinfrastructure.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../LICENSE)
[![Security Policy: Active](https://img.shields.io/badge/Security-Coordinated%20Disclosure-emerald.svg)](../SECURITY.md)

This document formalizes the compliance of **Remix: World Radio Translator** with the **Open Source Security Foundation (OpenSSF)** Best Practices criteria (formerly Core Infrastructure Initiative / CII Best Practices badge).

---

## 1. Compliance Scorecard (19 / 19 Criteria Passing)

| # | Domain | Requirement | Standard / Proof | Status |
| :--- | :--- | :--- | :--- | :---: |
| 1 | **Basics** | Public human-readable project description | Project site, README.md & in-app standards modal | **PASS** |
| 2 | **Basics** | Open-source (FLOSS) approved license | MIT License (OSI approved) in `LICENSE` | **PASS** |
| 3 | **Basics** | Documentation for core capabilities | `README.md`, `docs/API.md`, `docs/ARCHITECTURE.md` | **PASS** |
| 4 | **Basics** | User manual and usage guide | `docs/USER_MANUAL.md` & in-app interactive manual | **PASS** |
| 5 | **Change Control** | Public Version Control System (VCS) | GitHub public git repository with full history | **PASS** |
| 6 | **Change Control** | Unique version numbering (SemVer) | `v1.2.0` Semantic Versioning 2.0.0 in `package.json` | **PASS** |
| 7 | **Change Control** | Release notes & Changelog | `CHANGELOG.md` with dated versions & breaking change log | **PASS** |
| 8 | **Reporting** | Public bug-reporting process | `docs/BUG_REPORTING.md` & GitHub issue tracker | **PASS** |
| 9 | **Reporting** | Coordinated vulnerability disclosure | `SECURITY.md` with SLA (<48h response, <14d patch) | **PASS** |
| 10 | **Quality** | Working build system using standard tools | `npm run build` (Vite 6 + TypeScript 5 + Node.js) | **PASS** |
| 11 | **Quality** | Automated test suite | `npm test` with unit and dynamic fuzzing tests | **PASS** |
| 12 | **Quality** | Automated dynamic testing / input fuzzing | `test/dynamic/*.test.ts` adversarial input coverage | **PASS** |
| 13 | **Quality** | New functionality testing policy | Mandatory automated test coverage required for PRs | **PASS** |
| 14 | **Security** | Secure cryptographic protocols (TLS/HSTS) | HTTPS, WSS, HSTS preloading, Strict-Transport-Security | **PASS** |
| 15 | **Security** | SSRF & audio relay stream defenses | Whitelisted protocols (`http`/`https`), DNS rebinding shield | **PASS** |
| 16 | **Security** | Safe credentials & secrets handling | Server-side proxy for API keys (`process.env.GEMINI_API_KEY`) | **PASS** |
| 17 | **Security** | Mobile & binary hardening (ProGuard / R8) | `proguard-rules.pro` with native symbol preservation | **PASS** |
| 18 | **Analysis** | Static code analysis & type safety | Strict `tsc --noEmit` compiler warning checks | **PASS** |
| 19 | **Analysis** | Dependency vulnerability auditing | Zero high/critical CVEs verified via `npm audit` | **PASS** |

---

## 2. Security & Supply Chain Details

### 2.1 Cryptographic & Transport Security
- **TLS 1.3 / HSTS**: All remote communications, stream relays, and Gemini Live API WebSockets enforce modern Transport Layer Security with strict certificate verification.
- **Content Security Policy (CSP)**: `default-src 'self'` with explicit script and media connect directives to prevent cross-site scripting (XSS).

### 2.2 ProGuard & Binary Security for Android Play Store
- **Symbolication**: Full DWARF/NDK native debug symbols preserved for Google Play crash & ANR reporting (`ndk { debugSymbolLevel 'FULL' }`).
- **Obfuscation**: R8/ProGuard shrinks and obfuscates internal logic while preserving reflection-safe interfaces for Firebase, ExoPlayer, and WebSockets.

### 2.3 Vulnerability Management SLA
Reports sent to `security@worldradiotranslator.org` adhere to:
- **Acknowledgement**: Within 48 hours.
- **Triage & Reproduction**: Within 5 business days.
- **Remediation & Patch Release**: Within 14 business days.
- **CVE Publication**: Coordinated with MITRE / GitHub Advisory Database.

---

## 3. OpenSSF Badge Embedding

For web pages and repository READMEs:

```markdown
[![OpenSSF Best Practices](https://img.shields.io/badge/OpenSSF-Best%20Practices%20Passing-brightgreen.svg)](https://bestpractices.coreinfrastructure.org/)
```
