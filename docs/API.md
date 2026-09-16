# API Reference Documentation

This document describes the RESTful endpoints provided by the **Remix: World Radio Translator** backend server.

---

## 1. Health & Project Metadata

### `GET /api/health`
Returns the operational health status, application version, and security compliance flags.

**Response:**
```json
{
  "status": "ok",
  "version": "1.2.0",
  "uptime": 1245.8,
  "timestamp": "2026-09-10T10:41:54.000Z",
  "license": "MIT",
  "security": {
    "mitmProtection": true,
    "ssrfProtection": true,
    "hstsEnabled": true
  }
}
```

---

## 2. Stream Proxy & Audio Transport

### `GET /api/proxy-stream?url=<ENCODED_URL>`
Proxies live radio audio to eliminate browser mixed-content blocks and CORS restrictions while enforcing SSRF protection.

**Query Parameters:**
- `url` *(string, required)*: Fully qualified, URL-encoded HTTP or HTTPS stream address.

**Security Constraints:**
- Must use `http` or `https`.
- Private IP subnets (`127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) are rejected with `403 Forbidden`.
- Cloud metadata service (`169.254.169.254`) is strictly blocked.

---

## 3. Real-Time Translation & Language Detection

### `POST /api/translate`
Performs natural voice-to-voice and text translation using the Gemini Live API.

**Request Body:**
```json
{
  "text": "Bonjour tout le monde, bienvenue sur les ondes de France Inter.",
  "targetLanguage": "English",
  "voiceName": "Echo"
}
```

**Response:**
```json
{
  "translated": "Hello everyone, welcome to the airwaves of France Inter.",
  "audio": "<base64_encoded_pcm_audio>"
}
```

### `POST /api/detect-language`
Analyzes audio transcript snippets and station metadata to identify the primary broadcast language.

**Request Body:**
```json
{
  "stationLanguage": "Spanish",
  "stationName": "Radio Nacional",
  "country": "Argentina",
  "sampleText": "Buenas tardes amigos de la radio",
  "currentTargetLanguage": "English"
}
```

**Response:**
```json
{
  "detectedLanguage": "Spanish",
  "languageCode": "es",
  "confidence": 0.95,
  "differsFromTarget": true,
  "suggestedTargetLanguage": "English",
  "reason": "Spanish broadcast identified from audio transcript and station metadata."
}
```
