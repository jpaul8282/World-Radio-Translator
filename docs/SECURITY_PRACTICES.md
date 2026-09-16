# Secure Development Knowledge & Cryptographic Standards

This document establishes the security principles, cryptographic standards, and architectural defenses adopted by **Remix: World Radio Translator** in compliance with the OpenSSF Best Practices Badge requirements.

---

## 1. Secure Development Knowledge

Our engineering practices adhere to the following secure development tenets:
- **Defense in Depth:** Multi-tiered defenses across client-side validation, reverse proxy controls, server-side parameter checks, and strict environment configuration.
- **Principle of Least Privilege:** System processes run without elevated privileges; permissions requested via frame permissions are strictly audited in `metadata.json`.
- **Fail Securely:** When a stream or translation request fails or encounters an unhandled exception, error handlers log detailed diagnostics internally while returning sanitized, generic status codes (`502 Bad Gateway` or `400 Bad Request`) to prevent information leakage or stack trace exposure.
- **Input Sanitization & Output Encoding:** All inputs (search strings, stream URLs, language parameters) are sanitized before processing. Outputs rendered in React are inherently escaped to guard against Cross-Site Scripting (XSS).

---

## 2. Cryptographic Practices

- **Modern Hash Functions:** SHA-256 and SHA-512 are used exclusively. MD5 and SHA-1 are considered broken and are disallowed.
- **Symmetric Encryption:** AES-GCM (Galois/Counter Mode) with 256-bit keys and random initialization vectors (IV) for authenticated confidentiality and integrity.
- **Cryptographic Randomness:** The standard `crypto.getRandomValues()` (in the browser) or `crypto.randomBytes()` (in Node.js) is enforced for generating random session tokens, nonces, and transaction identifiers.
- **Secret Management:** Sensitive API credentials (e.g. `GEMINI_API_KEY`) are accessed via server-side environment variables and are never transmitted to client browsers or stored in version control.

---

## 3. Defense Against Man-In-The-Middle (MITM) Attacks

- **HTTPS / TLS 1.3 Transport:** All endpoints operate behind HTTPS and reverse proxies enforcing modern TLS cipher suites.
- **HSTS (HTTP Strict Transport Security):** Enforces HTTPS browser connections with a 2-year `max-age` and `includeSubDomains; preload` configuration.
- **Subresource Integrity (SRI):** External dependencies are pinned and verified.
- **Security Headers:**
  - `Content-Security-Policy`: Restricts unauthorized scripts and frame injection.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
  - `X-Frame-Options: SAMEORIGIN`: Protects against clickjacking.
  - `Referrer-Policy: strict-origin-when-cross-origin`: Minimizes referrer leakage.

---

## 4. Other Security Issues: SSRF & Stream Validation

Radio streaming features require fetching user-specified or catalog URLs. To prevent Server-Side Request Forgery (SSRF):
- Every stream URL is parsed using strict standard URL parsers.
- Schemes other than `http:` and `https:` are rejected.
- Private network ranges and loopback IPs are blocked before request initiation:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8` (Private Class A)
  - `172.16.0.0/12` (Private Class B)
  - `192.168.0.0/16` (Private Class C)
  - `169.254.169.254` (Cloud Metadata Endpoint)
- For comprehensive defensive patterns, redirect controls, DNS rebinding mitigation, and containerized exercises, see our [Radio Streaming Security Lab](RADIO_STREAMING_SECURITY_LAB.md).

---

## 5. Static & Dynamic Code Analysis

- **Static Analysis:**
  - Strict TypeScript compiler type checking (`tsc --noEmit --strict`) verifies type safety, detects unused variables, and prevents implicit any conversions.
  - Periodic automated dependency auditing via `npm audit`.
- **Dynamic Analysis:**
  - Automated fuzz testing and input boundary validation running against key utility and proxy modules via `npm run test:dynamic`.
  - Continuous runtime assertion of response content-types and payload limits.
