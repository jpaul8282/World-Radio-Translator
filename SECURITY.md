# Security Policy & Vulnerability Reporting Process

The **Remix: World Radio Translator** team takes security, user privacy, and data integrity seriously. This document outlines our vulnerability disclosure policy, response SLA, cryptographic guidelines, MITM protections, and secure development practices in accordance with Open Source Security Foundation (OpenSSF) / Linux Foundation CII Best Practices and the [Radio Streaming Security Lab](docs/RADIO_STREAMING_SECURITY_LAB.md).

---

## 1. Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Supported          | Security Maintenance Level |
| ------- | ------------------ | -------------------------- |
| 1.2.x   | :white_check_mark: | Active (Current Release)   |
| 1.1.x   | :white_check_mark: | Critical patches only      |
| < 1.1.0 | :x:                | End of Life (Upgrade req)  |

---

## 2. Vulnerability Reporting Process

If you believe you have discovered a security vulnerability in this project, **please do not disclose it publicly in an open GitHub issue or discussion forum.**

### How to Report

Please report potential vulnerabilities through one of the following secure channels:

1. **GitHub Security Advisory (Preferred):**
   Navigate to the repository's **Security** tab and click **"Report a vulnerability"** to open a confidential draft advisory.
2. **Security Email:**
   Send an encrypted or plain message to: `security@worldradiotranslator.org`
   (Subject line: `[SECURITY] Potential vulnerability in Remix: World Radio Translator`)

### Information to Include

To help us triage and verify your finding promptly, please provide:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or a minimal Proof-of-Concept (PoC).
- Affected version(s) and environment details (Node.js version, browser, OS).
- Any proposed mitigations or code fixes, if available.

### Response SLA & Timeline

- **Initial Acknowledgement:** Within **24 to 48 hours**.
- **Triage & Severity Assessment:** Within **5 business days**.
- **Fix Development & Testing:** Within **14 business days** for high/critical severity issues.
- **Public Disclosure / CVE:** Coordinated disclosure after a patched release is published and verified.

---

## 3. Cryptographic Standards & Practices

- **TLS 1.3 / HTTPS:** All client-server communications and audio stream proxy connections enforce modern TLS encryption.
- **Approved Cryptographic Algorithms:** 
  - Hash functions: **SHA-256 / SHA-384 / SHA-512** (via standard Web Crypto API or Node.js `crypto`).
  - Symmetric encryption: **AES-256-GCM** with authenticated data.
  - Asymmetric encryption / key exchange: **ECDSA / RSA-2048+**.
- **Banned Insecure Algorithms:** MD5, SHA-1, DES, and RC4 are strictly prohibited for cryptographic operations and security-sensitive validation.
- **Cryptographically Secure Random Numbers:** Generated exclusively using `crypto.getRandomValues()` (browser) or `crypto.randomBytes()` (server). Insecure `Math.random()` is never used for security-critical tokens or identifiers.

---

## 4. Protection Against Man-In-The-Middle (MITM) Attacks

To ensure end-to-end data integrity and prevent MITM attacks:
1. **HTTP Strict Transport Security (HSTS):** Enabled with `max-age=63072000; includeSubDomains; preload` to mandate HTTPS transport across all compliant user agents.
2. **Content Security Policy (CSP):** Restricts script, object, and style sources to trusted origins and authorized CDNs.
3. **MIME Sniffing Prevention:** Enforces `X-Content-Type-Options: nosniff`.
4. **Clickjacking & Embedding Mitigation:** Enforces `X-Frame-Options: SAMEORIGIN`.
5. **Secure WebSocket (WSS):** Real-time translation communication utilizes WSS over TLS.
6. **Subresource Integrity (SRI):** Static script references incorporate cryptographic hash verification where CDN assets are loaded.

---

## 5. Defense Against Server-Side Request Forgery (SSRF) & Other Vulnerabilities

- **Audio Stream Proxy Validation:** The `/api/proxy-stream` endpoint validates all target stream URLs before dispatch. It explicitly blocks:
  - Private IP addresses (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`)
  - Loopback addresses (`127.0.0.1`, `localhost`, `::1`)
  - Cloud provider metadata IP ranges (`169.254.169.254`)
  - Non-HTTP/HTTPS protocols (`file://`, `ftp://`, `gopher://`, `dict://`)
- **Redirect & DNS Rebinding Protections:** Follows the guidelines specified in the [Radio Streaming Security Lab](docs/RADIO_STREAMING_SECURITY_LAB.md) (Lab 1 through Lab 8, Appendix A test cases).
- **Input Sanitization & Output Encoding:** User search queries and transcript bookmarks are sanitized against XSS (Cross-Site Scripting).
- **Dependency Vulnerability Scanning:** All dependencies are continuously audited using `npm audit` and static analysis scanning.

---

## 6. Publicly Known Vulnerabilities Policy

All dependencies in `package.json` are pinned and tracked. Whenever a CVE is published for an upstream dependency:
1. The dependency is triaged and upgraded within **7 days** (or 24 hours for Critical severity).
2. Automated regression and dynamic analysis tests run to ensure compatibility.
3. Release notes explicitly detail addressed CVE identifiers.

For further reference, see our [Radio Streaming Security Lab](docs/RADIO_STREAMING_SECURITY_LAB.md) and [Security Practices Guide](docs/SECURITY_PRACTICES.md).
