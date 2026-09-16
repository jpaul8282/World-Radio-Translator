# Radio Streaming, Copyright & Broadcaster Policy

**Effective Date:** September 10, 2026  
**Document Version:** 1.2.0  
**Project:** Remix: World Radio Translator  

---

## 1. Nature of the Service & Indexing Model

Remix: World Radio Translator functions as an open-source, non-commercial client and educational tuner. It indexes publicly broadcast internet radio stations via the crowd-sourced [Radio Browser Community Directory](https://www.radio-browser.info/) and allows users to input their own custom streaming URLs.

The Service:
- **Does NOT host, store, or archive** audio streams or commercial broadcast recordings.
- **Does NOT rebroadcast** copyrighted content behind subscription paywalls or monetized advertising breaks.
- **Functions as a direct tuner and protocol proxy** enabling browser playback and assistive live translation for language accessibility.

---

## 2. Audio Proxy Architecture & Bandwidth Ethics

Due to web browser security policies (such as CORS restrictions and mixed-content blocking for HTTP streams on HTTPS sites), our application includes a lightweight backend pass-through proxy (`/api/proxy-stream`).

### 2.1 Bandwidth Ethics & Connection Management
We are deeply committed to respecting the server capacity and bandwidth of independent and public radio broadcasters:
- **No Stream Pooling / Multiplexing**: The proxy maintains a 1:1 connection mapping. It does NOT scrape or keep permanent background connections open to idle streams.
- **Immediate Disconnect**: When a listener stops audio playback, pauses the stream, or tunes to another station, the proxy socket to the origin broadcast server is terminated immediately.
- **User-Agent Transparency**: The proxy identifies itself clearly using a standard, recognizable User-Agent header: `RemixWorldRadioTranslator/1.2.0 (Open-Source Educational Tuner; +https://github.com/remix-radio/world-radio-translator)`.
- **SSRF Hardening**: The proxy rejects connection requests targeting private subnets, localhost addresses, or internal cloud infrastructure.

---

## 3. Copyright & Intellectual Property Attribution

All audio streams, music recordings, spoken-word broadcasts, station trademarks, and call letters streamed through the Service are the intellectual property of their respective broadcasters, artists, and rights-holders.

- **Attribution in UI**: The Service prominently presents the official station name, broadcaster country, broadcast language, codec, bitrate, and station website (where available) as registered in the Radio Browser directory.
- **Assistive Translation as Transformative Fair Use**: Real-time linguistic translation into foreign languages operates as an assistive technology for cross-cultural understanding, educational research, and hearing/linguistic accessibility, in accordance with fair use principles.

---

## 4. Broadcaster Opt-Out & Delisting Procedure

We fully respect the rights of radio station operators to control distribution of their online broadcasts. If you are an authorized representative of a radio station or broadcasting organization and wish to have your station delisted or blocked from our streaming proxy:

### 4.1 Fast-Track Takedown SLA (< 24 Hours)
Send a delisting request to `broadcasters@worldradiotranslator.org` or open an issue on our GitHub repository with the following details:
1. Station Name and Origin Country
2. Stream URL(s) to be blacklisted
3. Proof of affiliation or official broadcaster domain email address
4. Preferred resolution: Complete removal from search index or proxy blocklist entry

Upon receipt and verification of the request, the station will be added to our proxy exclusion list and search filter within **24 hours**.

---

## 5. Digital Millennium Copyright Act (DMCA) & Safe Harbor Notice

Remix: World Radio Translator complies with the Digital Millennium Copyright Act (17 U.S.C. § 512) and international safe harbor provisions for network service providers and information location tools.

### 5.1 Designated Copyright Agent
Notifications of claimed infringement must be submitted in writing to our designated DMCA agent:

- **Attn:** DMCA Compliance Officer  
- **Organization:** Remix: World Radio Translator Open Source Project  
- **Email:** `dmca@worldradiotranslator.org`  
- **Mailing Address:** Available upon request via verified legal disclosure  

### 5.2 Required Elements of DMCA Notice
To be effective under 17 U.S.C. § 512(c)(3), your notification must include:
1. A physical or electronic signature of a person authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.
2. Identification of the copyrighted work claimed to have been infringed.
3. Identification of the material that is claimed to be infringing or to be the subject of infringing activity and that is to be removed or access to which is to be disabled (specifically the station name and stream URL).
4. Information reasonably sufficient to permit the service provider to contact the complaining party (address, telephone number, and email address).
5. A statement that the complaining party has a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.
6. A statement that the information in the notification is accurate, and under penalty of perjury, that the complaining party is authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

---

## 6. Station Submission Guidelines

Broadcasters who wish to make their stations discoverable on our platform are encouraged to submit their streaming feeds directly to the [Radio Browser community database](https://www.radio-browser.info/), from which our station directory automatically syncs.

Ensure that:
- Feeds use standard HTTP/HTTPS Icecast, Shoutcast, or HLS formats (MP3, AAC, OGG).
- Station metadata includes accurate genre tags, country codes, and high-resolution logo artwork.
- Stream servers permit standard client audio connections.
