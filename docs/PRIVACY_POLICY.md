# Privacy Policy

**Effective Date:** September 10, 2026  
**Document Version:** 1.2.0  
**Project:** Remix: World Radio Translator  

---

## 1. Introduction & Commitment to Privacy

Remix: World Radio Translator ("we", "us", or "our") is dedicated to protecting user privacy. We believe that privacy is a fundamental human right. Our application is architected from the ground up to minimize data collection, operate without intrusive trackers, and process audio streams ephemerally.

This Privacy Policy explains what data is processed when you use our open-source web application, how third-party services interact with your session, and what rights you retain under global data protection laws (including GDPR and CCPA).

---

## 2. Information We Do NOT Collect

We take pride in our zero-tracking philosophy:
- ❌ **No Tracking Cookies**: We do not set persistent advertising, tracking, or profiling cookies.
- ❌ **No Behavioral Analytics**: We do not record user clicks, session recordings, heatmaps, or demographic profiling.
- ❌ **No Personal Identity Requirement**: You can stream any public radio station, visualize orbital space meshes, and translate speech in real time completely anonymously without creating an account.
- ❌ **No Audio Storage**: We do not record, store, or archive listening sessions on our servers.

---

## 3. Information Processed During Service Operation

### 3.1 Anonymous Technical Telemetry
When interacting with our web application, standard HTTP headers are received by our reverse proxy (such as IP address, user agent, and requested station URL). These logs are utilized strictly for:
- Routing streaming requests via `/api/proxy-stream`
- Mitigating DDoS attacks and abusive stream flooding
- Enforcing SSRF (Server-Side Request Forgery) protection against unauthorized internal networks

These ephemeral server logs are automatically rotated and purged in accordance with standard infrastructure policies.

### 3.2 Live Audio & Translation Data
When live translation is enabled:
- Audio frames captured from the radio stream are downsampled to 16 kHz WAV slices in memory.
- Slices are routed via secure HTTPS/WSS to Google Gemini Live and Google Gemini Flash models.
- Audio chunks contain only the public radio station audio broadcast—they do NOT contain any audio from the user's microphone or physical environment.
- Transcripts returned by Gemini are rendered directly in the user's browser tab.

### 3.3 Optional User Account Data
If a user chooses to authenticate via Google OAuth:
- We receive basic profile credentials provided by Google (User ID, Email address, Display Name, Profile Photo URL).
- This data is used solely to authenticate access to private Firestore collections containing user-created station bookmarks and custom channel presets.
- We never share, sell, or rent user profile information to advertisers or commercial data brokers.

---

## 4. Third-Party Services & Data Processors

| Service | Purpose | Data Transmitted | Privacy Documentation |
| :--- | :--- | :--- | :--- |
| **Google Gemini API** | Real-time speech translation and 10-minute transcript summaries | Public radio audio segments, transcribed text | [Google Privacy Policy](https://policies.google.com/privacy) |
| **Radio Browser API** | Community directory of public radio station streams | Station search queries, country/language filters | [Radio-Browser Terms](https://www.radio-browser.info/) |
| **Firebase Auth & Firestore** | Optional user authentication and bookmark sync | User email, user ID, user-saved bookmarks | [Google Cloud Privacy](https://cloud.google.com/terms/cloud-privacy-notice) |
| **Public Station Broadcasters** | Direct radio audio stream sources | User or proxy IP address upon connection request | Varies by individual station operator |

---

## 5. Security Safeguards

We implement modern, comprehensive cybersecurity controls to protect session integrity:
- **Transport Layer Security (TLS)**: All client-server communication is encrypted using modern TLS (HTTPS & WSS).
- **HSTS Preloading**: Enforces strict HTTP Strict Transport Security (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
- **SSRF Mitigation**: Our streaming proxy validates all URLs against RFC 1918 private subnets, cloud metadata IPs (`169.254.169.254`), and loopback addresses (`127.0.0.1`).
- **Content Security Policy (CSP)**: Hardened headers to neutralize Cross-Site Scripting (XSS) and unauthorized script injection.

---

## 6. User Rights (GDPR & CCPA Compliance)

Under applicable data protection frameworks (such as the EU General Data Protection Regulation and California Consumer Privacy Act), you possess specific rights:

1. **Right to Know / Access**: Inquire about any personal data associated with your optional user account.
2. **Right to Rectification**: Correct inaccuracies in your stored bookmarks or profile details.
3. **Right to Erasure ("Right to be Forgotten")**: Request immediate deletion of your authenticated account and associated Firestore records.
4. **Right to Portability**: Download your bookmarks and transcript logs in machine-readable formats (JSON, TXT).
5. **Right to Non-Discrimination**: Enjoy full and equal service access regardless of whether you exercise privacy rights.

To exercise any of these rights, email us at `privacy@worldradiotranslator.org`. We respond to verified requests within thirty (30) business days.

---

## 7. Children's Online Privacy

Remix: World Radio Translator is an educational and entertainment tool designed for general audiences. We do not knowingly solicit or collect personal information from children under the age of 16. If we discover that personal data has been submitted by an underage user, we take prompt action to delete such records.

---

## 8. Updates to This Privacy Policy

As new features (such as enhanced AI translation models or satellite constellation visualizations) are introduced, we may update this Privacy Policy. All revisions will include an updated "Effective Date" at the top of this document and will be documented in [CHANGELOG.md](../CHANGELOG.md).

---

## 9. Contact Information

For privacy questions, data protection requests, or compliance inquiries:
- **Email**: `privacy@worldradiotranslator.org`
- **Data Protection Officer**: `dpo@worldradiotranslator.org`
- **Security Team**: `security@worldradiotranslator.org`
