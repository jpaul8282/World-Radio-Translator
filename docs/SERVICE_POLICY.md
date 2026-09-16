# Service Policy & Terms of Use

**Effective Date:** September 10, 2026  
**Document Version:** 1.2.0  
**Project:** Remix: World Radio Translator  

---

## 1. Acceptance of Terms

By accessing, browsing, or utilizing the web application **Remix: World Radio Translator** (the "Service"), you agree to be bound by this Service Policy and Terms of Use. If you do not agree to these terms, you must refrain from using the Service.

The Service is provided as an open-source tool distributed under the [MIT License](../LICENSE), offering real-time streaming of public global radio broadcasts coupled with AI-assisted speech-to-text translation and intelligence synthesis.

---

## 2. Permitted Use & Scope

The Service is designed and operated exclusively for:
1. **Personal and Educational Listening**: Exploring cultural, informational, musical, and linguistic broadcasts from public radio stations worldwide.
2. **Language Learning & Accessibility**: Assisting listeners through simultaneous translation into multiple target languages.
3. **Research & Monitoring**: Monitoring broadcast patterns, frequency profiles, and regional media availability.

### 2.1 Non-Commercial License
While the underlying source code is licensed under the permissive MIT License, your utilization of third-party audio streams is subject to the respective rights and restrictions established by individual radio broadcast operators. You may not sell access to audio feeds or stream-relay endpoints provided by this Service.

---

## 3. Acceptable Use & Prohibited Conduct

Users agree **NOT** to engage in any of the following prohibited activities:

1. **Denial of Service & Stream Flooding**: Initiating rapid automated reconnection requests, excessive audio buffer floods, or distributed denial-of-service (DDoS) traffic against the Service or any upstream broadcast server.
2. **Bypassing Security Controls**: Attempting to bypass Server-Side Request Forgery (SSRF) filters, IP blacklists, private network blocks, or rate limiters implemented on the backend streaming proxy.
3. **Automated Scraping of Streaming Infrastructure**: Extracting high-bandwidth audio feeds using automated scripts or scrapers to build commercial rebroadcast networks or unauthorized mirror aggregations.
4. **Infringing Commercial Exploitation**: Rebroadcasting copyright radio streams under paywalls or commercial licensing arrangements without authorization from origin broadcast stations.
5. **Adversarial Input Submission**: Submitting malicious payloads, command injections, or harmful inputs to Gemini AI translation or summarization endpoints.

---

## 4. Availability, Latency & Service Boundaries

1. **Third-Party Station Feeds**: The Service indexes public online streams via the community-maintained Radio Browser directory. We do not operate, host, or guarantee the ongoing availability, bitrate, uptime, or content accuracy of any third-party broadcast stream. Station feeds may go offline, change stream URLs, or apply geographical restrictions independently.
2. **AI Translation Quotas**: AI-driven speech translation, live transcription, and broadcast intelligence summaries rely on Google Gemini API infrastructure. While resilient fallbacks are maintained, real-time speech translation may experience latency fluctuations or brief queue delays during high traffic volumes.
3. **No Emergency Services**: The Service is NOT intended as a source of safety-critical emergency communications or civil defense broadcasts. Always consult official local telecommunications authorities for disaster alerts.

---

## 5. Intellectual Property & Codebase License

- **Source Code**: All application code, components, and scripts developed for Remix: World Radio Translator are open-source and governed by the [MIT License](../LICENSE).
- **Trademarks & Station Logos**: Radio station names, call signs, logos, and audio broadcasts remain the exclusive intellectual property of their respective broadcasting entities.
- **Transcripts & User Notes**: Saved bookmarks and local translation transcripts created by the listener remain under the control of the listener for personal use.

---

## 6. Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS, MAINTAINERS, OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SERVICE OR THE USE OR OTHER DEALINGS IN THE SERVICE.

---

## 7. Modifications & Termination

We reserve the right to modify this Service Policy at any time in conjunction with software updates. Material revisions will be documented in the [CHANGELOG.md](../CHANGELOG.md) and reflected in updated version numbers according to [VERSIONING.md](VERSIONING.md). Continued use of the Service following updates constitutes acceptance of the modified terms.

---

## 8. Contact & Legal Inquiries

For questions regarding this Service Policy or terms of use:
- **Email**: `policy@worldradiotranslator.org`
- **Issue Tracker**: [https://github.com/remix-radio/world-radio-translator/issues](https://github.com/remix-radio/world-radio-translator/issues)
